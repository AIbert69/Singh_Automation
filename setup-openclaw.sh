#!/bin/bash

# OpenClaw Auto-Install & Setup Script
# ========================================
# Sets up the OpenClaw directory structure, config, mc-proxy,
# and Mission Control dashboard in one command.
#
# Usage: bash setup-openclaw.sh
#
# What it does:
# 1. Creates ~/.openclaw directory with config and agent structure
# 2. Installs mc-proxy dependencies
# 3. Installs Mission Control frontend dependencies
# 4. Starts both services (mc-proxy on :3001, Mission Control on :5174)
#
# Author: Singh Automation
# Date: February 2026

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="${HOME:-/root}"
OPENCLAW_DIR="$HOME_DIR/.openclaw"
CONFIG_PATH="$OPENCLAW_DIR/openclaw.json"
AGENTS_DIR="$OPENCLAW_DIR/agents"
LOG_DIR="/tmp/openclaw"
MC_PROXY_DIR="$SCRIPT_DIR/mc-proxy"
MISSION_CTRL_DIR="$SCRIPT_DIR/mission-control"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      OpenClaw Auto-Install                               ║"
echo "║      Mission Control for Singh Automation                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Preflight checks ────────────────────────────────────────────────────────

echo -e "${CYAN}[1/6] Preflight checks...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ first: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required (found v$NODE_VERSION).${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js v$NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# Check project directories exist
if [ ! -d "$MC_PROXY_DIR" ]; then
    echo -e "${RED}Error: mc-proxy directory not found at $MC_PROXY_DIR${NC}"
    echo "Please run this script from the Singh_Automation root."
    exit 1
fi

if [ ! -d "$MISSION_CTRL_DIR" ]; then
    echo -e "${RED}Error: mission-control directory not found at $MISSION_CTRL_DIR${NC}"
    echo "Please run this script from the Singh_Automation root."
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Project directories found"

# ─── Create OpenClaw directory structure ──────────────────────────────────────

echo ""
echo -e "${CYAN}[2/6] Setting up OpenClaw directory structure...${NC}"

mkdir -p "$OPENCLAW_DIR"
mkdir -p "$AGENTS_DIR/claw/sessions"
mkdir -p "$AGENTS_DIR/claw/workspace/skills"
mkdir -p "$AGENTS_DIR/architect/sessions"
mkdir -p "$AGENTS_DIR/architect/workspace/skills"
mkdir -p "$AGENTS_DIR/scout/sessions"
mkdir -p "$AGENTS_DIR/scout/workspace/skills"
mkdir -p "$AGENTS_DIR/sentinel/sessions"
mkdir -p "$AGENTS_DIR/sentinel/workspace/skills"
mkdir -p "$LOG_DIR"

echo -e "  ${GREEN}✓${NC} Created $OPENCLAW_DIR"
echo -e "  ${GREEN}✓${NC} Created agent directories (claw, architect, scout, sentinel)"
echo -e "  ${GREEN}✓${NC} Created log directory at $LOG_DIR"

# ─── Generate config ─────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}[3/6] Generating OpenClaw configuration...${NC}"

if [ -f "$CONFIG_PATH" ]; then
    echo -e "  ${YELLOW}!${NC} Config already exists at $CONFIG_PATH — skipping"
else
    # Generate a random auth token
    AUTH_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    cat > "$CONFIG_PATH" << JSONEOF
{
  "name": "Claw",
  "version": "0.9.2",
  "model": "claude-sonnet-4-5-20250929",
  "provider": "anthropic",
  "channels": ["web"],
  "token": "${AUTH_TOKEN}",
  "context": "Singh Automation — FANUC robotics integrator, federal contractor, UEI: GJ1DPYQ3X8K5",
  "capabilities": ["web_search", "code_execution", "file_management", "api_calls"],
  "agents": [
    {
      "id": "claw",
      "name": "Claw",
      "role": "Commander",
      "emoji": "⚡",
      "model": "claude-sonnet-4-5-20250929",
      "status": "active",
      "description": "Primary agent orchestrating all operations for Singh Automation"
    },
    {
      "id": "architect",
      "name": "The Architect",
      "role": "Auditor",
      "emoji": "🏗",
      "model": "claude-sonnet-4-5-20250929",
      "status": "active",
      "description": "Code review, system architecture, and compliance auditing"
    },
    {
      "id": "scout",
      "name": "Scout",
      "role": "Hunter",
      "emoji": "🔍",
      "model": "claude-sonnet-4-5-20250929",
      "status": "active",
      "description": "Opportunity discovery across SAM.gov, DLA, and procurement portals"
    },
    {
      "id": "sentinel",
      "name": "Sentinel",
      "role": "Monitor",
      "emoji": "🛡",
      "model": "claude-sonnet-4-5-20250929",
      "status": "idle",
      "description": "Continuous monitoring of markets and alerts"
    }
  ],
  "crons": [
    {
      "name": "SAM.gov Scanner",
      "schedule": "0 */6 * * *",
      "description": "Scan SAM.gov for NAICS 333249, 541330, 541512 opportunities",
      "lastRun": null,
      "nextRun": null,
      "status": "pending",
      "hits": 0
    },
    {
      "name": "SBIR/STTR Scanner",
      "schedule": "0 8 * * 1",
      "description": "Weekly scan for SBIR/STTR solicitations in robotics & automation",
      "lastRun": null,
      "nextRun": null,
      "status": "pending",
      "hits": 0
    }
  ]
}
JSONEOF

    echo -e "  ${GREEN}✓${NC} Generated $CONFIG_PATH"
    echo -e "  ${GREEN}✓${NC} Auth token generated"
fi

# ─── Write initial skill files ────────────────────────────────────────────────

SKILL_FILE="$AGENTS_DIR/claw/workspace/skills/rfp-generator.md"
if [ ! -f "$SKILL_FILE" ]; then
    cat > "$SKILL_FILE" << 'SKILLEOF'
# RFP Generator

## Overview
Automated RFP response generation for federal procurement.

## Capabilities
- FAR/DFARS compliance checking
- Past performance narrative generation
- Technical approach writing
- Cost volume estimation
- Section L/M response mapping

## Performance
- Supports NAICS: 333249, 541330, 541512, 541715

## Usage
```
claw rfp generate --solicitation <SOLICITATION_ID>
```
SKILLEOF
    echo -e "  ${GREEN}✓${NC} Created initial skill definitions"
fi

# ─── Write initial log entry ──────────────────────────────────────────────────

LOG_FILE="$LOG_DIR/openclaw-$(date +%Y%m%d).log"
echo "[$(date -Iseconds)] [INFO] OpenClaw initialized via setup-openclaw.sh" >> "$LOG_FILE"
echo "[$(date -Iseconds)] [INFO] Config: $CONFIG_PATH" >> "$LOG_FILE"
echo "[$(date -Iseconds)] [INFO] Agents: claw, architect, scout, sentinel" >> "$LOG_FILE"
echo -e "  ${GREEN}✓${NC} Wrote initial log entry"

# ─── Install mc-proxy dependencies ────────────────────────────────────────────

echo ""
echo -e "${CYAN}[4/6] Installing mc-proxy dependencies...${NC}"

cd "$MC_PROXY_DIR"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1
    echo -e "  ${GREEN}✓${NC} mc-proxy dependencies installed"
else
    echo -e "  ${GREEN}✓${NC} mc-proxy dependencies already installed"
fi

# ─── Install Mission Control dependencies ─────────────────────────────────────

echo ""
echo -e "${CYAN}[5/6] Installing Mission Control dependencies...${NC}"

cd "$MISSION_CTRL_DIR"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1
    echo -e "  ${GREEN}✓${NC} Mission Control dependencies installed"
else
    echo -e "  ${GREEN}✓${NC} Mission Control dependencies already installed"
fi

# ─── Start services ──────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}[6/6] Starting services...${NC}"

# Kill any existing processes on the ports
if command -v lsof &> /dev/null; then
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:5174 2>/dev/null | xargs kill -9 2>/dev/null || true
elif command -v fuser &> /dev/null; then
    fuser -k 3001/tcp 2>/dev/null || true
    fuser -k 5174/tcp 2>/dev/null || true
fi

# Start mc-proxy in background
cd "$MC_PROXY_DIR"
nohup node server.js > /tmp/openclaw/mc-proxy.log 2>&1 &
MC_PROXY_PID=$!
echo -e "  ${GREEN}✓${NC} mc-proxy started (PID $MC_PROXY_PID, port 3001)"

# Start Mission Control in background
cd "$MISSION_CTRL_DIR"
nohup npx vite --host 0.0.0.0 --port 5174 > /tmp/openclaw/mission-control.log 2>&1 &
MC_FRONTEND_PID=$!
echo -e "  ${GREEN}✓${NC} Mission Control started (PID $MC_FRONTEND_PID, port 5174)"

# Wait a moment for services to come up
sleep 2

# ─── Verify ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}Verifying services...${NC}"

# Check mc-proxy
if curl -s http://127.0.0.1:3001/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} mc-proxy API responding on http://127.0.0.1:3001"
else
    echo -e "  ${YELLOW}!${NC} mc-proxy may still be starting — check /tmp/openclaw/mc-proxy.log"
fi

# Check frontend
if curl -s http://127.0.0.1:5174 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Mission Control UI responding on http://127.0.0.1:5174"
else
    echo -e "  ${YELLOW}!${NC} Mission Control may still be starting — check /tmp/openclaw/mission-control.log"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗"
echo -e "║  ✅ OpenClaw Setup Complete!                              ║"
echo -e "╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Services running:${NC}"
echo "  mc-proxy API:        http://127.0.0.1:3001"
echo "  Mission Control UI:  http://127.0.0.1:5174"
echo ""
echo -e "${BOLD}Config:${NC}  $CONFIG_PATH"
echo -e "${BOLD}Agents:${NC}  $AGENTS_DIR"
echo -e "${BOLD}Logs:${NC}    $LOG_DIR"
echo ""
echo -e "${BOLD}Process logs:${NC}"
echo "  mc-proxy:         /tmp/openclaw/mc-proxy.log"
echo "  Mission Control:  /tmp/openclaw/mission-control.log"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  kill $MC_PROXY_PID $MC_FRONTEND_PID"
echo ""
echo -e "${YELLOW}To restart later:${NC}"
echo "  bash setup-openclaw.sh"
echo ""
