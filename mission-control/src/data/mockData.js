// ── Mock data fallback when gateway is offline ────────────────────────────────

export const MOCK_DASHBOARD = {
  gateway: { status: 'offline', host: '127.0.0.1', port: 18789 },
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
};

export const MOCK_SESSIONS = [
  { id: 'sess_001', agentId: 'claw', type: 'discord', started: '2026-02-07T08:15:00Z', messages: 12, status: 'active', lastMessage: 'Scanning SAM.gov for NAICS 333249 opportunities...' },
  { id: 'sess_002', agentId: 'scout', type: 'telegram', started: '2026-02-07T06:00:00Z', messages: 8, status: 'active', lastMessage: 'Found 3 new DLA welding contracts matching profile.' },
  { id: 'sess_003', agentId: 'sentinel', type: 'web', started: '2026-02-07T07:30:00Z', messages: 5, status: 'idle', lastMessage: 'Monitoring DeFi yields on Aave v3...' },
];

export const MOCK_CRONS = [
  { name: 'SAM.gov Scanner', schedule: '0 */6 * * *', description: 'Scan SAM.gov for NAICS 333249, 541330, 541512 opportunities', lastRun: '2026-02-07T06:00:00Z', nextRun: '2026-02-07T12:00:00Z', status: 'success', hits: 14 },
  { name: 'DeFi Yield Monitor', schedule: '0 */4 * * *', description: 'Monitor Aave v3, Compound, and Morpho yields', lastRun: '2026-02-07T04:00:00Z', nextRun: '2026-02-07T08:00:00Z', status: 'success', hits: 7 },
  { name: 'Polymarket Sniper', schedule: '*/15 * * * *', description: 'Scan Polymarket for arbitrage and new markets', lastRun: '2026-02-07T07:45:00Z', nextRun: '2026-02-07T08:00:00Z', status: 'success', hits: 23 },
  { name: 'Airdrop Hunter', schedule: '0 7 * * *', description: 'Daily airdrop eligibility check across protocols', lastRun: '2026-02-07T07:00:00Z', nextRun: '2026-02-08T07:00:00Z', status: 'success', hits: 2 },
  { name: 'SBIR/STTR Scanner', schedule: '0 8 * * 1', description: 'Weekly scan for SBIR/STTR solicitations in robotics & automation', lastRun: '2026-02-02T08:00:00Z', nextRun: '2026-02-09T08:00:00Z', status: 'success', hits: 5 },
];

export const MOCK_AGENTS = [
  { id: 'claw', name: 'Claw', role: 'Commander', emoji: '⚡', model: 'claude-sonnet-4-5', status: 'active', description: 'Primary agent orchestrating all operations for Singh Automation' },
  { id: 'architect', name: 'The Architect', role: 'Auditor', emoji: '🏗', model: 'claude-sonnet-4-5', status: 'active', description: 'Code review, system architecture, and compliance auditing' },
  { id: 'scout', name: 'Scout', role: 'Hunter', emoji: '🔍', model: 'claude-sonnet-4-5', status: 'active', description: 'Opportunity discovery across SAM.gov, DLA, and procurement portals' },
  { id: 'sentinel', name: 'Sentinel', role: 'Monitor', emoji: '🛡', model: 'claude-sonnet-4-5', status: 'idle', description: 'Continuous monitoring of DeFi positions, markets, and alerts' },
];

export const MOCK_SKILLS = [
  { name: 'RFP Generator', confidence: 94, category: 'GovCon', description: 'Generates compliant RFP responses using FAR/DFARS templates', status: 'production', lastUsed: '2026-02-07T05:30:00Z', doc: '# RFP Generator\n\n## Overview\nAutomated RFP response generation for federal procurement.\n\n## Capabilities\n- FAR/DFARS compliance checking\n- Past performance narrative generation\n- Technical approach writing\n- Cost volume estimation\n- Section L/M response mapping\n\n## Performance\n- 94% compliance score on test submissions\n- Average generation time: 12 minutes\n- Supports NAICS: 333249, 541330, 541512, 541715\n\n## Usage\nclaw rfp generate --solicitation W912DY-25-R-0042' },
  { name: 'DeFi Rebalancer', confidence: 87, category: 'DeFi', description: 'Monitors and rebalances DeFi positions across protocols', status: 'beta', lastUsed: '2026-02-07T04:00:00Z', doc: '# DeFi Rebalancer\n\n## Overview\nAutomated yield optimization across DeFi protocols.\n\n## Supported Protocols\n- Aave v3 (Ethereum, Arbitrum)\n- Compound v3\n- Morpho Blue\n- Lido stETH\n\n## Strategy\n- Risk-adjusted yield targeting\n- Gas-optimized rebalancing\n- Slippage protection (0.5% max)\n- Emergency exit triggers\n\n## Performance\n- 87% accuracy on yield predictions\n- Average APY improvement: 2.3%\n- Max drawdown protection: 5%' },
  { name: 'Polymarket Sniper', confidence: 91, category: 'Trading', description: 'Identifies and executes Polymarket arbitrage opportunities', status: 'production', lastUsed: '2026-02-07T07:45:00Z', doc: '# Polymarket Sniper\n\n## Overview\nReal-time Polymarket opportunity detection and execution.\n\n## Capabilities\n- New market detection (< 5min latency)\n- Cross-market arbitrage identification\n- Sentiment analysis correlation\n- Automated limit order placement\n\n## Performance\n- 91% win rate on snipe entries\n- Average ROI per trade: 8.2%\n- Markets tracked: 847\n- Daily scans: 96 (every 15min)' },
  { name: 'SBIR Matcher', confidence: 89, category: 'GovCon', description: 'Matches SBIR/STTR solicitations to company capabilities', status: 'production', lastUsed: '2026-02-02T08:00:00Z', doc: '# SBIR Matcher\n\n## Overview\nIntelligent matching of SBIR/STTR opportunities to Singh Automation capabilities.\n\n## Matching Criteria\n- NAICS code alignment\n- Technical keyword matching\n- Past performance relevance\n- Budget range compatibility\n- Agency preference scoring\n\n## Performance\n- 89% relevance accuracy\n- Covers DoD, DOE, NASA, NSF\n- Weekly scan of 200+ solicitations\n- Auto-generates capability statements' },
];

export const MOCK_LOGS = [
  '[2026-02-07 08:00:01] [INFO] Gateway started on :18789',
  '[2026-02-07 08:00:02] [INFO] Agent claw loaded (claude-sonnet-4-5)',
  '[2026-02-07 08:00:02] [INFO] Channels: discord, telegram, web',
  '[2026-02-07 08:00:03] [INFO] Cron: SAM.gov Scanner registered (every 6h)',
  '[2026-02-07 08:00:03] [INFO] Cron: DeFi Yield Monitor registered (every 4h)',
  '[2026-02-07 08:00:03] [INFO] Cron: Polymarket Sniper registered (every 15m)',
  '[2026-02-07 08:00:03] [INFO] Cron: Airdrop Hunter registered (daily 7AM)',
  '[2026-02-07 08:00:04] [INFO] WebSocket server ready',
  '[2026-02-07 08:00:05] [INFO] 4 agents online: claw, architect, scout, sentinel',
  '[2026-02-07 08:01:00] [INFO] [cron] SAM.gov Scanner triggered',
  '[2026-02-07 08:01:15] [INFO] [sam] Found 3 new opportunities for NAICS 333249',
  '[2026-02-07 08:01:16] [INFO] [sam] Found 1 new opportunity for NAICS 541512',
  '[2026-02-07 08:05:00] [INFO] [cron] Polymarket Sniper triggered',
  '[2026-02-07 08:05:02] [INFO] [polymarket] Scanning 847 active markets',
  '[2026-02-07 08:05:08] [INFO] [polymarket] Found 2 arbitrage opportunities',
  '[2026-02-07 08:10:00] [INFO] Session sess_001 started (discord)',
  '[2026-02-07 08:10:01] [INFO] [claw] Processing user request: SAM.gov scan results',
  '[2026-02-07 08:15:00] [INFO] [cron] Polymarket Sniper triggered',
  '[2026-02-07 08:15:03] [INFO] [polymarket] No new opportunities detected',
  '[2026-02-07 08:20:00] [INFO] Session sess_002 started (telegram)',
];

export const MOCK_TASKS = {
  queued: [
    { id: 't1', title: 'DLA Contract Analysis', desc: 'Analyze 3 new DLA welding equipment solicitations', priority: 'high', agent: 'scout', momentum: 0 },
    { id: 't2', title: 'SBIR Phase II Draft', desc: 'Draft Phase II proposal for DoD robotics integration SBIR', priority: 'medium', agent: 'claw', momentum: 0 },
  ],
  active: [
    { id: 't3', title: 'SAM.gov NAICS 333249 Scan', desc: 'Scanning for industrial machinery manufacturing opportunities', priority: 'high', agent: 'scout', momentum: 72, started: '2026-02-07T08:01:00Z' },
    { id: 't4', title: 'Aave v3 Yield Optimization', desc: 'Rebalancing ETH/USDC positions for optimal APY', priority: 'medium', agent: 'sentinel', momentum: 45, started: '2026-02-07T04:00:00Z' },
    { id: 't5', title: 'Polymarket Arbitrage Scan', desc: 'Cross-referencing 847 active markets for mispricing', priority: 'low', agent: 'claw', momentum: 88, started: '2026-02-07T07:45:00Z' },
  ],
  done: [
    { id: 't6', title: 'Navy Reentry Weld Proposal', desc: 'Completed N00024-25-R-WELD proposal for naval welding contract', priority: 'critical', agent: 'claw', momentum: 100, completed: '2026-02-07T05:30:00Z' },
    { id: 't7', title: 'Weekly SBIR/STTR Report', desc: 'Generated summary of 5 matching solicitations', priority: 'medium', agent: 'scout', momentum: 100, completed: '2026-02-02T08:45:00Z' },
    { id: 't8', title: 'DeFi Portfolio Snapshot', desc: 'Daily portfolio rebalance across Aave, Compound, Morpho', priority: 'low', agent: 'sentinel', momentum: 100, completed: '2026-02-07T04:30:00Z' },
  ],
};

export const MOCK_FINANCE = {
  daily: { spent: 0.47, cap: 5.00 },
  weekly: [0.52, 0.38, 0.61, 0.44, 0.55, 0.39, 0.47],
  weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  monthly: { spent: 12.80, projected: 14.50, cap: 150.00 },
  perTask: 0.50,
  categories: [
    { name: 'SAM.gov Scanning', amount: 3.20, pct: 25, color: 'accent' },
    { name: 'Proposal Generation', amount: 4.10, pct: 32, color: 'purple' },
    { name: 'DeFi Monitoring', amount: 2.40, pct: 19, color: 'green' },
    { name: 'Polymarket Trading', amount: 1.80, pct: 14, color: 'cyan' },
    { name: 'System & Misc', amount: 1.30, pct: 10, color: 'amber' },
  ],
  rules: [
    { rule: 'Daily spend cap', value: '$5.00/day', status: 'active' },
    { rule: 'Per-task limit', value: '$0.50/task', status: 'active' },
    { rule: 'Monthly budget', value: '$150.00/month', status: 'active' },
    { rule: 'Alert threshold', value: '80% of daily cap', status: 'active' },
    { rule: 'Emergency stop', value: '$10.00/day hard limit', status: 'standby' },
  ],
};

export const MOCK_DOCUMENTS = [
  { id: 'd1', name: 'N00024-25-R-WELD_Singh_Proposal.pdf', status: 'analyzed', pages: 24, insights: 12, uploaded: '2026-02-06', category: 'Proposal' },
  { id: 'd2', name: 'Leidos_Teaming_Outreach.pdf', status: 'analyzed', pages: 8, insights: 5, uploaded: '2026-02-05', category: 'Teaming' },
  { id: 'd3', name: 'FANUC_Certification_2025.pdf', status: 'processing', pages: 16, insights: 0, uploaded: '2026-02-07', category: 'Certification' },
  { id: 'd4', name: 'DLA_Welding_Requirements_Spec.pdf', status: 'queued', pages: 42, insights: 0, uploaded: '2026-02-07', category: 'Requirements' },
  { id: 'd5', name: 'Singh_Capability_Statement.pdf', status: 'analyzed', pages: 4, insights: 8, uploaded: '2026-01-28', category: 'Marketing' },
];
