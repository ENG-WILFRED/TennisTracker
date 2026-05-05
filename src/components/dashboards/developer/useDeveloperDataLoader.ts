import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

export function useDeveloperDataLoader(
  onDataLoaded: (data: { metrics: any; orgs: any[]; reports: any[] }) => void
) {
  const { addToast } = useToast();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once on mount
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const fetchData = async () => {
      try {
        const [metricsRes, orgsRes, reportsRes] = await Promise.all([
          authenticatedFetch('/api/developer/metrics'),
          authenticatedFetch('/api/developer/organizations?status=all'),
          authenticatedFetch('/api/developer/test-results/stats?days=7'),
        ]);

        const metrics = metricsRes.ok ? await metricsRes.json() : null;
        const orgs = orgsRes.ok ? (await orgsRes.json()).organizations || (await orgsRes.json()).pending || [] : [];
        const reports = reportsRes.ok ? (await reportsRes.json()).testRuns || [] : [];

        onDataLoaded({ metrics, orgs, reports });
      } catch {
        addToast('Failed to load developer dashboard data', 'error');
        onDataLoaded({ metrics: null, orgs: [], reports: [] });
      }
    };
    fetchData();
  }, []); // Empty dependency array - only run once on mount
}

