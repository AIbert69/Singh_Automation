"""
Memory Manager for Sam Agent 2.0
Handles persistent context and learning from user actions
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from .connection import get_db


class MemoryManager:
    """Manages persistent memory and context for the AI advisor"""

    def __init__(self):
        self.db = get_db()

    async def get_context(self) -> Dict[str, Any]:
        """Get full context for briefing generation"""
        return await self.db.get_full_context()

    async def get(self, key: str) -> Optional[Any]:
        """Get a specific memory value"""
        return await self.db.get_memory(key)

    async def set(self, key: str, value: Any, category: Optional[str] = None) -> None:
        """Set a memory value"""
        await self.db.set_memory(key, value, category)

    # ============ Priorities ============

    async def get_priorities(self) -> List[str]:
        """Get current priorities"""
        priorities = await self.get("priorities")
        return priorities if priorities else []

    async def set_priorities(self, priorities: List[str]) -> None:
        """Set current priorities"""
        await self.set("priorities", priorities, "priorities")

    async def add_priority(self, priority: str) -> None:
        """Add a new priority"""
        priorities = await self.get_priorities()
        if priority not in priorities:
            priorities.append(priority)
            await self.set_priorities(priorities)

    # ============ Active Pursuits ============

    async def get_active_pursuits(self) -> List[Dict[str, Any]]:
        """Get opportunities being actively pursued"""
        pursuits = await self.get("active_pursuits")
        return pursuits if pursuits else []

    async def add_pursuit(self, opportunity_id: str, title: str, due_date: str) -> None:
        """Add an opportunity to active pursuits"""
        pursuits = await self.get_active_pursuits()
        pursuit = {
            "id": opportunity_id,
            "title": title,
            "due_date": due_date,
            "added_at": datetime.now().isoformat()
        }
        pursuits.append(pursuit)
        await self.set("active_pursuits", pursuits, "active_pursuits")

    async def remove_pursuit(self, opportunity_id: str) -> None:
        """Remove an opportunity from active pursuits"""
        pursuits = await self.get_active_pursuits()
        pursuits = [p for p in pursuits if p["id"] != opportunity_id]
        await self.set("active_pursuits", pursuits, "active_pursuits")

    # ============ Win/Loss Tracking ============

    async def record_win(self, opportunity: Dict[str, Any], notes: str = "") -> None:
        """Record a won opportunity"""
        wins = await self.get("wins") or []
        win_record = {
            "opportunity_id": opportunity.get("id"),
            "title": opportunity.get("title"),
            "agency": opportunity.get("agency"),
            "value": opportunity.get("estimated_value"),
            "naics": opportunity.get("naics_codes", []),
            "date": datetime.now().isoformat(),
            "notes": notes
        }
        wins.append(win_record)
        await self.set("wins", wins, "wins")
        await self.db.record_action(opportunity.get("id"), "won", notes)

    async def record_loss(self, opportunity: Dict[str, Any], notes: str = "") -> None:
        """Record a lost opportunity"""
        losses = await self.get("losses") or []
        loss_record = {
            "opportunity_id": opportunity.get("id"),
            "title": opportunity.get("title"),
            "agency": opportunity.get("agency"),
            "value": opportunity.get("estimated_value"),
            "naics": opportunity.get("naics_codes", []),
            "date": datetime.now().isoformat(),
            "notes": notes
        }
        losses.append(loss_record)
        await self.set("losses", losses, "losses")
        await self.db.record_action(opportunity.get("id"), "lost", notes)

    # ============ Preferences ============

    async def get_preferences(self) -> Dict[str, Any]:
        """Get user preferences"""
        prefs = await self.get("preferences")
        return prefs if prefs else {
            "min_contract_value": 50000,
            "max_contract_value": 5000000,
            "preferred_states": ["MI", "IN", "OH", "CA"],
            "notification_time": "07:00",
            "notification_enabled": True
        }

    async def update_preferences(self, updates: Dict[str, Any]) -> None:
        """Update user preferences"""
        prefs = await self.get_preferences()
        prefs.update(updates)
        await self.set("preferences", prefs, "preferences")

    # ============ Learning ============

    async def learn_from_action(
        self,
        opportunity_id: str,
        action: str,
        outcome: Optional[str] = None
    ) -> None:
        """Update memory based on user actions to improve future recommendations"""
        await self.db.record_action(opportunity_id, action, outcome)

        opportunity = await self.db.get_opportunity(opportunity_id)
        if not opportunity:
            return

        if action == "pursued":
            patterns = await self.get("pursued_patterns") or {
                "naics": {},
                "agencies": {},
                "value_ranges": {}
            }

            for naics in opportunity.get("naics_codes", []):
                patterns["naics"][naics] = patterns["naics"].get(naics, 0) + 1

            agency = opportunity.get("agency", "Unknown")
            patterns["agencies"][agency] = patterns["agencies"].get(agency, 0) + 1

            await self.set("pursued_patterns", patterns, "learning")

        elif action == "passed":
            passed_patterns = await self.get("passed_patterns") or {
                "keywords": {},
                "agencies": {},
                "reasons": []
            }

            agency = opportunity.get("agency", "Unknown")
            passed_patterns["agencies"][agency] = passed_patterns["agencies"].get(agency, 0) + 1

            await self.set("passed_patterns", passed_patterns, "learning")

    # ============ Contacts ============

    async def add_contact(self, contact: Dict[str, Any]) -> None:
        """Add or update a contact"""
        await self.db.upsert_contact(contact)

    async def get_contacts(self, agency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get contacts"""
        return await self.db.get_contacts(agency)

    # ============ Stats ============

    async def get_stats(self) -> Dict[str, Any]:
        """Get summary statistics"""
        wins = await self.get("wins") or []
        losses = await self.get("losses") or []
        pursuits = await self.get_active_pursuits()

        total_win_value = sum(w.get("value", 0) or 0 for w in wins)

        return {
            "total_wins": len(wins),
            "total_losses": len(losses),
            "win_rate": len(wins) / (len(wins) + len(losses)) if (wins or losses) else 0,
            "total_win_value": total_win_value,
            "active_pursuits": len(pursuits),
            "avg_win_value": total_win_value / len(wins) if wins else 0
        }


# Singleton instance
_memory: Optional[MemoryManager] = None


def get_memory() -> MemoryManager:
    """Get the memory manager singleton"""
    global _memory
    if _memory is None:
        _memory = MemoryManager()
    return _memory
