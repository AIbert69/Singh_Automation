import React, { useState } from 'react';

const AGENT_COLORS = {
  claw: 'linear-gradient(135deg, var(--accent), var(--purple))',
  architect: 'linear-gradient(135deg, var(--amber), #d97706)',
  scout: 'linear-gradient(135deg, var(--cyan), #0891b2)',
  sentinel: 'linear-gradient(135deg, var(--green), #059669)',
};

const MOCK_CHAT = [
  { sender: 'user', text: 'Scan SAM.gov for new welding contracts', time: '08:10' },
  { sender: 'claw', text: 'Initiating SAM.gov scan for NAICS 333249, 541330, 541512...', time: '08:10' },
  { sender: 'claw', text: 'Found 3 new opportunities matching your profile:\n1. W912DY-26-R-0042 — Army Welding Services ($2.4M)\n2. N00024-26-R-WELD — Navy Hull Repair ($1.8M)\n3. FA8601-26-R-0015 — Air Force Maintenance ($950K)', time: '08:11' },
  { sender: 'user', text: 'Generate a proposal for the Navy one', time: '08:12' },
  { sender: 'claw', text: 'Generating RFP response for N00024-26-R-WELD using Singh Automation capabilities...\n\nSections being drafted:\n- Technical Approach (FANUC integration)\n- Past Performance (3 relevant contracts)\n- Cost Volume ($1.2M estimate)\n- Compliance Matrix (FAR/DFARS)', time: '08:12' },
  { sender: 'claw', text: 'Proposal draft complete. 24 pages, 94% compliance score. Saved to /proposals/N00024-26-R-WELD_Singh_Proposal.md', time: '08:15' },
  { sender: 'user', text: 'Check DeFi positions', time: '08:16' },
  { sender: 'sentinel', text: 'Current DeFi positions:\n- Aave v3 USDC: $12,400 @ 4.2% APY\n- Compound ETH: $8,200 @ 3.8% APY\n- Morpho Blue: $5,100 @ 5.1% APY\n\nTotal value: $25,700 | Avg APY: 4.3%', time: '08:16' },
];

export default function AgentHub({ gateway }) {
  const { agents, sessions } = gateway;
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div>
      {/* Tabs */}
      <div className="tabs mb-24" style={{ margin: '0 -24px', padding: '0 24px' }}>
        <div className={`tab ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
          Agents ({agents.length})
        </div>
        <div className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
          Sessions ({sessions.length})
        </div>
        <div className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          Agent Chat
        </div>
      </div>

      {activeTab === 'agents' && (
        <div className="agent-grid">
          {agents.map((agent) => (
            <div className="agent-card" key={agent.id}>
              <div className="agent-avatar" style={{ background: AGENT_COLORS[agent.id] || AGENT_COLORS.claw }}>
                {agent.emoji}
              </div>
              <div className="flex items-center gap-8">
                <span className="agent-name">{agent.name}</span>
                <span className={`tag ${agent.status === 'active' ? 'tag-green' : 'tag-amber'}`}>
                  {agent.status}
                </span>
              </div>
              <div className="agent-role">{agent.role} {agent.emoji}</div>
              <div className="agent-desc">{agent.description}</div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {agent.model || 'claude-sonnet-4-5'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Sessions</span>
            <span className="tag tag-green">{sessions.filter(s => s.status === 'active').length} active</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Agent</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Messages</th>
                  <th>Started</th>
                  <th>Last Message</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{sess.id}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-bright)' }}>{sess.agentId}</td>
                    <td>
                      <span className="tag tag-accent">{sess.type}</span>
                    </td>
                    <td>
                      <span className={`tag ${sess.status === 'active' ? 'tag-green' : 'tag-amber'}`}>
                        {sess.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sess.messages}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {new Date(sess.started).toLocaleTimeString()}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sess.lastMessage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Agent Chat Log</span>
            <span className="tag tag-accent">{MOCK_CHAT.length} messages</span>
          </div>
          <div className="chat-log">
            {MOCK_CHAT.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.sender === 'user' ? 'user' : 'agent'}`}>
                <div className="chat-msg-sender" style={{
                  color: msg.sender === 'user' ? 'var(--green)' : 'var(--accent)',
                }}>
                  {msg.sender === 'user' ? 'You' : msg.sender} • {msg.time}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
