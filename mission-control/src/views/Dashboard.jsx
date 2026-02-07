import React from 'react';

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function LogLine({ line }) {
  const cls = line.includes('ERR') ? 'l-e' : line.includes('WARN') ? 'l-w' : 'l-i';
  const m = line.match(/^\[([^\]]+)\]/);
  if (!m) return <div className={cls}>{line}</div>;
  return <div><span className="l-t">[{m[1]}]</span> <span className={cls}>{line.slice(m[0].length + 1)}</span></div>;
}

export default function Dashboard({ gw }) {
  const d = gw.dashboard;
  const live = gw.isLive;
  const logs = gw.logs;

  const spend = [0.52, 0.38, 0.61, 0.44, 0.55, 0.39, 0.47];
  const mx = Math.max(...spend);

  return (
    <>
      {/* ── Gateway status banner ───────────────────────────────────────── */}
      <div
        className="g-card glow mb24"
        style={{
          background: live
            ? 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, var(--card) 100%)'
            : 'linear-gradient(135deg, rgba(248,113,113,0.06) 0%, var(--card) 100%)',
          borderColor: live ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
        }}
      >
        <div className="fx aic jcb">
          <div className="fx aic gap12">
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: live
                ? 'linear-gradient(135deg, var(--green), #059669)'
                : 'linear-gradient(135deg, var(--red), #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, boxShadow: live
                ? '0 0 30px rgba(52,211,153,0.3)'
                : '0 0 30px rgba(248,113,113,0.3)',
            }}>
              {live ? '⚡' : '⏸'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bright)' }}>
                {d.agent?.name || 'Claw'} — {live ? 'Online' : 'Offline'}
              </div>
              <div className="mono fs11 dim" style={{ marginTop: 2 }}>
                {d.agent?.model || 'claude-sonnet-4-5'} via {d.agent?.provider || 'anthropic'}
              </div>
              <div className="mono fs10 dim" style={{ marginTop: 2 }}>
                Channels: {(d.agent?.channels || []).join(' · ')}
              </div>
            </div>
          </div>
          <div className="fx gap16">
            <div style={{ textAlign: 'right' }}>
              <div className="fs10 dim">UPTIME</div>
              <div className="mono fw7 bright" style={{ fontSize: 14 }}>{d.uptime || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="fs10 dim">GATEWAY</div>
              <div className="mono fw7" style={{ fontSize: 14, color: live ? 'var(--green)' : 'var(--red)' }}>
                {d.gateway?.status || 'offline'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="fs10 dim">WS</div>
              <div className="mono fw7" style={{ fontSize: 14, color: d.gateway?.wsConnected ? 'var(--green)' : 'var(--dim)' }}>
                {d.gateway?.wsConnected ? 'connected' : 'disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="g4 mb24">
        <div className="g-card">
          <div className="stat-lbl">Active Sessions</div>
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{d.sessions?.active ?? 0}</div>
          <div className="stat-sub dim">{d.sessions?.total ?? 0} total</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Tokens Today</div>
          <div className="stat-val" style={{ color: 'var(--cyan)' }}>{fmt(d.tokens?.today ?? 0)}</div>
          <div className="stat-sub dim">{fmt(d.tokens?.total ?? 0)} lifetime</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Daily Spend</div>
          <div className="stat-val" style={{ color: 'var(--green)' }}>$0.47</div>
          <div className="stat-sub" style={{ color: 'var(--green)' }}>9.4% of $5.00 cap</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Agents Online</div>
          <div className="stat-val" style={{ color: 'var(--purple)' }}>4</div>
          <div className="stat-sub dim">claw · architect · scout · sentinel</div>
        </div>
      </div>

      {/* ── Chart + Log ─────────────────────────────────────────────────── */}
      <div className="g2 mb24">
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Weekly Spend</span>
            <span className="tag tag-g">${spend.reduce((a, b) => a + b, 0).toFixed(2)}</span>
          </div>
          <div className="bars">
            {spend.map((v, i) => <div key={i} className="bar" style={{ height: `${(v / mx) * 100}%` }} title={`$${v.toFixed(2)}`} />)}
          </div>
          <div className="bar-labels">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Gateway Log</span>
            <span className="tag tag-b">{logs.length}</span>
          </div>
          <div className="log-box">
            {logs.slice(-16).map((l, i) => <LogLine key={i} line={l} />)}
          </div>
        </div>
      </div>

      {/* ── Gateway details ─────────────────────────────────────────────── */}
      <div className="g-card">
        <div className="g-card-head">
          <span className="g-card-title">Gateway Connection</span>
          <span className={`tag ${live ? 'tag-g' : 'tag-r'}`}>{d.gateway?.status || 'offline'}</span>
        </div>
        <div className="g3">
          <div>
            <div className="fs10 dim">Endpoint</div>
            <div className="mono fs12">{d.gateway?.url || 'ws://127.0.0.1:18789/ws'}</div>
          </div>
          <div>
            <div className="fs10 dim">WebSocket RPC</div>
            <div className="mono fs12">{d.gateway?.wsConnected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div>
            <div className="fs10 dim">WS Messages</div>
            <div className="mono fs12">{d.wsMessages ?? 0} received</div>
          </div>
        </div>
      </div>
    </>
  );
}
