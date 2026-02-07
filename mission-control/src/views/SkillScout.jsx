import React, { useState } from 'react';

const CONFIDENCE_COLORS = {
  high: 'var(--green)',
  medium: 'var(--amber)',
  low: 'var(--red)',
};

function getConfidenceLevel(n) {
  if (n >= 90) return 'high';
  if (n >= 70) return 'medium';
  return 'low';
}

function MarkdownRenderer({ text }) {
  // Simple markdown-like rendering
  const lines = text.split('\n');
  return (
    <div className="skill-doc">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} style={{ fontSize: 15, marginTop: 16, marginBottom: 8, color: 'var(--accent)' }}>{line.slice(3)}</h2>;
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} style={{ paddingLeft: 16, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>•</span>
              {line.slice(2)}
            </div>
          );
        }
        if (line.trim() === '') return <br key={i} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

export default function SkillScout({ gateway }) {
  const { skills } = gateway;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = skills[selectedIdx];

  return (
    <div className="two-panel">
      {/* Left panel: skill list */}
      <div className="panel-left">
        <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title">Skills Library</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {skills.length} skills installed
          </div>
        </div>
        <div className="skill-list" style={{ padding: 8 }}>
          {skills.map((skill, i) => (
            <div
              key={i}
              className={`skill-item ${i === selectedIdx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(i)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-bright)' }}>
                  {skill.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {skill.category} • {skill.status}
                </div>
              </div>
              <div
                className="skill-confidence"
                style={{ color: CONFIDENCE_COLORS[getConfidenceLevel(skill.confidence)] }}
              >
                {skill.confidence}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: skill detail */}
      <div className="panel-right">
        {selected && (
          <>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-bright)' }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selected.description}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: CONFIDENCE_COLORS[getConfidenceLevel(selected.confidence)],
                    }}
                  >
                    {selected.confidence}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>confidence</div>
                </div>
              </div>
              <div className="flex gap-8 mt-12">
                <span className="tag tag-accent">{selected.category}</span>
                <span className={`tag ${selected.status === 'production' ? 'tag-green' : 'tag-amber'}`}>
                  {selected.status}
                </span>
                {selected.lastUsed && (
                  <span className="tag tag-purple">
                    Last: {new Date(selected.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div
                    className={`progress-fill ${getConfidenceLevel(selected.confidence) === 'high' ? 'green' : getConfidenceLevel(selected.confidence) === 'medium' ? 'amber' : 'red'}`}
                    style={{ width: `${selected.confidence}%` }}
                  />
                </div>
              </div>
            </div>
            {selected.doc && <MarkdownRenderer text={selected.doc} />}
          </>
        )}
      </div>
    </div>
  );
}
