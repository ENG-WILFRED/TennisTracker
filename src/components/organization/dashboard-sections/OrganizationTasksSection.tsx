'use client';

import React, { useState } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface TasksSectionProps {
  pendingTasks: any[];
}

export default function OrganizationTasksSection({ pendingTasks }: TasksSectionProps) {
  const [tasks, setTasks] = useState(pendingTasks);

  const toggleTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
  };

  const priorityColor = (p: string) => p === 'High' ? '#ff6b6b' : p === 'Medium' ? G.yellow : G.muted;
  const priorityBg = (p: string) => p === 'High' ? '#ff6b6b33' : p === 'Medium' ? G.yellow + '33' : G.muted + '33';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Task Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Tasks</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime, marginBottom: 6 }}>{tasks.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>High Priority</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ff6b6b', marginBottom: 6 }}>{tasks.filter(t => t.priority === 'High').length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Medium Priority</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.yellow, marginBottom: 6 }}>{tasks.filter(t => t.priority === 'Medium').length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Completed</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright, marginBottom: 6 }}>{tasks.filter(t => t.completed).length}</div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>✓ Task Management</div>
        {tasks.map((t: any, i: number) => (
          <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: '12px', marginBottom: i < tasks.length - 1 ? 8 : 0, opacity: t.completed ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                checked={t.completed || false}
                onChange={() => toggleTask(i)}
                style={{ marginTop: 4, cursor: 'pointer', accentColor: G.lime, width: 16, height: 16 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.task}</div>
                <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>
                  Owner: {t.owner} · Due: {t.due}
                </div>
              </div>
              <span style={{ fontSize: 8, padding: '4px 8px', borderRadius: 4, background: priorityBg(t.priority), color: priorityColor(t.priority), fontWeight: 700, whiteSpace: 'nowrap' }}>
                {t.priority}
              </span>
            </div>
          </div>
        ))}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Add New Task
        </button>
      </div>
    </div>
  );
}
