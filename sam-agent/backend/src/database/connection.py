"""
Supabase Database Connection Manager
Handles all database operations for Sam Agent 2.0
"""

import os
from typing import Any, Dict, List, Optional
from datetime import datetime, date
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class DatabaseConnection:
    """Manages Supabase database connection and operations"""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables required")

        self.client: Client = create_client(self.url, self.key)

    # ============ Opportunities ============

    async def insert_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new opportunity"""
        result = self.client.table("opportunities").insert(opportunity).execute()
        return result.data[0] if result.data else None

    async def upsert_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update an opportunity based on source + source_id"""
        result = self.client.table("opportunities").upsert(
            opportunity,
            on_conflict="source,source_id"
        ).execute()
        return result.data[0] if result.data else None

    async def get_opportunity(self, id: str) -> Optional[Dict[str, Any]]:
        """Get a single opportunity by ID"""
        result = self.client.table("opportunities").select("*").eq("id", id).execute()
        return result.data[0] if result.data else None

    async def get_opportunities(
        self,
        status: Optional[str] = None,
        min_score: int = 0,
        source: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get filtered opportunities"""
        query = self.client.table("opportunities").select("*")

        if status:
            query = query.eq("status", status)
        if min_score > 0:
            query = query.gte("fit_score", min_score)
        if source:
            query = query.eq("source", source)

        query = query.order("fit_score", desc=True).range(offset, offset + limit - 1)
        result = query.execute()
        return result.data

    async def get_new_opportunities(self, since: datetime) -> List[Dict[str, Any]]:
        """Get opportunities created since a given time"""
        result = self.client.table("opportunities").select("*")\
            .gte("created_at", since.isoformat())\
            .order("fit_score", desc=True)\
            .execute()
        return result.data

    async def update_opportunity(self, id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an opportunity"""
        result = self.client.table("opportunities").update(updates).eq("id", id).execute()
        return result.data[0] if result.data else None

    async def update_opportunity_score(
        self,
        id: str,
        fit_score: int,
        fit_analysis: str,
        recommendation: str
    ) -> Dict[str, Any]:
        """Update opportunity with scoring results"""
        return await self.update_opportunity(id, {
            "fit_score": fit_score,
            "fit_analysis": fit_analysis,
            "strategic_recommendation": recommendation
        })

    # ============ Briefings ============

    async def create_briefing(self, briefing: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new daily briefing"""
        result = self.client.table("briefings").upsert(
            briefing,
            on_conflict="date"
        ).execute()
        return result.data[0] if result.data else None

    async def get_briefing(self, briefing_date: date) -> Optional[Dict[str, Any]]:
        """Get briefing for a specific date"""
        result = self.client.table("briefings").select("*")\
            .eq("date", briefing_date.isoformat()).execute()
        return result.data[0] if result.data else None

    async def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        """Get the most recent briefing"""
        result = self.client.table("briefings").select("*")\
            .order("date", desc=True).limit(1).execute()
        return result.data[0] if result.data else None

    # ============ Memory ============

    async def get_memory(self, key: str) -> Optional[Any]:
        """Get a memory value by key"""
        result = self.client.table("memory").select("value")\
            .eq("key", key).execute()
        return result.data[0]["value"] if result.data else None

    async def set_memory(self, key: str, value: Any, category: Optional[str] = None) -> Dict[str, Any]:
        """Set a memory value"""
        data = {"key": key, "value": value}
        if category:
            data["category"] = category
        result = self.client.table("memory").upsert(data, on_conflict="key").execute()
        return result.data[0] if result.data else None

    async def get_memory_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all memory entries in a category"""
        result = self.client.table("memory").select("*")\
            .eq("category", category).execute()
        return result.data

    async def get_full_context(self) -> Dict[str, Any]:
        """Get full context for briefing generation"""
        context = {}

        # Get all memory categories
        categories = ["priorities", "preferences", "contacts", "wins", "losses", "active_pursuits"]
        for cat in categories:
            items = await self.get_memory_by_category(cat)
            context[cat] = [item["value"] for item in items]

        # Get recent actions
        actions = self.client.table("actions").select("*")\
            .order("created_at", desc=True).limit(50).execute()
        context["recent_actions"] = actions.data

        return context

    # ============ Actions ============

    async def record_action(
        self,
        opportunity_id: str,
        action_type: str,
        notes: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Record a user action on an opportunity"""
        action = {
            "opportunity_id": opportunity_id,
            "action_type": action_type,
            "notes": notes,
            "metadata": metadata
        }
        result = self.client.table("actions").insert(action).execute()
        return result.data[0] if result.data else None

    async def get_actions_for_opportunity(self, opportunity_id: str) -> List[Dict[str, Any]]:
        """Get all actions for an opportunity"""
        result = self.client.table("actions").select("*")\
            .eq("opportunity_id", opportunity_id)\
            .order("created_at", desc=True).execute()
        return result.data

    # ============ Contacts ============

    async def upsert_contact(self, contact: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a contact"""
        result = self.client.table("contacts").upsert(contact).execute()
        return result.data[0] if result.data else None

    async def get_contacts(self, agency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get contacts, optionally filtered by agency"""
        query = self.client.table("contacts").select("*")
        if agency:
            query = query.eq("agency", agency)
        result = query.order("relationship_score", desc=True).execute()
        return result.data

    # ============ Events ============

    async def insert_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new event"""
        result = self.client.table("events").insert(event).execute()
        return result.data[0] if result.data else None

    async def get_upcoming_events(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get upcoming events in the next N days"""
        from datetime import timedelta
        end_date = datetime.now() + timedelta(days=days)

        result = self.client.table("events").select("*")\
            .gte("date", datetime.now().isoformat())\
            .lte("date", end_date.isoformat())\
            .order("date").execute()
        return result.data

    # ============ Competitors ============

    async def upsert_competitor(self, competitor: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a competitor"""
        result = self.client.table("competitors").upsert(
            competitor,
            on_conflict="name"
        ).execute()
        return result.data[0] if result.data else None

    async def get_competitors(self) -> List[Dict[str, Any]]:
        """Get all competitors"""
        result = self.client.table("competitors").select("*")\
            .order("total_awards", desc=True).execute()
        return result.data

    # ============ Scrape Logs ============

    async def start_scrape_log(self, source: str) -> Dict[str, Any]:
        """Start a new scrape log entry"""
        result = self.client.table("scrape_logs").insert({
            "source": source,
            "status": "running"
        }).execute()
        return result.data[0] if result.data else None

    async def complete_scrape_log(
        self,
        log_id: str,
        opportunities_found: int,
        opportunities_new: int,
        status: str = "completed",
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Complete a scrape log entry"""
        result = self.client.table("scrape_logs").update({
            "completed_at": datetime.now().isoformat(),
            "status": status,
            "opportunities_found": opportunities_found,
            "opportunities_new": opportunities_new,
            "error_message": error_message
        }).eq("id", log_id).execute()
        return result.data[0] if result.data else None


# Singleton instance
_db: Optional[DatabaseConnection] = None

def get_db() -> DatabaseConnection:
    """Get the database connection singleton"""
    global _db
    if _db is None:
        _db = DatabaseConnection()
    return _db
