"""
USASpending.gov API Scraper for Sam Agent 2.0

USASpending.gov provides data on federal spending.
Used for:
- Competitor analysis (who wins contracts)
- Historical spending patterns
- Agency procurement trends
- Market intelligence

API Documentation: https://api.usaspending.gov/
Rate Limit: 5 requests/second (no API key required)
"""

import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from .base import BaseScraper


class USASpendingScraper(BaseScraper):
    """Scraper for USASpending.gov federal spending data"""

    BASE_URL = "https://api.usaspending.gov/api/v2"

    def __init__(self, profile: Dict[str, Any]):
        super().__init__(profile, rate_limit_delay=0.2)  # 5 req/sec
        self.source_name = "usaspending"

    async def search(
        self,
        naics_codes: Optional[List[str]] = None,
        years: int = 2,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search historical contract awards

        Args:
            naics_codes: NAICS codes to filter by (uses profile if not specified)
            years: Years of history to search
            limit: Maximum results

        Returns:
            List of contract award records
        """
        if not naics_codes:
            naics_codes = self.profile.get("naics", [])

        self.log_search_start({"naics": naics_codes, "years": years})
        start_time = datetime.now()

        all_results = []

        for naics in naics_codes:
            try:
                results = await self._search_by_naics(naics, years, limit)
                all_results.extend(results)
                await self.rate_limit()
            except Exception as e:
                self.log_error(e, f"searching NAICS {naics}")

        duration = (datetime.now() - start_time).total_seconds()
        self.log_search_complete(len(all_results), duration)

        return all_results

    async def _search_by_naics(
        self,
        naics: str,
        years: int,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search awards by NAICS code"""
        url = f"{self.BASE_URL}/search/spending_by_award/"

        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * years)

        payload = {
            "filters": {
                "time_period": [
                    {
                        "start_date": start_date.strftime("%Y-%m-%d"),
                        "end_date": end_date.strftime("%Y-%m-%d")
                    }
                ],
                "naics_codes": [naics],
                "award_type_codes": ["A", "B", "C", "D"]  # Contract types
            },
            "fields": [
                "Award ID",
                "Recipient Name",
                "Award Amount",
                "Awarding Agency",
                "Awarding Sub Agency",
                "Start Date",
                "End Date",
                "Award Type",
                "Description",
                "Place of Performance State Code",
                "Place of Performance City Name",
                "NAICS Code",
                "NAICS Description"
            ],
            "limit": min(limit, 100),
            "page": 1,
            "sort": "Award Amount",
            "order": "desc"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

            results = data.get("results", [])
            return [self._normalize_award(r) for r in results]

    async def get_agency_spending(
        self,
        agency: str,
        naics: Optional[str] = None,
        years: int = 2
    ) -> Dict[str, Any]:
        """
        Analyze agency spending patterns

        Args:
            agency: Agency name or code
            naics: Optional NAICS filter
            years: Years to analyze

        Returns:
            Spending analysis with trends
        """
        url = f"{self.BASE_URL}/search/spending_by_award/"

        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * years)

        filters = {
            "time_period": [
                {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d")
                }
            ],
            "agencies": [{"type": "awarding", "tier": "toptier", "name": agency}]
        }

        if naics:
            filters["naics_codes"] = [naics]

        payload = {
            "filters": filters,
            "fields": [
                "Award ID",
                "Recipient Name",
                "Award Amount",
                "Award Type",
                "Start Date"
            ],
            "limit": 100,
            "page": 1,
            "sort": "Award Amount",
            "order": "desc"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                return self._analyze_spending(agency, results)

        except Exception as e:
            self.log_error(e, f"getting agency spending for {agency}")
            return {}

    async def get_competitor_analysis(
        self,
        naics_codes: Optional[List[str]] = None,
        years: int = 2,
        top_n: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Analyze top competitors in Singh's NAICS codes

        Returns list of competitors with win data
        """
        if not naics_codes:
            naics_codes = self.profile.get("naics", [])

        all_awards = await self.search(naics_codes, years, limit=500)

        # Aggregate by recipient
        recipients = {}
        for award in all_awards:
            name = award.get("recipient_name", "Unknown")
            if name not in recipients:
                recipients[name] = {
                    "name": name,
                    "total_value": 0,
                    "award_count": 0,
                    "agencies": set(),
                    "naics_codes": set(),
                    "states": set()
                }

            recipients[name]["total_value"] += award.get("award_amount", 0) or 0
            recipients[name]["award_count"] += 1

            if award.get("awarding_agency"):
                recipients[name]["agencies"].add(award["awarding_agency"])
            if award.get("naics_code"):
                recipients[name]["naics_codes"].add(award["naics_code"])
            if award.get("state"):
                recipients[name]["states"].add(award["state"])

        # Convert sets to lists and sort
        competitor_list = []
        for name, data in recipients.items():
            competitor_list.append({
                "name": data["name"],
                "total_value": data["total_value"],
                "award_count": data["award_count"],
                "avg_award_value": data["total_value"] / data["award_count"] if data["award_count"] > 0 else 0,
                "agencies": list(data["agencies"]),
                "naics_codes": list(data["naics_codes"]),
                "states": list(data["states"])
            })

        # Sort by total value
        competitor_list.sort(key=lambda x: x["total_value"], reverse=True)

        return competitor_list[:top_n]

    async def get_market_trends(
        self,
        naics_codes: Optional[List[str]] = None,
        years: int = 3
    ) -> Dict[str, Any]:
        """
        Analyze market trends for relevant NAICS codes

        Returns trend data including:
        - Year-over-year spending
        - Top agencies
        - Average contract size
        - Geographic distribution
        """
        if not naics_codes:
            naics_codes = self.profile.get("naics", [])

        all_awards = await self.search(naics_codes, years, limit=500)

        # Aggregate by year
        by_year = {}
        agencies = {}
        states = {}

        for award in all_awards:
            # Year aggregation
            start_date = award.get("start_date")
            if start_date:
                try:
                    year = datetime.fromisoformat(start_date.replace("Z", "")).year
                    if year not in by_year:
                        by_year[year] = {"total": 0, "count": 0}
                    by_year[year]["total"] += award.get("award_amount", 0) or 0
                    by_year[year]["count"] += 1
                except (ValueError, TypeError):
                    pass

            # Agency aggregation
            agency = award.get("awarding_agency", "Unknown")
            if agency not in agencies:
                agencies[agency] = {"total": 0, "count": 0}
            agencies[agency]["total"] += award.get("award_amount", 0) or 0
            agencies[agency]["count"] += 1

            # State aggregation
            state = award.get("state", "Unknown")
            if state and state != "Unknown":
                if state not in states:
                    states[state] = {"total": 0, "count": 0}
                states[state]["total"] += award.get("award_amount", 0) or 0
                states[state]["count"] += 1

        # Calculate totals
        total_value = sum(y["total"] for y in by_year.values())
        total_count = sum(y["count"] for y in by_year.values())

        return {
            "naics_codes": naics_codes,
            "years_analyzed": years,
            "total_market_value": total_value,
            "total_contracts": total_count,
            "avg_contract_value": total_value / total_count if total_count > 0 else 0,
            "yearly_trends": dict(sorted(by_year.items())),
            "top_agencies": dict(sorted(agencies.items(), key=lambda x: x[1]["total"], reverse=True)[:10]),
            "geographic_distribution": dict(sorted(states.items(), key=lambda x: x[1]["total"], reverse=True)[:10])
        }

    async def get_details(self, award_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific award"""
        url = f"{self.BASE_URL}/awards/{award_id}/"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()

        except Exception as e:
            self.log_error(e, f"getting details for award {award_id}")
            return None

    def _normalize_award(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize USASpending award data"""
        return {
            "source": "usaspending",
            "source_id": raw.get("Award ID", ""),
            "recipient_name": raw.get("Recipient Name", ""),
            "award_amount": raw.get("Award Amount"),
            "awarding_agency": raw.get("Awarding Agency", ""),
            "awarding_sub_agency": raw.get("Awarding Sub Agency", ""),
            "start_date": raw.get("Start Date"),
            "end_date": raw.get("End Date"),
            "award_type": raw.get("Award Type", ""),
            "description": raw.get("Description", ""),
            "state": raw.get("Place of Performance State Code", ""),
            "city": raw.get("Place of Performance City Name", ""),
            "naics_code": raw.get("NAICS Code", ""),
            "naics_description": raw.get("NAICS Description", ""),
            "raw_data": raw
        }

    def _analyze_spending(self, agency: str, awards: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze spending patterns from awards"""
        if not awards:
            return {"agency": agency, "total": 0, "count": 0}

        total = sum(a.get("Award Amount", 0) or 0 for a in awards)
        count = len(awards)

        # Top recipients
        recipients = {}
        for award in awards:
            name = award.get("Recipient Name", "Unknown")
            if name not in recipients:
                recipients[name] = 0
            recipients[name] += award.get("Award Amount", 0) or 0

        top_recipients = sorted(recipients.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "agency": agency,
            "total_spending": total,
            "contract_count": count,
            "avg_contract_value": total / count if count > 0 else 0,
            "top_recipients": dict(top_recipients)
        }
