import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastContext';

export function useTestRunner(onTimelineUpdate: (event: string) => void) {
  const { addToast } = useToast();

  const triggerTestRun = useCallback(
    async (suite: string, onTestStart: (testRunId: string) => void, onTestRunning: (isRunning: boolean) => void) => {
      onTestRunning(true);
      try {
        const response = await fetch('/api/developer/run-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suite,
            concurrent: '50',
            duration: '60',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          addToast(`Failed to trigger tests: ${error.error}`, 'error');
          onTestRunning(false);
          return;
        }

        const data = await response.json();
        onTestStart(data.testRunId);
        addToast(`Tests started: ${suite}`, 'success');
        onTimelineUpdate(`Tests triggered: ${suite} — ${new Date().toLocaleTimeString()}`);
      } catch {
        addToast('Failed to trigger tests', 'error');
        onTestRunning(false);
      }
    },
    [addToast, onTimelineUpdate]
  );

  return { triggerTestRun };
}
