# GitHub Cleanup Plan: Clean Slate for OpenClaw + Singh Automation

## Current Situation (The Problem)

The `AIbert69/Singh_Automation` repo has become a dumping ground for multiple unrelated projects:

- **Singh Automation core** - Government contracting platform (the actual business)
- **OpenClaw Mission Control** - AI agent dashboard (in `/mission-control/` and `/mc-proxy/`)
- **Mammoth Command Center** - Multi-company business platform (in `/mammoth-command-center/`)
- **55+ merged PRs** across many branches, making history messy
- The old Vercel deployment (`albert-command-center-*.vercel.app`) is disconnected/irrelevant
- The "original Mission Control" dashboard is not deployed anywhere usable

## Goal

**Two clean, separated repositories with clear purposes:**

1. `AIbert69/Open_claw` - OpenClaw agent platform (the resume/showcase + agent for Singh)
2. `AIbert69/Singh_Automation` - Clean government contracting platform (the business)

---

## Phase 1: Create `AIbert69/Open_claw` as a Clean Repo

### Step 1.1 - Create the Open_claw repository on GitHub
- Create `AIbert69/Open_claw` as a new repo (if it doesn't exist)
- Fresh repo, no forking from Singh_Automation
- Clean `main` branch, clean history

### Step 1.2 - Set up OpenClaw project structure
Extract and reorganize from Singh_Automation into a proper standalone project:

```
Open_claw/
├── README.md                  # What OpenClaw is, how to use it
├── package.json               # Root project config
├── CLAUDE.md                  # Claude Code context for OpenClaw
│
├── /gateway/                  # OpenClaw Gateway (agent runtime)
│   └── (future: core agent orchestration)
│
├── /mission-control/          # React dashboard (from Singh_Automation)
│   ├── src/
│   │   ├── views/             # Dashboard, Workshop, AgentHub, etc.
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── /mc-proxy/                 # API proxy server
│   ├── server.js
│   └── package.json
│
├── /agents/                   # Agent definitions
│   └── singh-automation/      # Singh Automation agent config
│       └── agent.json         # How OpenClaw connects to Singh
│
└── /scripts/
    └── install.sh             # Auto-install script (from existing)
```

### Step 1.3 - Clean up the Mission Control code
- Remove hardcoded references to Singh_Automation paths
- Update the dashboard to be a proper standalone OpenClaw product
- Make it connect to OpenClaw Gateway generically (not Singh-specific)
- Remove mock data fallbacks that reference Singh business logic

### Step 1.4 - Push to `AIbert69/Open_claw`
- Initialize fresh git history
- Push clean `main` branch
- No old branches, no old PRs, no baggage

---

## Phase 2: Clean Up `AIbert69/Singh_Automation`

### Step 2.1 - Remove OpenClaw code from Singh_Automation
Files/directories to remove from Singh_Automation `main`:
- `/mission-control/` (moved to Open_claw)
- `/mc-proxy/` (moved to Open_claw)
- Any OpenClaw auto-install scripts
- Mammoth Command Center (`/mammoth-command-center/`) - unrelated project

### Step 2.2 - Clean up stale branches
Delete old remote branches that are already merged or abandoned:
- `cursor/mission-control-dashboard-d367` (moved to Open_claw)
- Any other stale feature branches

### Step 2.3 - Singh_Automation stays focused
What remains in Singh_Automation:
```
Singh_Automation/
├── /api/              # SAM.gov, proposal generation, agent endpoints
├── /lib/              # Config, validation, qualification scoring
├── /scrapers/         # Procurement portal scrapers
├── /winscope-platform/ # Document intelligence
├── /proposals/        # Generated proposals
├── /tests/            # Jest tests
├── index.html         # Main dashboard
├── CLAUDE.md          # Project context
└── package.json
```

---

## Phase 3: Connect OpenClaw as Agent for Singh Automation

### Step 3.1 - Define Singh Automation as an OpenClaw agent target
- Create agent configuration in Open_claw that knows how to interact with Singh Automation's API
- OpenClaw becomes the "brain" that drives Singh Automation's procurement workflow

### Step 3.2 - OpenClaw as the Resume/Portfolio
- Open_claw repo serves as the showcase: "Here's the AI agent platform I built"
- Mission Control dashboard is the visual proof
- Singh Automation is the real-world use case it manages

---

## Execution Order

1. **Phase 1** first - Get Open_claw repo created and populated with clean code
2. **Phase 2** second - Clean up Singh_Automation by removing what was moved
3. **Phase 3** third - Wire them together (agent config)

## What We're NOT Doing
- NOT keeping the old Vercel deployment (`albert-command-center-*.vercel.app`)
- NOT reusing any old branches
- NOT merging old PRs
- NOT keeping Mammoth Command Center in Singh_Automation
- NOT keeping OpenClaw code inside Singh_Automation
