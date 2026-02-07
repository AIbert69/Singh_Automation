import React, { useState } from 'react';
import { MOCK_CHAT } from '../data/mock.js';

const AG_BG = {
  claw:      'linear-gradient(135deg, var(--accent), var(--purple))',
  architect: 'linear-gradient(135deg, var(--amber), #b45309)',
  scout:     'linear-gradient(135deg, var(--cyan), #0891b2)',
  sentinel:  'linear-gradient(135deg, var(--green), #059669)',
};

export default function AgentHub({ gw }) {
  const { agents, sessions } = gw;
  const [tab, setTab] = useState('agents');

  return (
    <>
      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="tabs">
        {['agents', 'sessions', 'chat'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {t === 'agents' ? `Agents (${agents.length})` : t === 'sessions' ? `Sessions (${sessions.length})` : 'Agent Chat'}
          </button>
        ))}
      </div>

      {/* ── Agents tab ──────────────────────────────────────────────────── */}
      {tab === 'agents' && (
        <div className="ag-grid">
          {agents.map(a => (
            <div className="ag-card" key={a.id}>
              <div className="ag-icon">{a.icon || a.emoji || '⚡'}</div>
              <div className="fx aic gap8">
                <span className="ag-name">{a.name}</span>
                <span className={`tag ${a.status === 'active' ? 'tag-g' : 'tag-a'}`}>{a.status}</span>
              </div>
              <div className="ag-role">{a.role} {a.icon || a.emoji || ''}</div>
              <div className="ag-desc">{a.desc || a.description || ''}</div>
              <div className="ag-model">{a.model || 'claude-sonnet-4-5'}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sessions tab ────────────────────────────────────────────────── */}
      {tab === 'sessions' && (
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Live Sessions</span>
            <span className="tag tag-g">{sessions.filter(s => s.status === 'active').length} active</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Agent</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Msgs</th>
                  <th>Started</th>
                  <th>Last Message</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td className="mono fs10 dim">{s.id}</td>
                    <td className="fw6 bright">{s.agentId}</td>
                    <td><span className="tag tag-b">{s.type}</span></td>
                    <td><span className={`tag ${s.status === 'active' ? 'tag-g' : 'tag-a'}`}>{s.status}</span></td>
                    <td className="mono">{s.messages}</td>
                    <td className="mono fs10">{new Date(s.started).toLocaleTimeString()}</td>
                    <td className="fs10 dim" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.lastMessage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Chat tab ────────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Agent Chat Log</span>
            <span className="tag tag-b">{MOCK_CHAT.length} messages</span>
          </div>
          <div className="chat-box">
            {MOCK_CHAT.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from === 'user' ? 'usr' : 'agt'}`}>
                <div className="chat-who">{m.from === 'user' ? 'You' : m.from} · {m.time}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
