'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/LoadingState';

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: string;
  coach: {
    id: string;
    name: string;
    photo?: string;
  };
  court?: {
    id: string;
    name: string;
    courtNumber?: number;
    surface?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  price?: number;
  maxParticipants?: number;
  isDirectAssignment: boolean;
  booking?: any;
  type: 'session'; // Marker for type discrimination
}

interface Task {
  id: string;
  templateId: string;
  organizationId: string;
  assignedToId: string;
  assignedToUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  };
  status: string;
  context: Record<string, any>;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    type: string;
    role: string;
    description?: string;
  };
  organization: {
    id: string;
    name: string;
  };
  type: 'task'; // Marker for type discrimination
}

interface SessionsViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: '#1e5f3f', text: '#7dc142', border: '#7dc142' },
  confirmed: { bg: '#1e4f7f', text: '#7dbaff', border: '#7dbaff' },
  'in-progress': { bg: '#5f4f1f', text: '#f0c040', border: '#f0c040' },
  completed: { bg: '#1e5f2f', text: '#7dc142', border: '#7dc142' },
  cancelled: { bg: '#5f1f1f', text: '#ff7d7d', border: '#ff7d7d' },
  'no-show': { bg: '#5f3f1f', text: '#ffb366', border: '#ffb366' },
  // Task statuses
  'ASSIGNED': { bg: '#1e4f7f', text: '#7dbaff', border: '#7dbaff' },
  'ACCEPTED': { bg: '#1e5f3f', text: '#7dc142', border: '#7dc142' },
  'IN_PROGRESS': { bg: '#5f4f1f', text: '#f0c040', border: '#f0c040' },
  'COMPLETED': { bg: '#1e5f2f', text: '#7dc142', border: '#7dc142' },
  'FAILED': { bg: '#5f1f1f', text: '#ff7d7d', border: '#ff7d7d' },
  'CANCELLED': { bg: '#5f3f1f', text: '#ffb366', border: '#ffb366' },
};

export const SessionsView: React.FC<SessionsViewProps> = ({ isEmbedded = false, playerId = '' }) => {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string) || 'player';
  const routeUserId = params?.userId as string;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sessions' | 'tasks'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId) {
        setError('Player ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch both sessions and tasks in parallel
        const [sessionsRes, tasksRes] = await Promise.all([
          fetch(`/api/players/sessions?playerId=${playerId}`),
          fetch(`/api/players/tasks?playerId=${playerId}`),
        ]);

        if (!sessionsRes.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const sessionsData = await sessionsRes.json();
        const formattedSessions: Session[] = (sessionsData.sessions || []).map((s: any) => ({
          ...s,
          type: 'session' as const,
        }));
        setSessions(formattedSessions);

        // Tasks fetch might fail if no tasks exist, that's ok
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const formattedTasks: Task[] = (tasksData.tasks || []).map((t: any) => ({
            ...t,
            type: 'task' as const,
          }));
          setTasks(formattedTasks);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching sessions/tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
        setSessions([]);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  if (loading) {
    return <LoadingState icon="📅" message="Loading your sessions and tasks..." />;
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-6 border"
        style={{ background: G.card, borderColor: G.cardBorder, color: G.text }}
      >
        <div className="text-red-400 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Combine sessions and tasks based on active tab
  let combinedItems: (Session | Task)[] = [];
  if (activeTab === 'all') {
    combinedItems = [...sessions, ...tasks];
  } else if (activeTab === 'sessions') {
    combinedItems = sessions;
  } else {
    combinedItems = tasks;
  }

  // Group by status
  const groupedItems = combinedItems.reduce(
    (acc, item) => {
      const status = item.type === 'session' ? (item as Session).status : (item as Task).status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(item);
      return acc;
    },
    {} as Record<string, (Session | Task)[]>
  );

  // Sort statuses
  const sortedStatuses = Object.keys(groupedItems).sort((a, b) => {
    const order = [
      'scheduled', 'confirmed', 'ASSIGNED', 'ACCEPTED',
      'in-progress', 'IN_PROGRESS', 'completed', 'COMPLETED',
      'cancelled', 'CANCELLED', 'no-show', 'FAILED'
    ];
    return order.indexOf(a) - order.indexOf(b);
  });

  const totalItems = combinedItems.length;

  if (totalItems === 0) {
    return (
      <div
        className="rounded-xl p-8 border text-center"
        style={{ background: G.card, borderColor: G.cardBorder, color: G.text }}
      >
        <div className="text-4xl mb-3">🎾</div>
        <h3 className="text-lg font-semibold mb-2">No Sessions or Tasks</h3>
        <p style={{ color: G.muted }}>
          You don't have any coaching sessions or assigned tasks yet. Ask your coach to schedule one with you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[#2d5a35] bg-[#152515] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: G.text }}>
            📅 My Sessions & Tasks
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-4 border-b pb-4" style={{ borderColor: G.cardBorder }}>
          {(['all', 'sessions', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSelectedStatus(null);
              }}
              className="px-4 py-2 font-semibold text-sm transition-colors rounded-full"
              style={{
                color: activeTab === tab ? '#0f1f0f' : G.muted,
                backgroundColor: activeTab === tab ? G.lime : G.card,
                border: activeTab === tab ? `1px solid ${G.lime}` : `1px solid ${G.cardBorder}`,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {' '}
              ({tab === 'all' ? totalItems : tab === 'sessions' ? sessions.length : tasks.length})
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedStatus(null)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex-shrink-0 ${
              selectedStatus === null
                ? 'text-[#0f1f0f]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={{
              backgroundColor: selectedStatus === null ? G.bright : G.card,
              borderColor: G.cardBorder,
              border: '1px solid',
            }}
          >
            All ({combinedItems.length})
          </button>
          {sortedStatuses.map(status => {
            const count = groupedItems[status].length;
            const colors = statusColors[status] || statusColors['scheduled'];
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className="px-4 py-2 rounded-full font-semibold text-sm transition-colors flex-shrink-0"
                style={{
                  backgroundColor:
                    selectedStatus === status
                      ? colors.bg
                      : G.card,
                  color: selectedStatus === status ? colors.text : G.muted,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[#2d5a35] bg-[#152515] p-4">
        <div className="space-y-3">
          {sortedStatuses.map(status => {
            const statusItems = groupedItems[status];
            if (selectedStatus && selectedStatus !== status) {
              return null;
            }

            return (
              <div key={status}>
                {selectedStatus === null && (
                  <h3
                    className="text-sm font-bold mb-2 uppercase tracking-wide"
                    style={{ color: G.lime }}
                  >
                    {status.replace('-', ' ').replace('_', ' ')}
                  </h3>
                )}
                <div className="space-y-2">
                  {statusItems.map(item => {
                    const itemStatus = item.type === 'session' ? (item as Session).status : (item as Task).status;
                    const colors = statusColors[itemStatus] || statusColors['scheduled'];

                    if (item.type === 'session') {
                      const session = item as Session;
                      const startDate = new Date(session.startTime);
                      const endDate = new Date(session.endTime);
                      const dateStr = startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });
                      const timeStr = `${startDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - ${endDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`;

                      return (
                        <div
                          key={session.id}
                          onClick={() => router.push(`/dashboard/${role}/${playerId}/session/${session.id}?sessions=true`)}
                          className="rounded-lg p-4 border transition-all hover:shadow-lg cursor-pointer"
                          style={{
                            background: G.card,
                            borderColor: colors.border,
                            borderWidth: '2px',
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📅</span>
                                <h4 className="text-lg font-bold" style={{ color: G.text }}>
                                  {session.title}
                                </h4>
                              </div>
                              {session.description && (
                                <p
                                  className="text-sm mt-1"
                                  style={{ color: G.muted }}
                                >
                                  {session.description}
                                </p>
                              )}
                            </div>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold ml-3 flex-shrink-0"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              {session.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📅</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Date
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {dateStr}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xl">⏰</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Time
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {timeStr}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xl">👨‍🏫</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Coach
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {session.coach.name}
                                </div>
                              </div>
                            </div>

                            {session.court && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🎾</span>
                                <div>
                                  <div className="text-xs" style={{ color: G.muted }}>
                                    Court
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color: G.text }}>
                                    {session.court.name}
                                    {session.court.courtNumber && ` #${session.court.courtNumber}`}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-xl">📋</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Type
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {session.sessionType.replace(/-/g, ' ').toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {session.price && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">💰</span>
                                <div>
                                  <div className="text-xs" style={{ color: G.muted }}>
                                    Price
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color: G.lime }}>
                                    KSh {session.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {session.booking && (
                            <div
                              className="text-xs p-2 rounded border mt-3"
                              style={{
                                background: G.dark,
                                borderColor: G.cardBorder,
                                color: G.muted,
                              }}
                            >
                              <div className="font-semibold mb-1">Booking Details:</div>
                              <div>Status: {session.booking.status}</div>
                              {session.booking.attendanceStatus && (
                                <div>Attendance: {session.booking.attendanceStatus}</div>
                              )}
                              {session.booking.feedbackRating && (
                                <div>Rating: {session.booking.feedbackRating}/5 ⭐</div>
                              )}
                            </div>
                          )}

                          {session.isDirectAssignment && (
                            <div
                              className="text-xs p-2 rounded border mt-3 flex items-center gap-2"
                              style={{
                                background: G.dark,
                                borderColor: G.lime,
                                color: G.lime,
                              }}
                            >
                              <span>✓</span>
                              <span>Directly assigned by your coach</span>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Task rendering
                      const task = item as Task;
                      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                      const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED' && task.status !== 'FAILED';

                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            toast('Navigating to task details...', { duration: 2000 });
                            router.push(`/dashboard/${role}/${playerId}/task/${task.id}?sessions=true`);
                          }}
                          className="rounded-lg p-4 border transition-all hover:shadow-lg cursor-pointer"
                          style={{
                            background: G.card,
                            borderColor: colors.border,
                            borderWidth: '2px',
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📋</span>
                                <h4 className="text-lg font-bold" style={{ color: G.text }}>
                                  {task.template.name}
                                </h4>
                              </div>
                              {task.template.description && (
                                <p className="text-sm mt-1" style={{ color: G.muted }}>
                                  {task.template.description}
                                </p>
                              )}
                            </div>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold ml-3 flex-shrink-0"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              {task.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">👨‍🏫</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Assigned Coach
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xl">📂</span>
                              <div>
                                <div className="text-xs" style={{ color: G.muted }}>
                                  Type
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {task.template.type}
                                </div>
                              </div>
                            </div>

                            {dueDate && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">📅</span>
                                <div>
                                  <div className="text-xs" style={{ color: G.muted }}>
                                    Due Date
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color: isOverdue ? '#ff7d7d' : G.text }}>
                                    {dueDate.toLocaleDateString()}
                                    {isOverdue && ' ⚠️'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {task.notes && (
                            <div
                              className="text-xs p-2 rounded border"
                              style={{
                                background: G.dark,
                                borderColor: G.cardBorder,
                                color: G.muted,
                              }}
                            >
                              <div className="font-semibold mb-1">Notes:</div>
                              <div>{task.notes}</div>
                            </div>
                          )}

                          <div
                            className="text-xs p-2 rounded border mt-3 flex items-center gap-2"
                            style={{
                              background: G.dark,
                              borderColor: G.lime,
                              color: G.lime,
                            }}
                          >
                            <span>👆</span>
                            <span>Click to view full details</span>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
