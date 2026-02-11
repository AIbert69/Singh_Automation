import React, { useState } from 'react';
import { useGateway } from './hooks/useGateway.js';
import Dashboard from './views/Dashboard.jsx';
import Workshop from './views/Workshop.jsx';
import Finance from './views/Finance.jsx';
import CronJobs from './views/CronJobs.jsx';
import SkillScout from './views/SkillScout.jsx';
import DocuDigest from './views/DocuDigest.jsx';
import AgentHub from './views/AgentHub.jsx';
import './App.css';

const NAV = [
  { id: 'dash',   label: 'Dashboard',  icon: '◈' },
  { id: 'work',   label: 'Workshop',   icon: '⚒' },
  { id: 'fin',    label: 'Finance',    icon: '◎' },
  { id: 'crons',  label: 'Cron Jobs',  icon: '⏱' },
  { id: 'skills', label: 'Skill Scout',icon: '◆' },
  { id: 'docs',   label: 'Docu Digest',icon: '▤' },
  { id: 'agents', label: 'Agent Hub',  icon: '◉' },
];

const VIEW_MAP = {
  dash: Dashboard, work: Workshop, fin: Finance,
  crons: CronJobs, skills: SkillScout, docs: DocuDigest, agents: AgentHub,
};

export default function App() {
  const [view, setView] = useState('dash');
  const gw = useGateway();
  const View = VIEW_MAP[view];
  const navItem = NAV.find(n => n.id === view);

  return (
    <div className="oc-root">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="oc-sidebar">
        <div className="oc-sidebar-brand">
          <div className="oc-logo">
            <span className="oc-logo-claw">🦀</span>
          </div>
          <div>
            <div className="oc-brand-name">OpenClaw</div>
            <div className="oc-brand-sub">Mission Control</div>
          </div>
        </div>

        <nav className="oc-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`oc-nav-btn${view === n.id ? ' active' : ''}`}
              onClick={() => setView(n.id)}
            >
              <span className="oc-nav-icon">{n.icon}</span>
              <span className="oc-nav-label">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="oc-sidebar-footer">
          <div className={`oc-gw-indicator ${gw.isLive ? 'live' : 'off'}`}>
            <span className="oc-gw-dot" />
            <span>{gw.isLive ? 'Gateway Connected' : 'Gateway Offline'}</span>
          </div>
          <div className="oc-sidebar-meta">
            ws://127.0.0.1:18789
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="oc-main">
        <header className="oc-topbar">
          <div className="oc-topbar-left">
            <span className="oc-topbar-icon">{navItem?.icon}</span>
            <span className="oc-topbar-title">{navItem?.label}</span>
          </div>
          <div className="oc-topbar-right">
            {gw.lastPoll && (
              <span className="oc-topbar-time">
                {gw.lastPoll.toLocaleTimeString()}
              </span>
            )}
            <div className={`oc-status-pill ${gw.isLive ? 'live' : 'off'}`}>
              <span className="oc-status-dot" />
              {gw.isLive ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        <div className="oc-view">
          <View gw={gw} />
        </div>
      </main>
    </div>
  );
}
