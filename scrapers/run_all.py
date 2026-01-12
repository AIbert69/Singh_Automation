#!/usr/bin/env python3
"""
Singh Automation - Portal Scraper Runner

Runs all configured scrapers and combines results into a single output file.
This script is designed to be run by GitHub Actions or cron.

Usage:
    python run_all.py              # Run all scrapers
    python run_all.py --demo       # Use demo data (for testing)
    python run_all.py --output combined.json  # Custom output file
"""

import json
import argparse
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# Import scrapers
from michigan_sigma import MichiganSIGMAScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ScraperRunner')

# All available scrapers
SCRAPERS = [
    MichiganSIGMAScraper,
    # Add more scrapers here as they're built:
    # CalEprocureScraper,
    # TexasSmartBuyScraper,
    # DIBBSScraper,
]


def run_all_scrapers(demo_mode: bool = False) -> List[Dict]:
    """
    Run all scrapers and combine results.

    Args:
        demo_mode: If True, use demo data instead of actual scraping

    Returns:
        Combined list of all opportunities
    """
    all_opportunities = []

    for ScraperClass in SCRAPERS:
        scraper_name = ScraperClass.__name__
        logger.info(f"Running {scraper_name}...")

        try:
            scraper = ScraperClass()

            if demo_mode:
                # Use demo data
                raw = scraper._get_demo_data() if hasattr(scraper, '_get_demo_data') else []
                opportunities = [scraper.normalize_opportunity(r) for r in raw]
            else:
                # Run actual scraper
                opportunities = scraper.run(filter_relevant=True, save=False)

            logger.info(f"{scraper_name}: Found {len(opportunities)} opportunities")
            all_opportunities.extend(opportunities)

        except Exception as e:
            logger.error(f"{scraper_name} failed: {e}")
            continue

    return all_opportunities


def deduplicate(opportunities: List[Dict]) -> List[Dict]:
    """Remove duplicate opportunities based on ID and title similarity."""
    seen_ids = set()
    seen_titles = set()
    unique = []

    for opp in opportunities:
        opp_id = opp.get('id', '')
        title_key = opp.get('title', '')[:50].lower()

        if opp_id in seen_ids or title_key in seen_titles:
            continue

        seen_ids.add(opp_id)
        seen_titles.add(title_key)
        unique.append(opp)

    return unique


def save_combined_results(opportunities: List[Dict], output_file: str = 'scraped_data.json'):
    """
    Save combined results to JSON file.

    Args:
        opportunities: List of all opportunities
        output_file: Output filename
    """
    output_path = Path(__file__).parent / 'output'
    output_path.mkdir(exist_ok=True)

    filepath = output_path / output_file

    result = {
        'lastUpdated': datetime.utcnow().isoformat() + 'Z',
        'totalCount': len(opportunities),
        'sources': list(set(o.get('source', 'Unknown') for o in opportunities)),
        'opportunities': opportunities
    }

    with open(filepath, 'w') as f:
        json.dump(result, f, indent=2)

    logger.info(f"Saved {len(opportunities)} opportunities to {filepath}")

    # Also save a "latest" symlink for easy access
    latest_path = output_path / 'latest.json'
    if latest_path.exists():
        latest_path.unlink()
    latest_path.symlink_to(output_file)

    return filepath


def main():
    parser = argparse.ArgumentParser(description='Run all Singh Automation scrapers')
    parser.add_argument('--demo', action='store_true', help='Use demo data instead of scraping')
    parser.add_argument('--output', default='scraped_data.json', help='Output filename')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("=" * 60)
    logger.info("Singh Automation - Portal Scraper Runner")
    logger.info("=" * 60)

    # Run all scrapers
    opportunities = run_all_scrapers(demo_mode=args.demo)

    # Deduplicate
    opportunities = deduplicate(opportunities)

    # Save results
    save_combined_results(opportunities, args.output)

    # Print summary
    print("\n" + "=" * 60)
    print("SCRAPER RUN COMPLETE")
    print("=" * 60)
    print(f"Total opportunities: {len(opportunities)}")

    # Group by source
    by_source = {}
    for opp in opportunities:
        source = opp.get('source', 'Unknown')
        by_source[source] = by_source.get(source, 0) + 1

    print("\nBy source:")
    for source, count in sorted(by_source.items()):
        print(f"  {source}: {count}")

    # Total value
    total_value = sum(opp.get('value', 0) or 0 for opp in opportunities)
    print(f"\nTotal pipeline value: ${total_value:,.0f}")

    print("\nResults saved to: output/" + args.output)


if __name__ == '__main__':
    main()
