"""
SAM.gov Opportunities API Scraper
https://api.sam.gov/opportunities/v2/search

Rate limit: 10 requests/second (with API key)
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .base import BaseScraper


class SamGovScraper(BaseScraper):
    """SAM.gov Contract Opportunities Scraper"""

    BASE_URL = "https://api.sam.gov/opportunities/v2"

    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(name="sam.gov", rate_limit_delay=0.15, **kwargs)
        self.api_key = api_key or os.getenv("SAM_API_KEY")
        if not self.api_key:
            raise ValueError("SAM_API_KEY environment variable required")

    def _format_date(self, dt: datetime) -> str:
        """Format date for SAM.gov API (MM/dd/yyyy)"""
        return dt.strftime("%m/%d/%Y")

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string from SAM.gov API"""
        if not date_str:
            return None
        try:
            # SAM.gov returns dates in various formats
            for fmt in ["%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d", "%m/%d/%Y"]:
                try:
                    return datetime.strptime(date_str.split(".")[0].replace("Z", "+0000"), fmt)
                except ValueError:
                    continue
            return None
        except Exception:
            return None

    async def search(
        self,
        days_back: int = 7,
        naics_codes: Optional[List[str]] = None,
        keywords: Optional[str] = None,
        set_aside: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search SAM.gov for opportunities

        Args:
            days_back: Number of days to look back for posted opportunities
            naics_codes: List of NAICS codes to filter by (defaults to profile)
            keywords: Keyword search string
            set_aside: Set-aside type filter
            limit: Maximum results per request (max 1000)
        """
        if naics_codes is None:
            naics_codes = self.naics_codes

        all_opportunities = []
        offset = 0

        # Calculate date range
        posted_from = datetime.now() - timedelta(days=days_back)
        posted_to = datetime.now()

        while True:
            params = {
                "api_key": self.api_key,
                "postedFrom": self._format_date(posted_from),
                "postedTo": self._format_date(posted_to),
                "limit": min(limit, 1000),
                "offset": offset,
                "ptype": "o,k,r,s,g,f,u",  # All opportunity types
            }

            # Add NAICS filter
            if naics_codes:
                params["ncode"] = ",".join(naics_codes)

            # Add keyword filter
            if keywords:
                params["q"] = keywords

            # Add set-aside filter
            if set_aside:
                params["typeOfSetAside"] = set_aside

            try:
                response = await self._request_with_retry(
                    "GET",
                    f"{self.BASE_URL}/search",
                    params=params
                )
                data = response.json()

                opportunities = data.get("opportunitiesData", [])
                if not opportunities:
                    break

                all_opportunities.extend(opportunities)
                self.logger.info(f"Fetched {len(opportunities)} opportunities (total: {len(all_opportunities)})")

                # Check if there are more results
                total_records = data.get("totalRecords", 0)
                if len(all_opportunities) >= total_records:
                    break

                offset += limit

            except Exception as e:
                self.logger.error(f"Search failed at offset {offset}: {e}")
                break

        return all_opportunities

    async def get_details(self, notice_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific opportunity"""
        try:
            response = await self._request_with_retry(
                "GET",
                f"{self.BASE_URL}/search",
                params={
                    "api_key": self.api_key,
                    "noticeId": notice_id
                }
            )
            data = response.json()
            opportunities = data.get("opportunitiesData", [])
            return opportunities[0] if opportunities else None

        except Exception as e:
            self.logger.error(f"Failed to get details for {notice_id}: {e}")
            return None

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize SAM.gov opportunity to standard format"""
        # Extract point of contact
        poc = None
        if raw.get("pointOfContact"):
            contacts = raw["pointOfContact"]
            if contacts:
                primary = contacts[0] if isinstance(contacts, list) else contacts
                poc = {
                    "name": primary.get("fullName"),
                    "email": primary.get("email"),
                    "phone": primary.get("phone"),
                    "type": primary.get("type")
                }

        # Extract place of performance
        pop = raw.get("placeOfPerformance", {})
        pop_location = None
        pop_state = None
        if pop:
            city = pop.get("city", {})
            state = pop.get("state", {})
            pop_location = f"{city.get('name', '')}, {state.get('code', '')}".strip(", ")
            pop_state = state.get("code")

        # Parse NAICS codes
        naics_codes = []
        naics_data = raw.get("naics", [])
        if naics_data:
            if isinstance(naics_data, list):
                naics_codes = [n.get("code") for n in naics_data if n.get("code")]
            elif isinstance(naics_data, dict):
                naics_codes = [naics_data.get("code")] if naics_data.get("code") else []

        # Determine estimated value
        award = raw.get("award", {})
        estimated_value = None
        if award:
            estimated_value = award.get("amount") or award.get("estimatedValue")

        return {
            "source": "sam.gov",
            "source_id": raw.get("noticeId"),
            "title": raw.get("title"),
            "description": raw.get("description"),
            "naics_codes": naics_codes,
            "due_date": self._parse_date(raw.get("responseDeadLine")),
            "posted_date": self._parse_date(raw.get("postedDate")),
            "agency": raw.get("fullParentPathName", "").split(".")[0] if raw.get("fullParentPathName") else raw.get("department", {}).get("name"),
            "office": raw.get("officeAddress", {}).get("name") if raw.get("officeAddress") else None,
            "location": pop_location,
            "place_of_performance": pop_location,
            "state": pop_state,
            "estimated_value": estimated_value,
            "contract_type": raw.get("typeOfSetAsideDescription"),
            "set_aside": raw.get("typeOfSetAsideDescription"),
            "url": f"https://sam.gov/opp/{raw.get('noticeId')}/view" if raw.get("noticeId") else None,
            "solicitation_number": raw.get("solicitationNumber"),
            "point_of_contact": poc,
            "raw_data": raw
        }

    async def search_by_keywords(self, keywords: List[str], days_back: int = 7) -> List[Dict[str, Any]]:
        """Search using keywords from profile"""
        all_results = []
        seen_ids = set()

        # Search with each keyword
        for keyword in keywords[:10]:  # Limit to top 10 keywords to avoid too many requests
            try:
                results = await self.search(
                    days_back=days_back,
                    keywords=keyword,
                    naics_codes=None  # Don't filter by NAICS for keyword search
                )

                for opp in results:
                    notice_id = opp.get("noticeId")
                    if notice_id and notice_id not in seen_ids:
                        seen_ids.add(notice_id)
                        all_results.append(opp)

            except Exception as e:
                self.logger.warning(f"Keyword search failed for '{keyword}': {e}")

        return all_results

    async def scrape(self, days_back: int = 7) -> List[Dict[str, Any]]:
        """Full scrape combining NAICS and keyword searches"""
        self.logger.info(f"Starting SAM.gov scrape for last {days_back} days")

        all_opportunities = []
        seen_ids = set()

        # Search by NAICS codes
        naics_results = await self.search(days_back=days_back)
        for opp in naics_results:
            notice_id = opp.get("noticeId")
            if notice_id not in seen_ids:
                seen_ids.add(notice_id)
                all_opportunities.append(opp)

        self.logger.info(f"NAICS search found {len(all_opportunities)} opportunities")

        # Search by keywords
        keyword_results = await self.search_by_keywords(
            self.include_keywords[:5],  # Top 5 keywords
            days_back=days_back
        )
        for opp in keyword_results:
            notice_id = opp.get("noticeId")
            if notice_id not in seen_ids:
                seen_ids.add(notice_id)
                all_opportunities.append(opp)

        self.logger.info(f"Total unique opportunities: {len(all_opportunities)}")

        # Normalize all opportunities
        normalized = [self.normalize_opportunity(opp) for opp in all_opportunities]

        return normalized
