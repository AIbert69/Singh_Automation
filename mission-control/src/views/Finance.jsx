import React from 'react';
import { MOCK_FINANCE } from '../data/mock.js';

const CAT_FILL = ['b', 'p', 'g', 'c', 'a'];

export default function Finance() {
  const f = MOCK_FINANCE;
  const dpct = (f.daily.spent / f.daily.cap) * 100;
  const mpct = (f.monthly.spent / f.monthly.cap) * 100;
  const mx = Math.max(...f.weekly);

  return (
    <>
      {/* ── Daily budget ────────────────────────────────────────────────── */}
      <div className="g-card glow mb24">
        <div className="fx aic jcb mb16">
          <div>
            <div className="fs10 dim">TODAY'S API SPEND</div>
            <div className="fx aic gap8">
              <span className="mono fw7" style={{ fontSize: 34, color: 'var(--green)' }}>
                ${f.daily.spent.toFixed(2)}
              </span>
              <span className="mono fs12 dim">/ ${f.daily.cap.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="fs10 dim">PER-TASK LIMIT</div>
            <div className="mono fw7" style={{ fontSize: 22, color: 'var(--accent)' }}>
              ${f.perTask.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="budget-bar">
          <div className="budget-fill" style={{ width: `${dpct}%` }}>{dpct.toFixed(1)}%</div>
        </div>
      </div>

      <div className="g2 mb24">
        {/* ── Weekly chart ──────────────────────────────────────────────── */}
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Weekly Spend</span>
            <span className="tag tag-g">${f.weekly.reduce((a, b) => a + b, 0).toFixed(2)}</span>
          </div>
          <div className="bars" style={{ height: 130 }}>
            {f.weekly.map((v, i) => (
              <div key={i} className="bar" style={{ height: `${(v / mx) * 100}%` }} title={`${f.weekLabels[i]}: $${v.toFixed(2)}`} />
            ))}
          </div>
          <div className="bar-labels">
            {f.weekLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>

        {/* ── Monthly overview ─────────────────────────────────────────── */}
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Monthly Budget</span>
            <span className="tag tag-b">{mpct.toFixed(1)}% used</span>
          </div>
          <div className="g2 mb16">
            <div>
              <div className="fs10 dim">Spent</div>
              <div className="mono fw7" style={{ fontSize: 22, color: 'var(--accent)' }}>${f.monthly.spent.toFixed(2)}</div>
            </div>
            <div>
              <div className="fs10 dim">Projected</div>
              <div className="mono fw7" style={{ fontSize: 22, color: 'var(--amber)' }}>${f.monthly.projected.toFixed(2)}</div>
            </div>
          </div>
          <div className="fs10 dim mb8">Cap: ${f.monthly.cap.toFixed(2)}/month</div>
          <div className="prog" style={{ height: 8 }}>
            <div className="prog-fill b" style={{ width: `${mpct}%` }} />
          </div>
        </div>
      </div>

      <div className="g2">
        {/* ── Categories ────────────────────────────────────────────────── */}
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Spend by Category</span>
          </div>
          <div className="fxc gap12">
            {f.categories.map((c, i) => (
              <div key={i}>
                <div className="fx aic jcb mb4">
                  <span className="fs11">{c.name}</span>
                  <span className="mono fs10 dim">${c.amount.toFixed(2)} ({c.pct}%)</span>
                </div>
                <div className="prog">
                  <div className={`prog-fill ${CAT_FILL[i] || 'b'}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rules ─────────────────────────────────────────────────────── */}
        <div className="g-card">
          <div className="g-card-head">
            <span className="g-card-title">Budget Rules</span>
          </div>
          <table className="tbl">
            <thead><tr><th>Rule</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              {f.rules.map((r, i) => (
                <tr key={i}>
                  <td className="fs11">{r.name}</td>
                  <td className="mono fs11">{r.value}</td>
                  <td><span className={`tag ${r.active ? 'tag-g' : 'tag-a'}`}>{r.active ? 'active' : 'standby'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
