import React from 'react';

const FREQ = {
  '0 */6 * * *':   'Every 6 hours',
  '0 */4 * * *':   'Every 4 hours',
  '*/15 * * * *':  'Every 15 min',
  '0 7 * * *':     'Daily 7:00 AM',
  '0 8 * * 1':     'Mon 8:00 AM',
};

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function CronJobs({ gw }) {
  const { crons, isLive } = gw;
  const hits = crons.reduce((s, c) => s + (c.hits || 0), 0);

  return (
    <>
      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="g3 mb24">
        <div className="g-card">
          <div className="stat-lbl">Scheduled Jobs</div>
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{crons.length}</div>
          <div className="stat-sub dim">{isLive ? 'from live config' : 'mock data'}</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">All Healthy</div>
          <div className="stat-val" style={{ color: 'var(--green)' }}>
            {crons.filter(c => c.status === 'success').length}/{crons.length}
          </div>
          <div className="stat-sub dim">passing</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Total Hits</div>
          <div className="stat-val" style={{ color: 'var(--cyan)' }}>{hits}</div>
          <div className="stat-sub dim">results found</div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="g-card mb24">
        <div className="g-card-head">
          <span className="g-card-title">Cron Schedule</span>
          <span className={`tag ${isLive ? 'tag-g' : 'tag-a'}`}>{isLive ? 'LIVE' : 'MOCK'}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Name</th>
                <th>Schedule</th>
                <th>Frequency</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Hits</th>
              </tr>
            </thead>
            <tbody>
              {crons.map((c, i) => (
                <tr key={i}>
                  <td><span className={`cron-dot ${c.status === 'success' ? 'ok' : c.status === 'running' ? 'run' : 'err'}`} /></td>
                  <td className="fw6 bright">{c.name}</td>
                  <td className="mono fs10 dim">{c.schedule}</td>
                  <td className="fs11">{FREQ[c.schedule] || c.schedule}</td>
                  <td className="mono fs10">{fmtTime(c.lastRun)}</td>
                  <td className="mono fs10">{fmtTime(c.nextRun)}</td>
                  <td>
                    <span className="mono fw6" style={{ color: (c.hits || 0) > 10 ? 'var(--green)' : 'var(--text)' }}>
                      {c.hits || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      <div className="g2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {crons.map((c, i) => (
          <div className="g-card" key={i}>
            <div className="fx aic gap8 mb12">
              <span className={`cron-dot ${c.status === 'success' ? 'ok' : 'err'}`} />
              <span className="fw6 bright fs12">{c.name}</span>
            </div>
            <div className="fs11" style={{ lineHeight: 1.5 }}>{c.description}</div>
            <div className="fx aic jcb mt12">
              <span className="mono fs10 dim">{FREQ[c.schedule] || c.schedule}</span>
              <span className="tag tag-c">{c.hits || 0} hits</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
