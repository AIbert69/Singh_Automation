import React from 'react';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function cronToHuman(schedule) {
  const map = {
    '0 */6 * * *': 'Every 6 hours',
    '0 */4 * * *': 'Every 4 hours',
    '*/15 * * * *': 'Every 15 minutes',
    '0 7 * * *': 'Daily at 7:00 AM',
    '0 8 * * 1': 'Weekly on Monday 8:00 AM',
  };
  return map[schedule] || schedule;
}

export default function CronJobs({ gateway }) {
  const { crons, isLive } = gateway;

  const totalHits = crons.reduce((sum, c) => sum + (c.hits || 0), 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid-3 mb-24">
        <div className="card">
          <div className="card-subtitle">Total Jobs</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{crons.length}</div>
          <div className="stat-label">
            {isLive ? 'from live config' : 'mock data'}
          </div>
        </div>
        <div className="card">
          <div className="card-subtitle">All Success</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            {crons.filter(c => c.status === 'success').length}/{crons.length}
          </div>
          <div className="stat-label">healthy jobs</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Total Hits</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{totalHits}</div>
          <div className="stat-label">results found</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scheduled Jobs</span>
          <span className={`tag ${isLive ? 'tag-green' : 'tag-amber'}`}>
            {isLive ? 'LIVE' : 'MOCK'}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Schedule</th>
                <th>Frequency</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Hits</th>
              </tr>
            </thead>
            <tbody>
              {crons.map((cron, i) => (
                <tr key={i}>
                  <td>
                    <span className={`cron-dot ${cron.status || 'success'}`} />
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-bright)' }}>{cron.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {cron.schedule}
                  </td>
                  <td style={{ fontSize: 12 }}>{cronToHuman(cron.schedule)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{formatTime(cron.lastRun)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{formatTime(cron.nextRun)}</td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: (cron.hits || 0) > 10 ? 'var(--green)' : 'var(--text)',
                    }}>
                      {cron.hits || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job descriptions */}
      <div className="grid-2 mt-16" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {crons.map((cron, i) => (
          <div className="card" key={i}>
            <div className="flex items-center gap-8 mb-16">
              <span className={`cron-dot ${cron.status || 'success'}`} />
              <span className="card-title">{cron.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              {cron.description}
            </div>
            <div className="flex items-center justify-between mt-12">
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {cronToHuman(cron.schedule)}
              </span>
              <span className="tag tag-cyan">{cron.hits || 0} hits</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
