import React from 'react';

const ST = {
  analyzed:   { label: 'Analyzed',   cls: 'tag-g', icon: '✓' },
  processing: { label: 'Processing', cls: 'tag-a', icon: '⟳' },
  queued:     { label: 'Queued',     cls: 'tag-p', icon: '⏳' },
};

export default function DocuDigest({ gw }) {
  const docs = gw.documents;
  const analyzed = docs.filter(d => d.status === 'analyzed').length;
  const insights = docs.reduce((s, d) => s + d.insights, 0);
  const pages = docs.reduce((s, d) => s + d.pages, 0);

  return (
    <>
      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="g4 mb24">
        <div className="g-card">
          <div className="stat-lbl">Documents</div>
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{docs.length}</div>
          <div className="stat-sub dim">tracked</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Analyzed</div>
          <div className="stat-val" style={{ color: 'var(--green)' }}>{analyzed}</div>
          <div className="stat-sub dim">complete</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Insights</div>
          <div className="stat-val" style={{ color: 'var(--cyan)' }}>{insights}</div>
          <div className="stat-sub dim">extracted</div>
        </div>
        <div className="g-card">
          <div className="stat-lbl">Pages</div>
          <div className="stat-val" style={{ color: 'var(--purple)' }}>{pages}</div>
          <div className="stat-sub dim">processed</div>
        </div>
      </div>

      {/* ── Drop zone ───────────────────────────────────────────────────── */}
      <div className="drop-zone mb24">
        <div className="drop-zone-icon">📄</div>
        <div className="drop-zone-text">Drop PDF / DOCX files here to ingest</div>
        <div className="drop-zone-hint">Max 50MB per file — auto-analyzed by OpenClaw</div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="g-card">
        <div className="g-card-head">
          <span className="g-card-title">Document Tracker</span>
          <span className="tag tag-b">{docs.length} files</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Insights</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const s = ST[d.status] || ST.queued;
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="fx aic gap8">
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <span className="fw6 bright fs11">{d.name}</span>
                      </div>
                    </td>
                    <td><span className="tag tag-b">{d.category}</span></td>
                    <td><span className={`tag ${s.cls}`}>{s.label}</span></td>
                    <td className="mono">{d.pages}</td>
                    <td>
                      <span className="mono fw6" style={{ color: d.insights > 0 ? 'var(--green)' : 'var(--dim)' }}>
                        {d.insights}
                      </span>
                    </td>
                    <td className="mono fs10">{d.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
