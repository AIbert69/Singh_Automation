"""
Sam Agent 2.0 FastAPI Backend
Main API server with scheduling and endpoints
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from ..database import get_db, get_memory
from ..scrapers import SamGovScraper, USASpendingScraper
from ..intelligence import OpportunityScorer, OpportunityAnalyzer


# ============ Pydantic Models ============

class OpportunityResponse(BaseModel):
    id: str
    source: str
    title: str
    description: Optional[str]
    agency: Optional[str]
    estimated_value: Optional[float]
    due_date: Optional[datetime]
    fit_score: int
    strategic_recommendation: str
    url: Optional[str]


class BriefingResponse(BaseModel):
    date: str
    greeting: str
    summary: str
    top_opportunities: List[Dict[str, Any]]
    strategic_advice: str
    action_items: List[str]
    insight: Optional[str]
    stats: Dict[str, Any]


class ActionRequest(BaseModel):
    action_type: str = Field(..., pattern="^(viewed|pursued|bid_submitted|won|lost|passed|bookmarked|dismissed)$")
    notes: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    timestamp: datetime


class MemoryUpdateRequest(BaseModel):
    key: str
    value: Any
    category: Optional[str] = None


# ============ Global Instances ============

scheduler = AsyncIOScheduler()
db = None
memory = None
scorer = None
analyzer = None


# ============ Lifecycle ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    global db, memory, scorer, analyzer

    # Startup
    print("🚀 Starting Sam Agent 2.0...")

    try:
        db = get_db()
        memory = get_memory()
        scorer = OpportunityScorer()
        analyzer = OpportunityAnalyzer()
        print("✅ Database and intelligence modules initialized")
    except Exception as e:
        print(f"⚠️ Initialization warning: {e}")
        # Continue without DB for development

    # Schedule daily scrape at 6 AM local time
    scheduler.add_job(
        daily_scrape_job,
        CronTrigger(hour=6, minute=0),
        id="daily_scrape",
        replace_existing=True
    )

    # Schedule briefing generation at 6:30 AM
    scheduler.add_job(
        daily_briefing_job,
        CronTrigger(hour=6, minute=30),
        id="daily_briefing",
        replace_existing=True
    )

    scheduler.start()
    print("📅 Scheduler started")

    yield

    # Shutdown
    scheduler.shutdown()
    print("👋 Sam Agent 2.0 shutting down")


# ============ App Setup ============

app = FastAPI(
    title="Sam Agent 2.0",
    description="Autonomous Government Contracting Advisor for Singh Automation",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Scheduled Jobs ============

async def daily_scrape_job():
    """Daily scrape job - runs at 6 AM"""
    print(f"🔍 Starting daily scrape at {datetime.now()}")

    try:
        # Scrape SAM.gov
        async with SamGovScraper() as sam_scraper:
            sam_opportunities = await sam_scraper.scrape(days_back=1)
            print(f"✅ SAM.gov: {len(sam_opportunities)} opportunities")

            # Score and store
            if scorer and db:
                scored = scorer.score_opportunities(sam_opportunities)
                for opp in scored:
                    await db.upsert_opportunity(opp)

        print(f"✅ Daily scrape completed at {datetime.now()}")

    except Exception as e:
        print(f"❌ Daily scrape failed: {e}")


async def daily_briefing_job():
    """Daily briefing generation - runs at 6:30 AM"""
    print(f"📋 Generating daily briefing at {datetime.now()}")

    try:
        if db and analyzer and memory:
            # Get today's opportunities
            since = datetime.now() - timedelta(days=1)
            opportunities = await db.get_new_opportunities(since)

            # Get context
            context = await memory.get_context()

            # Generate briefing
            briefing = await analyzer.generate_daily_briefing(opportunities, context)

            # Store briefing
            await db.create_briefing({
                "date": date.today().isoformat(),
                "summary": briefing.get("summary", ""),
                "opportunities_found": briefing.get("stats", {}).get("total", 0),
                "top_opportunities": briefing.get("top_opportunities", []),
                "strategic_advice": briefing.get("strategic_advice", ""),
                "action_items": briefing.get("action_items", []),
                "insight": briefing.get("insight")
            })

            print(f"✅ Daily briefing generated")

    except Exception as e:
        print(f"❌ Briefing generation failed: {e}")


# ============ Health Endpoints ============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Sam Agent 2.0",
        "status": "operational",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    checks = {
        "api": "healthy",
        "database": "unknown",
        "scheduler": "healthy" if scheduler.running else "stopped"
    }

    if db:
        try:
            # Quick DB check
            await db.get_memory("health_check")
            checks["database"] = "healthy"
        except Exception:
            checks["database"] = "unhealthy"

    status = "healthy" if all(v == "healthy" for v in checks.values()) else "degraded"

    return {
        "status": status,
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }


# ============ Briefing Endpoints ============

@app.get("/briefing/today", response_model=BriefingResponse)
async def get_today_briefing():
    """Get today's daily briefing"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    briefing = await db.get_briefing(date.today())

    if not briefing:
        # Generate on-demand if not available
        if analyzer and memory:
            since = datetime.now() - timedelta(days=1)
            opportunities = await db.get_new_opportunities(since)
            context = await memory.get_context()
            briefing = await analyzer.generate_daily_briefing(opportunities, context)

            # Store for future requests
            await db.create_briefing({
                "date": date.today().isoformat(),
                "summary": briefing.get("summary", ""),
                "opportunities_found": briefing.get("stats", {}).get("total", 0),
                "top_opportunities": briefing.get("top_opportunities", []),
                "strategic_advice": briefing.get("strategic_advice", ""),
                "action_items": briefing.get("action_items", []),
                "insight": briefing.get("insight")
            })
        else:
            raise HTTPException(status_code=404, detail="Briefing not available")

    return BriefingResponse(
        date=str(briefing.get("date", date.today())),
        greeting=briefing.get("greeting", "Good morning, Albert"),
        summary=briefing.get("summary", "No briefing available"),
        top_opportunities=briefing.get("top_opportunities", []),
        strategic_advice=briefing.get("strategic_advice", ""),
        action_items=briefing.get("action_items", []),
        insight=briefing.get("insight"),
        stats=briefing.get("stats", {})
    )


@app.get("/briefing/{briefing_date}")
async def get_briefing_by_date(briefing_date: date):
    """Get briefing for a specific date"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    briefing = await db.get_briefing(briefing_date)

    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found for this date")

    return briefing


# ============ Opportunities Endpoints ============

@app.get("/opportunities")
async def get_opportunities(
    status: Optional[str] = Query(None, description="Filter by status"),
    min_score: int = Query(0, ge=0, le=100, description="Minimum fit score"),
    source: Optional[str] = Query(None, description="Filter by source"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get filtered opportunities"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    opportunities = await db.get_opportunities(
        status=status,
        min_score=min_score,
        source=source,
        limit=limit,
        offset=offset
    )

    return {
        "opportunities": opportunities,
        "count": len(opportunities),
        "filters": {
            "status": status,
            "min_score": min_score,
            "source": source
        }
    }


@app.get("/opportunities/top")
async def get_top_opportunities(
    limit: int = Query(10, ge=1, le=50)
):
    """Get top opportunities by fit score"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    opportunities = await db.get_opportunities(
        min_score=50,
        limit=limit
    )

    return {"opportunities": opportunities, "count": len(opportunities)}


@app.get("/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """Get a single opportunity by ID"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    opportunity = await db.get_opportunity(opportunity_id)

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return opportunity


@app.get("/opportunities/{opportunity_id}/analyze")
async def analyze_opportunity(opportunity_id: str):
    """Get detailed AI analysis for an opportunity"""
    if not db or not analyzer:
        raise HTTPException(status_code=503, detail="Service not available")

    opportunity = await db.get_opportunity(opportunity_id)

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    analysis = await analyzer.analyze_opportunity(opportunity)

    # Update opportunity with analysis
    await db.update_opportunity(opportunity_id, {
        "fit_analysis": analysis.get("analysis"),
        "strategic_recommendation": analysis.get("recommendation")
    })

    return analysis


@app.post("/opportunities/{opportunity_id}/action")
async def record_opportunity_action(
    opportunity_id: str,
    action: ActionRequest
):
    """Record an action on an opportunity"""
    if not db or not memory:
        raise HTTPException(status_code=503, detail="Service not available")

    opportunity = await db.get_opportunity(opportunity_id)

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Record the action
    await db.record_action(
        opportunity_id=opportunity_id,
        action_type=action.action_type,
        notes=action.notes
    )

    # Update opportunity status based on action
    status_map = {
        "pursued": "pursuing",
        "passed": "passed",
        "won": "won",
        "lost": "lost"
    }

    if action.action_type in status_map:
        await db.update_opportunity(opportunity_id, {
            "status": status_map[action.action_type]
        })

    # Learn from the action
    await memory.learn_from_action(
        opportunity_id=opportunity_id,
        action=action.action_type,
        outcome=action.notes
    )

    return {"success": True, "message": f"Action '{action.action_type}' recorded"}


# ============ Scan Endpoints ============

@app.post("/scan/now")
async def trigger_scan(background_tasks: BackgroundTasks):
    """Manually trigger a scan"""
    background_tasks.add_task(daily_scrape_job)
    return {"message": "Scan triggered", "status": "processing"}


@app.get("/scan/status")
async def get_scan_status():
    """Get status of recent scans"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    # Get latest scrape logs
    # This would need to be implemented in the database module
    return {
        "last_scan": datetime.now().isoformat(),
        "next_scheduled": "06:00 AM tomorrow",
        "status": "idle"
    }


# ============ Chat Endpoint ============

@app.post("/chat", response_model=ChatResponse)
async def chat_with_sam(request: ChatRequest):
    """Chat with Sam for ad-hoc questions"""
    if not analyzer or not memory:
        raise HTTPException(status_code=503, detail="Service not available")

    context = await memory.get_context()

    # Add recent opportunities to context
    if db:
        recent = await db.get_opportunities(min_score=50, limit=10)
        context["recent_opportunities"] = recent

    response = await analyzer.chat(request.message, context)

    return ChatResponse(
        response=response,
        timestamp=datetime.now()
    )


# ============ Memory Endpoints ============

@app.get("/memory/{key}")
async def get_memory_value(key: str):
    """Get a memory value"""
    if not memory:
        raise HTTPException(status_code=503, detail="Service not available")

    value = await memory.get(key)

    if value is None:
        raise HTTPException(status_code=404, detail="Memory key not found")

    return {"key": key, "value": value}


@app.put("/memory")
async def set_memory_value(request: MemoryUpdateRequest):
    """Set a memory value"""
    if not memory:
        raise HTTPException(status_code=503, detail="Service not available")

    await memory.set(request.key, request.value, request.category)

    return {"success": True, "key": request.key}


@app.get("/stats")
async def get_stats():
    """Get summary statistics"""
    if not memory or not db:
        raise HTTPException(status_code=503, detail="Service not available")

    mem_stats = await memory.get_stats()

    # Get opportunity stats
    opportunities = await db.get_opportunities(limit=1000)
    if scorer:
        opp_stats = scorer.get_stats(opportunities)
    else:
        opp_stats = {"total": len(opportunities)}

    return {
        "memory": mem_stats,
        "opportunities": opp_stats,
        "timestamp": datetime.now().isoformat()
    }


# ============ Market Intelligence ============

@app.get("/market/analysis")
async def get_market_analysis():
    """Get market analysis for Singh's NAICS codes"""
    try:
        async with USASpendingScraper() as scraper:
            analysis = await scraper.analyze_market()
            return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/competitors/{competitor_name}")
async def analyze_competitor(competitor_name: str):
    """Analyze a competitor"""
    if not analyzer:
        raise HTTPException(status_code=503, detail="Service not available")

    try:
        async with USASpendingScraper() as scraper:
            awards = await scraper.get_competitor_awards(competitor_name)

        if not awards:
            raise HTTPException(status_code=404, detail="Competitor not found")

        analysis = await analyzer.analyze_competitor(competitor_name, awards)
        return analysis

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ Events ============

@app.get("/events")
async def get_upcoming_events(days: int = Query(30, ge=1, le=90)):
    """Get upcoming events"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    events = await db.get_upcoming_events(days=days)
    return {"events": events, "count": len(events)}
