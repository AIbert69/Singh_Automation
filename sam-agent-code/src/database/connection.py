"""
Database Connection for Sam Agent 2.0
Handles Supabase connection and data operations
"""

import os
from typing import Any, Dict, List, Optional
from datetime import datetime, date
from supabase import create_client, Client


class DatabaseConnection:
    """Manages Supabase database connection and operations"""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

        self.client: Client = create_client(self.url, self.key)

    # ============ Opportunities ============

    async def upsert_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update an opportunity"""
        result = self.client.table("opportunities").upsert(
            opportunity,
            on_conflict="source,source_id"
        ).execute()
        return result.data[0] if result.data else {}

    async def upsert_opportunities(self, opportunities: List[Dict[str, Any]]) -> int:
        """Bulk upsert opportunities"""
        if not opportunities:
            return 0
        result = self.client.table("opportunities").upsert(
            opportunities,
            on_conflict="source,source_id"
        ).execute()
        return len(result.data) if result.data else 0

    async def get_opportunity(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """Get a single opportunity by ID"""
        result = self.client.table("opportunities").select("*").eq("id", opportunity_id).execute()
        return result.data[0] if result.data else None

    async def get_opportunities(
        self,
        status: Optional[str] = None,
        min_score: int = 0,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get opportunities with optional filters"""
        query = self.client.table("opportunities").select("*")

        if status:
            query = query.eq("status", status)

        query = query.gte("fit_score", min_score)
        query = query.order("fit_score", desc=True)
        query = query.range(offset, offset + limit - 1)

        result = query.execute()
        return result.data if result.data else []

    async def get_new_opportunities(self, since: datetime) -> List[Dict[str, Any]]:
        """Get opportunities created since a given time"""
        result = self.client.table("opportunities").select("*").gte(
            "created_at", since.isoformat()
        ).order("fit_score", desc=True).execute()
        return result.data if result.data else []

    async def update_opportunity_status(
        self,
        opportunity_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update opportunity status"""
        update_data = {"status": status}
        if notes:
            update_data["user_notes"] = notes

        result = self.client.table("opportunities").update(update_data).eq(
            "id", opportunity_id
        ).execute()
        return result.data[0] if result.data else {}

    async def update_opportunity_analysis(
        self,
        opportunity_id: str,
        fit_score: int,
        fit_analysis: str,
        recommendation: str,
        ai_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update opportunity with AI analysis"""
        result = self.client.table("opportunities").update({
            "fit_score": fit_score,
            "fit_analysis": fit_analysis,
            "recommendation": recommendation,
            "ai_analysis": ai_analysis
        }).eq("id", opportunity_id).execute()
        return result.data[0] if result.data else {}

    # ============ Briefings ============

    async def save_briefing(self, briefing: Dict[str, Any]) -> Dict[str, Any]:
        """Save a daily briefing"""
        result = self.client.table("briefings").upsert(
            briefing,
            on_conflict="date"
        ).execute()
        return result.data[0] if result.data else {}

    async def get_briefing(self, briefing_date: date) -> Optional[Dict[str, Any]]:
        """Get briefing for a specific date"""
        result = self.client.table("briefings").select("*").eq(
            "date", briefing_date.isoformat()
        ).execute()
        return result.data[0] if result.data else None

    async def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        """Get the most recent briefing"""
        result = self.client.table("briefings").select("*").order(
            "date", desc=True
        ).limit(1).execute()
        return result.data[0] if result.data else None

    # ============ Memory ============

    async def get_memory(self, key: str) -> Optional[Any]:
        """Get a memory value by key"""
        result = self.client.table("memory").select("value").eq("key", key).execute()
        if result.data:
            return result.data[0]["value"]
        return None

    async def set_memory(
        self,
        key: str,
        value: Any,
        category: Optional[str] = None
    ) -> None:
        """Set a memory value"""
        data = {"key": key, "value": value}
        if category:
            data["category"] = category

        self.client.table("memory").upsert(data, on_conflict="key").execute()

    async def get_full_context(self) -> Dict[str, Any]:
        """Get all memory for context building"""
        result = self.client.table("memory").select("key, value, category").execute()
        context = {}
        if result.data:
            for item in result.data:
                context[item["key"]] = item["value"]
        return context

    # ============ Actions ============

    async def record_action(
        self,
        opportunity_id: Optional[str],
        action_type: str,
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Record a user action"""
        data = {
            "opportunity_id": opportunity_id,
            "action_type": action_type,
            "notes": notes,
            "metadata": metadata or {}
        }
        result = self.client.table("actions").insert(data).execute()
        return result.data[0] if result.data else {}

    async def get_recent_actions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent actions"""
        result = self.client.table("actions").select("*").order(
            "created_at", desc=True
        ).limit(limit).execute()
        return result.data if result.data else []

    # ============ Contacts ============

    async def upsert_contact(self, contact: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a contact"""
        result = self.client.table("contacts").upsert(contact).execute()
        return result.data[0] if result.data else {}

    async def get_contacts(self, agency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get contacts, optionally filtered by agency"""
        query = self.client.table("contacts").select("*")
        if agency:
            query = query.eq("agency", agency)
        result = query.order("relationship_score", desc=True).execute()
        return result.data if result.data else []

    # ============ Scrape Logs ============

    async def start_scrape_log(self, source: str) -> str:
        """Start a new scrape log entry"""
        result = self.client.table("scrape_logs").insert({
            "source": source,
            "started_at": datetime.now().isoformat(),
            "status": "running"
        }).execute()
        return result.data[0]["id"] if result.data else ""

    async def complete_scrape_log(
        self,
        log_id: str,
        opportunities_found: int,
        opportunities_new: int,
        error: Optional[str] = None
    ) -> None:
        """Complete a scrape log entry"""
        status = "failed" if error else "completed"
        self.client.table("scrape_logs").update({
            "completed_at": datetime.now().isoformat(),
            "status": status,
            "opportunities_found": opportunities_found,
            "opportunities_new": opportunities_new,
            "error_message": error
        }).eq("id", log_id).execute()

    # ============ Chat History ============

    async def save_chat_message(
        self,
        session_id: str,
        role: str,
        content: str,
        opportunity_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save a chat message"""
        result = self.client.table("chat_history").insert({
            "session_id": session_id,
            "role": role,
            "content": content,
            "opportunity_id": opportunity_id
        }).execute()
        return result.data[0] if result.data else {}

    async def get_chat_history(
        self,
        session_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get chat history for a session"""
        result = self.client.table("chat_history").select("*").eq(
            "session_id", session_id
        ).order("created_at", desc=False).limit(limit).execute()
        return result.data if result.data else []


# Singleton instance
_db: Optional[DatabaseConnection] = None


def get_db() -> DatabaseConnection:
    """Get the database connection singleton"""
    global _db
    if _db is None:
        _db = DatabaseConnection()
    return _db
