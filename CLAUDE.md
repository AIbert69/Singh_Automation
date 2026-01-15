# Singh Automation - Claude Code Context

## What This Project Does
Government contracting intelligence platform that helps Singh Automation find, evaluate, and bid on procurement opportunities. Live at https://singh-automation.vercel.app

## Quick Commands
```bash
npm run dev          # Start local dev server (localhost:3000)
npm test             # Run tests
npm run validate     # Lint + typecheck + test (run before commits)
```

## Tech Stack
- **Frontend**: Vanilla JS, HTML, CSS (deployed on Vercel)
- **Backend APIs**: Vercel serverless functions in `/api`
- **Python**: Scrapers in `/scrapers`, WinScope platform in `/winscope-platform`
- **Testing**: Jest (JS), pytest (Python)

## Key Directories
- `/api` - Serverless API endpoints (sam.js, generate-proposal.js, etc.)
- `/lib` - Shared config, validation, qualification logic
- `/scrapers` - Python web scrapers for procurement portals
- `/winscope-platform` - AI-powered document intelligence

## Company Context
- **Business**: Industrial automation, robotics, welding systems
- **NAICS Codes**: 333249, 541330, 541512, 541715, 238210, 333922
- **Certifications**: FANUC Authorized, Small Business, MBE
- **UEI**: GJ1DPYQ3X8K5

## Code Patterns
- Use Zod for input validation
- API responses use `{ success: true, data: ... }` format
- Error handling via `/lib/errors.js`
- Rate limiting: 60 req/min default

## Environment Variables
Required:
- `SAM_API_KEY` - SAM.gov API access
- `ANTHROPIC_API_KEY` - Claude API for proposal generation

## Testing Requirements
- 70% coverage threshold for all metrics
- Run `npm run validate` before committing

## Don't Do
- Don't hardcode API keys
- Don't skip input validation
- Don't ignore the qualification scoring algorithm in `/lib/qualification.js`
