'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@vico/design-system';
import { toastOptions } from '@vico/design-system';
import { AlertCircle, ArrowLeft, Clock, MessageCircle, CheckCircle2, X } from 'lucide-react';
import CoachTaskDetailsPanel from '@/components/tasks/CoachTaskDetailsPanel';

const G = {
  page: '#081107',
  card: '#0f1f0f',
  cardSoft: '#152515',
  cardBorder: '#243e24',
  panel: '#162616',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  accent: '#79bf3e',
  accentSoft: '#79bf3e22',
  accentStrong: '#3a7230',
  warning: '#f0c040',
  danger: '#d94f4f',
};

const statusLabels: Record<string, string> = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Missed / Failed',
  CANCELLED: 'Cancelled',
};

// Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#243e24] bg-[#0f1f0f] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-[#c8dcab]">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-3xl border border-[#243e24] bg-transparent px-4 py-3 text-sm font-semibold text-[#c8dcab] transition hover:bg-[#243e24]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
              isDangerous
                ? 'bg-[#d94f4f] text-white hover:bg-[#ef4444]'
                : 'bg-[#79bf3e] text-[#0f1f0f] hover:bg-[#98d56e]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Validation Tooltip Component
function ValidationTooltip({
  show,
  message,
  children,
}: {
  show: boolean;
  message: string;
  children: React.ReactNode;
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative w-full">
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="w-full"
      >
        {children}
      </div>
      {show && isHovering && (
        <div className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-full rounded-2xl border border-[#f0c040] bg-[#1a1a10] p-3 text-xs text-[#f0c040] shadow-lg">
          {message}
          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 border-r border-b border-[#f0c040] bg-[#1a1a10]" />
        </div>
      )}
    </div>
  );
}

function PlayerTaskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = params?.role as string;
  const userId = params?.userId as string;
  const taskId = params?.taskId as string;
  const showSessions = searchParams.get('sessions') === 'true';

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'postpone' | 'cancel'>('postpone');
  const [requestReason, setRequestReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'occurred' | 'missed' | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/tasks/${taskId}?playerId=${userId}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load task');
        }
        const payload = await res.json();
        setTask(payload.task);
      } catch (error) {
        console.error('Player task page error:', error);
        toast.error(error instanceof Error ? error.message : 'Unable to load task');
      } finally {
        setLoading(false);
      }
    };

    if (taskId && userId) {
      fetchTask();
    }
  }, [taskId, userId]);

  const hasActiveRequest = useMemo(() => {
    return !!task?.context?.playerRequest;
  }, [task?.context?.playerRequest]);

  const hasCoachRequest = useMemo(() => {
    return !!task?.context?.coachRequest;
  }, [task?.context?.coachRequest]);

  const currentTime = new Date();
  
  const dueDate = useMemo(() => {
    return task?.dueDate ? new Date(task.dueDate) : null;
  }, [task?.dueDate]);

  const isDateTimePassed = useMemo(() => {
    return dueDate ? currentTime >= dueDate : false;
  }, [dueDate, currentTime]);

  const canMarkPast = useMemo(() => {
    return ['ACCEPTED', 'IN_PROGRESS'].includes(task?.status) && !!task?.dueDate;
  }, [task?.status, task?.dueDate]);

  const isTerminalStatus = useMemo(() => {
    return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(task?.status);
  }, [task?.status]);

  const canExecuteAction = useMemo(() => {
    return canMarkPast && isDateTimePassed;
  }, [canMarkPast, isDateTimePassed]);

  const validationMessage = useMemo(() => {
    if (!canMarkPast) {
      return null;
    }
    if (!isDateTimePassed) {
      const timeUntil = Math.ceil((dueDate!.getTime() - currentTime.getTime()) / (1000 * 60));
      return `Session not due yet (${timeUntil} minutes remaining). You can postpone or cancel instead.`;
    }
    return null;
  }, [canMarkPast, isDateTimePassed, dueDate]);

  const taskDue = useMemo(() => {
    return dueDate ? dueDate.toLocaleDateString() : 'TBD';
  }, [dueDate]);

  const formatContextKey = useCallback((key: string) => {
    if (key === 'selectedPlayerIds') return 'Players';
    if (key === 'courtId' || key === 'courtName') return 'Court';
    return key.replace(/([A-Z])/g, ' $1').trim();
  }, []);

  const formatContextValue = useCallback((key: string, value: any, context: Record<string, any> = {}) => {
    if (key === 'selectedPlayerIds') {
      if (Array.isArray(context.selectedPlayerNames) && context.selectedPlayerNames.length > 0) {
        return context.selectedPlayerNames.join(', ');
      }
      return Array.isArray(value) ? value.join(', ') : String(value ?? '');
    }

    if (key === 'courtId') {
      return String(context.courtName || value || '');
    }

    if (key === 'courtName') {
      return String(value || '');
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return String(value ?? '');
  }, []);

  const handleActionWithConfirmation = useCallback((action: 'occurred' | 'missed') => {
    setPendingAction(action);
    setShowConfirmModal(true);
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction || !task || !userId) return;

    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/players/tasks/${taskId}?playerId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Action failed');
      }

      const updated = await res.json();
      setTask(updated.task || updated.data || updated);
      toast.success(
        pendingAction === 'occurred'
          ? 'Task marked as occurred.'
          : 'Task marked as missed.'
      );
    } catch (error) {
      console.error('Player task action error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to perform action');
    } finally {
      setSubmitting(false);
      setPendingAction(null);
    }
  }, [pendingAction, task, userId, taskId]);

  const handleRequestResponse = useCallback(async (decision: 'approved' | 'denied') => {
    if (!task || !userId || !task.context?.coachRequest) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/players/tasks/${taskId}?playerId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_request',
          payload: { decision },
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Action failed');
      }

      const updated = await res.json();
      setTask(updated.task || updated.data || updated);
      toast.success(
        decision === 'approved'
          ? 'Coach request approved.'
          : 'Coach request denied.'
      );
    } catch (error) {
      console.error('Player request response error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to respond to request');
    } finally {
      setSubmitting(false);
    }
  }, [task, userId, taskId]);

  const handleAction = useCallback(async (action: 'request') => {
    if (!task || !userId) return;
    if (action === 'request' && !requestReason.trim()) {
      toast.error('Please enter a reason for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = { action };
      if (action === 'request') {
        payload.payload = {
          requestType,
          reason: requestReason.trim(),
        };
      }

      const res = await fetch(`/api/players/tasks/${taskId}?playerId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Action failed');
      }

      const updated = await res.json();
      setTask(updated.task || updated.data || updated);
      toast.success('Request submitted. Your coach will review it.');

      if (action === 'request') {
        setRequestReason('');
      }
    } catch (error) {
      console.error('Player task action error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to perform action');
    } finally {
      setSubmitting(false);
    }
  }, [task, userId, taskId, requestType, requestReason]);

  const backHref = showSessions
    ? `/dashboard/player/${userId}?sessions=true`
    : `/dashboard/player/${userId}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#081107] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl bg-[#0f1f0f] border border-[#243e24] p-8 shadow-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[#243e24] rounded-full" />
            <div className="h-4 w-32 bg-[#243e24] rounded-full" />
            <div className="h-64 bg-[#243e24] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#081107] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl bg-[#0f1f0f] border border-[#243e24] p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-[#f87171]" />
          <h1 className="text-2xl font-semibold text-white">Task not found</h1>
          <p className="mt-2 text-sm text-[#a8d84e]">Check that the task URL is correct, or return to your sessions list.</p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#79bf3e] bg-[#79bf3e11] px-5 py-3 text-sm font-semibold text-[#cde1b2] transition hover:bg-[#79bf3e22]"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to sessions
          </button>
        </div>
      </div>
    );
  }

  const statusColor = task.status === 'COMPLETED' || task.status === 'ASSIGNED'
    ? '#79bf3e'
    : task.status === 'ACCEPTED'
    ? '#a8d84e'
    : task.status === 'IN_PROGRESS'
    ? '#f0c040'
    : task.status === 'FAILED'
    ? '#ef4444'
    : '#94a3b8';

  return (
    <div className="min-h-screen bg-[#081107] px-4 py-8 text-white">
      <div className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#79bf3e] bg-[#79bf3e11] px-4 py-2 text-sm font-semibold text-[#cde1b2] transition hover:bg-[#79bf3e22]"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to sessions
          </button>
          <div className="rounded-3xl border border-[#243e24] bg-[#0f1f0f] p-4 text-sm text-[#9ebd8c]">
            <span className="font-semibold text-[#d9ffd0]">Player task page</span> — coach-facing details, responsive layout, and direct actions.
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-[#243e24] bg-[#101f10] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#a8d84e]">Task details</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}60` }}
                  >
                    {statusLabels[task.status] || task.status}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{task.template?.name || 'Training Task'}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c8dcab]">{task.template?.description || task.notes || 'Your coach assigned this task for your next session.'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#243e24] bg-[#162616] p-5">
                  <p className="text-xs uppercase text-[#8db157]">Coach</p>
                  <p className="mt-2 text-lg font-semibold text-white">{task.assignedToUser?.firstName || 'Coach'} {task.assignedToUser?.lastName || ''}</p>
                  <p className="mt-1 text-sm text-[#a8d84e]">{task.assignedToUser?.email || 'No coach email'}</p>
                </div>
                <div className="rounded-3xl border border-[#243e24] bg-[#162616] p-5">
                  <p className="text-xs uppercase text-[#8db157]">Due date</p>
                  <p className="mt-2 text-lg font-semibold text-white">{taskDue}</p>
                  <p className="mt-1 text-sm text-[#a8d84e]">{task.dueDate ? `Scheduled by ${new Date(task.createdAt).toLocaleDateString()}` : 'Not scheduled'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#243e24] bg-[#162616] p-5">
                  <p className="text-xs uppercase text-[#8db157]">Status</p>
                  <p className="mt-2 text-lg font-semibold text-white">{statusLabels[task.status] || task.status}</p>
                </div>
                <div className="rounded-3xl border border-[#243e24] bg-[#162616] p-5">
                  <p className="text-xs uppercase text-[#8db157]">Session type</p>
                  <p className="mt-2 text-lg font-semibold text-white">{task.template?.type || 'Training plan'}</p>
                </div>
              </div>

              {task.notes && (
                <section className="rounded-3xl border border-[#243e24] bg-[#182818] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-[#8db157]">Coach notes</p>
                      <p className="mt-2 text-sm text-[#c8dcab]">{task.notes}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[#79bf3e]" />
                  </div>
                </section>
              )}

              {task.context && Object.keys(task.context).length > 0 && (
                <section className="rounded-3xl border border-[#243e24] bg-[#182818] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8db157]">Context</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {Object.entries(task.context)
                      .filter(([key]) => key !== 'selectedPlayerNames' && key !== 'playerRequest' && key !== 'coachRequest')
                      .filter(([key]) => !(key === 'courtName' && task.context?.courtId))
                      .map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[#7aaa6a]">{formatContextKey(key)}</p>
                          <p className="mt-2 text-sm text-[#dbe8c5]">{formatContextValue(key, value, task.context)}</p>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-[#243e24] bg-[#182818] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8db157]">Task details</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {task.context?.selectedPlayerIds && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7aaa6a]">Players</p>
                      <p className="mt-2 text-sm text-[#dbe8c5]">
                        {Array.isArray(task.context.selectedPlayerNames) && task.context.selectedPlayerNames.length > 0
                          ? task.context.selectedPlayerNames.join(', ')
                          : Array.isArray(task.context.selectedPlayerIds)
                          ? task.context.selectedPlayerIds.join(', ')
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                  {task.context?.courtId && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7aaa6a]">Court</p>
                      <p className="mt-2 text-sm text-[#dbe8c5]">{task.context.courtName || task.context.courtId}</p>
                    </div>
                  )}
                  {task.context?.trainingType && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7aaa6a]">Session type</p>
                      <p className="mt-2 text-sm text-[#dbe8c5]">{task.context.trainingType}</p>
                    </div>
                  )}
                  {task.context?.sessionDuration && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7aaa6a]">Duration</p>
                      <p className="mt-2 text-sm text-[#dbe8c5]">{task.context.sessionDuration}</p>
                    </div>
                  )}
                </div>
              </section>

              {hasActiveRequest && (
                <section className="rounded-3xl border border-[#407d2f] bg-[#1f3420] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-[#b0d78c]">Pending request</p>
                      <p className="mt-2 text-sm text-[#e9f3d0]">Your coach will see this request and can respond in their dashboard.</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-[#a8d84e]" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#dbe8c5]">
                    <p><span className="font-semibold text-[#c8e5a8]">Type:</span> {task.context.playerRequest?.requestType}</p>
                    <p><span className="font-semibold text-[#c8e5a8]">Reason:</span> {task.context.playerRequest?.reason}</p>
                    <p><span className="font-semibold text-[#c8e5a8]">Status:</span> {task.context.playerRequest?.status || 'pending'}</p>
                  </div>
                </section>
              )}

              {hasCoachRequest && (
                <section className="rounded-3xl border border-[#407d2f] bg-[#1f3420] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-[#b0d78c]">Coach request</p>
                      <p className="mt-2 text-sm text-[#e9f3d0]">Your coach has asked for a change. Approve or deny to move this task forward.</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-[#a8d84e]" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#dbe8c5]">
                    <p><span className="font-semibold text-[#c8e5a8]">Type:</span> {task.context.coachRequest?.requestType}</p>
                    <p><span className="font-semibold text-[#c8e5a8]">Reason:</span> {task.context.coachRequest?.reason}</p>
                    <p><span className="font-semibold text-[#c8e5a8]">Status:</span> {task.context.coachRequest?.status || 'pending'}</p>
                  </div>
                  {task.context.coachRequest?.status === 'pending' && !isTerminalStatus && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRequestResponse('approved')}
                        className="flex-1 rounded-3xl bg-[#79bf3e] px-4 py-3 text-sm font-semibold text-[#0f1f0f] transition hover:bg-[#98d56e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve request
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRequestResponse('denied')}
                        className="flex-1 rounded-3xl border border-[#d94f4f] bg-[#d94f4f11] px-4 py-3 text-sm font-semibold text-[#ffd5d5] transition hover:bg-[#d94f4f22] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Deny request
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl border border-[#243e24] bg-[#162616] p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#79bf3e] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f1f0f]">Player actions</span>
                  <span className="text-xs text-[#9ebd8c]">Touch-friendly and mobile-ready.</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ValidationTooltip show={!!validationMessage} message={validationMessage || ''}>
                      <button
                        type="button"
                        disabled={!canExecuteAction || submitting}
                        onClick={() => handleActionWithConfirmation('occurred')}
                        className="w-full rounded-3xl border border-[#79bf3e] bg-[#79bf3e11] px-4 py-4 text-left text-sm font-semibold text-[#d9ffd0] transition hover:bg-[#79bf3e22] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#79bf3e]" />
                          <span>Mark as occurred</span>
                        </div>
                        <p className="mt-2 text-xs text-[#aacb92]">Use this when the session was completed as planned.</p>
                      </button>
                    </ValidationTooltip>

                    <ValidationTooltip show={!!validationMessage} message={validationMessage || ''}>
                      <button
                        type="button"
                        disabled={!canExecuteAction || submitting}
                        onClick={() => handleActionWithConfirmation('missed')}
                        className="w-full rounded-3xl border border-[#d94f4f] bg-[#d94f4f11] px-4 py-4 text-left text-sm font-semibold text-[#ffd5d5] transition hover:bg-[#d94f4f22] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-[#d94f4f]" />
                          <span>Mark as missed</span>
                        </div>
                        <p className="mt-2 text-xs text-[#f0b1b1]">Use this when you did not attend or were unable to complete the session.</p>
                      </button>
                    </ValidationTooltip>
                  </div>

                  <div className="rounded-3xl border border-[#243e24] bg-[#0f1f0f] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#a8d84e]">
                      <MessageCircle className="h-4 w-4" />
                      <span>Request cancel or postpone</span>
                    </div>

                    {isTerminalStatus ? (
                      <div className="mt-4 rounded-3xl border border-[#f0c040] bg-[#1a1a10] p-4 text-sm text-[#f0c040]">
                        <p>This task is {task.status === 'COMPLETED' ? 'completed' : task.status === 'FAILED' ? 'missed' : 'cancelled'} and cannot be modified.</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setRequestType('postpone')}
                            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${requestType === 'postpone' ? 'bg-[#79bf3e] text-[#0f1f0f]' : 'border border-[#243e24] text-[#c8dcab]'}`}
                          >
                            Postpone
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequestType('cancel')}
                            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${requestType === 'cancel' ? 'bg-[#ef4444] text-white' : 'border border-[#243e24] text-[#c8dcab]'}`}
                          >
                            Cancel
                          </button>
                        </div>

                        <textarea
                          value={requestReason}
                          onChange={(event) => setRequestReason(event.target.value)}
                          rows={5}
                          placeholder="Add a short reason for your request..."
                          className="w-full rounded-3xl border border-[#243e24] bg-[#0f1f0f] p-4 text-sm text-[#e4f2da] outline-none transition focus:border-[#79bf3e] focus:ring-2 focus:ring-[#79bf3e33]"
                        />

                        <button
                          type="button"
                          onClick={() => handleAction('request')}
                          disabled={submitting}
                          className="inline-flex w-full items-center justify-center rounded-3xl bg-[#79bf3e] px-5 py-4 text-sm font-semibold text-[#0f1f0f] transition hover:bg-[#98d56e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Submit request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#243e24] bg-[#182818] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8db157]">Coach response</p>
                <p className="mt-3 text-sm text-[#c8dbb0]">Your coach can review this task and request details from their dashboard. If you mark it as occurred or missed, the status will update immediately for tracking.</p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        title={pendingAction === 'occurred' ? 'Confirm: Mark as Occurred' : 'Confirm: Mark as Missed'}
        message={
          pendingAction === 'occurred'
            ? 'Are you sure you want to mark this session as occurred? This action cannot be undone.'
            : 'Are you sure you want to mark this session as missed? This action cannot be undone.'
        }
        confirmText={pendingAction === 'occurred' ? 'Yes, mark as occurred' : 'Yes, mark as missed'}
        isDangerous={pendingAction === 'missed'}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}

function CoachTaskPage() {
  const params = useParams();
  const router = useRouter();
  const role = params?.role as string;
  const userId = params?.userId as string;
  const taskId = params?.taskId as string;
  const redirectBasePath = role && userId ? `/dashboard/${role}/${userId}` : '/dashboard';

  if (!taskId) {
    return (
      <div className="min-h-screen bg-[#081107] px-4 py-10 text-white">
        <div className="w-full rounded-3xl bg-[#0f1f0f] border border-[#243e24] p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-[#f87171]" />
          <h1 className="text-2xl font-semibold text-white">Task ID is missing</h1>
          <p className="mt-2 text-sm text-[#a8d84e]">Please go back to your tasks list and select a task.</p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#79bf3e] bg-[#79bf3e11] px-5 py-3 text-sm font-semibold text-[#cde1b2] transition hover:bg-[#79bf3e22]"
            onClick={() => router.push(redirectBasePath)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081107] px-4 py-8 text-white">
      <div className="w-full ">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#79bf3e] bg-[#79bf3e11] px-4 py-2 text-sm font-semibold text-[#cde1b2] transition hover:bg-[#79bf3e22]"
            onClick={() => router.push(redirectBasePath)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to tasks
          </button>
          <div className="rounded-3xl border border-[#243e24] bg-[#0f1f0f] p-4 text-sm text-[#9ebd8c]">
            <span className="font-semibold text-[#d9ffd0]">Coach task page</span> — open task details and actions on a dedicated page.
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#243e24] bg-[#101f10] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
          <CoachTaskDetailsPanel taskId={taskId} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardTaskPage() {
  const params = useParams();
  const role = params?.role as string;

  if (role === 'coach') {
    return <CoachTaskPage />;
  }

  return <PlayerTaskPage />;
}
