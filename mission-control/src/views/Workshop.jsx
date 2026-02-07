import React, { useState } from 'react';
import { MOCK_TASKS } from '../data/mockData.js';

const PRIORITY_COLORS = {
  critical: 'tag-red',
  high: 'tag-amber',
  medium: 'tag-accent',
  low: 'tag-purple',
};

function TaskCard({ task, onClick }) {
  return (
    <div className="kanban-card" onClick={() => onClick(task)}>
      <div className="kanban-card-title">{task.title}</div>
      <div className="kanban-card-desc">{task.desc}</div>
      <div className="kanban-card-footer">
        <span className={`tag ${PRIORITY_COLORS[task.priority] || 'tag-accent'}`}>
          {task.priority}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {task.agent}
        </span>
      </div>
      {task.momentum > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Momentum</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{task.momentum}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${task.momentum >= 80 ? 'green' : task.momentum >= 50 ? 'accent' : 'amber'}`}
              style={{ width: `${task.momentum}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ task, onClose }) {
  if (!task) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 100,
        padding: 24,
        overflowY: 'auto',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center justify-between mb-24">
        <span className="card-title" style={{ fontSize: 16 }}>{task.title}</span>
        <span
          style={{ cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}
          onClick={onClose}
        >
          ✕
        </span>
      </div>
      <div className="mb-16">
        <div className="text-xs text-muted mb-16">Description</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{task.desc}</div>
      </div>
      <div className="grid-2 mb-16">
        <div>
          <div className="text-xs text-muted">Priority</div>
          <span className={`tag ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        </div>
        <div>
          <div className="text-xs text-muted">Agent</div>
          <div className="text-mono text-sm">{task.agent}</div>
        </div>
      </div>
      {task.momentum > 0 && (
        <div className="mb-16">
          <div className="text-xs text-muted" style={{ marginBottom: 6 }}>Momentum</div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className={`progress-fill ${task.momentum >= 80 ? 'green' : task.momentum >= 50 ? 'accent' : 'amber'}`}
              style={{ width: `${task.momentum}%` }}
            />
          </div>
          <div className="text-mono text-xs mt-12" style={{ color: 'var(--text)' }}>
            {task.momentum}% complete
          </div>
        </div>
      )}
      {task.started && (
        <div className="mb-16">
          <div className="text-xs text-muted">Started</div>
          <div className="text-mono text-sm">{new Date(task.started).toLocaleString()}</div>
        </div>
      )}
      {task.completed && (
        <div className="mb-16">
          <div className="text-xs text-muted">Completed</div>
          <div className="text-mono text-sm">{new Date(task.completed).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

export default function Workshop() {
  const [selected, setSelected] = useState(null);
  const tasks = MOCK_TASKS;

  const columns = [
    { key: 'queued', title: 'Queued', color: 'var(--amber)' },
    { key: 'active', title: 'Active', color: 'var(--accent)' },
    { key: 'done', title: 'Done', color: 'var(--green)' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-24">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {tasks.queued.length + tasks.active.length + tasks.done.length} tasks across all agents
          </div>
        </div>
        <div className="flex gap-8">
          <span className="tag tag-amber">{tasks.queued.length} queued</span>
          <span className="tag tag-accent">{tasks.active.length} active</span>
          <span className="tag tag-green">{tasks.done.length} done</span>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map(col => (
          <div className="kanban-column" key={col.key}>
            <div className="kanban-column-header">
              <div className="flex items-center gap-8">
                <div style={{ width: 8, height: 8, borderRadius: 4, background: col.color }} />
                <span className="kanban-column-title">{col.title}</span>
              </div>
              <span className="kanban-count">{tasks[col.key].length}</span>
            </div>
            {tasks[col.key].map(task => (
              <TaskCard key={task.id} task={task} onClick={setSelected} />
            ))}
          </div>
        ))}
      </div>

      {selected && <DetailPanel task={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
