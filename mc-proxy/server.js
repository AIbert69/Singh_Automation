import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';

const PORT = 3001;
const OPENCLAW_HOST = '127.0.0.1';
const OPENCLAW_PORT = 18789;
const HOME = process.env.HOME || '/root';
const OPENCLAW_DIR = path.join(HOME, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_DIR, 'openclaw.json');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const LOG_DIR = '/tmp/openclaw';

// ── State ──────────────────────────────────────────────────────────────────────
let gatewayConnected = false;
let gatewayWs = null;
let config = null;
let lastGatewayCheck = 0;

// ── Config loader ──────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = JSON.parse(raw);
      return config;
    }
  } catch (e) {
    console.error('[mc-proxy] Failed to load config:', e.message);
  }
  return null;
}

function getToken() {
  const c = loadConfig();
  return c?.token || c?.auth?.token || null;
}

// ── WebSocket to Gateway ───────────────────────────────────────────────────────
function connectGateway() {
  const token = getToken();
  if (!token) {
    gatewayConnected = false;
    return;
  }
  try {
    const wsUrl = `ws://${OPENCLAW_HOST}:${OPENCLAW_PORT}/ws`;
    gatewayWs = new WebSocket(wsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    gatewayWs.on('open', () => {
      gatewayConnected = true;
      console.log('[mc-proxy] Connected to OpenClaw Gateway WebSocket');
    });
    gatewayWs.on('close', () => {
      gatewayConnected = false;
      console.log('[mc-proxy] Gateway WebSocket closed');
      setTimeout(connectGateway, 5000);
    });
    gatewayWs.on('error', (err) => {
      gatewayConnected = false;
      console.error('[mc-proxy] Gateway WS error:', err.message);
    });
  } catch (e) {
    gatewayConnected = false;
  }
}

// ── Health check ───────────────────────────────────────────────────────────────
async function checkGatewayHealth() {
  try {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`http://${OPENCLAW_HOST}:${OPENCLAW_PORT}/`, { headers, signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── File readers ───────────────────────────────────────────────────────────────
function readSessions() {
  const sessions = [];
  try {
    if (!fs.existsSync(AGENTS_DIR)) return sessions;
    const agents = fs.readdirSync(AGENTS_DIR);
    for (const agentId of agents) {
      const sessDir = path.join(AGENTS_DIR, agentId, 'sessions');
      if (!fs.existsSync(sessDir)) continue;
      const files = fs.readdirSync(sessDir);
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(sessDir, f), 'utf-8');
          const data = JSON.parse(raw);
          sessions.push({ agentId, ...data });
        } catch { /* skip bad files */ }
      }
    }
  } catch (e) {
    console.error('[mc-proxy] readSessions error:', e.message);
  }
  return sessions;
}

function readSkills() {
  const skills = [];
  try {
    if (!fs.existsSync(AGENTS_DIR)) return skills;
    const agents = fs.readdirSync(AGENTS_DIR);
    for (const agentId of agents) {
      const skillsDir = path.join(AGENTS_DIR, agentId, 'workspace', 'skills');
      if (!fs.existsSync(skillsDir)) continue;
      const files = fs.readdirSync(skillsDir);
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(skillsDir, f), 'utf-8');
          skills.push({ agentId, file: f, content: raw });
        } catch { /* skip */ }
      }
    }
  } catch (e) {
    console.error('[mc-proxy] readSkills error:', e.message);
  }
  return skills;
}

function readLogs(lines = 200) {
  const logs = [];
  try {
    if (!fs.existsSync(LOG_DIR)) return logs;
    const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log')).sort().reverse();
    for (const f of files.slice(0, 5)) {
      try {
        const raw = fs.readFileSync(path.join(LOG_DIR, f), 'utf-8');
        const allLines = raw.split('\n').filter(Boolean);
        logs.push(...allLines.slice(-lines));
      } catch { /* skip */ }
    }
  } catch (e) {
    console.error('[mc-proxy] readLogs error:', e.message);
  }
  return logs.slice(-lines);
}

// ── Mock data (offline fallback) ───────────────────────────────────────────────
const MOCK = {
  dashboard: {
    gateway: { status: 'offline', host: OPENCLAW_HOST, port: OPENCLAW_PORT },
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
  },
  sessions: [
    { id: 'sess_001', agentId: 'claw', type: 'discord', started: '2026-02-07T08:15:00Z', messages: 12, status: 'active', lastMessage: 'Scanning SAM.gov for NAICS 333249 opportunities...' },
    { id: 'sess_002', agentId: 'scout', type: 'telegram', started: '2026-02-07T06:00:00Z', messages: 8, status: 'active', lastMessage: 'Found 3 new DLA welding contracts matching profile.' },
    { id: 'sess_003', agentId: 'sentinel', type: 'web', started: '2026-02-07T07:30:00Z', messages: 5, status: 'idle', lastMessage: 'Monitoring DeFi yields on Aave v3...' },
  ],
  config: {
    name: 'Claw',
    model: 'claude-sonnet-4-5',
    provider: 'anthropic',
    channels: ['discord', 'telegram', 'web'],
    context: 'Singh Automation — FANUC robotics integrator, federal contractor, UEI: GJ1DPYQ3X8K5',
    capabilities: ['web_search', 'code_execution', 'file_management', 'api_calls'],
  },
  crons: [
    { name: 'SAM.gov Scanner', schedule: '0 */6 * * *', description: 'Scan SAM.gov for NAICS 333249, 541330, 541512 opportunities', lastRun: '2026-02-07T06:00:00Z', nextRun: '2026-02-07T12:00:00Z', status: 'success', hits: 14 },
    { name: 'DeFi Yield Monitor', schedule: '0 */4 * * *', description: 'Monitor Aave v3, Compound, and Morpho yields', lastRun: '2026-02-07T04:00:00Z', nextRun: '2026-02-07T08:00:00Z', status: 'success', hits: 7 },
    { name: 'Polymarket Sniper', schedule: '*/15 * * * *', description: 'Scan Polymarket for arbitrage and new markets', lastRun: '2026-02-07T07:45:00Z', nextRun: '2026-02-07T08:00:00Z', status: 'success', hits: 23 },
    { name: 'Airdrop Hunter', schedule: '0 7 * * *', description: 'Daily airdrop eligibility check across protocols', lastRun: '2026-02-07T07:00:00Z', nextRun: '2026-02-08T07:00:00Z', status: 'success', hits: 2 },
    { name: 'SBIR/STTR Scanner', schedule: '0 8 * * 1', description: 'Weekly scan for SBIR/STTR solicitations in robotics & automation', lastRun: '2026-02-02T08:00:00Z', nextRun: '2026-02-09T08:00:00Z', status: 'success', hits: 5 },
  ],
  agents: [
    { id: 'claw', name: 'Claw', role: 'Commander', emoji: '⚡', model: 'claude-sonnet-4-5', status: 'active', description: 'Primary agent orchestrating all operations for Singh Automation' },
    { id: 'architect', name: 'The Architect', role: 'Auditor', emoji: '🏗', model: 'claude-sonnet-4-5', status: 'active', description: 'Code review, system architecture, and compliance auditing' },
    { id: 'scout', name: 'Scout', role: 'Hunter', emoji: '🔍', model: 'claude-sonnet-4-5', status: 'active', description: 'Opportunity discovery across SAM.gov, DLA, and procurement portals' },
    { id: 'sentinel', name: 'Sentinel', role: 'Monitor', emoji: '🛡', model: 'claude-sonnet-4-5', status: 'idle', description: 'Continuous monitoring of DeFi positions, markets, and alerts' },
  ],
  skills: [
    { name: 'RFP Generator', confidence: 94, category: 'GovCon', description: 'Generates compliant RFP responses using FAR/DFARS templates', status: 'production', lastUsed: '2026-02-07T05:30:00Z', doc: '# RFP Generator\n\n## Overview\nAutomated RFP response generation for federal procurement.\n\n## Capabilities\n- FAR/DFARS compliance checking\n- Past performance narrative generation\n- Technical approach writing\n- Cost volume estimation\n- Section L/M response mapping\n\n## Performance\n- 94% compliance score on test submissions\n- Average generation time: 12 minutes\n- Supports NAICS: 333249, 541330, 541512, 541715\n\n## Usage\n```\nclaw rfp generate --solicitation W912DY-25-R-0042\n```' },
    { name: 'DeFi Rebalancer', confidence: 87, category: 'DeFi', description: 'Monitors and rebalances DeFi positions across protocols', status: 'beta', lastUsed: '2026-02-07T04:00:00Z', doc: '# DeFi Rebalancer\n\n## Overview\nAutomated yield optimization across DeFi protocols.\n\n## Supported Protocols\n- Aave v3 (Ethereum, Arbitrum)\n- Compound v3\n- Morpho Blue\n- Lido stETH\n\n## Strategy\n- Risk-adjusted yield targeting\n- Gas-optimized rebalancing\n- Slippage protection (0.5% max)\n- Emergency exit triggers\n\n## Performance\n- 87% accuracy on yield predictions\n- Average APY improvement: 2.3%\n- Max drawdown protection: 5%' },
    { name: 'Polymarket Sniper', confidence: 91, category: 'Trading', description: 'Identifies and executes Polymarket arbitrage opportunities', status: 'production', lastUsed: '2026-02-07T07:45:00Z', doc: '# Polymarket Sniper\n\n## Overview\nReal-time Polymarket opportunity detection and execution.\n\n## Capabilities\n- New market detection (< 5min latency)\n- Cross-market arbitrage identification\n- Sentiment analysis correlation\n- Automated limit order placement\n\n## Performance\n- 91% win rate on snipe entries\n- Average ROI per trade: 8.2%\n- Markets tracked: 847\n- Daily scans: 96 (every 15min)' },
    { name: 'SBIR Matcher', confidence: 89, category: 'GovCon', description: 'Matches SBIR/STTR solicitations to company capabilities', status: 'production', lastUsed: '2026-02-02T08:00:00Z', doc: '# SBIR Matcher\n\n## Overview\nIntelligent matching of SBIR/STTR opportunities to Singh Automation capabilities.\n\n## Matching Criteria\n- NAICS code alignment\n- Technical keyword matching\n- Past performance relevance\n- Budget range compatibility\n- Agency preference scoring\n\n## Performance\n- 89% relevance accuracy\n- Covers DoD, DOE, NASA, NSF\n- Weekly scan of 200+ solicitations\n- Auto-generates capability statements' },
  ],
  logs: [
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
  ],
};

// ── Route handlers ─────────────────────────────────────────────────────────────
async function handleDashboard() {
  const live = await checkGatewayHealth();
  const c = loadConfig();
  const sessions = readSessions();

  if (live && c) {
    return {
      success: true,
      live: true,
      data: {
        gateway: { status: 'online', host: OPENCLAW_HOST, port: OPENCLAW_PORT, connected: gatewayConnected },
        agent: {
          name: c.name || c.agent?.name || MOCK.dashboard.agent.name,
          model: c.model || c.agent?.model || MOCK.dashboard.agent.model,
          provider: c.provider || c.agent?.provider || MOCK.dashboard.agent.provider,
          channels: c.channels || c.agent?.channels || MOCK.dashboard.agent.channels,
        },
        sessions: { active: sessions.length || MOCK.dashboard.sessions.active, total: MOCK.dashboard.sessions.total },
        tokens: MOCK.dashboard.tokens,
        uptime: MOCK.dashboard.uptime,
        version: c.version || MOCK.dashboard.version,
      },
    };
  }

  return { success: true, live: false, data: MOCK.dashboard };
}

function handleSessions() {
  const sessions = readSessions();
  if (sessions.length > 0) {
    return { success: true, live: true, data: sessions };
  }
  return { success: true, live: false, data: MOCK.sessions };
}

function handleConfig() {
  const c = loadConfig();
  if (c) {
    // Sanitize: strip tokens
    const sanitized = { ...c };
    delete sanitized.token;
    delete sanitized.auth;
    delete sanitized.api_key;
    delete sanitized.apiKey;
    return { success: true, live: true, data: sanitized };
  }
  return { success: true, live: false, data: MOCK.config };
}

function handleCrons() {
  const c = loadConfig();
  if (c?.crons && Array.isArray(c.crons) && c.crons.length > 0) {
    return { success: true, live: true, data: c.crons };
  }
  return { success: true, live: false, data: MOCK.crons };
}

function handleAgents() {
  const c = loadConfig();
  if (c?.agents && Array.isArray(c.agents) && c.agents.length > 0) {
    return { success: true, live: true, data: c.agents };
  }
  // Also check filesystem
  try {
    if (fs.existsSync(AGENTS_DIR)) {
      const dirs = fs.readdirSync(AGENTS_DIR);
      if (dirs.length > 0) {
        return { success: true, live: true, data: dirs.map(d => ({ id: d })) };
      }
    }
  } catch { /* fall through */ }
  return { success: true, live: false, data: MOCK.agents };
}

function handleSkills() {
  const skills = readSkills();
  if (skills.length > 0) {
    return { success: true, live: true, data: skills };
  }
  return { success: true, live: false, data: MOCK.skills };
}

function handleLogs() {
  const logs = readLogs();
  if (logs.length > 0) {
    return { success: true, live: true, data: logs };
  }
  return { success: true, live: false, data: MOCK.logs };
}

async function handleHealth() {
  const live = await checkGatewayHealth();
  return {
    success: true,
    data: {
      proxy: 'ok',
      gateway: live ? 'reachable' : 'unreachable',
      gatewayWs: gatewayConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  };
}

// ── HTTP Server ────────────────────────────────────────────────────────────────
const ROUTES = {
  '/api/dashboard': handleDashboard,
  '/api/sessions': handleSessions,
  '/api/config': handleConfig,
  '/api/crons': handleCrons,
  '/api/agents': handleAgents,
  '/api/skills': handleSkills,
  '/api/logs': handleLogs,
  '/api/health': handleHealth,
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = ROUTES[url.pathname];

  if (handler) {
    try {
      const result = await handler();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mc-proxy] Mission Control API running on http://0.0.0.0:${PORT}`);
  console.log(`[mc-proxy] OpenClaw config: ${CONFIG_PATH}`);
  console.log(`[mc-proxy] Attempting gateway connection...`);
  connectGateway();
});
