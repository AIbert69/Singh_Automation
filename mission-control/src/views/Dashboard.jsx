import React from 'react';

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function LogLine({ line }) {
  let cls = '';
  if (line.includes('[INFO]')) cls = 'log-info';
  else if (line.includes('[WARN]')) cls = 'log-warn';
  else if (line.includes('[ERROR]')) cls = 'log-error';

  const timeMatch = line.match(/^\[([^\]]+)\]/);
  if (timeMatch) {
    const rest = line.slice(timeMatch[0].length);
    return (
      <div>
        <span className="log-time">[{timeMatch[1]}]</span>
        <span className={cls}>{rest}</span>
      </div>
    );
  }
  return <div className={cls}>{line}</div>;
}

export default function Dashboard({ gateway }) {
  const { dashboard, logs, isLive } = gateway;
  const d = dashboard;

  const spendData = [0.52, 0.38, 0.61, 0.44, 0.55, 0.39, 0.47];
  const maxSpend = Math.max(...spendData);

  return (
    <div>
      {/* Status banner */}
      <div
        className="card card-glow mb-24"
        style={{
          background: isLive
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(16, 16, 22, 1))'
            : 'linear-gradient(135deg, rgba(248, 113, 113, 0.08), rgba(16, 16, 22, 1))',
          borderColor: isLive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: isLive
                  ? 'linear-gradient(135deg, var(--green), #059669)'
                  : 'linear-gradient(135deg, var(--red), #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              {isLive ? '⚡' : '⏸'}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-bright)' }}>
                {d.agent?.name || 'Claw'} — {isLive ? 'Online' : 'Offline Mode'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {d.agent?.model} • {d.agent?.provider} • {d.agent?.channels?.join(', ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Uptime</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-bright)' }}>
                {d.uptime || '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Version</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-bright)' }}>
                {d.version || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-24">
        <div className="card">
          <div className="card-subtitle">Active Sessions</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{d.sessions?.active || 0}</div>
          <div className="stat-label">{d.sessions?.total || 0} total</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Tokens Today</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{formatNumber(d.tokens?.today || 0)}</div>
          <div className="stat-label">{formatNumber(d.tokens?.total || 0)} lifetime</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Daily Spend</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>$0.47</div>
          <div className="stat-change up">↑ 9.4% of $5.00 cap</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Agents Online</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>4</div>
          <div className="stat-label">claw, architect, scout, sentinel</div>
        </div>
      </div>

      {/* Charts + Logs row */}
      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Spend</span>
            <span className="tag tag-green">$3.36 total</span>
          </div>
          <div className="chart-bars">
            {spendData.map((val, i) => (
              <div
                key={i}
                className="chart-bar"
                style={{ height: `${(val / maxSpend) * 100}%` }}
                title={`$${val.toFixed(2)}`}
              />
            ))}
          </div>
          <div className="chart-labels">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <span key={i} className="chart-label">{d}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Gateway Log</span>
            <span className="tag tag-accent">{logs.length} entries</span>
          </div>
          <div className="log-viewer">
            {logs.slice(-15).map((line, i) => (
              <LogLine key={i} line={line} />
            ))}
          </div>
        </div>
      </div>

      {/* Gateway info */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Gateway Details</span>
          <span className={`tag ${d.gateway?.status === 'online' ? 'tag-green' : 'tag-red'}`}>
            {d.gateway?.status || 'offline'}
          </span>
        </div>
        <div className="grid-3">
          <div>
            <div className="text-xs text-muted">Host</div>
            <div className="text-mono text-sm">{d.gateway?.host || '127.0.0.1'}:{d.gateway?.port || 18789}</div>
          </div>
          <div>
            <div className="text-xs text-muted">WebSocket</div>
            <div className="text-mono text-sm">{d.gateway?.connected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Channels</div>
            <div className="text-mono text-sm">{d.agent?.channels?.join(', ') || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
