import React, { useEffect, useState } from 'react';
import { TaskRole, TaskType, Task } from '@/types/task-system';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface AssignCardProps {
  organizationId: string;
  onTaskAssigned?: (task: Task) => void;
  onClose?: () => void;
}

type RoleType = 'REFEREE' | 'COACH';

interface AssignFormData {
  role: RoleType;
  userId: string;
  templateType: string;
  tournamentId?: string;
  eventId?: string;
  courtId?: string;
  dueDate?: string;
  notes: string;
  // Referee-specific specs
  refereEventType?: string;
  matchDuration?: number;
  courtNumber?: string;
  // Coach-specific specs
  coachTrainingType?: string;
  playerCount?: number;
  sessionDuration?: number;
  selectedPlayerIds?: string[]; // Players selected for coach tasks
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  email?: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  role: string;
  type: string;
}

export function AssignCard({
  organizationId,
  onTaskAssigned,
  onClose,
}: AssignCardProps) {
  const [formData, setFormData] = useState<AssignFormData>({
    role: 'REFEREE',
    userId: '',
    templateType: '',
    notes: '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [orgPlayers, setOrgPlayers] = useState<Player[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingOrgPlayers, setLoadingOrgPlayers] = useState(false);

  // Fetch task templates based on role
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await authenticatedFetch(
          `/api/admin/task-templates?organizationId=${organizationId}&role=${formData.role}`
        );
        if (res.ok) {
          const data = await res.json();
          // API returns { success: true, data: templates, count }
          const templatesList = data.data || data.templates || [];
          setTemplates(Array.isArray(templatesList) ? templatesList : []);
        } else {
          setTemplates([]);
        }
      } catch (err) {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (organizationId) fetchTemplates();
  }, [formData.role, organizationId]);

  // Fetch referees or coaches based on role
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setFetchingData(true);
        let endpoint = '';
        
        if (formData.role === 'REFEREE') {
          // Fetch referees using staff endpoint with referee role
          endpoint = `/api/organization/${organizationId}/staff?role=referee`;
        } else {
          // Fetch coaches using the new coaches endpoint with caching
          endpoint = `/api/organization/${organizationId}/coaches`;
        }
        
        const res = await authenticatedFetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          // Handle both array response and object with coaches/staff property
          const usersList = formData.role === 'COACH' 
            ? (Array.isArray(data) ? data : data.coaches || [])
            : (Array.isArray(data) ? data : data.staff || []);
          setUsers(usersList);
        } else {
          setUsers([]);
        }
        setFormData(prev => ({ ...prev, userId: '' }));
      } catch (err) {
        setUsers([]);
      } finally {
        setFetchingData(false);
      }
    };

    fetchUsers();
  }, [formData.role, organizationId]);

  // Fetch tournaments - only for referees
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        if (formData.role === 'REFEREE') {
          const res = await authenticatedFetch(`/api/tournaments`);
          
          if (res.ok) {
            const data = await res.json();
            setTournaments(Array.isArray(data) ? data : data.tournaments || []);
          }
        } else {
          setTournaments([]);
        }
      } catch (err) {
        // Silently handle error
      }
    };

    if (organizationId) fetchTournaments();
  }, [organizationId, formData.role]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await authenticatedFetch(
          `/api/organization/${organizationId}/events`
        );
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : data.events || []);
        }
      } catch (err) {
        // Silently handle error
      }
    };

    if (organizationId) fetchEvents();
  }, [organizationId]);

  // Fetch courts with auth
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await authenticatedFetch(
          `/api/organization/${organizationId}/courts`
        );
        if (res.ok) {
          const data = await res.json();
          setCourts(Array.isArray(data) ? data : data.courts || []);
        }
      } catch (err) {
        // Silently handle error
      }
    };

    if (organizationId) fetchCourts();
  }, [organizationId]);

  // Fetch players when tournament is selected (REFEREE only)
  useEffect(() => {
    if (formData.role === 'REFEREE') {
      if (!formData.tournamentId) {
        setPlayers([]);
        setLoadingPlayers(false);
        return;
      }

      const fetchPlayers = async () => {
        try {
          setLoadingPlayers(true);
          const res = await authenticatedFetch(
            `/api/tournaments/${formData.tournamentId}`
          );
          if (res.ok) {
            const data = await res.json();
            // Extract players from registrations
            const playersList = data.registrations?.map((reg: any) => ({
              id: reg.member?.player?.userId || reg.memberId,
              name: reg.member?.player?.user?.firstName + ' ' + reg.member?.player?.user?.lastName || 'Unknown',
              email: reg.member?.player?.user?.email,
            })) || [];
            setPlayers(playersList);
          }
        } catch (err) {
          // Silently handle error
        } finally {
          setLoadingPlayers(false);
        }
      };

      fetchPlayers();
    }
  }, [formData.tournamentId, formData.role]);

  // Fetch organization players for coaches - ONLY when a coach is selected
  useEffect(() => {
    if (formData.role === 'COACH' && formData.userId) {
      const fetchOrgPlayers = async () => {
        try {
          setLoadingOrgPlayers(true);
          const res = await authenticatedFetch(
            `/api/organization/${organizationId}/players`
          );
          if (res.ok) {
            const data = await res.json();
            const players = Array.isArray(data) ? data : data.players || [];
            setOrgPlayers(players);
          } else {
            setOrgPlayers([]);
          }
        } catch (err) {
          setOrgPlayers([]);
        } finally {
          setLoadingOrgPlayers(false);
        }
      };

      fetchOrgPlayers();
    } else {
      setOrgPlayers([]);
      setSelectedPlayers([]);
    }
  }, [formData.role, formData.userId, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build context data based on role
      const context: Record<string, any> = {
        role: formData.role,
      };

      if (formData.role === 'REFEREE') {
        context.eventType = formData.refereEventType;
        context.matchDuration = formData.matchDuration;
        context.courtNumber = formData.courtNumber;
        context.courtId = formData.courtId;
        context.eventId = formData.eventId;
        context.tournamentId = formData.tournamentId;
        context.registeredPlayerIds = players.map(p => p.id);
      } else if (formData.role === 'COACH') {
        context.trainingType = formData.coachTrainingType;
        // Use selected players count, or manual playerCount if set
        context.playerCount = selectedPlayers.length > 0 ? selectedPlayers.length : formData.playerCount;
        context.sessionDuration = formData.sessionDuration;
        context.courtId = formData.courtId;
        // Important: NO tournamentId for coach tasks
        context.selectedPlayerIds = selectedPlayers;
      }

      const payload = {
        organizationId,
        assignmentPayload: {
          templateId: formData.templateType,
          assignedToId: formData.userId,
          context,
          dueDate: formData.dueDate
            ? new Date(formData.dueDate)
            : undefined,
          notes: formData.notes,
        },
      };

      const res = await authenticatedFetch('/api/admin/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign task');
      }

      const data = await res.json();
      onTaskAssigned?.(data.data);

      // Reset form
      setFormData({
        role: 'REFEREE',
        userId: '',
        templateType: '',
        notes: '',
      });
      setSelectedPlayers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 1000,
      background: G.sidebar,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: G.lime, marginBottom: 4 }}>
          📋 Assign Task
        </h2>
        <p style={{ fontSize: 11, color: G.muted }}>
          Create and assign a new task to a referee or coach with specific details
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {error && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10,
            background: 'rgba(255, 107, 107, 0.12)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: 8,
            color: '#ff6b6b',
            fontSize: 11,
          }}>
            {error}
          </div>
        )}

        {/* Role Selection - Full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 6 }}>
            Role
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, role: 'REFEREE', userId: '' })
              }
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 6,
                border: `2px solid ${formData.role === 'REFEREE' ? G.lime : G.cardBorder}`,
                background: formData.role === 'REFEREE' ? 'rgba(125, 193, 66, 0.15)' : 'transparent',
                color: formData.role === 'REFEREE' ? G.lime : G.muted,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ⚖️ Referee
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, role: 'COACH', userId: '' })
              }
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 6,
                border: `2px solid ${formData.role === 'COACH' ? G.bright : G.cardBorder}`,
                background: formData.role === 'COACH' ? 'rgba(61, 122, 50, 0.15)' : 'transparent',
                color: formData.role === 'COACH' ? G.bright : G.muted,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🏆 Coach
            </button>
          </div>
        </div>

        {/* Task Type Selection - Full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
            Task Type
          </label>
          <select
            value={formData.templateType}
            onChange={(e) =>
              setFormData({ ...formData, templateType: e.target.value })
            }
            disabled={loadingTemplates}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 6,
              color: G.text,
              fontSize: 11,
              fontFamily: 'inherit',
              cursor: loadingTemplates ? 'not-allowed' : 'pointer',
              opacity: loadingTemplates ? 0.6 : 1,
            }}
          >
            <option value="">{loadingTemplates ? 'Loading task types...' : 'Select a task type...'}</option>
            {templates.length > 0 ? (
              templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))
            ) : (
              !loadingTemplates && <option disabled>No task types available</option>
            )}
          </select>
        </div>

        {/* User Selection - Full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
            Assign To
          </label>
          <select
            value={formData.userId}
            onChange={(e) =>
              setFormData({ ...formData, userId: e.target.value })
            }
            disabled={fetchingData}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 6,
              color: G.text,
              fontSize: 11,
              fontFamily: 'inherit',
              cursor: fetchingData ? 'not-allowed' : 'pointer',
              opacity: fetchingData ? 0.6 : 1,
            }}
          >
            <option value="">{fetchingData ? 'Loading...' : `Select a ${formData.role.toLowerCase()}...`}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tournament Selection (REFEREE only) */}
        {formData.role === 'REFEREE' && (
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
              Tournament
            </label>
            <select
              value={formData.tournamentId || ''}
              onChange={(e) =>
                setFormData({ ...formData, tournamentId: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                background: G.card,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                color: G.text,
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="">Select tournament...</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Event Selection - Right column */}
        {formData.role === 'REFEREE' && (
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
              Event
            </label>
            <select
              value={formData.eventId || ''}
              onChange={(e) =>
                setFormData({ ...formData, eventId: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                background: G.card,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                color: G.text,
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="">Select event...</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Referee Tournament Players Display */}
        {formData.role === 'REFEREE' && formData.tournamentId && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10,
            background: 'rgba(125, 193, 66, 0.08)',
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}>
            <h3 style={{ fontWeight: 700, color: G.lime, marginBottom: 8, fontSize: 11 }}>
              🎾 Tournament Players ({players.length})
            </h3>
            
            {loadingPlayers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted, fontSize: 10 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: `2px solid ${G.cardBorder}`,
                    borderTop: `2px solid ${G.lime}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Loading players...</span>
              </div>
            ) : players.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 6,
                maxHeight: 120,
                overflowY: 'auto',
              }}>
                {players.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      padding: '6px 8px',
                      background: G.card,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 4,
                      fontSize: 9,
                      color: G.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={player.name}
                  >
                    {player.name}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: G.muted }}>No players registered for this tournament</div>
            )}
          </div>
        )}

        {/* Coach Player Selection - Multi-select with checkboxes */}
        {formData.role === 'COACH' && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10,
            background: 'rgba(61, 122, 50, 0.08)',
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}>
            <h3 style={{ fontWeight: 700, color: G.bright, marginBottom: 8, fontSize: 11 }}>
              👥 Select Players ({selectedPlayers.length} selected)
            </h3>

            {loadingOrgPlayers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted, fontSize: 10 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: `2px solid ${G.cardBorder}`,
                    borderTop: `2px solid ${G.bright}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Loading players...</span>
              </div>
            ) : orgPlayers.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 6,
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                {orgPlayers.map((player) => (
                  <label
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 10px',
                      background: selectedPlayers.includes(player.id) ? G.card : 'transparent',
                      border: `1px solid ${selectedPlayers.includes(player.id) ? G.bright : G.cardBorder}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers([...selectedPlayers, player.id]);
                        } else {
                          setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        width: 14,
                        height: 14,
                      }}
                    />
                    <span style={{
                      fontSize: 9,
                      color: G.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}>
                      {player.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: G.muted }}>No players available in this organization</div>
            )}
          </div>
        )}

        {/* Court & Due Date - One Row */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
            Court
          </label>
          <select
            value={formData.courtId || ''}
            onChange={(e) =>
              setFormData({ ...formData, courtId: e.target.value })
            }
            style={{
              width: '100%',
              padding: '8px 10px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 6,
              color: G.text,
              fontSize: 11,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <option value="">Select court...</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate || ''}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            style={{
              width: '100%',
              padding: '8px 10px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 6,
              color: G.text,
              fontSize: 11,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Referee-Specific Specs */}
        {formData.role === 'REFEREE' && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10,
            background: 'rgba(125, 193, 66, 0.08)',
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}>
            <h3 style={{ fontWeight: 700, color: G.lime, marginBottom: 8, fontSize: 11 }}>
              ⚖️ Referee Specifications
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Event Type
                </label>
                <select
                  value={formData.refereEventType || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      refereEventType: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select type...</option>
                  <option value="match">Match</option>
                  <option value="tournament">Tournament</option>
                  <option value="practice">Practice</option>
                  <option value="exhibition">Exhibition</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Match Duration (min)
                </label>
                <input
                  type="number"
                  value={formData.matchDuration || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      matchDuration: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="90"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Court #
                </label>
                <input
                  type="text"
                  value={formData.courtNumber || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      courtNumber: e.target.value,
                    })
                  }
                  placeholder="1, 2, 3..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Coach-Specific Specs */}
        {formData.role === 'COACH' && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10,
            background: 'rgba(61, 122, 50, 0.08)',
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}>
            <h3 style={{ fontWeight: 700, color: G.bright, marginBottom: 8, fontSize: 11 }}>
              🏆 Coach Specifications
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Training Type
                </label>
                <select
                  value={formData.coachTrainingType || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coachTrainingType: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select type...</option>
                  <option value="technique">Technique</option>
                  <option value="fitness">Fitness</option>
                  <option value="strategy">Strategy</option>
                  <option value="evaluation">Evaluation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Player Count {selectedPlayers.length > 0 && <span style={{color: G.bright}}>({selectedPlayers.length})</span>}
                </label>
                <input
                  type="number"
                  value={selectedPlayers.length > 0 ? selectedPlayers.length : (formData.playerCount || '')}
                  onChange={(e) => {
                    // Only allow manual input if no players are selected
                    if (selectedPlayers.length === 0) {
                      setFormData({
                        ...formData,
                        playerCount: parseInt(e.target.value) || undefined,
                      });
                    }
                  }}
                  disabled={selectedPlayers.length > 0}
                  placeholder="5"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                    opacity: selectedPlayers.length > 0 ? 0.6 : 1,
                    cursor: selectedPlayers.length > 0 ? 'not-allowed' : 'text',
                  }}
                />
                {selectedPlayers.length > 0 && (
                  <div style={{ fontSize: 8, color: G.muted, marginTop: 2 }}>Auto-set from selection</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 3 }}>
                  Session Duration (min)
                </label>
                <input
                  type="number"
                  value={formData.sessionDuration || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessionDuration: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="60"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    color: G.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes - Full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: G.muted, display: 'block', marginBottom: 4 }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Add instructions..."
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 6,
              color: G.text,
              fontSize: 11,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Form Actions - Full width */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            disabled={loading || !formData.userId || !formData.templateType}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: loading ? G.mid : G.lime,
              color: loading ? G.muted : '#0f1f0f',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 11,
              cursor: loading || !formData.userId || !formData.templateType ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.userId || !formData.templateType ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Assigning...' : '✓ Assign Task'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'transparent',
                color: G.muted,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
