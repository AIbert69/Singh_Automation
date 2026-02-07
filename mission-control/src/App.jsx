import React, { useState } from 'react';
import { useGateway } from './hooks/useGateway.js';
import Dashboard from './views/Dashboard.jsx';
import Workshop from './views/Workshop.jsx';
import Finance from './views/Finance.jsx';
import CronJobs from './views/CronJobs.jsx';
import SkillScout from './views/SkillScout.jsx';
import DocuDigest from './views/DocuDigest.jsx';
import AgentHub from './views/AgentHub.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈', badge: null },
  { id: 'workshop', label: 'Workshop', icon: '⚒', badge: '5' },
  { id: 'finance', label: 'Finance', icon: '◎', badge: null },
  { id: 'crons', label: 'Cron Jobs', icon: '⏱', badge: '5' },
  { id: 'skills', label: 'Skill Scout', icon: '◆', badge: '4' },
  { id: 'docs', label: 'Docu Digest', icon: '▤', badge: null },
  { id: 'agents', label: 'Agent Hub', icon: '◉', badge: '4' },
];

const VIEWS = {
  dashboard: Dashboard,
  workshop: Workshop,
  finance: Finance,
  crons: CronJobs,
  skills: SkillScout,
  docs: DocuDigest,
  agents: AgentHub,
};

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const gateway = useGateway();

  const ViewComponent = VIEWS[activeView];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">MC</div>
            <div>
              <div className="sidebar-logo-text">Mission Control</div>
              <div className="sidebar-subtitle">Singh Automation</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Operations</div>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            v0.9.2 • {gateway.isLive ? 'CONNECTED' : 'MOCK DATA'}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <span className="topbar-title">
            {NAV_ITEMS.find(n => n.id === activeView)?.icon}{' '}
            {NAV_ITEMS.find(n => n.id === activeView)?.label}
          </span>
          <div className="flex items-center gap-12">
            {gateway.lastUpdate && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Updated {gateway.lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <div className={`status-badge ${gateway.isLive ? 'live' : 'offline'}`}>
              <span className={`status-dot ${gateway.isLive ? 'live' : 'offline'}`} />
              {gateway.isLive ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </header>
        <div className="view-container">
          <ViewComponent gateway={gateway} />
        </div>
      </main>
    </div>
  );
}
