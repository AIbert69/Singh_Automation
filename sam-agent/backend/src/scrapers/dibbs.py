"""
DIBBS (DLA Internet Bid Board System) Scraper
https://www.dibbs.bsm.dla.mil

No public API - requires web scraping with Playwright
Defense Logistics Agency procurement opportunities
"""

import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .base import BaseScraper

# Playwright is optional - only import if available
try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class DIBBSScraper(BaseScraper):
    """DLA Internet Bid Board System Scraper"""

    BASE_URL = "https://www.dibbs.bsm.dla.mil"
    RFQ_SEARCH_URL = f"{BASE_URL}/rfq"
    AWARDS_URL = f"{BASE_URL}/awards"

    def __init__(self, **kwargs):
        super().__init__(name="dibbs", rate_limit_delay=2.0, **kwargs)
        self.browser: Optional[Browser] = None

        if not PLAYWRIGHT_AVAILABLE:
            self.logger.warning(
                "Playwright not installed. DIBBS scraper will not function. "
                "Install with: pip install playwright && playwright install chromium"
            )

    async def _get_browser(self):
        """Get or create browser instance"""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed")

        if self.browser is None:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage"
                ]
            )
        return self.browser

    async def _create_page(self) -> Page:
        """Create a new browser page with stealth settings"""
        browser = await self._get_browser()
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
            locale="en-US"
        )
        page = await context.new_page()
        return page

    async def search(
        self,
        days_back: int = 7,
        keywords: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search DIBBS for RFQs

        Args:
            days_back: Number of days to look back
            keywords: Keywords to search for
        """
        if not PLAYWRIGHT_AVAILABLE:
            self.logger.warning("Playwright not available, returning empty results")
            return []

        if keywords is None:
            keywords = self.include_keywords[:5]  # Use top 5 profile keywords

        all_rfqs = []
        page = await self._create_page()

        try:
            # Navigate to DIBBS
            self.logger.info(f"Navigating to {self.RFQ_SEARCH_URL}")
            await page.goto(self.RFQ_SEARCH_URL, wait_until="networkidle")
            await self._rate_limit()

            # Calculate date range
            from_date = (datetime.now() - timedelta(days=days_back)).strftime("%m/%d/%Y")

            # Search for each keyword
            for keyword in keywords:
                try:
                    self.logger.info(f"Searching DIBBS for: {keyword}")

                    # Fill search form (adjust selectors based on actual DIBBS UI)
                    await page.fill('input[name="searchText"]', keyword, timeout=5000)

                    # Set date filter if available
                    date_input = page.locator('input[name="fromDate"]')
                    if await date_input.count() > 0:
                        await date_input.fill(from_date)

                    # Submit search
                    await page.click('button[type="submit"]', timeout=5000)
                    await page.wait_for_load_state("networkidle")
                    await self._rate_limit()

                    # Extract results
                    rfqs = await self._extract_rfqs(page)
                    all_rfqs.extend(rfqs)

                    self.logger.info(f"Found {len(rfqs)} RFQs for '{keyword}'")

                except Exception as e:
                    self.logger.warning(f"Search failed for '{keyword}': {e}")
                    continue

        except Exception as e:
            self.logger.error(f"DIBBS scrape failed: {e}")

        finally:
            await page.close()

        # Deduplicate by RFQ number
        seen = set()
        unique_rfqs = []
        for rfq in all_rfqs:
            rfq_num = rfq.get("rfq_number")
            if rfq_num and rfq_num not in seen:
                seen.add(rfq_num)
                unique_rfqs.append(rfq)

        return unique_rfqs

    async def _extract_rfqs(self, page: Page) -> List[Dict[str, Any]]:
        """Extract RFQ data from search results page"""
        rfqs = []

        try:
            # Wait for results table
            await page.wait_for_selector("table.results, .rfq-list, .search-results", timeout=10000)

            # Extract each row (adjust selectors based on actual DIBBS UI)
            rows = await page.query_selector_all("table.results tr, .rfq-item")

            for row in rows:
                try:
                    # Extract data from row
                    rfq_data = {}

                    # RFQ Number
                    rfq_num = await row.query_selector(".rfq-number, td:nth-child(1)")
                    if rfq_num:
                        rfq_data["rfq_number"] = await rfq_num.inner_text()

                    # Description/Title
                    desc = await row.query_selector(".description, td:nth-child(2)")
                    if desc:
                        rfq_data["title"] = await desc.inner_text()

                    # Closing Date
                    close_date = await row.query_selector(".close-date, td:nth-child(3)")
                    if close_date:
                        rfq_data["closing_date"] = await close_date.inner_text()

                    # NSN (National Stock Number)
                    nsn = await row.query_selector(".nsn, td:nth-child(4)")
                    if nsn:
                        rfq_data["nsn"] = await nsn.inner_text()

                    # Quantity
                    qty = await row.query_selector(".quantity, td:nth-child(5)")
                    if qty:
                        rfq_data["quantity"] = await qty.inner_text()

                    # Link to details
                    link = await row.query_selector("a[href*='rfq']")
                    if link:
                        href = await link.get_attribute("href")
                        rfq_data["url"] = f"{self.BASE_URL}{href}" if href and not href.startswith("http") else href

                    if rfq_data.get("rfq_number"):
                        rfqs.append(rfq_data)

                except Exception as e:
                    self.logger.debug(f"Failed to extract row: {e}")
                    continue

        except Exception as e:
            self.logger.warning(f"Failed to extract RFQs: {e}")

        return rfqs

    async def get_details(self, rfq_number: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific RFQ"""
        if not PLAYWRIGHT_AVAILABLE:
            return None

        page = await self._create_page()

        try:
            # Navigate to RFQ detail page
            detail_url = f"{self.BASE_URL}/rfq/{rfq_number}"
            await page.goto(detail_url, wait_until="networkidle")
            await self._rate_limit()

            # Extract detailed information
            details = {
                "rfq_number": rfq_number,
                "source": "dibbs"
            }

            # Title/Description
            title = await page.query_selector("h1, .rfq-title")
            if title:
                details["title"] = await title.inner_text()

            # Full description
            desc = await page.query_selector(".description, .rfq-description")
            if desc:
                details["description"] = await desc.inner_text()

            # Technical specifications
            specs = await page.query_selector(".specifications, .tech-specs")
            if specs:
                details["specifications"] = await specs.inner_text()

            # Delivery requirements
            delivery = await page.query_selector(".delivery, .shipping")
            if delivery:
                details["delivery_requirements"] = await delivery.inner_text()

            return details

        except Exception as e:
            self.logger.error(f"Failed to get details for {rfq_number}: {e}")
            return None

        finally:
            await page.close()

    def normalize_opportunity(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize DIBBS RFQ to standard format"""
        # Parse closing date
        due_date = None
        closing_str = raw.get("closing_date", "")
        if closing_str:
            for fmt in ["%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"]:
                try:
                    due_date = datetime.strptime(closing_str.strip(), fmt)
                    break
                except ValueError:
                    continue

        # Extract estimated value from quantity if present
        estimated_value = None
        qty_str = raw.get("quantity", "")
        if qty_str:
            # Try to extract numeric value
            numbers = re.findall(r"[\d,]+", qty_str)
            if numbers:
                try:
                    estimated_value = int(numbers[0].replace(",", ""))
                except ValueError:
                    pass

        return {
            "source": "dibbs",
            "source_id": raw.get("rfq_number"),
            "title": raw.get("title"),
            "description": raw.get("description") or raw.get("title"),
            "naics_codes": [],  # DIBBS doesn't use NAICS
            "due_date": due_date,
            "posted_date": None,  # DIBBS doesn't show posted date
            "agency": "Defense Logistics Agency",
            "office": "DLA",
            "location": None,
            "place_of_performance": None,
            "state": None,
            "estimated_value": estimated_value,
            "contract_type": "RFQ",
            "set_aside": None,
            "url": raw.get("url") or f"{self.BASE_URL}/rfq/{raw.get('rfq_number')}",
            "solicitation_number": raw.get("rfq_number"),
            "point_of_contact": None,
            "raw_data": raw
        }

    async def close(self):
        """Close browser instance"""
        if self.browser:
            await self.browser.close()
            self.browser = None
