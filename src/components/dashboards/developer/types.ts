export type DeveloperMetrics = {
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
    responseTime: { avg: number; max: number };
    errorRate: number;
  };
  database: { connections: number; queriesPerMinute: number; activeConnections: number };
  users: { total: number; active: number; growth: number };
  organizations: { total: number; active: number };
  courts: { total: number; utilization: number };
  bookings: { total: number; recent: number; conversionRate: number };
  bugs: { total: number; open: number; critical: number; resolutionRate: number };
  timestamp: string;
};

export type DeveloperBug = {
  id: string;
  title: string;
  severity: string;
  status: string;
  module: string;
  reporter: string;
  reporterEmail?: string;
  pageUrl?: string;
  userAgent?: string;
  createdAt: string;
  description: string;
};

export type NavTab = 'overview' | 'organizations' | 'bugs' | 'reports' | 'timeline' | 'alerts';

export const NAV_TABS = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'organizations', label: 'Organizations', icon: '🏢' },
  { key: 'bugs', label: 'Bug Triage', icon: '⬡' },
  { key: 'reports', label: 'Test Reports', icon: '📊' },
  { key: 'timeline', label: 'Timeline', icon: '◎' },
  { key: 'alerts', label: 'Alerts', icon: '◆' },
] as const;

export const statusOrder = ['open', 'in_progress', 'resolved'] as const;

export const statusBadge: Record<string, string> = {
  open: 'bg-red-950/60 text-red-300 border border-red-700/50',
  in_progress: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
  resolved: 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50',
};

export const severityDot: Record<string, string> = {
  critical: 'bg-red-400 shadow-[0_0_8px_#f87171]',
  high: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
  medium: 'bg-yellow-400 shadow-[0_0_8px_#facc15]',
  low: 'bg-green-400 shadow-[0_0_8px_#4ade80]',
};

export const metricsConfig = [
  { key: 'cpuUsage', label: 'CPU', unit: '%', warning: 85, max: 100, color: '#22d3ee' },
  { key: 'memoryUsage', label: 'Memory', unit: '%', warning: 90, max: 100, color: '#a78bfa' },
  { key: 'responseTime', label: 'Response', unit: 'ms', warning: 650, max: 1000, color: '#34d399' },
  { key: 'errorRate', label: 'Errors', unit: '%', warning: 5, max: 10, color: '#f87171' },
];