"""
DIBBS (Defense Logistics Agency Internet Bid Board System) Scraper

DIBBS URL: https://www.dibbs.bsm.dla.mil
No public API - requires web scraping with Playwright
Used for DLA procurement opportunities (parts, supplies, equipment)
"""

import os
import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from .base import BaseScraper

logger = logging.getLogger(__name__)

# Playwright is optional - only import if available
try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. DIBBS scraper will be disabled.")


class DIBBSScraper(BaseScraper):
    """Scraper for DLA DIBBS procurement system"""

    BASE_URL = "https://www.dibbs.bsm.dla.mil"
    RFQ_SEARCH_URL = f"{BASE_URL}/rfq/rfq_search.asp"

    def __init__(self, profile: Dict[str, Any]):
        super().__init__(profile, rate_limit_delay=2.0)  # Be respectful
        self.source_name = "dibbs"
        self.browser: Optional[Browser] = None

    async def search(
        self,
        keywords: Optional[List[str]] = None,
        nsn: Optional[str] = None,
        cage: Optional[str] = None,
        days_back: int = 30,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search DIBBS for RFQs

        Args:
            keywords: Keywords to search (uses profile keywords if not specified)
            nsn: National Stock Number to search
            cage: CAGE code filter
            days_back: Look back period
            limit: Maximum results

        Returns:
            List of normalized opportunities
        """
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright not available, skipping DIBBS search")
            return []

        if not keywords:
            keywords = self.profile.get("keywords", [])[:5]  # Top 5 keywords

        self.log_search_start({"keywords": keywords, "nsn": nsn, "cage": cage})
        start_time = datetime.now()

        all_results = []

        try:
            async with async_playwright() as p:
                self.browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-dev-shm-usage']
                )

                context = await self.browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                )

                page = await context.new_page()

                # Search by keywords
                for keyword in keywords:
                    try:
                        results = await self._search_keyword(page, keyword, limit)
                        all_results.extend(results)
                        await self.rate_limit()
                    except Exception as e:
                        self.log_error(e, f"searching keyword '{keyword}'")

                # Search by NSN if provided
                if nsn:
                    try:
                        results = await self._search_nsn(page, nsn)
                        all_results.extend(results)
                    except Exception as e:
                        self.log_error(e, f"searching NSN '{nsn}'")

                await self.browser.close()

        except Exception as e:
            self.log_error(e, "during DIBBS search")

        # Deduplicate
        seen = set()
        unique = []
        for opp in all_results:
            if opp["source_id"] not in seen:
                seen.add(opp["source_id"])
                unique.append(opp)

        duration = (datetime.now() - start_time).total_seconds()
        self.log_search_complete(len(unique), duration)

        return unique[:limit]

    async def _search_keyword(
        self,
        page: "Page",
        keyword: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search DIBBS by keyword"""
        results = []

        try:
            await page.goto(self.RFQ_SEARCH_URL, wait_until="networkidle")

            # Fill in search form
            await page.fill('input[name="item_desc"]', keyword)

            # Submit search
            await page.click('input[type="submit"]')
            await page.wait_for_load_state("networkidle")

            # Parse results
            results = await self._parse_results_page(page)

        except Exception as e:
            self.log_error(e, f"in keyword search for '{keyword}'")

        return results

    async def _search_nsn(self, page: "Page", nsn: str) -> List[Dict[str, Any]]:
        """Search DIBBS by National Stock Number"""
        results = []

        try:
            await page.goto(self.RFQ_SEARCH_URL, wait_until="networkidle")

            # Fill in NSN field
            await page.fill('input[name="nsn"]', nsn)

            # Submit
            await page.click('input[type="submit"]')
            await page.wait_for_load_state("networkidle")

            results = await self._parse_results_page(page)

        except Exception as e:
            self.log_error(e, f"in NSN search for '{nsn}'")

        return results

    async def _parse_results_page(self, page: "Page") -> List[Dict[str, Any]]:
        """Parse DIBBS search results page"""
        results = []

        try:
            # Wait for results table
            await page.wait_for_selector("table", timeout=10000)

            # Get all result rows
            rows = await page.query_selector_all("table tr")

            for row in rows[1:]:  # Skip header row
                try:
                    cells = await row.query_selector_all("td")
                    if len(cells) >= 5:
                        raw_data = await self._extract_row_data(cells)
                        if raw_data:
                            results.append(self.normalize_opportunity(raw_data))
                except Exception as e:
                    continue

        except Exception as e:
            self.log_error(e, "parsing results page")

        return results

    async def _extract_row_data(self, cells) -> Optional[Dict[str, Any]]:
        """Extract data from a table row"""
        try:
            rfq_number = await cells[0].inner_text()
            nsn = await cells[1].inner_text() if len(cells) > 1 else ""
            description = await cells[2].inner_text() if len(cells) > 2 else ""
            quantity = await cells[3].inner_text() if len(cells) > 3 else ""
            due_date = await cells[4].inner_text() if len(cells) > 4 else ""

            # Get link if available
            link_elem = await cells[0].query_selector("a")
            url = ""
            if link_elem:
                href = await link_elem.get_attribute("href")
                if href:
                    url = f"{self.BASE_URL}{href}" if not href.startswith("http") else href

            return {
                "id": rfq_number.strip(),
                "nsn": nsn.strip(),
                "title": description.strip(),
                "description": description.strip(),
                "quantity": quantity.strip(),
                "due_date": due_date.strip(),
                "url": url
            }

        except Exception:
            return None

    async def get_details(self, rfq_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific RFQ"""
        if not PLAYWRIGHT_AVAILABLE:
            return None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()

                url = f"{self.BASE_URL}/rfq/rfq_detail.asp?rfq={rfq_id}"
                await page.goto(url, wait_until="networkidle")

                # Parse detail page
                details = await self._parse_detail_page(page)
                await browser.close()

                return details

        except Exception as e:
            self.log_error(e, f"getting details for {rfq_id}")
            return None

    async def _parse_detail_page(self, page: "Page") -> Dict[str, Any]:
        """Parse RFQ detail page"""
        details = {}

        try:
            # Extract all labeled fields
            labels = await page.query_selector_all("td.label")
            for label in labels:
                label_text = await label.inner_text()
                value_cell = await label.evaluate_handle("el => el.nextElementSibling")
                if value_cell:
                    value_text = await value_cell.inner_text()
                    key = label_text.strip().rstrip(":").lower().replace(" ", "_")
                    details[key] = value_text.strip()

        except Exception as e:
            self.log_error(e, "parsing detail page")

        return details

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize DIBBS data to standard format"""
        return {
            "source": "dibbs",
            "source_id": raw.get("id", ""),
            "title": raw.get("title", raw.get("description", "")),
            "description": raw.get("description", ""),
            "naics_codes": [],  # DIBBS uses NSN, not NAICS
            "psc_codes": [],
            "due_date": self._parse_dibbs_date(raw.get("due_date")),
            "posted_date": None,
            "agency": "Defense Logistics Agency",
            "sub_agency": "DLA",
            "office": None,
            "location": None,
            "place_of_performance": None,
            "state": None,
            "estimated_value": None,
            "contract_type": "RFQ",
            "set_aside": None,
            "url": raw.get("url", ""),
            "solicitation_number": raw.get("id", ""),
            "nsn": raw.get("nsn", ""),
            "quantity": raw.get("quantity", ""),
            "raw_data": raw
        }

    def _parse_dibbs_date(self, date_str: Optional[str]) -> Optional[str]:
        """Parse DIBBS date format"""
        if not date_str:
            return None

        try:
            # DIBBS typically uses MM/DD/YYYY format
            dt = datetime.strptime(date_str.strip(), "%m/%d/%Y")
            return dt.isoformat()
        except ValueError:
            return None
