import React from 'react';
import { MOCK_DOCUMENTS } from '../data/mockData.js';

const STATUS_CONFIG = {
  analyzed: { label: 'Analyzed', cls: 'tag-green' },
  processing: { label: 'Processing', cls: 'tag-amber' },
  queued: { label: 'Queued', cls: 'tag-purple' },
  error: { label: 'Error', cls: 'tag-red' },
};

export default function DocuDigest() {
  const docs = MOCK_DOCUMENTS;

  const analyzed = docs.filter(d => d.status === 'analyzed').length;
  const totalInsights = docs.reduce((sum, d) => sum + d.insights, 0);
  const totalPages = docs.reduce((sum, d) => sum + d.pages, 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid-4 mb-24">
        <div className="card">
          <div className="card-subtitle">Documents</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{docs.length}</div>
          <div className="stat-label">tracked</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Analyzed</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{analyzed}</div>
          <div className="stat-label">complete</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Total Insights</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{totalInsights}</div>
          <div className="stat-label">extracted</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Pages Processed</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{totalPages}</div>
          <div className="stat-label">total pages</div>
        </div>
      </div>

      {/* Drop zone */}
      <div className="drop-zone mb-24">
        <div className="drop-zone-icon">📄</div>
        <div className="drop-zone-text">Drop PDF files here or click to upload</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Supports PDF, DOCX — Max 50MB per file
        </div>
      </div>

      {/* Document table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Document Tracker</span>
          <span className="tag tag-accent">{docs.length} files</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Insights</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>
                          {doc.status === 'analyzed' ? '✅' : doc.status === 'processing' ? '⏳' : '📋'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-bright)', fontSize: 12 }}>
                            {doc.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag tag-accent">{doc.category}</span>
                    </td>
                    <td>
                      <span className={`tag ${sc.cls}`}>{sc.label}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{doc.pages}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: doc.insights > 0 ? 'var(--green)' : 'var(--text-muted)',
                      }}>
                        {doc.insights}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{doc.uploaded}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
