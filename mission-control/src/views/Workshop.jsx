import React, { useState } from 'react';
import { MOCK_TASKS } from '../data/mock.js';

const PRI = { critical: 'tag-r', high: 'tag-a', medium: 'tag-b', low: 'tag-p' };
const COL_COLOR = { queued: 'var(--amber)', active: 'var(--accent)', done: 'var(--green)' };

function Card({ t, onClick }) {
  return (
    <div className="kb-card" onClick={() => onClick(t)}>
      <div className="kb-card-t">{t.title}</div>
      <div className="kb-card-d">{t.desc}</div>
      <div className="kb-card-f">
        <div className="kb-card-tags">
          <span className={`tag ${PRI[t.priority]}`}>{t.priority}</span>
          {(t.tags || []).map((tg, i) => <span key={i} className="tag tag-c">{tg}</span>)}
        </div>
        <span className="mono fs10 dim">{t.agent}</span>
      </div>
      {t.momentum > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="fx aic jcb mb4">
            <span className="fs10 dim">Momentum</span>
            <span className="mono fs10">{t.momentum}%</span>
          </div>
          <div className="prog">
            <div
              className={`prog-fill ${t.momentum >= 80 ? 'g' : t.momentum >= 50 ? 'b' : 'a'}`}
              style={{ width: `${t.momentum}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ t, onClose }) {
  if (!t) return null;
  return (
    <div className="slide-over">
      <div className="fx aic jcb mb24">
        <div className="fw7 bright" style={{ fontSize: 16 }}>{t.title}</div>
        <span className="slide-over-close" onClick={onClose}>✕</span>
      </div>
      <div className="mb16">
        <div className="fs10 dim mb8">DESCRIPTION</div>
        <div className="fs12" style={{ lineHeight: 1.6 }}>{t.desc}</div>
      </div>
      <div className="g2 mb16">
        <div><div className="fs10 dim">Priority</div><span className={`tag ${PRI[t.priority]}`}>{t.priority}</span></div>
        <div><div className="fs10 dim">Agent</div><div className="mono fs12">{t.agent}</div></div>
      </div>
      {t.tags && (
        <div className="mb16">
          <div className="fs10 dim mb8">Tags</div>
          <div className="fx gap4">{t.tags.map((tg, i) => <span key={i} className="tag tag-c">{tg}</span>)}</div>
        </div>
      )}
      {t.momentum > 0 && (
        <div className="mb16">
          <div className="fs10 dim mb8">Progress</div>
          <div className="prog" style={{ height: 8 }}>
            <div className={`prog-fill ${t.momentum >= 80 ? 'g' : t.momentum >= 50 ? 'b' : 'a'}`} style={{ width: `${t.momentum}%` }} />
          </div>
          <div className="mono fs10 mt8">{t.momentum}% complete</div>
        </div>
      )}
      {t.started && <div className="mb16"><div className="fs10 dim">Started</div><div className="mono fs11">{new Date(t.started).toLocaleString()}</div></div>}
      {t.completed && <div className="mb16"><div className="fs10 dim">Completed</div><div className="mono fs11">{new Date(t.completed).toLocaleString()}</div></div>}
    </div>
  );
}

export default function Workshop() {
  const [sel, setSel] = useState(null);
  const T = MOCK_TASKS;

  const cols = [
    { key: 'queued', label: 'Queued' },
    { key: 'active', label: 'Active' },
    { key: 'done',   label: 'Done' },
  ];

  return (
    <>
      <div className="fx aic jcb mb20">
        <div className="fs11 dim">{T.queued.length + T.active.length + T.done.length} tasks across all agents</div>
        <div className="fx gap6">
          <span className="tag tag-a">{T.queued.length} queued</span>
          <span className="tag tag-b">{T.active.length} active</span>
          <span className="tag tag-g">{T.done.length} done</span>
        </div>
      </div>

      <div className="kb-board">
        {cols.map(c => (
          <div className="kb-col" key={c.key}>
            <div className="kb-col-head">
              <div className="fx aic gap6">
                <div style={{ width: 7, height: 7, borderRadius: 4, background: COL_COLOR[c.key] }} />
                <span className="kb-col-title">{c.label}</span>
              </div>
              <span className="kb-cnt">{T[c.key].length}</span>
            </div>
            {T[c.key].map(t => <Card key={t.id} t={t} onClick={setSel} />)}
          </div>
        ))}
      </div>

      {sel && <Detail t={sel} onClose={() => setSel(null)} />}
    </>
  );
}
