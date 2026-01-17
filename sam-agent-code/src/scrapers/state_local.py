"""
State and Local Government Scrapers for Sam Agent 2.0

Scrapers for state-level procurement portals:
- Michigan: SIGMA (https://sigma.michigan.gov)
- California: Cal eProcure (https://caleprocure.ca.gov)
- Indiana: IDOA (https://www.in.gov/idoa/procurement/)
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from .base import BaseScraper

logger = logging.getLogger(__name__)

try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class MichiganScraper(BaseScraper):
    """Scraper for Michigan SIGMA procurement portal"""

    BASE_URL = "https://sigma.michigan.gov"
    SEARCH_URL = f"{BASE_URL}/webapp/PRDVSS2X1/AltSelfService"

    def __init__(self, profile: Dict[str, Any]):
        super().__init__(profile, rate_limit_delay=2.0)
        self.source_name = "michigan_sigma"

    async def search(
        self,
        keywords: Optional[List[str]] = None,
        days_back: int = 30,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search Michigan SIGMA for procurement opportunities"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright not available, skipping Michigan search")
            return []

        if not keywords:
            keywords = self.profile.get("keywords", [])[:5]

        self.log_search_start({"keywords": keywords, "state": "MI"})
        start_time = datetime.now()

        results = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
                )
                page = await context.new_page()

                for keyword in keywords:
                    try:
                        keyword_results = await self._search_keyword(page, keyword)
                        results.extend(keyword_results)
                        await self.rate_limit()
                    except Exception as e:
                        self.log_error(e, f"searching keyword '{keyword}'")

                await browser.close()

        except Exception as e:
            self.log_error(e, "during Michigan search")

        # Deduplicate
        seen = set()
        unique = []
        for opp in results:
            if opp["source_id"] not in seen:
                seen.add(opp["source_id"])
                unique.append(opp)

        duration = (datetime.now() - start_time).total_seconds()
        self.log_search_complete(len(unique), duration)

        return unique[:limit]

    async def _search_keyword(self, page: "Page", keyword: str) -> List[Dict[str, Any]]:
        """Search SIGMA by keyword"""
        results = []

        try:
            # Navigate to public bid search
            await page.goto(self.SEARCH_URL, wait_until="networkidle")

            # Look for public opportunities link
            await page.click("text=Public Opportunities", timeout=5000)
            await page.wait_for_load_state("networkidle")

            # Search for keyword
            search_input = await page.query_selector('input[type="text"]')
            if search_input:
                await search_input.fill(keyword)
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle")

            # Parse results
            rows = await page.query_selector_all("table tr")
            for row in rows[1:]:  # Skip header
                try:
                    data = await self._parse_row(row)
                    if data:
                        results.append(self.normalize_opportunity(data))
                except Exception:
                    continue

        except Exception as e:
            self.log_error(e, f"searching Michigan for '{keyword}'")

        return results

    async def _parse_row(self, row) -> Optional[Dict[str, Any]]:
        """Parse a result row"""
        try:
            cells = await row.query_selector_all("td")
            if len(cells) < 4:
                return None

            bid_number = await cells[0].inner_text()
            title = await cells[1].inner_text()
            agency = await cells[2].inner_text()
            due_date = await cells[3].inner_text()

            link = await cells[0].query_selector("a")
            url = ""
            if link:
                href = await link.get_attribute("href")
                url = f"{self.BASE_URL}{href}" if href else ""

            return {
                "id": bid_number.strip(),
                "title": title.strip(),
                "agency": agency.strip(),
                "due_date": due_date.strip(),
                "url": url
            }
        except Exception:
            return None

    async def get_details(self, bid_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a specific bid"""
        return None  # Implement if needed

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Michigan SIGMA data"""
        return {
            "source": "michigan_sigma",
            "source_id": raw.get("id", ""),
            "title": raw.get("title", ""),
            "description": raw.get("description", ""),
            "naics_codes": [],
            "psc_codes": [],
            "due_date": self._parse_date(raw.get("due_date")),
            "posted_date": None,
            "agency": raw.get("agency", "State of Michigan"),
            "sub_agency": None,
            "office": None,
            "location": "Michigan",
            "place_of_performance": "Michigan",
            "state": "MI",
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": raw.get("url", ""),
            "solicitation_number": raw.get("id", ""),
            "raw_data": raw
        }

    def _parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str:
            return None
        try:
            for fmt in ["%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"]:
                try:
                    dt = datetime.strptime(date_str.strip(), fmt)
                    return dt.isoformat()
                except ValueError:
                    continue
        except Exception:
            pass
        return None


class CaliforniaScraper(BaseScraper):
    """Scraper for California Cal eProcure"""

    BASE_URL = "https://caleprocure.ca.gov"

    def __init__(self, profile: Dict[str, Any]):
        super().__init__(profile, rate_limit_delay=2.0)
        self.source_name = "california_eprocure"

    async def search(
        self,
        keywords: Optional[List[str]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search Cal eProcure for opportunities"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright not available, skipping California search")
            return []

        if not keywords:
            keywords = self.profile.get("keywords", [])[:5]

        self.log_search_start({"keywords": keywords, "state": "CA"})
        start_time = datetime.now()

        results = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()

                # Navigate to bid search
                await page.goto(f"{self.BASE_URL}/pages/public-search.aspx")
                await page.wait_for_load_state("networkidle")

                for keyword in keywords:
                    try:
                        # Search
                        search_input = await page.query_selector('#txtKeyword')
                        if search_input:
                            await search_input.fill(keyword)
                            await page.click('#btnSearch')
                            await page.wait_for_load_state("networkidle")

                            # Parse results
                            rows = await page.query_selector_all(".bid-row")
                            for row in rows:
                                data = await self._parse_ca_row(row)
                                if data:
                                    results.append(self.normalize_opportunity(data))

                        await self.rate_limit()

                    except Exception as e:
                        self.log_error(e, f"searching CA for '{keyword}'")

                await browser.close()

        except Exception as e:
            self.log_error(e, "during California search")

        # Deduplicate
        seen = set()
        unique = [opp for opp in results if not (opp["source_id"] in seen or seen.add(opp["source_id"]))]

        duration = (datetime.now() - start_time).total_seconds()
        self.log_search_complete(len(unique), duration)

        return unique[:limit]

    async def _parse_ca_row(self, row) -> Optional[Dict[str, Any]]:
        """Parse California result row"""
        try:
            bid_id = await row.query_selector(".bid-id")
            title = await row.query_selector(".bid-title")
            agency = await row.query_selector(".bid-agency")
            due = await row.query_selector(".bid-due")

            return {
                "id": await bid_id.inner_text() if bid_id else "",
                "title": await title.inner_text() if title else "",
                "agency": await agency.inner_text() if agency else "",
                "due_date": await due.inner_text() if due else ""
            }
        except Exception:
            return None

    async def get_details(self, bid_id: str) -> Optional[Dict[str, Any]]:
        return None

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source": "california_eprocure",
            "source_id": raw.get("id", ""),
            "title": raw.get("title", ""),
            "description": "",
            "naics_codes": [],
            "psc_codes": [],
            "due_date": None,
            "posted_date": None,
            "agency": raw.get("agency", "State of California"),
            "sub_agency": None,
            "office": None,
            "location": "California",
            "place_of_performance": "California",
            "state": "CA",
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": "",
            "solicitation_number": raw.get("id", ""),
            "raw_data": raw
        }


class IndianaScraper(BaseScraper):
    """Scraper for Indiana IDOA procurement"""

    BASE_URL = "https://www.in.gov/idoa/procurement"

    def __init__(self, profile: Dict[str, Any]):
        super().__init__(profile, rate_limit_delay=2.0)
        self.source_name = "indiana_idoa"

    async def search(
        self,
        keywords: Optional[List[str]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search Indiana IDOA for opportunities"""
        if not PLAYWRIGHT_AVAILABLE:
            return []

        self.log_search_start({"state": "IN"})
        # Implementation similar to Michigan/California
        return []

    async def get_details(self, bid_id: str) -> Optional[Dict[str, Any]]:
        return None

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source": "indiana_idoa",
            "source_id": raw.get("id", ""),
            "title": raw.get("title", ""),
            "description": "",
            "naics_codes": [],
            "psc_codes": [],
            "due_date": None,
            "posted_date": None,
            "agency": "State of Indiana",
            "sub_agency": None,
            "office": None,
            "location": "Indiana",
            "place_of_performance": "Indiana",
            "state": "IN",
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": "",
            "solicitation_number": raw.get("id", ""),
            "raw_data": raw
        }


class StateLocalScraperOrchestrator:
    """Orchestrates all state/local scrapers"""

    def __init__(self, profile: Dict[str, Any]):
        self.profile = profile
        self.scrapers = {
            "MI": MichiganScraper(profile),
            "CA": CaliforniaScraper(profile),
            "IN": IndianaScraper(profile)
        }

    async def search_all(
        self,
        states: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        limit_per_state: int = 50
    ) -> List[Dict[str, Any]]:
        """Search all configured state portals"""
        if not states:
            states = self.profile.get("geographic_preference", {}).get("primary", ["MI", "IN", "OH"])

        all_results = []

        for state in states:
            if state in self.scrapers:
                try:
                    results = await self.scrapers[state].search(
                        keywords=keywords,
                        limit=limit_per_state
                    )
                    all_results.extend(results)
                except Exception as e:
                    logger.error(f"Error searching {state}: {e}")

        return all_results

    async def search_state(
        self,
        state: str,
        keywords: Optional[List[str]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search a specific state"""
        if state not in self.scrapers:
            logger.warning(f"No scraper available for state: {state}")
            return []

        return await self.scrapers[state].search(keywords=keywords, limit=limit)
