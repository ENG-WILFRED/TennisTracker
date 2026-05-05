import { useMemo } from 'react';
import type { DeveloperMetrics } from './types';

export function useHealthStatus(metrics: DeveloperMetrics | null) {
  const healthStatus = useMemo(() => {
    if (!metrics) return 'LOADING';
    if (metrics.system.cpuUsage > 85 || metrics.system.memoryUsage > 90 || metrics.system.errorRate > 5) {
      return 'CRITICAL';
    }
    if (metrics.system.cpuUsage > 72 || metrics.system.memoryUsage > 80 || metrics.system.errorRate > 3) {
      return 'WARNING';
    }
    return 'STABLE';
  }, [metrics]);

  const healthColor = useMemo(() => {
    const colors = {
      CRITICAL: 'text-red-400 border-red-700/60 bg-red-950/40',
      WARNING: 'text-amber-400 border-amber-700/60 bg-amber-950/40',
      STABLE: 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40',
      LOADING: 'text-slate-400 border-slate-700/60 bg-slate-950/40',
    };
    return colors[healthStatus as keyof typeof colors];
  }, [healthStatus]);

  const healthGlow = useMemo(() => {
    const glows = {
      CRITICAL: 'shadow-[0_0_24px_rgba(248,113,113,0.25)]',
      WARNING: 'shadow-[0_0_24px_rgba(251,191,36,0.2)]',
      STABLE: 'shadow-[0_0_24px_rgba(52,211,153,0.2)]',
      LOADING: '',
    };
    return glows[healthStatus as keyof typeof glows];
  }, [healthStatus]);

  return { healthStatus, healthColor, healthGlow };
}
