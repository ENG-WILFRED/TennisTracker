import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

export function useOrganizationActions(
  onOrgAction: (action: string, orgName: string) => void,
  onRefresh: () => Promise<void>
) {
  const { addToast } = useToast();

  const handleOrganizationAction = useCallback(
    async (orgId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete', rejectionReason?: string) => {
      try {
        const response = await authenticatedFetch(`/api/developer/organizations/${orgId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, rejectionReason }),
        });

        if (response.ok) {
          const result = await response.json();
          addToast(result.message || `Action ${action} completed successfully`, 'success');
          onOrgAction(action, result.organization?.name ?? orgId);
          await onRefresh();
        } else {
          const error = await response.json();
          addToast(`Failed to ${action} organization: ${error.error}`, 'error');
        }
      } catch (error) {
        console.error('[useOrganizationActions] Action failed:', error);
        addToast(`Failed to ${action} organization`, 'error');
      }
    },
    [addToast, onOrgAction, onRefresh]
  );

  const handleEmailOrg = useCallback((org: any) => {
    if (!org.email && !org.creator?.email) {
      addToast('No email address available for this organization', 'error');
      return;
    }

    const recipient = org.email || org.creator?.email;
    const subject = encodeURIComponent('Follow up on your TennisTracker organization registration');
    const body = encodeURIComponent(
      `Hello ${org.creator?.firstName || ''},%0D%0A%0D%0AWe are reaching out regarding your organization registration for ${org.name}.%0D%0A%0D%0APlease let us know if you need any assistance or have questions.%0D%0A%0D%0ABest regards,%0D%0AThe TennisTracker Team`
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  }, [addToast]);

  return { handleOrganizationAction, handleEmailOrg };
}
