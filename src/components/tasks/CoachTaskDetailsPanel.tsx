'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Users, CheckCircle, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface CoachTaskDetailsPanelProps {
  taskId: string;
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

export default function CoachTaskDetailsPanel({ taskId, onClose }: CoachTaskDetailsPanelProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [requestType, setRequestType] = useState<'postpone' | 'cancel'>('postpone');
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'occurred' | 'missed' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const taskRes = await authenticatedFetch(`/api/coach/tasks/${taskId}`);

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTask(taskData.data);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const handleStatusUpdate = async (newStatus: string, payload?: Record<string, any>) => {
    try {
      setStatusUpdating(true);
      const res = await authenticatedFetch(`/api/coach/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newStatus.toLowerCase(), payload }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTask(updated.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmAction = async (action: 'occurred' | 'missed') => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingAction) return;
    setShowConfirmModal(false);
    await handleStatusUpdate(pendingAction);
    setPendingAction(null);
  };

  const handleRequestSubmission = async () => {
    if (!requestReason.trim()) return;
    setSubmittingRequest(true);

    try {
      await handleStatusUpdate('request', {
        requestType,
        reason: requestReason.trim(),
      });
      setRequestReason('');
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRequestResponse = async (decision: 'approved' | 'denied') => {
    try {
      setStatusUpdating(true);
      const res = await authenticatedFetch(`/api/coach/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_request',
          payload: { decision },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTask(updated.data);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

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
    'pending': { bg: `${G.blue}22`, border: G.blue, text: G.blue },
    'in_progress': { bg: `${G.yellow}22`, border: G.yellow, text: G.yellow },
    'completed': { bg: `${G.lime}22`, border: G.lime, text: G.lime },
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || statusColors['ASSIGNED'];
  };

  const currentStatus = task.status?.toUpperCase() || 'ASSIGNED';
  const statusColor = getStatusColor(task.status || 'pending');

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

  const confirmTitle = pendingAction === 'occurred' ? 'Confirm Occurred' : 'Confirm Missed';
  const confirmMessage = pendingAction === 'occurred'
    ? 'Do you want to mark this task as occurred? Both coach and player must agree to finalize.'
    : 'Do you want to mark this task as missed? Both coach and player must agree to finalize.';

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

      <div style={{ padding: '16px 20px', background: G.card3, borderBottom: `1px solid ${G.border}`, display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Players</div>
            <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
              {Array.isArray(task.context?.selectedPlayerNames) && task.context.selectedPlayerNames.length > 0
                ? task.context.selectedPlayerNames.join(', ')
                : Array.isArray(task.context?.selectedPlayerIds)
                ? task.context.selectedPlayerIds.join(', ')
                : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 4, fontWeight: 600 }}>Court</div>
            <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
              {task.context?.courtName || task.context?.courtId || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
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
            Assigned by: {task.assignedBy || 'Unknown'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {task.status === 'ASSIGNED' && (
            <button
              onClick={() => handleStatusUpdate('accept')}
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
          {task.status === 'ACCEPTED' && (
            <button
              onClick={() => handleStatusUpdate('start')}
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
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusUpdate('submit')}
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

      {task.context?.playerRequest?.status === 'pending' && (
        <div style={{ padding: '16px 20px', background: G.card3, borderBottom: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.lime2 }}>Player request pending</div>
              <div style={{ fontSize: 12, color: G.text2 }}>Review the player's postpone / cancel request and respond to finalize the task state.</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Type</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{task.context.playerRequest.requestType}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{task.context.playerRequest.status}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: G.text2 }}>{task.context.playerRequest.reason}</div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleRequestResponse('approved')}
              disabled={statusUpdating}
              style={{
                flex: 1,
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              Approve request
            </button>
            <button
              onClick={() => handleRequestResponse('denied')}
              disabled={statusUpdating}
              style={{
                flex: 1,
                background: G.red,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              Deny request
            </button>
          </div>
        </div>
      )}

      {task.status !== 'COMPLETED' && task.status !== 'FAILED' && task.status !== 'CANCELLED' && (
        <div style={{ padding: '16px 20px', background: G.card3, borderBottom: `1px solid ${G.border}`, display: 'grid', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.lime2, marginBottom: 8 }}>Confirm final session result</div>
            <div style={{ fontSize: 12, color: G.text2 }}>Mark this task as occurred or missed. Both coach and player must agree before the final status is applied.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleConfirmAction('occurred')}
              disabled={statusUpdating}
              style={{
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              Mark as occurred
            </button>
            <button
              type="button"
              onClick={() => handleConfirmAction('missed')}
              disabled={statusUpdating}
              style={{
                background: G.red,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: statusUpdating ? 'not-allowed' : 'pointer',
                opacity: statusUpdating ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              Mark as missed
            </button>
          </div>
          <div style={{ border: `1px solid ${G.border}`, borderRadius: 12, padding: 14, background: G.card2 }}>
            <div style={{ fontSize: 11, color: G.muted2, marginBottom: 6 }}>Request change</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setRequestType('postpone')}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: requestType === 'postpone' ? `1px solid ${G.lime}` : `1px solid ${G.border}`,
                  background: requestType === 'postpone' ? G.lime : 'transparent',
                  color: requestType === 'postpone' ? '#0a180a' : G.text,
                }}
              >
                Postpone
              </button>
              <button
                type="button"
                onClick={() => setRequestType('cancel')}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: requestType === 'cancel' ? `1px solid ${G.red}` : `1px solid ${G.border}`,
                  background: requestType === 'cancel' ? G.red : 'transparent',
                  color: requestType === 'cancel' ? '#fff' : G.text,
                }}
              >
                Cancel
              </button>
            </div>
            <textarea
              value={requestReason}
              onChange={(event) => setRequestReason(event.target.value)}
              rows={4}
              placeholder="Explain why you need to postpone or cancel this session..."
              style={{
                width: '100%',
                borderRadius: 12,
                border: `1px solid ${G.border}`,
                background: G.card,
                color: G.text,
                padding: 12,
                resize: 'vertical',
              }}
            />
            <button
              type="button"
              onClick={handleRequestSubmission}
              disabled={submittingRequest}
              style={{
                marginTop: 10,
                width: '100%',
                background: G.lime,
                color: '#0a180a',
                border: 'none',
                borderRadius: 10,
                padding: '11px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: submittingRequest ? 'not-allowed' : 'pointer',
                opacity: submittingRequest ? 0.6 : 1,
              }}
            >
              Submit request
            </button>
          </div>
        </div>
      )}

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
                  .filter(([key]) => !['courtName', 'role', 'playerRequest', 'coachRequest', 'playerDecision', 'coachDecision'].includes(key))
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
      </div>

      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, borderRadius: 24, border: `1px solid ${G.border}`, background: G.card, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 12 }}>{confirmTitle}</h2>
            <p style={{ fontSize: 14, color: G.text2, lineHeight: 1.6 }}>{confirmMessage}</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{ flex: 1, borderRadius: 12, border: `1px solid ${G.border}`, background: 'transparent', color: G.text2, padding: '12px 14px', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                style={{ flex: 1, borderRadius: 12, border: 'none', background: G.lime, color: '#0a180a', padding: '12px 14px', fontSize: 13, fontWeight: 700 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
