"""
State and Local Government Procurement Scrapers

Covers:
- Michigan SIGMA & MITN
- Indiana procurement portal
- California Cal eProcure
- Ohio procurement
"""

import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .base import BaseScraper

try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class MichiganScraper(BaseScraper):
    """Michigan SIGMA and MITN Procurement Scraper"""

    SIGMA_URL = "https://sigma.michigan.gov/webapp/PRDVSS2X1/AltSelfService"
    MITN_URL = "https://mitn.info/"

    def __init__(self, **kwargs):
        super().__init__(name="michigan", rate_limit_delay=2.0, **kwargs)
        self.browser: Optional[Browser] = None

    async def _get_browser(self):
        """Get or create browser instance"""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed")

        if self.browser is None:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(headless=True)
        return self.browser

    async def _create_page(self) -> Page:
        """Create a new browser page"""
        browser = await self._get_browser()
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
        )
        return await context.new_page()

    async def search(
        self,
        days_back: int = 30,
        keywords: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Michigan procurement portals"""
        if not PLAYWRIGHT_AVAILABLE:
            self.logger.warning("Playwright not available")
            return []

        all_opportunities = []

        # Search MITN (Michigan Inter-governmental Trade Network)
        mitn_results = await self._search_mitn(days_back, keywords)
        all_opportunities.extend(mitn_results)

        return all_opportunities

    async def _search_mitn(
        self,
        days_back: int,
        keywords: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Search MITN for opportunities"""
        opportunities = []

        if keywords is None:
            keywords = self.include_keywords[:3]

        page = await self._create_page()

        try:
            await page.goto(self.MITN_URL, wait_until="networkidle")
            await self._rate_limit()

            for keyword in keywords:
                try:
                    # Fill search
                    search_input = page.locator('input[type="search"], input[name="search"], #search')
                    if await search_input.count() > 0:
                        await search_input.fill(keyword)
                        await page.keyboard.press("Enter")
                        await page.wait_for_load_state("networkidle")
                        await self._rate_limit()

                    # Extract results
                    items = await self._extract_mitn_results(page)
                    opportunities.extend(items)

                except Exception as e:
                    self.logger.warning(f"MITN search failed for '{keyword}': {e}")

        except Exception as e:
            self.logger.error(f"MITN scrape failed: {e}")

        finally:
            await page.close()

        return opportunities

    async def _extract_mitn_results(self, page: Page) -> List[Dict[str, Any]]:
        """Extract opportunities from MITN results page"""
        results = []

        try:
            rows = await page.query_selector_all(".bid-item, .opportunity-row, tr.data-row")

            for row in rows:
                try:
                    data = {
                        "source": "mitn",
                        "state": "MI"
                    }

                    title = await row.query_selector(".title, .bid-title, td:nth-child(1)")
                    if title:
                        data["title"] = await title.inner_text()

                    agency = await row.query_selector(".agency, .organization, td:nth-child(2)")
                    if agency:
                        data["agency"] = await agency.inner_text()

                    due_date = await row.query_selector(".due-date, .closing, td:nth-child(3)")
                    if due_date:
                        data["due_date_str"] = await due_date.inner_text()

                    link = await row.query_selector("a[href]")
                    if link:
                        href = await link.get_attribute("href")
                        data["url"] = href if href.startswith("http") else f"{self.MITN_URL}{href}"

                    if data.get("title"):
                        results.append(data)

                except Exception:
                    continue

        except Exception as e:
            self.logger.warning(f"Failed to extract MITN results: {e}")

        return results

    async def get_details(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a specific opportunity"""
        return None  # Would need URL-based lookup

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Michigan opportunity to standard format"""
        # Parse due date
        due_date = None
        due_str = raw.get("due_date_str", "")
        if due_str:
            for fmt in ["%m/%d/%Y", "%Y-%m-%d", "%B %d, %Y"]:
                try:
                    due_date = datetime.strptime(due_str.strip(), fmt)
                    break
                except ValueError:
                    continue

        return {
            "source": "michigan",
            "source_id": raw.get("id") or raw.get("url"),
            "title": raw.get("title"),
            "description": raw.get("description") or raw.get("title"),
            "naics_codes": [],
            "due_date": due_date,
            "posted_date": None,
            "agency": raw.get("agency"),
            "office": None,
            "location": "Michigan",
            "place_of_performance": "Michigan",
            "state": "MI",
            "estimated_value": raw.get("value"),
            "contract_type": raw.get("type"),
            "set_aside": None,
            "url": raw.get("url"),
            "solicitation_number": raw.get("bid_number"),
            "point_of_contact": raw.get("contact"),
            "raw_data": raw
        }

    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            self.browser = None


class CaliforniaScraper(BaseScraper):
    """California Cal eProcure Scraper"""

    BASE_URL = "https://caleprocure.ca.gov"
    SEARCH_URL = f"{BASE_URL}/pages/Events-BS3/event-search.aspx"

    def __init__(self, **kwargs):
        super().__init__(name="california", rate_limit_delay=2.0, **kwargs)
        self.browser: Optional[Browser] = None

    async def _get_browser(self):
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed")

        if self.browser is None:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(headless=True)
        return self.browser

    async def _create_page(self) -> Page:
        browser = await self._get_browser()
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
        )
        return await context.new_page()

    async def search(
        self,
        days_back: int = 30,
        keywords: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search California procurement portal"""
        if not PLAYWRIGHT_AVAILABLE:
            self.logger.warning("Playwright not available")
            return []

        if keywords is None:
            keywords = self.include_keywords[:3]

        opportunities = []
        page = await self._create_page()

        try:
            await page.goto(self.SEARCH_URL, wait_until="networkidle")
            await self._rate_limit()

            for keyword in keywords:
                try:
                    # Search
                    search_input = page.locator('input[type="text"]').first
                    if await search_input.count() > 0:
                        await search_input.fill(keyword)

                    # Submit
                    submit = page.locator('input[type="submit"], button[type="submit"]').first
                    if await submit.count() > 0:
                        await submit.click()
                        await page.wait_for_load_state("networkidle")
                        await self._rate_limit()

                    # Extract results
                    rows = await page.query_selector_all("table tr, .event-row")

                    for row in rows:
                        try:
                            data = {"source": "california", "state": "CA"}

                            title_el = await row.query_selector("a, .title")
                            if title_el:
                                data["title"] = await title_el.inner_text()
                                href = await title_el.get_attribute("href")
                                if href:
                                    data["url"] = href if href.startswith("http") else f"{self.BASE_URL}{href}"

                            if data.get("title") and "automation" in data["title"].lower() or any(
                                kw.lower() in data.get("title", "").lower()
                                for kw in self.include_keywords
                            ):
                                opportunities.append(data)

                        except Exception:
                            continue

                except Exception as e:
                    self.logger.warning(f"CA search failed for '{keyword}': {e}")

        except Exception as e:
            self.logger.error(f"California scrape failed: {e}")

        finally:
            await page.close()

        return opportunities

    async def get_details(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        return None

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source": "california",
            "source_id": raw.get("id") or raw.get("url"),
            "title": raw.get("title"),
            "description": raw.get("description") or raw.get("title"),
            "naics_codes": [],
            "due_date": None,
            "posted_date": None,
            "agency": raw.get("agency") or "State of California",
            "office": None,
            "location": "California",
            "place_of_performance": "California",
            "state": "CA",
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": raw.get("url"),
            "solicitation_number": None,
            "point_of_contact": None,
            "raw_data": raw
        }

    async def close(self):
        if self.browser:
            await self.browser.close()
            self.browser = None


class IndianaScraper(BaseScraper):
    """Indiana Procurement Scraper"""

    BASE_URL = "https://www.in.gov/idoa/procurement/"

    def __init__(self, **kwargs):
        super().__init__(name="indiana", rate_limit_delay=2.0, **kwargs)
        self.browser: Optional[Browser] = None

    async def search(self, days_back: int = 30, **kwargs) -> List[Dict[str, Any]]:
        """Search Indiana procurement"""
        if not PLAYWRIGHT_AVAILABLE:
            return []

        # Similar implementation pattern
        return []

    async def get_details(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        return None

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source": "indiana",
            "source_id": raw.get("id"),
            "title": raw.get("title"),
            "description": raw.get("description"),
            "naics_codes": [],
            "due_date": None,
            "posted_date": None,
            "agency": raw.get("agency") or "State of Indiana",
            "office": None,
            "location": "Indiana",
            "place_of_performance": "Indiana",
            "state": "IN",
            "estimated_value": None,
            "contract_type": None,
            "set_aside": None,
            "url": raw.get("url"),
            "solicitation_number": None,
            "point_of_contact": None,
            "raw_data": raw
        }


class StateLocalScraperOrchestrator:
    """Orchestrates all state/local scrapers"""

    def __init__(self):
        self.scrapers = {
            "michigan": MichiganScraper,
            "california": CaliforniaScraper,
            "indiana": IndianaScraper
        }

    async def scrape_all(
        self,
        states: Optional[List[str]] = None,
        days_back: int = 30
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Scrape all configured states"""
        results = {}

        if states is None:
            states = list(self.scrapers.keys())

        for state in states:
            scraper_class = self.scrapers.get(state.lower())
            if scraper_class:
                try:
                    async with scraper_class() as scraper:
                        opportunities = await scraper.scrape(days_back=days_back)
                        results[state] = opportunities
                except Exception as e:
                    results[state] = []

        return results
