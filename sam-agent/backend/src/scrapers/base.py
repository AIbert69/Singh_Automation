"""
Base Scraper Class for Sam Agent 2.0
Provides common functionality for all procurement scrapers
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class BaseScraper(ABC):
    """Abstract base class for all procurement scrapers"""

    def __init__(
        self,
        name: str,
        profile_path: str = "config/singh_profile.json",
        rate_limit_delay: float = 1.0,
        max_retries: int = 3,
        timeout: float = 30.0
    ):
        self.name = name
        self.logger = logging.getLogger(name)
        self.rate_limit_delay = rate_limit_delay
        self.max_retries = max_retries
        self.timeout = timeout
        self.profile = self._load_profile(profile_path)
        self.session: Optional[httpx.AsyncClient] = None

    def _load_profile(self, path: str) -> Dict[str, Any]:
        """Load Singh Automation profile"""
        try:
            # Try relative to project root first
            profile_path = Path(path)
            if not profile_path.exists():
                # Try relative to this file
                profile_path = Path(__file__).parent.parent.parent.parent / path

            with open(profile_path) as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.warning(f"Profile not found at {path}, using defaults")
            return self._default_profile()

    def _default_profile(self) -> Dict[str, Any]:
        """Default profile if file not found"""
        return {
            "naics": {
                "codes": [
                    {"code": "333249"},
                    {"code": "541330"},
                    {"code": "238210"}
                ]
            },
            "keywords": {
                "include": ["robotics", "automation", "manufacturing"],
                "exclude": ["construction", "janitorial"]
            }
        }

    @property
    def naics_codes(self) -> List[str]:
        """Get NAICS codes from profile"""
        return [n["code"] for n in self.profile.get("naics", {}).get("codes", [])]

    @property
    def include_keywords(self) -> List[str]:
        """Get include keywords from profile"""
        return self.profile.get("keywords", {}).get("include", [])

    @property
    def exclude_keywords(self) -> List[str]:
        """Get exclude keywords from profile"""
        return self.profile.get("keywords", {}).get("exclude", [])

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.aclose()

    async def _rate_limit(self):
        """Apply rate limiting between requests"""
        await asyncio.sleep(self.rate_limit_delay)

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """Make HTTP request with retry logic"""
        last_error = None

        for attempt in range(self.max_retries):
            try:
                await self._rate_limit()

                if method.upper() == "GET":
                    response = await self.session.get(url, **kwargs)
                elif method.upper() == "POST":
                    response = await self.session.post(url, **kwargs)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                response.raise_for_status()
                return response

            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_error = e
                wait_time = 2 ** attempt  # Exponential backoff
                self.logger.warning(
                    f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}. "
                    f"Retrying in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)

        raise last_error

    def _matches_keywords(self, text: str) -> bool:
        """Check if text matches include keywords and doesn't match exclude keywords"""
        if not text:
            return False

        text_lower = text.lower()

        # Check for exclude keywords first
        for keyword in self.exclude_keywords:
            if keyword.lower() in text_lower:
                return False

        # Check for include keywords
        for keyword in self.include_keywords:
            if keyword.lower() in text_lower:
                return True

        return False

    def _matches_naics(self, naics_codes: List[str]) -> bool:
        """Check if any NAICS codes match"""
        if not naics_codes:
            return False

        # Check for exact match or partial match (first 4 digits)
        for code in naics_codes:
            if code in self.naics_codes:
                return True
            # Check partial match (industry group level)
            for our_code in self.naics_codes:
                if code[:4] == our_code[:4]:
                    return True

        return False

    def normalize_opportunity(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw opportunity data to standard format.
        Override in subclasses for source-specific normalization.
        """
        return {
            "source": self.name,
            "source_id": None,
            "title": None,
            "description": None,
            "naics_codes": [],
            "due_date": None,
            "posted_date": None,
            "agency": None,
            "office": None,
            "location": None,
            "place_of_performance": None,
            "state": None,
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": None,
            "solicitation_number": None,
            "point_of_contact": None,
            "raw_data": raw_data
        }

    @abstractmethod
    async def search(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Search for opportunities.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    async def get_details(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific opportunity.
        Must be implemented by subclasses.
        """
        pass

    async def scrape(self, days_back: int = 7) -> List[Dict[str, Any]]:
        """
        Main scraping method. Searches and filters opportunities.
        """
        self.logger.info(f"Starting {self.name} scrape for last {days_back} days")

        try:
            # Search for opportunities
            raw_opportunities = await self.search(days_back=days_back)
            self.logger.info(f"Found {len(raw_opportunities)} raw opportunities")

            # Normalize and filter
            normalized = []
            for raw in raw_opportunities:
                opportunity = self.normalize_opportunity(raw)

                # Basic relevance filter
                title_desc = f"{opportunity.get('title', '')} {opportunity.get('description', '')}"
                naics_match = self._matches_naics(opportunity.get("naics_codes", []))
                keyword_match = self._matches_keywords(title_desc)

                if naics_match or keyword_match:
                    normalized.append(opportunity)

            self.logger.info(f"Filtered to {len(normalized)} relevant opportunities")
            return normalized

        except Exception as e:
            self.logger.error(f"Scrape failed: {e}")
            raise
