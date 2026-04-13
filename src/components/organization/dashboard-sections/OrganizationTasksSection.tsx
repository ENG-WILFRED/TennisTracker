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
}

const TASKS_PER_PAGE = 10;

export default function OrganizationTasksSection({ orgId, pendingTasks = [] }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
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
      fetchTasks();
      fetchStaff();
    }
  }, [orgId, currentPage]);

  async function fetchTasks() {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * TASKS_PER_PAGE;
      const res = await authenticatedFetch(`/api/organization/${orgId}/tasks?offset=${offset}&limit=${TASKS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []));
        setTotalTasks(data.total || data.length || 0);
      }
    } catch (err) {
      toast.error('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchTasks();
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

  const handleTaskAssigned = (newTask?: any) => {
    if (newTask) {
      // Optimistically add the new task to the list (don't refetch)
      const formattedTask = {
        id: newTask.id || newTask.data?.id,
        staffUserId: newTask.assignedToId || newTask.data?.assignedToId || '',
        title: newTask.template?.name || newTask.data?.template?.name || 'Task',
        description: newTask.notes || newTask.data?.notes,
        status: newTask.status || 'pending',
        role: newTask.template?.type || newTask.data?.template?.type || 'Task',
        priority: newTask.context?.priority || 'normal',
        dueDate: newTask.dueDate || newTask.data?.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'typed_task'
      };
      setTasks([formattedTask as Task, ...tasks]);
    }
    toast.success('Task assigned successfully');
    setShowAssignModal(false);
  };

  const filteredTasks = tasks.filter(t => {
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || t.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

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
                style={{
                  padding: 14,
                  borderBottom: idx < filteredTasks.length - 1 ? `1px solid ${G.cardBorder}` : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
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
    </div>
  );
}
