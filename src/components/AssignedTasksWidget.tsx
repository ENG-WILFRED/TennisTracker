'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', orange: '#e8944f', blue: '#4ab0d0',
  red: '#ff6b6b',
};

interface AssignedTask {
  id: string;
  eventId?: string;
  title: string;
  description?: string;
  role: string;
  responsibility?: string;
  status: string;
  priority: string;
  dueDate?: string;
  organizationId?: string;
}

interface TasksWidgetProps {
  userId: string;
  limit?: number;
}

const TASKS_PER_PAGE = 10;

export default function AssignedTasksWidget({ userId, limit = 3 }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

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
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, [userId, currentPage]);

  async function fetchAssignedTasks() {
    try {
      setLoading(true);
      // Calculate offset based on current page
      const offset = (currentPage - 1) * TASKS_PER_PAGE;
      // Get all organizations for this user, then fetch their tasks
      const res = await authenticatedFetch(`/api/user/${userId}/assigned-tasks?offset=${offset}&limit=${TASKS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []));
        setTotalTasks(data.total || data.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch assigned tasks', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchAssignedTasks();
  };

  const handleBackgroundRefresh = async () => {
    setIsRefreshing(true);
    try {
      const offset = (currentPage - 1) * TASKS_PER_PAGE;
      const res = await authenticatedFetch(`/api/user/${userId}/assigned-tasks?offset=${offset}&limit=${TASKS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []));
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

  async function handleAcceptTask(taskId: string, orgId: string) {
    setProcessingId(taskId);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks/${taskId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Task accepted!');
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'accepted' } : t));
      } else {
        toast.error('Failed to accept task');
      }
    } catch (err) {
      toast.error('Error accepting task');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectTask(taskId: string, orgId: string) {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(taskId);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks/${taskId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (res.ok) {
        toast.success('Task rejected');
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'rejected' } : t));
        setShowRejectModal(null);
        setRejectionReason('');
      } else {
        toast.error('Failed to reject task');
      }
    } catch (err) {
      toast.error('Error rejecting task');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReopenTask(taskId: string, orgId: string) {
    setProcessingId(taskId);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks/${taskId}/reopen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Task reopened');
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t));
      } else {
        toast.error('Failed to reopen task');
      }
    } catch (err) {
      toast.error('Error reopening task');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  const statsCount = (status: string) => tasks.filter(t => t.status === status).length;

  if (loading) {
    return (
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: G.muted }}>Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: G.text, margin: 0 }}>📋 Assigned Tasks</h2>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.text }}>{tasks.length}</div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Pending</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.yellow }}>{statsCount('pending')}</div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Accepted</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.bright }}>{statsCount('accepted')}</div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Completed</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>{statsCount('completed')}</div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Rejected</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.red }}>{statsCount('rejected')}</div>
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
                {statusConfig[status]?.icon || '•'} {status === 'all' ? 'All' : status}
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

        {/* Tasks Container */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10 }}>

        {(() => {
          const filteredTasks = tasks.filter(task => {
            const statusMatch = filterStatus === 'all' || task.status === filterStatus;
            const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
            return statusMatch && priorityMatch;
          });

          return filteredTasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: G.muted }}>
              {filterStatus === 'all' && filterPriority === 'all' ? (
                'No tasks assigned yet'
              ) : filterStatus !== 'all' && filterPriority === 'all' ? (
                `No ${filterStatus} tasks`
              ) : filterStatus === 'all' && filterPriority !== 'all' ? (
                `No ${filterPriority} priority tasks`
              ) : (
                `No ${filterStatus} tasks under ${filterPriority} priority`
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
              {filteredTasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  background: '#0f1f0f',
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{task.title}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>
                      {task.role} {task.dueDate && `• Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      background: (priorityConfig[task.priority] || priorityConfig.medium).bgColor,
                      color: (priorityConfig[task.priority] || priorityConfig.medium).color,
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.responsibility && (
                  <div style={{ fontSize: 10, color: G.text, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${G.cardBorder}` }}>
                    {task.responsibility}
                  </div>
                )}

                {/* Action Buttons */}
                {task.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => task.organizationId ? handleAcceptTask(task.id, task.organizationId) : toast.error('Organization ID not available')}
                      disabled={processingId === task.id || !task.organizationId}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: G.bright,
                        color: G.text,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: processingId === task.id ? 'not-allowed' : 'pointer',
                        opacity: processingId === task.id ? 0.6 : 1,
                      }}
                    >
                      {processingId === task.id ? '⏳' : '✓'} Accept
                    </button>
                    <button
                      onClick={() => setShowRejectModal(task.id)}
                      disabled={processingId === task.id}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: 'transparent',
                        color: G.red,
                        border: `1px solid ${G.red}`,
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: processingId === task.id ? 'not-allowed' : 'pointer',
                        opacity: processingId === task.id ? 0.6 : 1,
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {task.status !== 'pending' && (
                  task.status === 'rejected' ? (
                    <button
                      onClick={() => task.organizationId && handleReopenTask(task.id, task.organizationId)}
                      disabled={processingId === task.id || !task.organizationId}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: G.blue,
                        color: G.text,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: processingId === task.id ? 'not-allowed' : 'pointer',
                        opacity: processingId === task.id ? 0.6 : 1,
                      }}
                    >
                      {processingId === task.id ? '⏳' : '↺'} Reopen
                    </button>
                  ) : (
                    <div style={{
                      padding: '6px 10px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 4,
                      fontSize: 10,
                      color: (statusConfig[task.status] || statusConfig.pending).color,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      {statusConfig[task.status]?.icon || '•'} {task.status.replace('_', ' ')}
                    </div>
                  )
                )}
              </div>
            ))}
            </div>
          );
        })()}

          {/* Pagination Controls */}
          {tasks.length > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTop: `1px solid ${G.cardBorder}` }}>
              <div style={{ fontSize: 10, color: G.muted }}>
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
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setShowRejectModal(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: G.sidebar,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: G.text }}>Reject Task</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 8 }}>
                Why are you rejecting this task? *
              </label>
              <textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: G.card,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  color: G.text,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  minHeight: 80,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  const orgId = tasks.find(t => t.id === showRejectModal)?.organizationId;
                  if (!orgId) {
                    toast.error('Organization ID not available');
                    return;
                  }
                  handleRejectTask(showRejectModal, orgId);
                }}
                disabled={processingId === showRejectModal || !rejectionReason.trim() || !tasks.find(t => t.id === showRejectModal)?.organizationId}
                style={{
                  flex: 1,
                  background: G.red,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: processingId === showRejectModal || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: processingId === showRejectModal || !rejectionReason.trim() ? 0.6 : 1,
                }}
              >
                {processingId === showRejectModal ? '⏳ Rejecting...' : '✕ Reject'}
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: G.muted,
                  border: `1px solid ${G.cardBorder}`,
                  padding: '10px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
