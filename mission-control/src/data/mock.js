/**
 * OpenClaw Mission Control — Mock Data
 *
 * Used when the OpenClaw Gateway at ws://127.0.0.1:18789 is unreachable.
 * All data reflects Singh Automation's agent "Claw" running claude-sonnet-4-5.
 */

export const MOCK_DASHBOARD = {
  gateway: {
    status: 'offline',
    wsConnected: false,
    host: '127.0.0.1',
    port: 18789,
    url: 'ws://127.0.0.1:18789/ws',
  },
  agent: {
    name: 'Claw',
    model: 'claude-sonnet-4-5',
    provider: 'anthropic',
    channels: ['discord', 'telegram', 'web'],
  },
  sessions: { active: 3, total: 47 },
  tokens: { today: 124580, total: 2847391 },
  uptime: '6d 14h 23m',
  version: '0.9.2',
  wsMessages: 0,
};

export const MOCK_SESSIONS = [
  {
    id: 'sess_a01',
    agentId: 'claw',
    type: 'discord',
    started: '2026-02-07T08:15:00Z',
    messages: 12,
    status: 'active',
    lastMessage: 'Scanning SAM.gov for NAICS 333249 opportunities...',
  },
  {
    id: 'sess_a02',
    agentId: 'scout',
    type: 'telegram',
    started: '2026-02-07T06:00:00Z',
    messages: 8,
    status: 'active',
    lastMessage: 'Found 3 new DLA welding contracts matching profile.',
  },
  {
    id: 'sess_a03',
    agentId: 'sentinel',
    type: 'web',
    started: '2026-02-07T07:30:00Z',
    messages: 5,
    status: 'idle',
    lastMessage: 'Monitoring DeFi yields — Aave v3 ETH at 4.2% APY.',
  },
];

export const MOCK_CRONS = [
  {
    name: 'SAM.gov Scanner',
    schedule: '0 */6 * * *',
    description: 'Scan SAM.gov for NAICS 333249, 541330, 541512 opportunities',
    lastRun: '2026-02-07T06:00:00Z',
    nextRun: '2026-02-07T12:00:00Z',
    status: 'success',
    hits: 14,
  },
  {
    name: 'DeFi Yield Monitor',
    schedule: '0 */4 * * *',
    description: 'Monitor Aave v3, Compound v3, and Morpho Blue yields',
    lastRun: '2026-02-07T04:00:00Z',
    nextRun: '2026-02-07T08:00:00Z',
    status: 'success',
    hits: 7,
  },
  {
    name: 'Polymarket Sniper',
    schedule: '*/15 * * * *',
    description: 'Scan Polymarket for mispriced markets and arbitrage',
    lastRun: '2026-02-07T07:45:00Z',
    nextRun: '2026-02-07T08:00:00Z',
    status: 'success',
    hits: 23,
  },
  {
    name: 'Airdrop Hunter',
    schedule: '0 7 * * *',
    description: 'Daily airdrop eligibility sweep across protocols',
    lastRun: '2026-02-07T07:00:00Z',
    nextRun: '2026-02-08T07:00:00Z',
    status: 'success',
    hits: 2,
  },
  {
    name: 'SBIR/STTR Scanner',
    schedule: '0 8 * * 1',
    description: 'Weekly scan for SBIR/STTR solicitations — robotics & automation',
    lastRun: '2026-02-02T08:00:00Z',
    nextRun: '2026-02-09T08:00:00Z',
    status: 'success',
    hits: 5,
  },
];

export const MOCK_AGENTS = [
  {
    id: 'claw',
    name: 'Claw',
    role: 'Commander',
    icon: '⚡',
    model: 'claude-sonnet-4-5',
    status: 'active',
    desc: 'Primary orchestrator. Manages all sub-agents, task routing, and Singh Automation operations.',
  },
  {
    id: 'architect',
    name: 'The Architect',
    role: 'Auditor',
    icon: '🏗',
    model: 'claude-sonnet-4-5',
    status: 'active',
    desc: 'Code review, system architecture audits, FAR/DFARS compliance validation.',
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Hunter',
    icon: '🔍',
    model: 'claude-sonnet-4-5',
    status: 'active',
    desc: 'Opportunity discovery — SAM.gov, DLA, GovWin, and procurement portal scanning.',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Monitor',
    icon: '🛡',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    desc: 'Continuous DeFi position monitoring, Polymarket tracking, and alert generation.',
  },
];

export const MOCK_SKILLS = [
  {
    name: 'RFP Generator',
    confidence: 94,
    category: 'GovCon',
    status: 'production',
    description: 'Generates FAR/DFARS-compliant RFP responses from solicitation docs',
    lastUsed: '2026-02-07T05:30:00Z',
    doc: `# RFP Generator

## Overview
Automated RFP response generation for federal procurement opportunities. Tailored to Singh Automation's capabilities as a FANUC-authorized robotics integrator.

## How It Works
1. Ingest solicitation PDF (Section L/M requirements)
2. Map requirements to Singh Automation capability matrix
3. Generate compliant sections: Technical Approach, Past Performance, Cost Volume
4. FAR/DFARS clause compliance check
5. Output formatted proposal draft

## Capabilities
- Section L/M response mapping
- Past performance narrative generation (3 relevant contracts auto-selected)
- Technical approach writing with FANUC integration specifics
- Cost volume estimation based on historical bid data
- Compliance matrix generation
- SF-330 format support for A/E contracts

## Supported NAICS
- 333249 — Industrial Machinery Manufacturing
- 541330 — Engineering Services
- 541512 — Computer Systems Design
- 541715 — R&D in Physical Sciences
- 238210 — Electrical Contractors

## Performance Metrics
- 94% compliance score on test submissions
- Average generation time: 12 minutes
- Proposal win rate improvement: +23% since deployment
- 47 proposals generated to date

## Usage
\`\`\`
claw rfp generate --solicitation W912DY-25-R-0042
claw rfp analyze --pdf ./solicitation.pdf
claw rfp compliance-check --draft ./proposal.md
\`\`\``,
  },
  {
    name: 'DeFi Rebalancer',
    confidence: 87,
    category: 'DeFi',
    status: 'beta',
    description: 'Automated yield optimization across Aave, Compound, and Morpho',
    lastUsed: '2026-02-07T04:00:00Z',
    doc: `# DeFi Rebalancer

## Overview
Automated yield farming optimization. Monitors positions across lending protocols and rebalances for maximum risk-adjusted yield.

## Supported Protocols
- **Aave v3** — Ethereum mainnet + Arbitrum
- **Compound v3** — Ethereum mainnet
- **Morpho Blue** — Ethereum mainnet
- **Lido** — stETH liquid staking

## Strategy
The rebalancer uses a multi-factor scoring model:
1. Current APY across all positions
2. Protocol risk score (smart contract audit history, TVL)
3. Gas cost optimization (batch transactions when possible)
4. Slippage protection — max 0.5% per rebalance
5. Emergency exit triggers — if APY drops >50% or TVL drops >30%

## Current Positions
| Protocol | Asset | Amount | APY |
|----------|-------|--------|-----|
| Aave v3 | USDC | $12,400 | 4.2% |
| Compound | ETH | $8,200 | 3.8% |
| Morpho | USDC | $5,100 | 5.1% |

## Performance
- 87% accuracy on yield predictions (7-day forward)
- Average APY improvement: +2.3% over manual management
- Max drawdown protection: 5% hard stop
- Rebalance frequency: every 4 hours (cron)
- Total value managed: $25,700

## Risk Controls
- Max single-protocol allocation: 60%
- Stablecoin minimum: 40% of portfolio
- Gas price ceiling: 50 gwei (delays rebalance if exceeded)`,
  },
  {
    name: 'Polymarket Sniper',
    confidence: 91,
    category: 'Trading',
    status: 'production',
    description: 'Real-time Polymarket arbitrage detection and position management',
    lastUsed: '2026-02-07T07:45:00Z',
    doc: `# Polymarket Sniper

## Overview
Automated Polymarket trading agent. Detects mispriced markets, identifies arbitrage between correlated events, and manages positions.

## Detection Methods
1. **New Market Sniping** — Monitors for new markets within 5 minutes of creation. Early entry captures maximum mispricing.
2. **Cross-Market Arbitrage** — Identifies contradictory pricing across related markets (e.g., election outcomes).
3. **Sentiment Divergence** — Compares market odds vs. aggregated polling/prediction data.
4. **Liquidity Imbalance** — Detects when one side of a market has disproportionate liquidity.

## Execution
- Automated limit order placement
- Position sizing: max $500/market, max 10 concurrent positions
- Stop-loss: -15% per position
- Take-profit: +25% per position
- Portfolio heat: max $3,000 total exposure

## Performance
- 91% win rate on snipe entries (< 5min from market creation)
- Average ROI per trade: 8.2%
- Markets tracked: 847 active
- Daily scan frequency: 96 (every 15 minutes via cron)
- Total P&L: +$2,840 since deployment

## Active Markets
Tracking categories: US Politics, Global Elections, Crypto, AI/Tech, Sports`,
  },
  {
    name: 'SBIR Matcher',
    confidence: 89,
    category: 'GovCon',
    status: 'production',
    description: 'Matches SBIR/STTR solicitations to Singh Automation R&D capabilities',
    lastUsed: '2026-02-02T08:00:00Z',
    doc: `# SBIR Matcher

## Overview
Intelligent matching engine for SBIR (Small Business Innovation Research) and STTR (Small Business Technology Transfer) solicitations. Maps opportunities to Singh Automation's robotics and automation R&D capabilities.

## Matching Algorithm
Multi-factor scoring (0-100):
1. **NAICS Alignment** (30%) — Direct code match + adjacent code relevance
2. **Technical Keywords** (25%) — NLP matching of solicitation topics to capability matrix
3. **Past Performance** (20%) — Relevance of prior SBIR/STTR awards
4. **Budget Fit** (15%) — Phase I ($150K) / Phase II ($1M) alignment with project scope
5. **Agency Preference** (10%) — Historical win rates by agency

## Agencies Covered
- Department of Defense (DoD) — Army, Navy, Air Force, DARPA
- Department of Energy (DOE)
- NASA
- National Science Foundation (NSF)
- DHS

## Singh Automation Strengths
- FANUC robotics integration for defense manufacturing
- Automated welding systems (TIG, MIG, orbital)
- Industrial IoT sensor networks
- Predictive maintenance AI
- Human-robot collaboration safety systems

## Performance
- 89% relevance accuracy (validated against manual review)
- Weekly scan: 200+ new solicitations processed
- Auto-generates capability statements for top matches
- 5 Phase I awards facilitated since deployment
- Pipeline: $2.4M in pending SBIR proposals`,
  },
];

export const MOCK_TASKS = {
  queued: [
    {
      id: 'tq1',
      title: 'DLA Welding Contract Analysis',
      desc: 'Analyze 3 new DLA solicitations for welding equipment and services',
      priority: 'high',
      agent: 'scout',
      tags: ['GovCon', 'DLA'],
      momentum: 0,
    },
    {
      id: 'tq2',
      title: 'SBIR Phase II Draft',
      desc: 'Draft Phase II proposal for DoD robotics integration SBIR — W912DY-26-SBIR-0015',
      priority: 'medium',
      agent: 'claw',
      tags: ['GovCon', 'SBIR'],
      momentum: 0,
    },
  ],
  active: [
    {
      id: 'ta1',
      title: 'SAM.gov NAICS 333249 Scan',
      desc: 'Full scan of SAM.gov for industrial machinery manufacturing opportunities matching Singh profile',
      priority: 'high',
      agent: 'scout',
      tags: ['GovCon', 'SAM.gov'],
      momentum: 72,
      started: '2026-02-07T08:01:00Z',
    },
    {
      id: 'ta2',
      title: 'Aave v3 Yield Rebalance',
      desc: 'Rebalancing USDC/ETH positions across Aave v3 and Compound for optimal APY',
      priority: 'medium',
      agent: 'sentinel',
      tags: ['DeFi', 'Yield'],
      momentum: 45,
      started: '2026-02-07T04:00:00Z',
    },
    {
      id: 'ta3',
      title: 'Polymarket Arbitrage Scan',
      desc: 'Cross-referencing 847 active Polymarket markets for mispriced events',
      priority: 'low',
      agent: 'claw',
      tags: ['Trading', 'Polymarket'],
      momentum: 88,
      started: '2026-02-07T07:45:00Z',
    },
  ],
  done: [
    {
      id: 'td1',
      title: 'Navy Hull Weld Proposal',
      desc: 'Completed N00024-25-R-WELD proposal — FANUC welding integration for naval hull repair',
      priority: 'critical',
      agent: 'claw',
      tags: ['GovCon', 'Navy'],
      momentum: 100,
      completed: '2026-02-07T05:30:00Z',
    },
    {
      id: 'td2',
      title: 'Weekly SBIR Report',
      desc: 'Generated summary of 5 matching SBIR/STTR solicitations across DoD and DOE',
      priority: 'medium',
      agent: 'scout',
      tags: ['GovCon', 'SBIR'],
      momentum: 100,
      completed: '2026-02-02T08:45:00Z',
    },
    {
      id: 'td3',
      title: 'DeFi Portfolio Snapshot',
      desc: 'Daily rebalance complete — Aave $12.4K, Compound $8.2K, Morpho $5.1K',
      priority: 'low',
      agent: 'sentinel',
      tags: ['DeFi', 'Report'],
      momentum: 100,
      completed: '2026-02-07T04:30:00Z',
    },
  ],
};

export const MOCK_FINANCE = {
  daily: { spent: 0.47, cap: 5.00 },
  perTask: 0.50,
  weekly: [0.52, 0.38, 0.61, 0.44, 0.55, 0.39, 0.47],
  weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  monthly: { spent: 12.80, projected: 14.50, cap: 150.00 },
  categories: [
    { name: 'SAM.gov Scanning', amount: 3.20, pct: 25 },
    { name: 'Proposal Generation', amount: 4.10, pct: 32 },
    { name: 'DeFi Monitoring', amount: 2.40, pct: 19 },
    { name: 'Polymarket Trading', amount: 1.80, pct: 14 },
    { name: 'System Overhead', amount: 1.30, pct: 10 },
  ],
  rules: [
    { name: 'Daily spend cap', value: '$5.00/day', active: true },
    { name: 'Per-task limit', value: '$0.50/task', active: true },
    { name: 'Monthly budget', value: '$150.00/month', active: true },
    { name: 'Alert threshold', value: '80% of daily cap', active: true },
    { name: 'Emergency stop', value: '$10.00/day hard limit', active: false },
  ],
};

export const MOCK_DOCUMENTS = [
  { id: 'doc1', name: 'N00024-25-R-WELD_Singh_Proposal.pdf', category: 'Proposal', status: 'analyzed', pages: 24, insights: 12, date: '2026-02-06' },
  { id: 'doc2', name: 'Leidos_Teaming_Outreach.pdf', category: 'Teaming', status: 'analyzed', pages: 8, insights: 5, date: '2026-02-05' },
  { id: 'doc3', name: 'FANUC_Certification_2025.pdf', category: 'Certification', status: 'processing', pages: 16, insights: 0, date: '2026-02-07' },
  { id: 'doc4', name: 'DLA_Welding_Requirements.pdf', category: 'Requirements', status: 'queued', pages: 42, insights: 0, date: '2026-02-07' },
  { id: 'doc5', name: 'Singh_Capability_Statement.pdf', category: 'Marketing', status: 'analyzed', pages: 4, insights: 8, date: '2026-01-28' },
];

export const MOCK_LOGS = [
  '[08:00:01] INFO  gateway started on :18789',
  '[08:00:02] INFO  agent "claw" loaded — claude-sonnet-4-5 via anthropic',
  '[08:00:02] INFO  channels: discord, telegram, web',
  '[08:00:03] INFO  cron registered: SAM.gov Scanner (every 6h)',
  '[08:00:03] INFO  cron registered: DeFi Yield Monitor (every 4h)',
  '[08:00:03] INFO  cron registered: Polymarket Sniper (every 15m)',
  '[08:00:03] INFO  cron registered: Airdrop Hunter (daily 7AM)',
  '[08:00:04] INFO  websocket server ready',
  '[08:00:05] INFO  4 agents online: claw, architect, scout, sentinel',
  '[08:01:00] INFO  [cron] SAM.gov Scanner → triggered',
  '[08:01:15] INFO  [sam] 3 new opps for NAICS 333249',
  '[08:01:16] INFO  [sam] 1 new opp for NAICS 541512',
  '[08:05:00] INFO  [cron] Polymarket Sniper → triggered',
  '[08:05:02] INFO  [poly] scanning 847 active markets',
  '[08:05:08] INFO  [poly] 2 arbitrage opportunities detected',
  '[08:10:00] INFO  session sess_a01 opened (discord)',
  '[08:10:01] INFO  [claw] processing: SAM.gov scan results',
  '[08:15:00] INFO  [cron] Polymarket Sniper → triggered',
  '[08:15:03] INFO  [poly] no new opportunities',
  '[08:20:00] INFO  session sess_a02 opened (telegram)',
  '[08:20:01] INFO  [scout] processing: DLA contract alert',
];

export const MOCK_CHAT = [
  { from: 'user', text: 'Scan SAM.gov for new welding contracts', time: '08:10' },
  { from: 'claw', text: 'Initiating SAM.gov scan — NAICS 333249, 541330, 541512...', time: '08:10' },
  { from: 'claw', text: 'Found 3 opportunities:\n\n1. W912DY-26-R-0042 — Army Welding Services ($2.4M)\n2. N00024-26-R-WELD — Navy Hull Repair ($1.8M)\n3. FA8601-26-R-0015 — AF Maintenance ($950K)', time: '08:11' },
  { from: 'user', text: 'Generate proposal for the Navy one', time: '08:12' },
  { from: 'claw', text: 'Generating RFP response for N00024-26-R-WELD...\n\nDrafting:\n→ Technical Approach (FANUC integration)\n→ Past Performance (3 contracts)\n→ Cost Volume ($1.2M estimate)\n→ Compliance Matrix (FAR/DFARS)', time: '08:12' },
  { from: 'claw', text: '✓ Proposal complete — 24 pages, 94% compliance.\nSaved: /proposals/N00024-26-R-WELD_Singh_Proposal.md', time: '08:15' },
  { from: 'user', text: 'How are DeFi positions?', time: '08:16' },
  { from: 'sentinel', text: 'Portfolio snapshot:\n\nAave v3 USDC  $12,400  4.2% APY\nCompound ETH  $8,200   3.8% APY\nMorpho USDC   $5,100   5.1% APY\n\nTotal: $25,700 | Avg APY: 4.3%', time: '08:16' },
];
