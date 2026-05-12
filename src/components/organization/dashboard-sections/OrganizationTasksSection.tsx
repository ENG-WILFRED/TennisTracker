'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { AssignCard } from '@/components/tasks/AssignCard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', orange: '#e8944f', blue: '#4ab0d0',
  red: '#ff6b6b',
};

interface Task {
  id: string;
  eventId?: string;
  staffUserId: string;
  title: string;
  description?: string;
  role: string;
  responsibility?: string;
  status: string;
  priority: string;
  rejectionReason?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  assignedBy?: string;
  context?: Record<string, any>;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    role: string;
  };
  event?: {
    id: string;
    name: string;
  };
}

interface Staff {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
}

interface TasksSectionProps {
  orgId?: string;
  pendingTasks?: any[];
  adminUserId?: string;
}

const TASKS_PER_PAGE = 10;

export default function OrganizationTasksSection({ orgId, pendingTasks = [], adminUserId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const priorityConfig: Record<string, { color: string; bgColor: string }> = {
    high: { color: G.red, bgColor: 'rgba(255,107,107,0.12)' },
    medium: { color: G.yellow, bgColor: 'rgba(240,192,64,0.12)' },
    low: { color: G.muted, bgColor: 'rgba(122,170,106,0.12)' },
  };

  const statusConfig: Record<string, { color: string; icon: string }> = {
    pending: { color: G.yellow, icon: '⏳' },
    accepted: { color: G.bright, icon: '✅' },
    in_progress: { color: G.blue, icon: '🔄' },
    completed: { color: G.lime, icon: '✔️' },
    rejected: { color: G.red, icon: '❌' },
    cancelled: { color: G.muted, icon: '⊘' },
  };

  useEffect(() => {
    if (orgId) {
      fetchTasks(currentPage);
      fetchStaff();
    }
  }, [orgId, currentPage]);

  // Resolve player names for tasks that have selectedPlayerIds but no selectedPlayerNames
  useEffect(() => {
    if (
      selectedTask?.context?.selectedPlayerIds &&
      Array.isArray(selectedTask.context.selectedPlayerIds) &&
      !selectedTask.context.selectedPlayerNames
    ) {
      const resolvePlayerNames = async () => {
        try {
          const context = selectedTask?.context;
          const ids = Array.isArray(context?.selectedPlayerIds)
            ? context.selectedPlayerIds.join(',')
            : '';
          const res = await authenticatedFetch(
            `/api/organization/${orgId}/players?ids=${ids}`
          );
          if (res.ok) {
            const players = await res.json();
            const playerNames = players
              .map((p: any) => p.name || p.firstName + ' ' + p.lastName)
              .filter((name: string) => !!name);
            setSelectedTask((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                context: {
                  ...prev.context,
                  selectedPlayerNames: playerNames,
                },
              };
            });
          }
        } catch (err) {
          console.error('Error resolving player names:', err);
        }
      };
      resolvePlayerNames();
    }
  }, [selectedTask?.id, orgId]);

  async function fetchTasks(page: number = currentPage) {
    try {
      setLoading(true);
      const offset = (page - 1) * TASKS_PER_PAGE;
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks?offset=${offset}&limit=${TASKS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []));
        setTotalTasks(data.total || data.length || 0);
        return true;
      }
    } catch (err) {
      toast.error('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
    return false;
  }

  const formatContextKey = (key: string, context: Record<string, any> = {}) => {
    // Use player names label if available
    if (key === 'selectedPlayerNames') {
      return 'Selected Players';
    }
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatContextValue = (
    key: string,
    value: any,
    context: Record<string, any> = {}
  ) => {
    if (key === 'selectedPlayerIds') {
      if (Array.isArray(context.selectedPlayerNames) && context.selectedPlayerNames.length > 0) {
        return context.selectedPlayerNames.join(', ');
      }
      return Array.isArray(value) ? value.join(', ') : String(value);
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return String(value ?? '');
  };

  const handleRefresh = () => {
    if (currentPage === 1) {
      fetchTasks(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleBackgroundRefresh = async () => {
    setIsRefreshing(true);
    try {
      const offset = (currentPage - 1) * TASKS_PER_PAGE;
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks?offset=${offset}&limit=${TASKS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        const updatedTasks = Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []);
        setTasks(updatedTasks);
        setTotalTasks(data.total || data.length || 0);
        toast.success('Tasks refreshed');
      }
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      toast.error('Failed to refresh tasks');
    } finally {
      setIsRefreshing(false);
    }
  };

  async function fetchStaff() {
    try {
      setStaffLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStaffLoading(false);
    }
  }

  const handleTaskAssigned = async (newTask?: any) => {
    setShowAssignModal(false);
    if (currentPage !== 1) {
      setCurrentPage(1);
      toast.success('Task assigned successfully');
      return;
    }

    const refreshed = await fetchTasks(1);
    if (refreshed) {
      toast.success('Task assigned successfully');
    } else {
      toast.error('Task assigned successfully, but task list refresh failed.');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || t.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const openTaskDetails = (task: Task) => setSelectedTask(task);
  const closeTaskDetails = () => setSelectedTask(null);

  const statsCount = (status: string) => tasks.filter(t => t.status === status).length;
  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: G.text }}>📋 Task Management</h2>
        <button
          onClick={() => setShowAssignModal(true)}
          style={{
            background: G.lime,
            color: '#0f1f0f',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Assign Task
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.text }}>{tasks.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Pending</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.yellow }}>{statsCount('pending')}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Accepted</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.bright }}>{statsCount('accepted')}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Completed</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.lime }}>{statsCount('completed')}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Rejected</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.red }}>{statsCount('rejected')}</div>
        </div>
      </div>

      {/* Filters & Refresh Bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '10px 12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* Status Filter */}
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                background: filterStatus === status ? G.bright : 'transparent',
                border: `1px solid ${filterStatus === status ? G.bright : G.cardBorder}`,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                color: filterStatus === status ? G.text : G.muted,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {statusConfig[status]?.icon || '•'} {status}
            </button>
          ))}

          {/* Priority Filter */}
          {['all', 'high', 'medium', 'low'].map(priority => (
            <button
              key={priority}
              onClick={() => {
                setFilterPriority(priority);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                background: filterPriority === priority ? G.yellow : 'transparent',
                border: `1px solid ${filterPriority === priority ? G.yellow : G.cardBorder}`,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                color: filterPriority === priority ? '#000' : G.muted,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {priority === 'all' ? '⚖️ All' : priority}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleBackgroundRefresh}
          disabled={isRefreshing}
          style={{
            padding: '6px 12px',
            background: isRefreshing ? G.cardBorder : G.lime,
            color: isRefreshing ? G.muted : '#0f1f0f',
            border: `1px solid ${G.lime}`,
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Assign Task Modal with AssignCard */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setShowAssignModal(false)}>
          <div onClick={e => e.stopPropagation()}>
            <AssignCard
              organizationId={orgId || ''}
              currentUserId={adminUserId}
              onTaskAssigned={handleTaskAssigned}
              onClose={() => setShowAssignModal(false)}
            />
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: G.muted }}>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: G.muted }}>
            {filterStatus === 'all' && filterPriority === 'all' ? (
              'No tasks yet. Create one to get started!'
            ) : filterStatus !== 'all' && filterPriority === 'all' ? (
              `No ${filterStatus} tasks`
            ) : filterStatus === 'all' && filterPriority !== 'all' ? (
              `No ${filterPriority} priority tasks`
            ) : (
              `No ${filterStatus} tasks under ${filterPriority} priority`
            )}
          </div>
        ) : (
          <div>
            {filteredTasks.map((task, idx) => (
              <div
                key={task.id}
                onClick={() => openTaskDetails(task)}
                style={{
                  padding: 14,
                  borderBottom: idx < filteredTasks.length - 1 ? `1px solid ${G.cardBorder}` : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: G.mid,
                    border: `2px solid ${G.bright}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {task.assignedTo?.name.charAt(0) || '?'}
                </div>

                {/* Task Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: G.text }}>{task.title}</div>
                    <span
                      style={{
                        padding: '3px 8px',
                        background: (priorityConfig[task.priority] || priorityConfig.medium).bgColor,
                        color: (priorityConfig[task.priority] || priorityConfig.medium).color,
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {task.priority}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        color: (statusConfig[task.status] || statusConfig.pending).color,
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {statusConfig[task.status]?.icon || '•'} {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>
                    <strong>{task.assignedTo?.name || 'Unassigned'}</strong> • {task.role}
                    {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                  </div>

                  {task.responsibility && (
                    <div style={{ fontSize: 11, color: G.text, marginBottom: 6 }}>
                      {task.responsibility}
                    </div>
                  )}

                  {task.rejectionReason && (
                    <div style={{
                      fontSize: 11,
                      color: G.red,
                      background: 'rgba(255, 107, 107, 0.12)',
                      padding: '6px 8px',
                      borderRadius: 4,
                      marginTop: 6,
                    }}>
                      <strong>Rejection reason:</strong> {task.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderTop: `1px solid ${G.cardBorder}` }}>
                <div style={{ fontSize: 11, color: G.muted }}>
                  Page {currentPage} of {totalPages} • {totalTasks} total tasks
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    style={{
                      background: currentPage === 1 ? 'rgba(0,0,0,0.3)' : G.bright,
                      color: currentPage === 1 ? G.muted : G.text,
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 || loading ? 0.5 : 1,
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    style={{
                      background: currentPage === totalPages ? 'rgba(0,0,0,0.3)' : G.bright,
                      color: currentPage === totalPages ? G.muted : G.text,
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: currentPage === totalPages || loading ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages || loading ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={closeTaskDetails}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: G.text }}>{selectedTask.title}</h3>
                <p style={{ margin: '8px 0 0', color: G.muted, fontSize: 13 }}>
                  {selectedTask.role} • Assigned to {selectedTask.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={closeTaskDetails}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: G.text,
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
                aria-label="Close task details"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</div>
                  <div style={{ marginTop: 4, color: G.text }}>{statusConfig[selectedTask.status]?.icon || '•'} {selectedTask.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Priority</div>
                  <div style={{ marginTop: 4, color: (priorityConfig[selectedTask.priority] || priorityConfig.medium).color }}>{selectedTask.priority}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assigned by</div>
                  <div style={{ marginTop: 4, color: G.text }}>{selectedTask.assignedBy || 'System'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due date</div>
                  <div style={{ marginTop: 4, color: G.text }}>{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Created</div>
                  <div style={{ marginTop: 4, color: G.text }}>{new Date(selectedTask.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Updated</div>
                  <div style={{ marginTop: 4, color: G.text }}>{new Date(selectedTask.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description</div>
              <div style={{ color: G.text, lineHeight: 1.6 }}>{selectedTask.description || 'No description provided.'}</div>
            </div>

            {selectedTask.responsibility && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Responsibility</div>
                <div style={{ color: G.text, lineHeight: 1.6 }}>{selectedTask.responsibility}</div>
              </div>
            )}

            {selectedTask.rejectionReason && (
              <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: 'rgba(255, 107, 107, 0.12)', border: `1px solid ${G.red}` }}>
                <div style={{ fontSize: 11, color: G.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rejection reason</div>
                <div style={{ color: G.text }}>{selectedTask.rejectionReason}</div>
              </div>
            )}

            {selectedTask.context && Object.keys(selectedTask.context).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Context</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {Object.entries(selectedTask.context)
                    .filter(
                      ([key]) => !(key === 'selectedPlayerIds' &&
                        Array.isArray(selectedTask.context?.selectedPlayerNames) &&
                        selectedTask.context.selectedPlayerNames.length > 0)
                    )
                    .map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: G.text, fontSize: 13 }}>
                        <span style={{ color: G.muted, minWidth: 140, textTransform: 'capitalize' }}>{formatContextKey(key, selectedTask.context)}</span>
                        <span>{formatContextValue(key, value, selectedTask.context)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={closeTaskDetails}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: `1px solid ${G.cardBorder}`,
                  background: 'transparent',
                  color: G.text,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
