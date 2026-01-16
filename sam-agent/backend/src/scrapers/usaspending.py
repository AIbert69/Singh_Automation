"""
USASpending.gov API Scraper
https://api.usaspending.gov/

Public API - No API key required
Rate limit: 5 requests/second

Used for:
- Historical contract awards analysis
- Competitor intelligence
- Agency spending patterns
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .base import BaseScraper


class USASpendingScraper(BaseScraper):
    """USASpending.gov Contract Awards Scraper"""

    BASE_URL = "https://api.usaspending.gov/api/v2"

    def __init__(self, **kwargs):
        super().__init__(name="usaspending", rate_limit_delay=0.25, **kwargs)

    async def search(
        self,
        days_back: int = 365,
        naics_codes: Optional[List[str]] = None,
        keywords: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search USASpending for contract awards

        Args:
            days_back: Number of days to look back (default 1 year)
            naics_codes: NAICS codes to filter by
            keywords: Keyword search string
            limit: Maximum results
        """
        if naics_codes is None:
            naics_codes = self.naics_codes

        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)

        # Build filters
        filters = {
            "time_period": [
                {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d")
                }
            ],
            "award_type_codes": ["A", "B", "C", "D"],  # Contract types
        }

        if naics_codes:
            filters["naics_codes"] = naics_codes

        if keywords:
            filters["keywords"] = [keywords]

        all_awards = []
        page = 1

        while len(all_awards) < limit:
            try:
                payload = {
                    "filters": filters,
                    "fields": [
                        "Award ID",
                        "Recipient Name",
                        "Award Amount",
                        "Total Outlays",
                        "Description",
                        "Start Date",
                        "End Date",
                        "Awarding Agency",
                        "Awarding Sub Agency",
                        "NAICS Code",
                        "PSC Code",
                        "Place of Performance State Code",
                        "Place of Performance City Name",
                        "Contract Award Type",
                        "recipient_id",
                        "generated_unique_award_id"
                    ],
                    "page": page,
                    "limit": min(100, limit - len(all_awards)),
                    "sort": "Award Amount",
                    "order": "desc"
                }

                response = await self._request_with_retry(
                    "POST",
                    f"{self.BASE_URL}/search/spending_by_award/",
                    json=payload
                )
                data = response.json()

                results = data.get("results", [])
                if not results:
                    break

                all_awards.extend(results)
                self.logger.info(f"Fetched {len(results)} awards (total: {len(all_awards)})")

                page += 1

                if len(results) < 100:
                    break

            except Exception as e:
                self.logger.error(f"Search failed at page {page}: {e}")
                break

        return all_awards[:limit]

    async def get_details(self, award_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific award"""
        try:
            response = await self._request_with_retry(
                "GET",
                f"{self.BASE_URL}/awards/{award_id}/"
            )
            return response.json()

        except Exception as e:
            self.logger.error(f"Failed to get details for {award_id}: {e}")
            return None

    async def get_agency_spending(
        self,
        agency_name: str,
        naics_codes: Optional[List[str]] = None,
        years: int = 3
    ) -> Dict[str, Any]:
        """
        Analyze agency spending patterns

        Args:
            agency_name: Name of the agency to analyze
            naics_codes: NAICS codes to filter by
            years: Number of years to analyze
        """
        if naics_codes is None:
            naics_codes = self.naics_codes

        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)

        filters = {
            "time_period": [
                {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d")
                }
            ],
            "award_type_codes": ["A", "B", "C", "D"],
            "agencies": [{"type": "awarding", "tier": "toptier", "name": agency_name}]
        }

        if naics_codes:
            filters["naics_codes"] = naics_codes

        try:
            # Get spending totals
            response = await self._request_with_retry(
                "POST",
                f"{self.BASE_URL}/search/spending_by_award_count/",
                json={"filters": filters}
            )
            count_data = response.json()

            # Get top awards
            awards = await self.search(
                days_back=years * 365,
                naics_codes=naics_codes,
                limit=50
            )

            return {
                "agency": agency_name,
                "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                "total_contracts": count_data.get("results", {}).get("contracts", 0),
                "top_awards": awards
            }

        except Exception as e:
            self.logger.error(f"Failed to get agency spending for {agency_name}: {e}")
            return {}

    async def get_competitor_awards(
        self,
        competitor_name: str,
        years: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Get awards for a specific competitor

        Args:
            competitor_name: Name of the competitor company
            years: Number of years to look back
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)

        filters = {
            "time_period": [
                {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d")
                }
            ],
            "award_type_codes": ["A", "B", "C", "D"],
            "recipient_search_text": competitor_name
        }

        try:
            payload = {
                "filters": filters,
                "fields": [
                    "Award ID",
                    "Recipient Name",
                    "Award Amount",
                    "Description",
                    "Start Date",
                    "Awarding Agency",
                    "NAICS Code"
                ],
                "page": 1,
                "limit": 100,
                "sort": "Award Amount",
                "order": "desc"
            }

            response = await self._request_with_retry(
                "POST",
                f"{self.BASE_URL}/search/spending_by_award/",
                json=payload
            )
            data = response.json()

            return data.get("results", [])

        except Exception as e:
            self.logger.error(f"Failed to get competitor awards for {competitor_name}: {e}")
            return []

    async def analyze_market(
        self,
        naics_codes: Optional[List[str]] = None,
        years: int = 2
    ) -> Dict[str, Any]:
        """
        Analyze market trends for specific NAICS codes

        Returns top agencies, competitors, and spending trends
        """
        if naics_codes is None:
            naics_codes = self.naics_codes

        self.logger.info(f"Analyzing market for NAICS: {naics_codes}")

        # Get recent awards
        awards = await self.search(
            days_back=years * 365,
            naics_codes=naics_codes,
            limit=500
        )

        if not awards:
            return {
                "naics_codes": naics_codes,
                "total_awards": 0,
                "top_agencies": [],
                "top_contractors": [],
                "avg_contract_size": 0
            }

        # Aggregate by agency
        agency_totals = {}
        contractor_totals = {}
        total_value = 0

        for award in awards:
            agency = award.get("Awarding Agency") or "Unknown"
            contractor = award.get("Recipient Name") or "Unknown"
            amount = award.get("Award Amount") or 0

            agency_totals[agency] = agency_totals.get(agency, 0) + amount
            contractor_totals[contractor] = contractor_totals.get(contractor, 0) + amount
            total_value += amount

        # Sort and get top 10
        top_agencies = sorted(
            agency_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        top_contractors = sorted(
            contractor_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        return {
            "naics_codes": naics_codes,
            "total_awards": len(awards),
            "total_value": total_value,
            "avg_contract_size": total_value / len(awards) if awards else 0,
            "top_agencies": [
                {"agency": a[0], "total_value": a[1]}
                for a in top_agencies
            ],
            "top_contractors": [
                {"name": c[0], "total_value": c[1]}
                for c in top_contractors
            ]
        }

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize USASpending award to standard format"""
        # Parse dates
        start_date = None
        start_str = raw.get("Start Date")
        if start_str:
            try:
                start_date = datetime.strptime(start_str, "%Y-%m-%d")
            except ValueError:
                pass

        naics_code = raw.get("NAICS Code")

        return {
            "source": "usaspending",
            "source_id": raw.get("generated_unique_award_id") or raw.get("Award ID"),
            "title": raw.get("Description", "")[:500] if raw.get("Description") else None,
            "description": raw.get("Description"),
            "naics_codes": [naics_code] if naics_code else [],
            "due_date": None,  # Awards are historical
            "posted_date": start_date,
            "agency": raw.get("Awarding Agency"),
            "office": raw.get("Awarding Sub Agency"),
            "location": f"{raw.get('Place of Performance City Name', '')}, {raw.get('Place of Performance State Code', '')}".strip(", "),
            "place_of_performance": raw.get("Place of Performance City Name"),
            "state": raw.get("Place of Performance State Code"),
            "estimated_value": raw.get("Award Amount"),
            "contract_type": raw.get("Contract Award Type"),
            "set_aside": None,
            "url": f"https://www.usaspending.gov/award/{raw.get('generated_unique_award_id')}" if raw.get("generated_unique_award_id") else None,
            "solicitation_number": raw.get("Award ID"),
            "point_of_contact": None,
            "raw_data": raw
        }
