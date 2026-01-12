"""
Base Scraper Class for Singh Automation Portal Scrapers

All portal scrapers inherit from this class to ensure consistent:
- Rate limiting
- Error handling
- Output format
- Logging
"""

import requests
import json
import time
import logging
from datetime import datetime
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class BaseScraper(ABC):
    """Base class for all procurement portal scrapers."""

    # Singh Automation NAICS codes for filtering
    SINGH_NAICS = [
        '333514',  # Industrial Machinery
        '333515',  # Metalworking Machinery
        '334513',  # Process Control Instruments
        '541330',  # Engineering Services
        '541512',  # Computer Systems Design
        '332710',  # Machine Shops
        '333511',  # Industrial Molds
        '541511',  # Custom Computer Programming
    ]

    # Keywords to search for
    AUTOMATION_KEYWORDS = [
        'automation', 'plc', 'scada', 'hmi', 'robot', 'robotic',
        'industrial control', 'conveyor', 'servo', 'vfd', 'motor control',
        'machine vision', 'sensor', 'pneumatic', 'hydraulic',
        'manufacturing', 'assembly line', 'welding', 'cnc',
        'allen-bradley', 'siemens', 'fanuc', 'rockwell'
    ]

    def __init__(self, name: str, base_url: str, rate_limit: float = 2.0):
        """
        Initialize scraper.

        Args:
            name: Scraper name (e.g., "Michigan SIGMA")
            base_url: Base URL of the portal
            rate_limit: Minimum seconds between requests
        """
        self.name = name
        self.base_url = base_url
        self.rate_limit = rate_limit
        self.last_request_time = 0
        self.logger = logging.getLogger(name)

        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SinghAutomation/1.0 (Government Contract Research)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            sleep_time = self.rate_limit - elapsed
            self.logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()

    def get(self, url: str, **kwargs) -> requests.Response:
        """
        Make a rate-limited GET request.

        Args:
            url: URL to fetch
            **kwargs: Additional arguments for requests.get()

        Returns:
            Response object
        """
        self._rate_limit()
        self.logger.info(f"GET {url}")

        try:
            response = self.session.get(url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            raise

    def post(self, url: str, **kwargs) -> requests.Response:
        """Make a rate-limited POST request."""
        self._rate_limit()
        self.logger.info(f"POST {url}")

        try:
            response = self.session.post(url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            raise

    @abstractmethod
    def scrape(self) -> List[Dict]:
        """
        Scrape opportunities from the portal.

        Must be implemented by subclasses.

        Returns:
            List of opportunity dictionaries
        """
        pass

    def normalize_opportunity(self, raw: Dict) -> Dict:
        """
        Normalize opportunity data to standard schema.

        Args:
            raw: Raw scraped data

        Returns:
            Normalized opportunity dict
        """
        return {
            'id': raw.get('id', f"{self.name.lower().replace(' ', '-')}-{int(time.time())}"),
            'source': self.name,
            'title': raw.get('title', 'Untitled'),
            'agency': raw.get('agency', 'Unknown Agency'),
            'value': self._parse_value(raw.get('value')),
            'closeDate': self._parse_date(raw.get('closeDate')),
            'postedDate': self._parse_date(raw.get('postedDate')),
            'solicitation': raw.get('solicitation', ''),
            'naicsCode': raw.get('naicsCode', ''),
            'setAside': raw.get('setAside', ''),
            'link': raw.get('link', ''),
            'description': raw.get('description', '')[:1000],  # Truncate
            'location': raw.get('location', ''),
            'scrapedAt': datetime.utcnow().isoformat() + 'Z',
            'isLive': True,
            'type': raw.get('type', 'contract'),
        }

    def _parse_value(self, value) -> Optional[float]:
        """Parse contract value from various formats."""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove currency symbols and commas
            cleaned = value.replace('$', '').replace(',', '').strip()
            # Handle ranges like "$50,000 - $100,000"
            if '-' in cleaned:
                parts = cleaned.split('-')
                try:
                    return float(parts[1].strip())  # Use high end
                except (ValueError, IndexError):
                    pass
            # Handle "K" and "M" suffixes
            if cleaned.upper().endswith('K'):
                try:
                    return float(cleaned[:-1]) * 1000
                except ValueError:
                    pass
            if cleaned.upper().endswith('M'):
                try:
                    return float(cleaned[:-1]) * 1000000
                except ValueError:
                    pass
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None

    def _parse_date(self, date_str) -> Optional[str]:
        """Parse date string to ISO format."""
        if date_str is None:
            return None
        if isinstance(date_str, datetime):
            return date_str.strftime('%Y-%m-%d')

        from dateutil import parser
        try:
            dt = parser.parse(str(date_str))
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            return None

    def filter_relevant(self, opportunities: List[Dict]) -> List[Dict]:
        """
        Filter opportunities relevant to Singh Automation.

        Args:
            opportunities: List of normalized opportunities

        Returns:
            Filtered list
        """
        relevant = []
        for opp in opportunities:
            text = f"{opp.get('title', '')} {opp.get('description', '')}".lower()

            # Check for automation keywords
            if any(kw in text for kw in self.AUTOMATION_KEYWORDS):
                relevant.append(opp)
                continue

            # Check for matching NAICS
            naics = opp.get('naicsCode', '')
            if naics and any(naics.startswith(n) for n in self.SINGH_NAICS):
                relevant.append(opp)
                continue

        self.logger.info(f"Filtered {len(opportunities)} -> {len(relevant)} relevant opportunities")
        return relevant

    def save_results(self, opportunities: List[Dict], output_dir: str = 'output'):
        """
        Save scraped results to JSON file.

        Args:
            opportunities: List of opportunities
            output_dir: Output directory
        """
        output_path = Path(__file__).parent / output_dir
        output_path.mkdir(exist_ok=True)

        filename = f"{self.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = output_path / filename

        with open(filepath, 'w') as f:
            json.dump({
                'source': self.name,
                'scrapedAt': datetime.utcnow().isoformat() + 'Z',
                'count': len(opportunities),
                'opportunities': opportunities
            }, f, indent=2)

        self.logger.info(f"Saved {len(opportunities)} opportunities to {filepath}")
        return filepath

    def run(self, filter_relevant: bool = True, save: bool = True) -> List[Dict]:
        """
        Run the scraper end-to-end.

        Args:
            filter_relevant: Whether to filter for Singh-relevant opportunities
            save: Whether to save results to file

        Returns:
            List of opportunities
        """
        self.logger.info(f"Starting {self.name} scraper...")

        try:
            opportunities = self.scrape()
            self.logger.info(f"Scraped {len(opportunities)} raw opportunities")

            # Normalize all opportunities
            normalized = [self.normalize_opportunity(opp) for opp in opportunities]

            # Filter if requested
            if filter_relevant:
                normalized = self.filter_relevant(normalized)

            # Save if requested
            if save:
                self.save_results(normalized)

            self.logger.info(f"Completed with {len(normalized)} opportunities")
            return normalized

        except Exception as e:
            self.logger.error(f"Scraper failed: {e}")
            raise
