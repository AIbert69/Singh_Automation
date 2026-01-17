"""
FastAPI Backend for Sam Agent 2.0

REST API for the Sam Agent mobile app.
Includes endpoints for opportunities, briefings, chat, and memory management.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, date, timedelta
from contextlib import asynccontextmanager
import uuid

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Local imports
from ..database import get_db, get_memory
from ..scrapers import SamGovScraper, DIBBSScraper, USASpendingScraper, StateLocalScraperOrchestrator
from ..intelligence import OpportunityScorer, OpportunityAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load profile
PROFILE_PATH = os.path.join(os.path.dirname(__file__), "../../../config/singh_profile.json")
with open(PROFILE_PATH) as f:
    PROFILE = json.load(f)

# Initialize components
scorer = OpportunityScorer(PROFILE)
analyzer = OpportunityAnalyzer(PROFILE)

# Scheduler for background jobs
scheduler = AsyncIOScheduler()


# ============ Pydantic Models ============

class ActionRequest(BaseModel):
    action: str = Field(..., description="Action type: viewed, pursued, bid, won, lost, passed")
    notes: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    opportunity_id: Optional[str] = None


class MemoryUpdate(BaseModel):
    key: str
    value: Any


class PriorityUpdate(BaseModel):
    priorities: List[str]


class PreferencesUpdate(BaseModel):
    min_contract_value: Optional[int] = None
    max_contract_value: Optional[int] = None
    notification_time: Optional[str] = None
    notification_enabled: Optional[bool] = None


# ============ Lifecycle Events ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Sam Agent API...")

    # Schedule daily scrape at 6 AM
    scheduler.add_job(
        daily_scrape,
        "cron",
        hour=int(os.getenv("DAILY_SCRAPE_HOUR", "6")),
        minute=0,
        id="daily_scrape"
    )

    # Schedule daily briefing generation at 6:30 AM
    scheduler.add_job(
        generate_daily_briefing_job,
        "cron",
        hour=int(os.getenv("BRIEFING_HOUR", "6")),
        minute=30,
        id="daily_briefing"
    )

    scheduler.start()
    logger.info("Scheduler started")

    yield

    # Shutdown
    scheduler.shutdown()
    logger.info("Sam Agent API shutdown")


# ============ App Setup ============

app = FastAPI(
    title="Sam Agent API",
    description="Government Contracting Intelligence API for Singh Automation",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Background Jobs ============

async def daily_scrape():
    """Run daily opportunity scrape from all sources"""
    logger.info("Starting daily scrape...")
    db = get_db()

    try:
        # SAM.gov scrape
        sam_scraper = SamGovScraper(PROFILE)
        sam_opportunities = await sam_scraper.search(days_back=1)
        logger.info(f"SAM.gov: Found {len(sam_opportunities)} opportunities")

        # Score opportunities
        scored = scorer.score_batch(sam_opportunities)

        # Save to database
        for opp in scored:
            opp["fit_score"] = opp.get("score", 0)
            opp["fit_analysis"] = "; ".join(opp.get("reasons", []))
            opp["recommendation"] = opp.get("recommendation", "watch")

        await db.upsert_opportunities(scored)
        logger.info(f"Saved {len(scored)} opportunities to database")

        # Optional: DIBBS scrape
        try:
            dibbs_scraper = DIBBSScraper(PROFILE)
            dibbs_opps = await dibbs_scraper.search()
            dibbs_scored = scorer.score_batch(dibbs_opps)
            await db.upsert_opportunities(dibbs_scored)
            logger.info(f"DIBBS: Found {len(dibbs_scored)} opportunities")
        except Exception as e:
            logger.warning(f"DIBBS scrape failed: {e}")

        logger.info("Daily scrape completed")

    except Exception as e:
        logger.error(f"Daily scrape failed: {e}")


async def generate_daily_briefing_job():
    """Generate the daily briefing"""
    logger.info("Generating daily briefing...")

    try:
        db = get_db()
        memory = get_memory()

        # Get recent opportunities
        yesterday = datetime.now() - timedelta(days=1)
        opportunities = await db.get_new_opportunities(yesterday)

        # Get context
        context = await memory.get_context()

        # Generate briefing
        briefing = await analyzer.generate_daily_briefing(opportunities, context)

        # Save briefing
        await db.save_briefing(briefing)
        logger.info("Daily briefing generated and saved")

    except Exception as e:
        logger.error(f"Briefing generation failed: {e}")


# ============ Health Check ============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sam-agent",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }


# ============ Briefing Endpoints ============

@app.get("/briefing/today")
async def get_today_briefing():
    """Get today's daily briefing"""
    db = get_db()
    briefing = await db.get_briefing(date.today())

    if not briefing:
        # Generate on demand if not available
        memory = get_memory()
        opportunities = await db.get_opportunities(min_score=25, limit=50)
        context = await memory.get_context()
        briefing = await analyzer.generate_daily_briefing(opportunities, context)
        await db.save_briefing(briefing)

    return {"success": True, "data": briefing}


@app.get("/briefing/{briefing_date}")
async def get_briefing(briefing_date: str):
    """Get briefing for a specific date"""
    try:
        d = date.fromisoformat(briefing_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    db = get_db()
    briefing = await db.get_briefing(d)

    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")

    return {"success": True, "data": briefing}


# ============ Opportunity Endpoints ============

@app.get("/opportunities")
async def get_opportunities(
    status: Optional[str] = Query(None, description="Filter by status"),
    min_score: int = Query(0, description="Minimum fit score"),
    recommendation: Optional[str] = Query(None, description="Filter by recommendation"),
    limit: int = Query(50, le=200),
    offset: int = Query(0)
):
    """Get opportunities with filtering"""
    db = get_db()
    opportunities = await db.get_opportunities(
        status=status,
        min_score=min_score,
        limit=limit,
        offset=offset
    )

    if recommendation:
        opportunities = [o for o in opportunities if o.get("recommendation") == recommendation]

    return {
        "success": True,
        "data": opportunities,
        "count": len(opportunities)
    }


@app.get("/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """Get a single opportunity by ID"""
    db = get_db()
    opportunity = await db.get_opportunity(opportunity_id)

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {"success": True, "data": opportunity}


@app.post("/opportunities/{opportunity_id}/analyze")
async def analyze_opportunity(opportunity_id: str):
    """Run AI analysis on a specific opportunity"""
    db = get_db()
    memory = get_memory()

    opportunity = await db.get_opportunity(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    context = await memory.get_context()
    analysis = await analyzer.analyze_opportunity(opportunity, context)

    # Update opportunity with analysis
    await db.update_opportunity_analysis(
        opportunity_id,
        fit_score=opportunity.get("fit_score", 0),
        fit_analysis=analysis.get("analysis", ""),
        recommendation=analysis.get("recommendation", "review"),
        ai_analysis=analysis
    )

    return {"success": True, "data": analysis}


@app.post("/opportunities/{opportunity_id}/action")
async def record_action(opportunity_id: str, request: ActionRequest):
    """Record a user action on an opportunity"""
    db = get_db()
    memory = get_memory()

    opportunity = await db.get_opportunity(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    valid_actions = ["viewed", "pursued", "bid", "won", "lost", "passed"]
    if request.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {valid_actions}"
        )

    # Update status
    status_map = {
        "pursued": "pursuing",
        "bid": "bid",
        "won": "won",
        "lost": "lost",
        "passed": "passed"
    }

    if request.action in status_map:
        await db.update_opportunity_status(
            opportunity_id,
            status_map[request.action],
            request.notes
        )

    # Record action and learn
    await memory.learn_from_action(opportunity_id, request.action, request.notes)

    # Handle wins/losses
    if request.action == "won":
        await memory.record_win(opportunity, request.notes or "")
    elif request.action == "lost":
        await memory.record_loss(opportunity, request.notes or "")

    return {"success": True, "message": f"Action '{request.action}' recorded"}


# ============ Chat Endpoint ============

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat with Sam about opportunities or government contracting"""
    db = get_db()
    memory = get_memory()

    session_id = request.session_id or str(uuid.uuid4())

    # Get opportunity context if provided
    opportunity = None
    if request.opportunity_id:
        opportunity = await db.get_opportunity(request.opportunity_id)

    # Get memory context
    context = await memory.get_context()

    # Get chat history
    history = await db.get_chat_history(session_id)

    # Get response from Sam
    response = await analyzer.chat(
        message=request.message,
        opportunity=opportunity,
        context=context,
        history=history
    )

    # Save messages
    await db.save_chat_message(session_id, "user", request.message, request.opportunity_id)
    await db.save_chat_message(session_id, "assistant", response, request.opportunity_id)

    return {
        "success": True,
        "data": {
            "response": response,
            "session_id": session_id
        }
    }


# ============ Memory/Context Endpoints ============

@app.get("/memory")
async def get_memory_context():
    """Get full memory context"""
    memory = get_memory()
    context = await memory.get_context()
    return {"success": True, "data": context}


@app.post("/memory")
async def update_memory(request: MemoryUpdate):
    """Update a memory value"""
    memory = get_memory()
    await memory.set(request.key, request.value)
    return {"success": True, "message": f"Memory '{request.key}' updated"}


@app.get("/priorities")
async def get_priorities():
    """Get current priorities"""
    memory = get_memory()
    priorities = await memory.get_priorities()
    return {"success": True, "data": priorities}


@app.post("/priorities")
async def update_priorities(request: PriorityUpdate):
    """Update priorities"""
    memory = get_memory()
    await memory.set_priorities(request.priorities)
    return {"success": True, "message": "Priorities updated"}


@app.get("/preferences")
async def get_preferences():
    """Get user preferences"""
    memory = get_memory()
    prefs = await memory.get_preferences()
    return {"success": True, "data": prefs}


@app.post("/preferences")
async def update_preferences(request: PreferencesUpdate):
    """Update preferences"""
    memory = get_memory()
    updates = request.model_dump(exclude_none=True)
    await memory.update_preferences(updates)
    return {"success": True, "message": "Preferences updated"}


# ============ Stats Endpoints ============

@app.get("/stats")
async def get_stats():
    """Get summary statistics"""
    memory = get_memory()
    stats = await memory.get_stats()
    return {"success": True, "data": stats}


@app.get("/stats/opportunities")
async def get_opportunity_stats():
    """Get opportunity statistics"""
    db = get_db()
    opportunities = await db.get_opportunities(limit=500)
    summary = scorer.summarize_batch(opportunities)
    return {"success": True, "data": summary}


# ============ Manual Triggers ============

@app.post("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """Manually trigger a scrape"""
    background_tasks.add_task(daily_scrape)
    return {"success": True, "message": "Scrape started in background"}


@app.post("/briefing/generate")
async def trigger_briefing(background_tasks: BackgroundTasks):
    """Manually trigger briefing generation"""
    background_tasks.add_task(generate_daily_briefing_job)
    return {"success": True, "message": "Briefing generation started"}
