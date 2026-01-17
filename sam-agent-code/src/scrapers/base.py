"""
Base Scraper Class for Sam Agent 2.0
Abstract base class for all data source scrapers
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Abstract base class for all scrapers"""

    def __init__(
        self,
        profile: Dict[str, Any],
        rate_limit_delay: float = 1.0,
        max_retries: int = 3
    ):
        self.profile = profile
        self.rate_limit_delay = rate_limit_delay
        self.max_retries = max_retries
        self.source_name = "base"

    @abstractmethod
    async def search(self, **kwargs) -> List[Dict[str, Any]]:
        """Search for opportunities. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def get_details(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific opportunity."""
        pass

    def normalize_opportunity(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw opportunity data to standard format.
        Override in subclasses for source-specific normalization.
        """
        return {
            "source": self.source_name,
            "source_id": raw_data.get("id"),
            "title": raw_data.get("title", ""),
            "description": raw_data.get("description", ""),
            "naics_codes": raw_data.get("naics_codes", []),
            "psc_codes": raw_data.get("psc_codes", []),
            "due_date": raw_data.get("due_date"),
            "posted_date": raw_data.get("posted_date"),
            "agency": raw_data.get("agency"),
            "sub_agency": raw_data.get("sub_agency"),
            "office": raw_data.get("office"),
            "location": raw_data.get("location"),
            "place_of_performance": raw_data.get("place_of_performance"),
            "state": raw_data.get("state"),
            "estimated_value": raw_data.get("estimated_value"),
            "contract_type": raw_data.get("contract_type"),
            "set_aside": raw_data.get("set_aside"),
            "url": raw_data.get("url"),
            "solicitation_number": raw_data.get("solicitation_number"),
            "raw_data": raw_data
        }

    async def rate_limit(self) -> None:
        """Apply rate limiting delay"""
        await asyncio.sleep(self.rate_limit_delay)

    async def retry_with_backoff(
        self,
        func,
        *args,
        **kwargs
    ) -> Any:
        """Execute function with exponential backoff retry"""
        last_error = None

        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e
                wait_time = (2 ** attempt) * self.rate_limit_delay
                logger.warning(
                    f"{self.source_name}: Attempt {attempt + 1} failed: {e}. "
                    f"Retrying in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)

        logger.error(f"{self.source_name}: All {self.max_retries} attempts failed")
        raise last_error

    def filter_by_naics(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter opportunities by matching NAICS codes"""
        target_naics = set(self.profile.get("naics", []))

        filtered = []
        for opp in opportunities:
            opp_naics = set(opp.get("naics_codes", []))
            # Check for exact match or prefix match
            if opp_naics & target_naics:
                filtered.append(opp)
            else:
                # Check for partial match (first 4 digits)
                for target in target_naics:
                    for opp_code in opp_naics:
                        if opp_code[:4] == target[:4]:
                            filtered.append(opp)
                            break
                    else:
                        continue
                    break

        return filtered

    def filter_by_keywords(
        self,
        opportunities: List[Dict[str, Any]],
        min_matches: int = 1
    ) -> List[Dict[str, Any]]:
        """Filter opportunities by keyword matches in title/description"""
        keywords = [kw.lower() for kw in self.profile.get("keywords", [])]
        exclude = [kw.lower() for kw in self.profile.get("exclude_keywords", [])]

        filtered = []
        for opp in opportunities:
            text = f"{opp.get('title', '')} {opp.get('description', '')}".lower()

            # Check for excluded keywords
            if any(ex in text for ex in exclude):
                continue

            # Count keyword matches
            matches = sum(1 for kw in keywords if kw in text)
            if matches >= min_matches:
                opp["keyword_matches"] = matches
                filtered.append(opp)

        return filtered

    def is_eligible_setaside(self, set_aside: str) -> bool:
        """Check if the set-aside is one Singh can compete for"""
        if not set_aside:
            return True

        set_aside_lower = set_aside.lower()
        ineligible = [sa.lower() for sa in self.profile.get("ineligible_setasides", [])]

        for inel in ineligible:
            if inel in set_aside_lower:
                return False

        return True

    def log_search_start(self, params: Dict[str, Any]) -> None:
        """Log search start"""
        logger.info(f"{self.source_name}: Starting search with params: {params}")

    def log_search_complete(self, count: int, duration: float) -> None:
        """Log search completion"""
        logger.info(
            f"{self.source_name}: Search complete. "
            f"Found {count} opportunities in {duration:.2f}s"
        )

    def log_error(self, error: Exception, context: str = "") -> None:
        """Log error with context"""
        logger.error(f"{self.source_name}: Error {context}: {error}")
