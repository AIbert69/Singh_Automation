import React from 'react';
import { MOCK_FINANCE } from '../data/mockData.js';

export default function Finance() {
  const f = MOCK_FINANCE;
  const dailyPct = (f.daily.spent / f.daily.cap) * 100;
  const monthlyPct = (f.monthly.spent / f.monthly.cap) * 100;
  const maxWeekly = Math.max(...f.weekly);

  return (
    <div>
      {/* Daily budget banner */}
      <div className="card card-glow mb-24">
        <div className="flex items-center justify-between mb-16">
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's Spend</div>
            <div className="flex items-center gap-8">
              <span style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                ${f.daily.spent.toFixed(2)}
              </span>
              <span style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                / ${f.daily.cap.toFixed(2)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Per-Task Limit</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              ${f.perTask.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="budget-bar">
          <div className="budget-fill" style={{ width: `${dailyPct}%` }}>
            {dailyPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        {/* Weekly chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Spend</span>
            <span className="tag tag-green">${f.weekly.reduce((a, b) => a + b, 0).toFixed(2)} total</span>
          </div>
          <div className="chart-bars" style={{ height: 140 }}>
            {f.weekly.map((val, i) => (
              <div
                key={i}
                className="chart-bar"
                style={{ height: `${(val / maxWeekly) * 100}%` }}
                title={`${f.weekLabels[i]}: $${val.toFixed(2)}`}
              />
            ))}
          </div>
          <div className="chart-labels">
            {f.weekLabels.map((label, i) => (
              <span key={i} className="chart-label">{label}</span>
            ))}
          </div>
        </div>

        {/* Monthly projection */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Overview</span>
            <span className="tag tag-accent">{monthlyPct.toFixed(1)}% used</span>
          </div>
          <div className="grid-2 mb-16">
            <div>
              <div className="text-xs text-muted">Spent</div>
              <div className="stat-value" style={{ fontSize: 22, color: 'var(--accent)' }}>
                ${f.monthly.spent.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Projected</div>
              <div className="stat-value" style={{ fontSize: 22, color: 'var(--amber)' }}>
                ${f.monthly.projected.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Monthly Budget: ${f.monthly.cap.toFixed(2)}
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill accent" style={{ width: `${monthlyPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Category breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Breakdown</span>
          </div>
          <div className="flex flex-col gap-12">
            {f.categories.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{cat.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    ${cat.amount.toFixed(2)} ({cat.pct}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget rules */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Budget Rules</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {f.rules.map((rule, i) => (
                  <tr key={i}>
                    <td>{rule.rule}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{rule.value}</td>
                    <td>
                      <span className={`tag ${rule.status === 'active' ? 'tag-green' : 'tag-amber'}`}>
                        {rule.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
