import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { statusOrder } from './types';
import type { DeveloperBug } from './types';

export function useBugActions(
  onBugUpdated: (bugId: string, status: string) => void,
  onTimelineUpdate: (event: string) => void
) {
  const { addToast } = useToast();

  const handleUpdateStatus = useCallback(
    async (bugId: string, bug: DeveloperBug | undefined) => {
      if (!bug) return;
      const next = statusOrder[(statusOrder.indexOf(bug.status as any) + 1) % statusOrder.length];
      try {
        const r = await fetch('/api/developer/bugs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bugId, status: next }),
        });
        if (r.ok) {
          onBugUpdated(bugId, next);
          if (next === 'resolved') {
            const note = `Resolved: ${bug.title}`;
            onTimelineUpdate(note);
            addToast(note, 'success');
          }
        } else {
          addToast('Failed to update bug status', 'error');
        }
      } catch {
        addToast('Failed to update bug status', 'error');
      }
    },
    [addToast, onBugUpdated, onTimelineUpdate]
  );

  const sendBugResponse = useCallback(
    async (selectedBug: DeveloperBug | null, replyText: string, onReplyCleared: () => void, onTimelineUpdate: (event: string) => void) => {
      if (!selectedBug) {
        addToast('Please select a bug to respond to.', 'warning');
        return;
      }
      if (!replyText.trim()) {
        addToast('Enter a response before sending.', 'warning');
        return;
      }

      try {
        const response = await fetch('/api/developer/bugs/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedBug.id, message: replyText.trim() }),
        });

        if (response.ok) {
          onTimelineUpdate(
            `Response sent to ${selectedBug.reporter}: "${replyText.substring(0, 50)}..." — ${new Date().toLocaleTimeString()}`
          );
          addToast('Bug response sent successfully', 'success');
          onReplyCleared();
        } else {
          addToast('Failed to send bug response', 'error');
        }
      } catch {
        addToast('Failed to send bug response', 'error');
      }
    },
    [addToast]
  );

  return { handleUpdateStatus, sendBugResponse };
}
