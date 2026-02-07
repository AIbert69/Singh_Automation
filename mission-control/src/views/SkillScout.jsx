import React, { useState } from 'react';

function confColor(n) {
  if (n >= 90) return 'var(--green)';
  if (n >= 70) return 'var(--amber)';
  return 'var(--red)';
}

function confFill(n) {
  if (n >= 90) return 'g';
  if (n >= 70) return 'a';
  return 'r';
}

function RenderDoc({ text }) {
  return (
    <div className="sk-doc">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('| '))  return <div key={i} style={{ color: 'var(--cyan)', fontSize: 10.5 }}>{line}</div>;
        if (line.startsWith('- '))  return <div key={i} style={{ paddingLeft: 14 }}><span style={{ color: 'var(--accent)' }}>•</span> {line.slice(2)}</div>;
        if (line.startsWith('```')) return null;
        if (line.trim() === '')     return <br key={i} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

export default function SkillScout({ gw }) {
  const { skills } = gw;
  const [idx, setIdx] = useState(0);
  const sk = skills[idx];

  return (
    <div className="split">
      {/* ── Left: skill list ─────────────────────────────────────────── */}
      <div className="split-l">
        <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div className="fw6 bright fs12">Skills Library</div>
          <div className="fs10 dim mt8">{skills.length} skills installed</div>
        </div>
        {skills.map((s, i) => (
          <div
            key={i}
            className={`sk-item${i === idx ? ' on' : ''}`}
            onClick={() => setIdx(i)}
          >
            <div>
              <div className="sk-name">{s.name}</div>
              <div className="sk-meta">{s.category} · {s.status}</div>
            </div>
            <div className="sk-pct" style={{ color: confColor(s.confidence) }}>
              {s.confidence}%
            </div>
          </div>
        ))}
      </div>

      {/* ── Right: detail & doc ──────────────────────────────────────── */}
      <div className="split-r">
        {sk && (
          <>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div className="fx aic jcb">
                <div>
                  <div className="fw7 bright" style={{ fontSize: 18 }}>{sk.name}</div>
                  <div className="fs11 dim mt8">{sk.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono fw7" style={{ fontSize: 30, color: confColor(sk.confidence) }}>
                    {sk.confidence}%
                  </div>
                  <div className="fs10 dim">confidence</div>
                </div>
              </div>
              <div className="fx gap6 mt12">
                <span className="tag tag-b">{sk.category}</span>
                <span className={`tag ${sk.status === 'production' ? 'tag-g' : 'tag-a'}`}>{sk.status}</span>
                {sk.lastUsed && (
                  <span className="tag tag-p">Last: {new Date(sk.lastUsed).toLocaleDateString()}</span>
                )}
              </div>
              <div className="prog mt12" style={{ height: 6 }}>
                <div className={`prog-fill ${confFill(sk.confidence)}`} style={{ width: `${sk.confidence}%` }} />
              </div>
            </div>
            {sk.doc && <RenderDoc text={sk.doc} />}
          </>
        )}
      </div>
    </div>
  );
}
