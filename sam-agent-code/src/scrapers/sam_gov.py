"""
SAM.gov Opportunities API Scraper for Sam Agent 2.0

SAM.gov Public API Documentation:
- Base URL: https://api.sam.gov/opportunities/v2
- Rate Limit: 10 requests/second
- API Key: Free registration at sam.gov

Endpoints:
- /search - Search opportunities
- /{noticeId} - Get opportunity details
"""

import os
import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from .base import BaseScraper


class SamGovScraper(BaseScraper):
    """Scraper for SAM.gov federal opportunities"""

    BASE_URL = "https://api.sam.gov/opportunities/v2"

    def __init__(self, profile: Dict[str, Any], api_key: Optional[str] = None):
        super().__init__(profile, rate_limit_delay=0.1)  # 10 req/sec allowed
        self.api_key = api_key or os.getenv("SAM_API_KEY")
        self.source_name = "sam.gov"

        if not self.api_key:
            raise ValueError("SAM_API_KEY is required")

    async def search(
        self,
        days_back: int = 7,
        posted_from: Optional[str] = None,
        posted_to: Optional[str] = None,
        naics_codes: Optional[List[str]] = None,
        keywords: Optional[str] = None,
        set_aside: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search SAM.gov for opportunities matching criteria

        Args:
            days_back: Number of days to look back for posted opportunities
            posted_from: Start date (MM/DD/YYYY) - overrides days_back
            posted_to: End date (MM/DD/YYYY) - defaults to today
            naics_codes: List of NAICS codes to filter by
            keywords: Keyword search string
            set_aside: Set-aside code filter
            limit: Max results per request (max 1000)
            offset: Pagination offset
            active_only: Only return active opportunities

        Returns:
            List of normalized opportunity dictionaries
        """
        # Calculate date range
        if not posted_to:
            posted_to = datetime.now().strftime("%m/%d/%Y")
        if not posted_from:
            posted_from = (datetime.now() - timedelta(days=days_back)).strftime("%m/%d/%Y")

        # Use profile NAICS if not specified
        if not naics_codes:
            naics_codes = self.profile.get("naics", [])

        params = {
            "api_key": self.api_key,
            "postedFrom": posted_from,
            "postedTo": posted_to,
            "limit": min(limit, 1000),
            "offset": offset
        }

        # Add NAICS filter
        if naics_codes:
            params["ncode"] = ",".join(naics_codes)

        # Add keyword search
        if keywords:
            params["q"] = keywords

        # Add set-aside filter
        if set_aside:
            params["typeOfSetAside"] = set_aside

        # Filter for active opportunities only
        if active_only:
            params["ptype"] = "o,p,k"  # Solicitation, Presolicitation, Combined

        self.log_search_start(params)
        start_time = datetime.now()

        try:
            opportunities = await self._fetch_opportunities(params)

            # Filter by eligibility
            eligible = [
                opp for opp in opportunities
                if self.is_eligible_setaside(opp.get("set_aside", ""))
            ]

            duration = (datetime.now() - start_time).total_seconds()
            self.log_search_complete(len(eligible), duration)

            return eligible

        except Exception as e:
            self.log_error(e, "during search")
            raise

    async def search_by_keywords(
        self,
        days_back: int = 14,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search using profile keywords to find relevant opportunities
        that might not match NAICS codes exactly
        """
        all_opportunities = []
        keywords = self.profile.get("keywords", [])[:10]  # Top 10 keywords

        for keyword in keywords:
            try:
                results = await self.search(
                    days_back=days_back,
                    keywords=keyword,
                    naics_codes=[],  # Don't filter by NAICS for keyword search
                    limit=limit
                )
                all_opportunities.extend(results)
                await self.rate_limit()
            except Exception as e:
                self.log_error(e, f"searching keyword '{keyword}'")

        # Deduplicate by source_id
        seen = set()
        unique = []
        for opp in all_opportunities:
            if opp["source_id"] not in seen:
                seen.add(opp["source_id"])
                unique.append(opp)

        # Filter by profile keywords
        filtered = self.filter_by_keywords(unique)

        return filtered

    async def get_details(self, notice_id: str) -> Optional[Dict[str, Any]]:
        """
        Get full details for a specific opportunity

        Args:
            notice_id: The SAM.gov notice ID

        Returns:
            Normalized opportunity dictionary or None
        """
        url = f"{self.BASE_URL}/search"
        params = {
            "api_key": self.api_key,
            "noticeId": notice_id
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                if data.get("opportunitiesData"):
                    raw = data["opportunitiesData"][0]
                    return self.normalize_opportunity(raw)

                return None

        except Exception as e:
            self.log_error(e, f"getting details for {notice_id}")
            return None

    async def _fetch_opportunities(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch opportunities from SAM.gov API"""
        url = f"{self.BASE_URL}/search"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await self.retry_with_backoff(
                self._make_request, client, url, params
            )
            return response

    async def _make_request(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Make a single API request"""
        response = await client.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        opportunities_data = data.get("opportunitiesData", [])

        return [self.normalize_opportunity(raw) for raw in opportunities_data]

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize SAM.gov opportunity data to standard format"""
        # Extract NAICS codes
        naics_codes = []
        if raw.get("naicsCode"):
            naics_codes = [raw["naicsCode"]]
        elif raw.get("classificationCode"):
            naics_codes = [raw["classificationCode"]]

        # Extract PSC codes
        psc_codes = []
        if raw.get("psc"):
            psc_codes = [raw["psc"]]

        # Parse dates
        posted_date = self._parse_date(raw.get("postedDate"))
        due_date = self._parse_date(raw.get("responseDeadLine"))
        archive_date = self._parse_date(raw.get("archiveDate"))

        # Extract location info
        place_of_performance = raw.get("placeOfPerformance", {})
        state = None
        if isinstance(place_of_performance, dict):
            state_obj = place_of_performance.get("state", {})
            if isinstance(state_obj, dict):
                state = state_obj.get("code")
            elif isinstance(state_obj, str):
                state = state_obj

        # Build normalized opportunity
        return {
            "source": "sam.gov",
            "source_id": raw.get("noticeId"),
            "title": raw.get("title", ""),
            "description": raw.get("description", ""),
            "naics_codes": naics_codes,
            "psc_codes": psc_codes,
            "due_date": due_date,
            "posted_date": posted_date,
            "archive_date": archive_date,
            "agency": raw.get("fullParentPathName", "").split(".")[0] if raw.get("fullParentPathName") else raw.get("department"),
            "sub_agency": raw.get("subtierAgency"),
            "office": raw.get("office"),
            "location": self._format_location(place_of_performance),
            "place_of_performance": self._format_location(place_of_performance),
            "state": state,
            "estimated_value": self._parse_value(raw.get("award", {})),
            "contract_type": raw.get("typeOfContractPricing"),
            "set_aside": raw.get("typeOfSetAsideDescription") or raw.get("typeOfSetAside"),
            "url": f"https://sam.gov/opp/{raw.get('noticeId')}/view",
            "solicitation_number": raw.get("solicitationNumber"),
            "notice_type": raw.get("type"),
            "active": raw.get("active", "Yes") == "Yes",
            "raw_data": raw
        }

    def _parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """Parse SAM.gov date format to ISO format"""
        if not date_str:
            return None

        try:
            # SAM.gov uses various formats
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S"]:
                try:
                    dt = datetime.strptime(date_str.split("T")[0], fmt.split("T")[0])
                    return dt.isoformat()
                except ValueError:
                    continue
            return date_str
        except Exception:
            return None

    def _parse_value(self, award: Dict[str, Any]) -> Optional[float]:
        """Extract estimated value from award data"""
        if not award:
            return None

        for key in ["amount", "ceiling", "floor"]:
            if award.get(key):
                try:
                    return float(award[key])
                except (ValueError, TypeError):
                    pass

        return None

    def _format_location(self, place: Dict[str, Any]) -> str:
        """Format place of performance to readable string"""
        if not place or not isinstance(place, dict):
            return ""

        parts = []

        city = place.get("city", {})
        if isinstance(city, dict):
            parts.append(city.get("name", ""))
        elif isinstance(city, str):
            parts.append(city)

        state = place.get("state", {})
        if isinstance(state, dict):
            parts.append(state.get("code", ""))
        elif isinstance(state, str):
            parts.append(state)

        country = place.get("country", {})
        if isinstance(country, dict) and country.get("code") != "USA":
            parts.append(country.get("name", ""))

        return ", ".join(filter(None, parts))
