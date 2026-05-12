'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Users, CheckCircle, X } from 'lucide-react';

interface PlayerTaskDetailsPanelProps {
  taskId: string;
  playerId: string;
  onClose?: () => void;
}

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

export default function PlayerTaskDetailsPanel({ taskId, playerId, onClose }: PlayerTaskDetailsPanelProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch the specific task
        const response = await fetch(`/api/players/tasks/${taskId}?playerId=${playerId}`);
        
        if (response.ok) {
          const data = await response.json();
          setTask(data.task);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, playerId]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: G.muted }}>Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: G.red }}>
        <AlertCircle style={{ width: 32, height: 32, margin: '0 auto 8px' }} />
        Failed to load task details
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    'ASSIGNED': { bg: `${G.blue}22`, border: G.blue, text: G.blue },
    'ACCEPTED': { bg: `${G.lime}22`, border: G.lime, text: G.lime },
    'IN_PROGRESS': { bg: `${G.yellow}22`, border: G.yellow, text: G.yellow },
    'COMPLETED': { bg: `${G.lime}22`, border: G.lime, text: G.lime },
    'FAILED': { bg: `${G.red}22`, border: G.red, text: G.red },
    'CANCELLED': { bg: `${G.muted}22`, border: G.muted, text: G.muted },
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || statusColors['ASSIGNED'];
  };

  const currentStatus = task.status?.toUpperCase() || 'ASSIGNED';
  const statusColor = getStatusColor(task.status || 'ASSIGNED');

  const formatContextValue = (key: string, value: any, context: Record<string, any> = {}) => {
    if (key === 'selectedPlayerIds') {
      if (Array.isArray(context.selectedPlayerNames) && context.selectedPlayerNames.length > 0) {
        return context.selectedPlayerNames.join(', ');
      }
      return Array.isArray(value) ? value.join(', ') : String(value);
    }

    if (key === 'courtId') {
      if (context.courtName) {
        return context.courtName;
      }
      return String(value ?? '');
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return String(value ?? '');
  };

  const assignedCoach = task.assignedToUser ? `${task.assignedToUser.firstName} ${task.assignedToUser.lastName}` : 'Unknown';

  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12 }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 4 }}>{task.template?.name || 'Task'}</h2>
          <p style={{ fontSize: 11, color: G.text2 }}>{task.template?.description || task.notes}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            style={{ 
              color: G.muted, 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = G.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = G.muted)}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Status Section */}
      <div style={{ padding: '16px 20px', background: G.card2, borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 6,
            padding: '4px 10px',
            background: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
            color: statusColor.text,
          }}>
            {currentStatus}
          </span>
          <span style={{ fontSize: 11, color: G.muted2 }}>
            Assigned Coach: {assignedCoach}
          </span>
        </div>
      </div>

      {/* Details Section */}
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: G.lime2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Task Details
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Task Type */}
            <div>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Type</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{task.template?.type}</div>
            </div>

            {/* Task Role */}
            <div>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Role</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{task.template?.role || 'N/A'}</div>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Due Date</div>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Created Date */}
            {task.createdAt && (
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Created</div>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
                  {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Started Date */}
            {task.startedAt && (
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Started</div>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
                  {new Date(task.startedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Completed Date */}
            {task.completedAt && (
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Completed</div>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
                  {new Date(task.completedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Context Fields */}
            {task.context && Object.keys(task.context).length > 0 && (
              <>
                {Object.entries(task.context)
                  .filter(
                    ([key]) => !(key === 'selectedPlayerIds' &&
                      Array.isArray(task.context?.selectedPlayerNames) &&
                      task.context.selectedPlayerNames.length > 0)
                  )
                  .filter(
                    ([key]) => !(key === 'courtId' &&
                      task.context?.courtName)
                  )
                  .filter(([key]) => key !== 'courtName' && key !== 'role' && key !== 'selectedPlayerIds')
                  .map(([key, value]) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600, textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
                        {formatContextValue(key, value, task.context)}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {task.notes && (
          <div style={{ marginTop: 16, padding: 12, background: G.card2, borderRadius: 6, borderLeft: `3px solid ${G.lime}` }}>
            <div style={{ fontSize: 10, color: G.lime2, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Notes</div>
            <div style={{ fontSize: 12, color: G.text, lineHeight: 1.5 }}>{task.notes}</div>
          </div>
        )}

        {/* Rejection Reason */}
        {task.rejectionReason && (
          <div style={{ marginTop: 16, padding: 12, background: `${G.red}22`, borderRadius: 6, borderLeft: `3px solid ${G.red}` }}>
            <div style={{ fontSize: 10, color: G.red, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Rejection Reason</div>
            <div style={{ fontSize: 12, color: G.text, lineHeight: 1.5 }}>{task.rejectionReason}</div>
          </div>
        )}
      </div>
    </div>
  );
}
