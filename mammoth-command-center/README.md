# Mammoth Command Center

Multi-Company Business Automation Platform for Mammoth Holdings.

## Overview

The Mammoth Command Center is a unified business intelligence and automation platform designed to centralize operations across three distinct companies:

- **MammothDX** - Diagnostics & Analytics
- **Shield** - Security Solutions
- **Durablue** - Industrial Durability

## Features

### Dashboard Views

1. **Executive Dashboard** - Real-time KPIs, pipeline summary, alerts
2. **Sales Pipeline** - Kanban-style deal management
3. **Email Command Center** - Unified inbox with AI features
4. **Task Management** - Multi-view task tracking
5. **Campaign Calendar** - Marketing campaign planning
6. **Contacts/CRM** - Contact management with activity timeline

### Automation Workflows

Pre-built workflows for:
- New lead welcome sequences
- Stale deal alerts
- Deal won/lost follow-ups
- Email response reminders
- Lead scoring updates

### AI-Powered Features (Claude Integration)

- Email thread summarization
- Sentiment analysis
- Draft response generation
- Deal insights and recommendations
- Natural language task parsing

## Tech Stack

- **Frontend**: Vanilla JS, HTML5, CSS3
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Automation**: n8n / Make (Integromat)
- **AI**: Claude API (Anthropic)

## Project Structure

```
mammoth-command-center/
├── api/                    # API endpoints
│   └── index.js           # Main API router
├── assets/
│   ├── css/
│   │   └── styles.css     # Global styles
│   └── js/
│       └── app.js         # Main application
├── lib/
│   ├── config.js          # Configuration & constants
│   ├── supabase.js        # Database client
│   ├── validation.js      # Zod schemas
│   ├── ai-service.js      # Claude AI integration
│   └── workflows.js       # Automation engine
├── tests/
│   ├── config.test.js
│   └── validation.test.js
├── index.html             # Main dashboard
├── schema.sql             # Database schema
└── README.md
```

## Database Schema

The platform uses a multi-tenant architecture with Row-Level Security (RLS):

### Core Tables
- `companies` - Company definitions (MammothDX, Shield, Durablue)
- `contacts` - CRM contacts with lead scoring
- `deals` - Sales pipeline opportunities
- `tasks` - Task management
- `emails` - Email tracking and AI analysis
- `campaigns` - Marketing campaigns
- `activities` - Activity timeline
- `workflows` - Automation configurations

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key (for AI features)

### Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Setup

1. Create a Supabase project
2. Run `schema.sql` to create tables
3. Configure environment variables
4. Deploy to Vercel or run locally

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mammoth/health` | Health check |
| GET | `/api/mammoth/companies` | List companies |
| GET | `/api/mammoth/contacts` | List contacts |
| POST | `/api/mammoth/contacts` | Create contact |
| PATCH | `/api/mammoth/contacts/:id` | Update contact |
| GET | `/api/mammoth/deals` | List deals |
| POST | `/api/mammoth/deals` | Create deal |
| PATCH | `/api/mammoth/deals/:id/stage` | Update deal stage |
| GET | `/api/mammoth/tasks` | List tasks |
| POST | `/api/mammoth/tasks` | Create task |
| GET | `/api/mammoth/campaigns` | List campaigns |
| GET | `/api/mammoth/activities` | List activities |
| GET | `/api/mammoth/dashboard/metrics` | Dashboard KPIs |

## Workflow Templates

Available automation templates:

- `new_lead_welcome` - Welcome sequence for new leads
- `stale_deal_alert` - Alert for inactive deals
- `deal_won_celebration` - Post-win automation
- `deal_lost_follow_up` - Follow-up after losing a deal
- `proposal_follow_up` - Proposal stage follow-ups
- `email_response_reminder` - Unanswered email alerts
- `daily_task_digest` - Daily task summary
- `lead_scoring_update` - Dynamic lead scoring

## Security

- Row-Level Security (RLS) for data isolation
- AES-256 encryption at rest
- TLS 1.3 for all communications
- Role-based access control (RBAC)
- Audit logging for compliance

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access to all companies and settings |
| Manager | Team oversight and reports |
| Sales Rep | Manage own deals and contacts |
| Marketing | Campaign and template management |
| Viewer | Read-only access |

## License

Internal / Confidential - Mammoth Holdings
