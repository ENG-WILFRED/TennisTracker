'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Trophy, AlertCircle, CheckCircle, Clock, Plus, Edit2, Send, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface TaskDetailsPanelProps {
  taskId: string;
  refereeId: string;
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

export default function TaskDetailsPanel({ taskId, refereeId, onClose }: TaskDetailsPanelProps) {
  const [task, setTask] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'matches' | 'resources' | 'progress'>('details');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newMatch, setNewMatch] = useState({ playerA: '', playerB: '', scheduledTime: '' });
  const [newResource, setNewResource] = useState({ resourceType: '', quantity: 1, description: '' });
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedMatchForResults, setSelectedMatchForResults] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, progressRes] = await Promise.all([
          authenticatedFetch(`/api/referee/tasks/${taskId}/details`),
          authenticatedFetch(`/api/referee/tasks/${taskId}/progress`),
        ]);

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTask(taskData);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      const res = await authenticatedFetch(`/api/referee/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTask((prev: any) => ({ ...prev, task: { ...prev.task, status: updated.task.status } }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateMatch = async () => {
    if (task.matches?.list?.length > 0) {
      setToast({ type: 'error', message: 'Manual match creation is disabled after group stage generation.' });
      return;
    }

    if (!newMatch.playerA || !newMatch.playerB) {
      alert('Please select both players');
      return;
    }

    try {
      const res = await authenticatedFetch(`/api/referee/tasks/${taskId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAId: newMatch.playerA,
          playerBId: newMatch.playerB,
          scheduledTime: newMatch.scheduledTime,
        }),
      });

      if (res.ok) {
        setShowNewMatchForm(false);
        setNewMatch({ playerA: '', playerB: '', scheduledTime: '' });
        // Refresh task details
        const taskRes = await authenticatedFetch(`/api/referee/tasks/${taskId}/details`);
        if (taskRes.ok) {
          setTask(await taskRes.json());
        }
      } else {
        const errorData = await res.json();
        setToast({ type: 'error', message: errorData?.error || 'Failed to create match.' });
      }
    } catch (error: any) {
      console.error('Error creating match:', error);
      setToast({ type: 'error', message: error?.message || 'Error creating match.' });
    }
  };

  const handleRequestResource = async () => {
    if (!newResource.resourceType) {
      alert('Please select a resource type');
      return;
    }

    try {
      const res = await authenticatedFetch(`/api/referee/tasks/${taskId}/resource-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      });

      if (res.ok) {
        setShowResourceForm(false);
        setNewResource({ resourceType: '', quantity: 1, description: '' });
        // Refresh task details
        const taskRes = await authenticatedFetch(`/api/referee/tasks/${taskId}/details`);
        if (taskRes.ok) {
          setTask(await taskRes.json());
        }
      }
    } catch (error) {
      console.error('Error requesting resource:', error);
    }
  };

  const getPlayerName = (player: any) => {
    if (!player) return 'TBD';
    if (typeof player === 'string') return player;
    if (player.name) return player.name;
    const fullName = `${player.user?.firstName || ''} ${player.user?.lastName || ''}`.trim();
    return fullName || 'TBD';
  };

  const handleGenerateGroupStage = async () => {
    const players = task.players || [];
    if (players.length < 2) {
      alert('You need at least two registered players to build a group stage.');
      return;
    }

    const pairs: Array<{ playerAId: string; playerBId: string; round: number; matchPosition: number }> = [];
    for (let i = 0; i < players.length; i += 2) {
      const playerA = players[i];
      const playerB = players[i + 1];
      if (!playerB) {
        console.warn('Odd number of players, leaving last player unpaired:', playerA);
        continue;
      }
      pairs.push({
        playerAId: playerA.id,
        playerBId: playerB.id,
        round: 1,
        matchPosition: Math.floor(i / 2),
      });
    }

    if (!pairs.length) {
      alert('No valid player pairs could be created from the current registration list.');
      return;
    }

    try {
      setGeneratingMatches(true);
      setToast(null);
      await Promise.all(
        pairs.map(async (pair) => {
          const res = await authenticatedFetch(`/api/referee/tasks/${taskId}/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pair, groupStageGeneration: true }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData?.error || 'Failed to create group stage matches');
          }

          return res.json();
        })
      );

      const taskRes = await authenticatedFetch(`/api/referee/tasks/${taskId}/details`);
      if (taskRes.ok) {
        setTask(await taskRes.json());
        setActiveTab('matches');
      }
    } catch (error: any) {
      console.error('Error generating group stage matches:', error);
      setToast({ type: 'error', message: error?.message || 'Failed to generate group stage matches.' });
    } finally {
      setGeneratingMatches(false);
    }
  };

  const refreshTaskData = async () => {
    try {
      const [taskRes, progressRes] = await Promise.all([
        authenticatedFetch(`/api/referee/tasks/${taskId}/details`),
        authenticatedFetch(`/api/referee/tasks/${taskId}/progress`),
      ]);

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTask(taskData);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error refreshing task data:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse text-gray-500">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
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

  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, width: '100%' }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 4 }}>{task.task?.title}</h2>
          <p style={{ fontSize: 11, color: G.text2 }}>{task.task?.description}</p>
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

      {/* Status and Actions */}
      <div style={{ padding: '16px 20px', background: G.card2, borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 6,
            padding: '4px 10px',
            background: statusColors[task.task?.status]?.bg || `${G.muted}22`,
            border: `1px solid ${statusColors[task.task?.status]?.border || G.muted}`,
            color: statusColors[task.task?.status]?.text || G.text,
          }}>
            {task.task?.status}
          </span>
          <span style={{ fontSize: 11, color: G.muted2 }}>
            Assigned by: {task.task?.assignedBy}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {task.task?.status === 'ASSIGNED' && (
            <button
              onClick={() => handleStatusUpdate('ACCEPTED')}
              disabled={statusUpdating}
              style={{
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 10,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              Accept Task
            </button>
          )}
          {task.task?.status === 'ACCEPTED' && (
            <button
              onClick={() => handleStatusUpdate('IN_PROGRESS')}
              disabled={statusUpdating}
              style={{
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 10,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              Start Task
            </button>
          )}
          {task.task?.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={statusUpdating}
              style={{
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 10,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${G.border}` }}>
        {(['details', 'matches', 'resources', 'progress'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              fontSize: 11,
              fontWeight: 600,
              borderBottom: activeTab === tab ? `2px solid ${G.lime}` : `2px solid transparent`,
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: activeTab === tab ? G.lime : G.muted,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                (e.currentTarget as HTMLButtonElement).style.color = G.text2;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                (e.currentTarget as HTMLButtonElement).style.color = G.muted;
              }
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 20 }}>
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: G.muted2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task Type</label>
                <p style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{task.task?.type}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: G.muted2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Organization</label>
                <p style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{task.task?.organization?.name}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: G.muted2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date</label>
                <p style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{task.task?.dueDate ? new Date(task.task.dueDate).toLocaleDateString() : 'No due date'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: G.muted2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Started At</label>
                <p style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{task.task?.startedAt ? new Date(task.task.startedAt).toLocaleString() : 'Not started'}</p>
              </div>
            </div>

            {task.players?.length > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: G.card2, border: `1px solid ${G.border}`, borderRadius: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: G.lime, marginBottom: 10 }}>Registered Players</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {task.players.map((player: any) => (
                    <div key={player.id || player.userId} style={{ padding: 12, background: G.card, borderRadius: 10, border: `1px solid ${G.border}` }}>
                      <div style={{ fontSize: 12, color: G.text, fontWeight: 700 }}>{getPlayerName(player)}</div>
                      {player.email && <div style={{ marginTop: 4, fontSize: 11, color: G.muted2 }}>{player.email}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.event && (
              <div style={{ marginTop: 16, padding: 16, background: G.card2, border: `1px solid ${G.border}`, borderRadius: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: G.lime, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🏆</span>
                  Tournament Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontSize: 11, color: G.text }}><span style={{ color: G.muted2, fontWeight: 600 }}>Name:</span> {task.event.name}</p>
                  <p style={{ fontSize: 11, color: G.text }}><span style={{ color: G.muted2, fontWeight: 600 }}>Players:</span> {task.event.playerCount}</p>
                  <p style={{ fontSize: 11, color: G.text }}><span style={{ color: G.muted2, fontWeight: 600 }}>Type:</span> {task.event.eventType}</p>
                  <p style={{ fontSize: 11, color: G.text }}><span style={{ color: G.muted2, fontWeight: 600 }}>Dates:</span> {new Date(task.event.startDate).toLocaleDateString()} - {new Date(task.event.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: G.text }}>
                  Matches: {task.matches?.played}/{task.matches?.total}
                </h3>
                <div style={{ marginTop: 10, width: '100%', background: G.card3, borderRadius: 9999, height: 10 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(task.matches?.played / task.matches?.total * 100) || 0}%`,
                      backgroundColor: G.lime,
                      borderRadius: 9999,
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowNewMatchForm(!showNewMatchForm)}
                  disabled={task.matches?.list?.length > 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: task.matches?.list?.length > 0 ? G.border2 : G.lime,
                    color: '#0a180a',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: task.matches?.list?.length > 0 ? 'not-allowed' : 'pointer',
                    opacity: task.matches?.list?.length > 0 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {task.matches?.list?.length > 0 ? 'Match Creation Locked' : 'New Match'}
                </button>
                <button
                  onClick={handleGenerateGroupStage}
                  disabled={generatingMatches || task.matches?.list?.length > 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: task.matches?.list?.length > 0 ? G.border2 : G.bright,
                    color: '#0a180a',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: generatingMatches || task.matches?.list?.length > 0 ? 'not-allowed' : 'pointer',
                    opacity: generatingMatches || task.matches?.list?.length > 0 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {generatingMatches ? (
                    <span>⟳</span>
                  ) : (
                    <span>⚡</span>
                  )}
                  {task.matches?.list?.length > 0 ? 'Group Stage Generated' : generatingMatches ? 'Generating...' : 'Generate Group Stage'}
                </button>
              </div>
            </div>

            {task.matches?.list?.length > 0 && (
              <div style={{ padding: 12, background: G.card3, borderRadius: 12, border: `1px solid ${G.border}`, marginBottom: 12 }}>
                <p style={{ color: G.text2, fontSize: 12 }}>
                  Group stage matches are already generated and saved. Manual match creation is locked for this task.
                </p>
              </div>
            )}

            {generatingMatches && (
              <div style={{ padding: 16, background: G.card3, borderRadius: 12, border: `1px solid ${G.border}`, marginBottom: 12 }}>
                <p style={{ color: G.text2, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Generating group-stage matches...</span>
                </p>
              </div>
            )}

            {toast && (
              <div style={{
                padding: 14,
                backgroundColor: toast.type === 'error' ? G.red + '22' : G.lime + '22',
                borderRadius: 12,
                border: `1px solid ${toast.type === 'error' ? G.red : G.lime}`,
                marginBottom: 12
              }}>
                <p style={{
                  color: toast.type === 'error' ? G.red : G.lime,
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {toast.message}
                </p>
              </div>
            )}

            {showNewMatchForm && task.matches?.list?.length === 0 && (
              <div style={{ padding: 20, background: G.card2, borderRadius: 12, border: `1px solid ${G.lime2}` }}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <select
                    value={newMatch.playerA}
                    onChange={(e) => setNewMatch({ ...newMatch, playerA: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 13 }}
                  >
                    <option value="">Select Player A</option>
                    {task.players?.map((p: any) => (
                      <option key={p.id || p.userId} value={p.userId || p.id}>{getPlayerName(p)}</option>
                    ))}
                  </select>
                  <select
                    value={newMatch.playerB}
                    onChange={(e) => setNewMatch({ ...newMatch, playerB: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 13 }}
                  >
                    <option value="">Select Player B</option>
                    {task.players?.map((p: any) => (
                      <option key={p.id || p.userId} value={p.userId || p.id}>{getPlayerName(p)}</option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={newMatch.scheduledTime}
                    onChange={(e) => setNewMatch({ ...newMatch, scheduledTime: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleCreateMatch}
                      style={{ flex: 1, background: G.lime, color: '#0a180a', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Create Match
                    </button>
                    <button
                      onClick={() => setShowNewMatchForm(false)}
                      style={{ flex: 1, background: 'transparent', color: G.text2, border: `1px solid ${G.border}`, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Matches List */}
            <div style={{ display: 'grid', gap: 12 }}>
              {task.matches?.list?.map((match: any) => (
                <div key={match.id} style={{ padding: 18, background: G.card2, borderRadius: 14, border: `1px solid ${G.border}`, borderLeft: `4px solid ${G.lime}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: G.text }}>
                        {getPlayerName(match.playerA)} vs {getPlayerName(match.playerB)}
                      </p>
                      {match.group && (
                        <p style={{ fontSize: 11, color: G.lime2, marginTop: 4 }}>{match.group}</p>
                      )}
                      <p style={{ fontSize: 12, color: G.text2, marginTop: 6 }}>
                        <span style={{ marginRight: 6 }}>🕒</span>
                        {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Not scheduled'}
                      </p>
                      {match.status === 'COMPLETED' && (
                        <p style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: G.lime }}>
                          Score: {match.scoreA} - {match.scoreB}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      <span style={{
                        padding: '6px 10px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 700,
                        color: G.dark,
                        backgroundColor: match.status === 'COMPLETED' ? G.lime : match.status === 'IN_PROGRESS' ? G.yellow + '22' : G.blue + '22'
                      }}>
                        {match.status === 'COMPLETED' ? 'COMPLETED' : match.status}
                      </span>
                      <button
                        onClick={() => match.status === 'COMPLETED' ? setSelectedMatchForResults(match) : window.open(`/matches?matchId=${match.id}`, '_blank')}
                        style={{ backgroundColor: match.status === 'COMPLETED' ? G.lime : G.lime, color: '#0a180a', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {match.status === 'COMPLETED' ? 'View Results' : 'Open Match'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div style={{ padding: 20 }}>
            <p>Resources tab content</p>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && progress && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ padding: 24, background: G.card2, borderRadius: 18, border: `1px solid ${G.border}`, boxShadow: `0 0 0 1px ${G.lime}11` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: G.lime, marginBottom: 12 }}>Overall Progress</h3>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: G.text2 }}>Task Completion</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: G.lime }}>{progress.progress?.overallPercentage}%</span>
                </div>
                <div style={{ width: '100%', background: G.card3, borderRadius: 9999, height: 12 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progress.progress?.overallPercentage}%`,
                      backgroundColor: G.lime,
                      borderRadius: 9999,
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <div style={{ padding: 18, background: G.card2, borderRadius: 16, border: `1px solid ${G.border}`, textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: G.lime }}>{progress.progress?.matches?.completed}</p>
                <p style={{ fontSize: 12, color: G.text2, marginTop: 8 }}>Matches Played</p>
              </div>
              <div style={{ padding: 18, background: G.card2, borderRadius: 16, border: `1px solid ${G.border}`, textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: G.lime }}>{progress.progress?.matches?.scheduled}</p>
                <p style={{ fontSize: 12, color: G.text2, marginTop: 8 }}>Scheduled</p>
              </div>
            </div>

            <div style={{ padding: 20, background: G.card2, borderRadius: 18, border: `1px solid ${G.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 12 }}>Top Performers</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {progress.playerPerformance?.slice(0, 5).map((player: any) => (
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: G.card, borderRadius: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{player.name}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                      <span style={{ color: G.lime, fontWeight: 700 }}>{player.wins}W</span>
                      <span style={{ color: G.red, fontWeight: 700 }}>{player.losses}L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 20, background: G.card2, borderRadius: 18, border: `1px solid ${G.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 12 }}>Recent Matches</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {progress.recentMatches?.map((match: any) => (
                  <div key={match.id} style={{ padding: '12px 14px', background: G.card, borderRadius: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{match.playerA} vs {match.playerB}</p>
                    <p style={{ fontSize: 12, color: G.text2, marginTop: 6 }}>Score: {match.scoreA}-{match.scoreB}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match Results Modal */}
      {selectedMatchForResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: G.lime }}>Match Results</h2>
              <button
                onClick={() => setSelectedMatchForResults(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: G.muted,
                  cursor: 'pointer',
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {/* Match Header */}
            <div style={{ padding: 20, background: G.card2, borderRadius: 12, border: `1px solid ${G.border}`, marginBottom: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: G.text, marginBottom: 2 }}>
                  {getPlayerName(selectedMatchForResults.playerA)} vs {getPlayerName(selectedMatchForResults.playerB)}
                </p>
                {selectedMatchForResults.group && (
                  <p style={{ fontSize: 12, color: G.lime2 }}>{selectedMatchForResults.group}</p>
                )}
              </div>

              {/* Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ textAlign: 'center', padding: 16, background: G.card, borderRadius: 10, border: `1px solid ${G.border}` }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 8 }}>{getPlayerName(selectedMatchForResults.playerA)}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: G.lime }}>
                    {selectedMatchForResults.scoreSetA?.split('-')[0] || '0'} - {selectedMatchForResults.scoreSetB?.split('-')[0] || '0'} - {selectedMatchForResults.scoreSetC?.split('-')[0] || '0'}
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: G.card, borderRadius: 10, border: `1px solid ${G.border}` }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 8 }}>{getPlayerName(selectedMatchForResults.playerB)}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: G.lime }}>
                    {selectedMatchForResults.scoreSetA?.split('-')[1] || '0'} - {selectedMatchForResults.scoreSetB?.split('-')[1] || '0'} - {selectedMatchForResults.scoreSetC?.split('-')[1] || '0'}
                  </p>
                </div>
              </div>

              {/* Set Scores */}
              {(selectedMatchForResults.scoreSetA || selectedMatchForResults.scoreSetB || selectedMatchForResults.scoreSetC) && (
                <div style={{ padding: 14, background: G.card3, borderRadius: 10, border: `1px solid ${G.border}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: G.muted2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Set Scores</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedMatchForResults.scoreSetA && (
                      <div style={{ padding: '8px 12px', background: G.card, borderRadius: 8, border: `1px solid ${G.border}` }}>
                        <p style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Set 1</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{selectedMatchForResults.scoreSetA}</p>
                      </div>
                    )}
                    {selectedMatchForResults.scoreSetB && (
                      <div style={{ padding: '8px 12px', background: G.card, borderRadius: 8, border: `1px solid ${G.border}` }}>
                        <p style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Set 2</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{selectedMatchForResults.scoreSetB}</p>
                      </div>
                    )}
                    {selectedMatchForResults.scoreSetC && (
                      <div style={{ padding: '8px 12px', background: G.card, borderRadius: 8, border: `1px solid ${G.border}` }}>
                        <p style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Set 3</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{selectedMatchForResults.scoreSetC}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Match Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 14, background: G.card2, borderRadius: 10, border: `1px solid ${G.border}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: G.muted2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Played</p>
                <p style={{ fontSize: 12, color: G.text }}>
                  {selectedMatchForResults.scheduledTime
                    ? new Date(selectedMatchForResults.scheduledTime).toLocaleString()
                    : 'Date not recorded'}
                </p>
              </div>
              {selectedMatchForResults.winnerId && (
                <div style={{ padding: 14, background: G.card2, borderRadius: 10, border: `1px solid ${G.lime}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: G.lime, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>🏆 Winner</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: G.lime }}>
                    {selectedMatchForResults.winnerId === selectedMatchForResults.playerA?.id
                      ? getPlayerName(selectedMatchForResults.playerA)
                      : getPlayerName(selectedMatchForResults.playerB)}
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedMatchForResults(null)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
