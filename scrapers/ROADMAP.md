# Portal Scraper Roadmap

## Overview

This document outlines the plan for building web scrapers to pull live opportunities from government procurement portals that don't have public APIs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Singh Automation Platform                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (index.html)                                          │
│    └── Calls /api/scraped-opportunities                         │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Vercel Serverless)                                  │
│    └── /api/scraped-opportunities.js                            │
│         └── Reads from scraped_data.json or database            │
├─────────────────────────────────────────────────────────────────┤
│  Scraper Service (Runs on schedule - GitHub Actions or Cron)    │
│    ├── scrapers/michigan_sigma.py                               │
│    ├── scrapers/cal_eprocure.py                                 │
│    ├── scrapers/dibbs_scraper.py (requires auth)                │
│    └── scrapers/university_portals/                             │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Public Portals (No Auth Required)

Target portals with public bid boards that don't require login.

| Portal | URL | Difficulty | Status |
|--------|-----|------------|--------|
| Michigan SIGMA | bidders.michigan.gov | Easy | **In Progress** |
| California Cal eProcure | caleprocure.ca.gov | Medium | Planned |
| Texas SmartBuy | txsmartbuy.gov | Medium | Planned |
| Ohio Buys | ohiobuys.ohio.gov | Medium | Planned |

### Michigan SIGMA Scraper (First Target)

**Why first:**
- Public bid board, no login required
- Clean HTML structure
- Relevant to Singh (MI-based company)
- Good automation/manufacturing opportunities

**Implementation:**
```python
# Uses requests + BeautifulSoup
# Searches for automation, PLC, SCADA keywords
# Extracts: title, agency, value, close date, solicitation #
```

## Phase 2: Authenticated Portals

Portals requiring login credentials (stored securely in environment variables).

| Portal | Auth Type | Difficulty | Notes |
|--------|-----------|------------|-------|
| DLA DIBBS | Username/Password | Hard | Anti-bot measures |
| SAM.gov Enhanced | API Key + Login | Medium | Some features need auth |
| Grants.gov Workspace | Login | Hard | Application submission |

### DLA DIBBS Scraper

**Challenges:**
- Requires DLA vendor account
- Session management
- May have CAPTCHA
- Need to handle timeouts

**Approach:**
```python
# Use Selenium with headless Chrome
# Store credentials in .env (never commit)
# Implement retry logic
# Cache results to avoid excessive requests
```

## Phase 3: University & Local Portals

Custom scrapers for each institution.

| Portal | Location | Priority |
|--------|----------|----------|
| University of Michigan | Ann Arbor, MI | High |
| Michigan State | East Lansing, MI | High |
| UC System | California | Medium |
| San Diego County | San Diego, CA | Medium |

## Technical Requirements

### Dependencies

```txt
# requirements.txt
requests>=2.28.0
beautifulsoup4>=4.11.0
selenium>=4.8.0
webdriver-manager>=3.8.0
python-dotenv>=1.0.0
schedule>=1.1.0
```

### Environment Variables

```bash
# .env (never commit!)
DIBBS_USERNAME=your_username
DIBBS_PASSWORD=your_password
SCRAPER_USER_AGENT=SinghAutomation/1.0
```

### Rate Limiting

- Max 1 request per 2 seconds per portal
- Implement exponential backoff on errors
- Respect robots.txt where applicable
- Cache results for 1 hour minimum

### Data Schema

All scrapers output standardized JSON:

```json
{
  "id": "mi-sigma-12345",
  "source": "Michigan SIGMA",
  "title": "PLC System Upgrade",
  "agency": "Michigan DOT",
  "value": 150000,
  "closeDate": "2024-02-15",
  "solicitation": "MDOT-2024-001",
  "link": "https://sigma.michigan.gov/...",
  "description": "...",
  "scrapedAt": "2024-01-15T10:30:00Z"
}
```

## Deployment Options

### Option A: GitHub Actions (Recommended for MVP)

```yaml
# .github/workflows/scrape.yml
name: Run Scrapers
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/run_all.py
      - run: # Upload results to storage
```

### Option B: Dedicated Server

- AWS Lambda + CloudWatch Events
- DigitalOcean Droplet with cron
- Heroku Scheduler

### Option C: Vercel Edge Functions

- Limited to 10s execution time
- Only works for fast scrapers
- Not suitable for Selenium-based scrapers

## Timeline

| Phase | Target | Est. Effort |
|-------|--------|-------------|
| Phase 1.1 | Michigan SIGMA scraper | 1-2 days |
| Phase 1.2 | Cal eProcure scraper | 2-3 days |
| Phase 1.3 | GitHub Actions integration | 1 day |
| Phase 2.1 | DLA DIBBS scraper | 3-5 days |
| Phase 3.x | University portals | 2-3 days each |

## Next Steps

1. **Immediate:** Complete Michigan SIGMA scraper
2. **This week:** Set up GitHub Actions for scheduled runs
3. **Next week:** Add Cal eProcure scraper
4. **Future:** Tackle authenticated portals (DIBBS)

## Files in This Directory

```
scrapers/
├── ROADMAP.md              # This file
├── requirements.txt        # Python dependencies
├── run_all.py              # Main entry point
├── base_scraper.py         # Base class for all scrapers
├── michigan_sigma.py       # Michigan SIGMA scraper
├── cal_eprocure.py         # California eProcure (planned)
├── dibbs_scraper.py        # DLA DIBBS (planned)
└── output/
    └── scraped_data.json   # Combined output
```
