# Sam Agent 2.0

**Autonomous Government Contracting Advisor for Singh Automation**

Sam Agent is an AI-powered mobile application that acts as an expert government contracting advisor. It scrapes procurement opportunities daily, analyzes them against Singh Automation's capabilities, and provides strategic guidance with actionable recommendations.

## Features

- **Daily Briefings**: AI-generated morning briefings with top opportunities and strategic advice
- **Opportunity Scoring**: Automatic scoring (0-100) based on NAICS match, keywords, contract size, and location
- **Multi-Source Scraping**: SAM.gov, DIBBS, USASpending, and state/local portals
- **Persistent Memory**: Learns from your actions and maintains context across sessions
- **Chat Interface**: Ask Sam anything about government contracting
- **Push Notifications**: Alerts for high-score opportunities and daily briefings

## Architecture

```
sam-agent/
├── backend/                 # Python FastAPI backend
│   ├── src/
│   │   ├── scrapers/       # Data collection from procurement sources
│   │   ├── intelligence/   # AI analysis and scoring
│   │   ├── api/           # REST API endpoints
│   │   └── database/      # Supabase connection and memory
│   ├── main.py            # Entry point
│   └── requirements.txt
├── mobile/                 # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   └── services/      # API client
│   └── App.tsx
└── config/
    └── singh_profile.json # Company profile configuration
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- SAM.gov API key (free: https://api.sam.gov)
- Anthropic API key
- Supabase account (free tier works)

### Backend Setup

```bash
# Navigate to backend
cd sam-agent/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp ../.env.example .env
# Edit .env with your API keys

# Run database migrations (using Supabase dashboard or CLI)
# Execute the SQL in src/database/schema.sql

# Start the server
uvicorn main:app --reload --port 8080
```

### Mobile App Setup

```bash
# Navigate to mobile
cd sam-agent/mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Scan QR code with Expo Go app on your phone
```

## Configuration

### Company Profile

Edit `config/singh_profile.json` to customize:

- NAICS codes
- Keywords to match
- Contract size preferences
- Geographic preferences
- Scoring weights

### Scoring Weights

| Factor | Default Weight |
|--------|---------------|
| NAICS Match | 30 points |
| Keywords | 5 points each (max 25) |
| Set-Aside | 20 points |
| Geographic | 10 points |
| Contract Size | 25 points |
| Past Performance | 10 points |

### Recommendation Thresholds

- **Pursue**: Score ≥ 50
- **Review**: Score 25-49
- **Watch**: Score < 25
- **Pass**: Disqualified (ineligible set-aside or exclude keyword)

## API Endpoints

### Briefings
- `GET /briefing/today` - Today's AI-generated briefing
- `GET /briefing/{date}` - Historical briefing

### Opportunities
- `GET /opportunities` - List opportunities (filters: status, min_score, source)
- `GET /opportunities/top` - Top scoring opportunities
- `GET /opportunities/{id}` - Single opportunity details
- `GET /opportunities/{id}/analyze` - AI analysis
- `POST /opportunities/{id}/action` - Record action (pursued, passed, won, lost)

### Chat
- `POST /chat` - Ask Sam a question

### Scan
- `POST /scan/now` - Trigger manual scan
- `GET /scan/status` - Check scan status

### Stats
- `GET /stats` - Summary statistics
- `GET /market/analysis` - Market analysis for your NAICS codes

## Data Sources

| Source | Method | Risk Level |
|--------|--------|------------|
| SAM.gov | Official API | ✅ None |
| USASpending | Official API | ✅ None |
| DIBBS | Web scraping | ⚠️ Medium |
| State portals | Web scraping | ⚠️ Low |

## Scheduling

The backend automatically runs:
- **Daily Scrape**: 6:00 AM local time
- **Briefing Generation**: 6:30 AM local time

Push notifications arrive by 7:00 AM.

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=src --cov-report=html
```

### Code Style

```bash
# Format Python code
black src/ tests/

# Sort imports
isort src/ tests/

# Type checking
mypy src/
```

## Deployment

### Backend (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

### Database (Supabase)

1. Create project at supabase.com
2. Run schema.sql in SQL editor
3. Copy URL and anon key to environment

### Mobile (Expo)

```bash
# Build for iOS/Android
eas build --platform all

# Submit to app stores
eas submit
```

## Security Notes

- API keys stored in environment variables, never in code
- Database encryption at rest (Supabase built-in)
- HTTPS for all API calls
- Rate limiting on all endpoints
- Proxy rotation for web scraping

## Support

For Singh Automation internal use only.

Contact: albert@singhautomation.com

## License

Proprietary - Singh Automation LLC
