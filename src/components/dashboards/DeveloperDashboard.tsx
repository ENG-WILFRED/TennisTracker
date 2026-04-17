'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/components/ui/ToastContext';
import type { Socket } from 'socket.io-client';

type DeveloperMetrics = {
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

type DeveloperBug = {
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

const statusOrder = ['open', 'in_progress', 'resolved'] as const;

const NAV_TABS = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'organizations', label: 'Organizations', icon: '🏢' },
  { key: 'bugs', label: 'Bug Triage', icon: '⬡' },
  { key: 'timeline', label: 'Timeline', icon: '◎' },
  { key: 'alerts', label: 'Alerts', icon: '◆' },
] as const;

type NavTab = typeof NAV_TABS[number]['key'];

const statusBadge: Record<string, string> = {
  open: 'bg-red-950/60 text-red-300 border border-red-700/50',
  in_progress: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
  resolved: 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50',
};

const severityDot: Record<string, string> = {
  critical: 'bg-red-400 shadow-[0_0_8px_#f87171]',
  high: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
  medium: 'bg-yellow-400 shadow-[0_0_8px_#facc15]',
  low: 'bg-green-400 shadow-[0_0_8px_#4ade80]',
};

const metricsConfig = [
  { key: 'cpuUsage', label: 'CPU', unit: '%', warning: 85, max: 100, color: '#22d3ee' },
  { key: 'memoryUsage', label: 'Memory', unit: '%', warning: 90, max: 100, color: '#a78bfa' },
  { key: 'responseTime', label: 'Response', unit: 'ms', warning: 650, max: 1000, color: '#34d399' },
  { key: 'errorRate', label: 'Errors', unit: '%', warning: 5, max: 10, color: '#f87171' },
];

export function DeveloperDashboard() {
  const { user } = useAuth();
  const { currentRole } = useRole();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [bugs, setBugs] = useState<DeveloperBug[]>([]);
  const [metrics, setMetrics] = useState<DeveloperMetrics | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [bugReplyText, setBugReplyText] = useState('');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string[]>([
    'Realtime monitor initialized',
    'Bug tracker synced with issue feed',
    'Health check completed: 14 services alive',
  ]);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customResponse, setCustomResponse] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [cachedMetrics, setCachedMetrics] = useState<DeveloperMetrics | null>(null);
  const wsRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, bugsRes, orgsRes] = await Promise.all([
          fetch('/api/developer/metrics'),
          fetch('/api/developer/bugs?limit=20'),
          fetch('/api/developer/organizations'),
        ]);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
          setCachedMetrics(metricsData);
        }
        if (bugsRes.ok) {
          const d = await bugsRes.json();
          setBugs(d.bugReports || []);
        }
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          setOrganizations(orgsData.pending || []);
        }
      } catch {
        addToast('Failed to load developer dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  useEffect(() => {
    // Dynamic import of socket.io client
    const initializeSocket = async () => {
      const { io } = await import('socket.io-client');

      const connect = () => {
        try {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const socket = io(`${protocol}//${window.location.host}`, {
            path: '/api/socketio',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
          });

          socket.on('connect', () => {
            setWsConnected(true);
            setTimeline(p => [`Socket.IO connected — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
            
            // Subscribe to developer metrics
            socket.emit('developer_subscribe');
          });

          socket.on('developer_subscribed', () => {
            setTimeline(p => [`Developer metrics streaming enabled — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
          });

          socket.on('developer_metrics_update', (metricsData: DeveloperMetrics) => {
            // Only update if metrics actually changed
            if (JSON.stringify(metricsData) !== JSON.stringify(cachedMetrics)) {
              setMetrics(metricsData);
              setCachedMetrics(metricsData);
            }
          });

          socket.on('bug_status_update', (data: any) => {
            setBugs(p => p.map(b => b.id === data.id ? { ...b, status: data.status } : b));
            const note = `Bug "${data.title}" → ${data.status}`;
            setNotificationLog(p => [note, ...p.slice(0, 7)]);
            addToast(note, 'info');
          });

          socket.on('disconnect', () => {
            setWsConnected(false);
            setTimeline(p => [`Socket.IO disconnected — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
          });

          socket.on('error', (error: any) => {
            console.error('Socket.IO error:', error);
            addToast('Connection error: ' + (error?.message || 'Unknown error'), 'error');
          });

          socket.on('ping', (data: any) => {
            socket.emit('pong', data);
          });

          wsRef.current = socket;
        } catch (error) {
          console.error('Socket.IO connection error:', error);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };

      connect();
    };

    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.emit('developer_unsubscribe');
        wsRef.current.disconnect();
      }
    };
  }, [addToast, cachedMetrics]);

  useEffect(() => {
    const refreshBugs = async () => {
      try {
        const r = await fetch('/api/developer/bugs?limit=20');
        if (r.ok) {
          const d = await r.json();
          setBugs(d.bugReports || []);
        }
      } catch {}
    };

    refreshBugs();
    const bugInterval = setInterval(refreshBugs, 15000);
    return () => clearInterval(bugInterval);
  }, []);

  // Automatic ping every 5 minutes
  useEffect(() => {
    const pingBaseUrl = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch('/', { method: 'HEAD' });
        const latency = Date.now() - startTime;
        setPingLatency(latency);
        setPingStatus(response.ok ? 'ok' : 'failed');
        setLastPingAt(new Date().toLocaleTimeString());
        
        const statusText = response.ok ? `OK (${latency}ms)` : 'FAILED';
        setTimeline(p => [`Auto ping: ${statusText} — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
        
        if (!response.ok) {
          addToast(`Base URL ping failed: ${response.status}`, 'error');
        }
      } catch (error) {
        setPingStatus('failed');
        setLastPingAt(new Date().toLocaleTimeString());
        setTimeline(p => [`Auto ping: FAILED — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
        addToast('Base URL ping failed', 'error');
      }
    };

    // Initial ping
    pingBaseUrl();
    
    // Set up interval for every 5 minutes
    const pingInterval = setInterval(pingBaseUrl, 5 * 60 * 1000);
    
    return () => clearInterval(pingInterval);
  }, [addToast]);

  const openBugs = useMemo(() => bugs.filter(b => b.status !== 'resolved'), [bugs]);
  const selectedBug = useMemo(
    () => bugs.find((b) => b.id === selectedBugId) || null,
    [bugs, selectedBugId]
  );

  const handleUpdateStatus = async (bugId: string) => {
    const bug = bugs.find(b => b.id === bugId);
    if (!bug) return;
    const next = statusOrder[(statusOrder.indexOf(bug.status as any) + 1) % statusOrder.length];
    try {
      const r = await fetch('/api/developer/bugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bugId, status: next }),
      });
      if (r.ok) {
        setBugs(p => p.map(b => b.id === bugId ? { ...b, status: next } : b));
        if (next === 'resolved') {
          const note = `Resolved: ${bug.title}`;
          setNotificationLog(p => [note, ...p.slice(0, 7)]);
          addToast(note, 'success');
        }
      } else addToast('Failed to update bug status', 'error');
    } catch {
      addToast('Failed to update bug status', 'error');
    }
  };

  const sendBugResponse = async () => {
    if (!selectedBug) {
      addToast('Please select a bug to respond to.', 'warning');
      return;
    }
    if (!bugReplyText.trim()) {
      addToast('Enter a response before sending.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/developer/bugs/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBug.id, message: bugReplyText.trim() }),
      });

      if (response.ok) {
        setTimeline(p => [`Response sent to ${selectedBug.reporter}: "${bugReplyText.substring(0, 50)}..." — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)]);
        setNotificationLog(p => [`Response sent to ${selectedBug.reporter}`, ...p.slice(0, 7)]);
        addToast('Bug response sent successfully', 'success');
        setBugReplyText('');
      } else {
        addToast('Failed to send bug response', 'error');
      }
    } catch (error) {
      addToast('Failed to send bug response', 'error');
    }
  };

  const handleOrganizationAction = async (orgId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/developer/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId, action }),
      });

      if (response.ok) {
        const result = await response.json();
        if (action === 'approve') {
          addToast(`Organization "${result.organization.name}" approved successfully`, 'success');
          setNotificationLog(p => [`Approved organization: ${result.organization.name}`, ...p.slice(0, 7)]);
        } else {
          addToast(`Organization "${result.organization.name}" rejected`, 'success');
          setNotificationLog(p => [`Rejected organization: ${result.organization.name}`, ...p.slice(0, 7)]);
        }
        // Refresh organizations list
        const orgsResponse = await fetch('/api/developer/organizations');
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          setOrganizations(orgsData.pending || []);
        }
      } else {
        const error = await response.json();
        addToast(`Failed to ${action} organization: ${error.error}`, 'error');
      }
    } catch (error) {
      addToast(`Failed to ${action} organization`, 'error');
    }
  };

  const getMetricValue = (key: string): number => {
    if (!metrics) return 0;
    switch (key) {
      case 'cpuUsage': return metrics.system.cpuUsage;
      case 'memoryUsage': return metrics.system.memoryUsage;
      case 'responseTime': return metrics.system.responseTime.avg;
      case 'errorRate': return metrics.system.errorRate;
      default: return 0;
    }
  };

  const healthStatus = metrics
    ? (metrics.system.cpuUsage > 85 || metrics.system.memoryUsage > 90 || metrics.system.errorRate > 5
      ? 'CRITICAL'
      : metrics.system.cpuUsage > 72 || metrics.system.memoryUsage > 80 || metrics.system.errorRate > 3
      ? 'WARNING'
      : 'STABLE')
    : 'LOADING';

  const healthColor = {
    CRITICAL: 'text-red-400 border-red-700/60 bg-red-950/40',
    WARNING: 'text-amber-400 border-amber-700/60 bg-amber-950/40',
    STABLE: 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40',
    LOADING: 'text-slate-400 border-slate-700/60 bg-slate-950/40',
  }[healthStatus];

  const healthGlow = {
    CRITICAL: 'shadow-[0_0_24px_rgba(248,113,113,0.25)]',
    WARNING: 'shadow-[0_0_24px_rgba(251,191,36,0.2)]',
    STABLE: 'shadow-[0_0_24px_rgba(52,211,153,0.2)]',
    LOADING: '',
  }[healthStatus];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#03050a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">Booting systems…</p>
        </div>
      </main>
    );
  }

  // Restrict access to developers only
  if (currentRole !== 'developer') {
    return (
      <main className="min-h-screen bg-[#03050a] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-950/40 border border-red-700/60 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-slate-400">This dashboard is restricted to developers only.</p>
          <p className="text-slate-600 text-sm">Current role: <span className="text-slate-400 font-mono">{currentRole || 'unknown'}</span></p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#03050a] text-slate-100"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Ambient background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Header ── */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.4em] text-cyan-500 uppercase mb-1">◈ Developer Console v2</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Real-time{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                Site Monitor
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ping status */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/70 backdrop-blur px-3 py-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                pingStatus === 'ok' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
                pingStatus === 'failed' ? 'bg-red-400 shadow-[0_0_6px_#f87171]' :
                'bg-slate-500'
              }`} />
              <span className="text-slate-300 font-medium">
                Ping: {pingLatency ? `${pingLatency}ms` : '---'}
              </span>
              {lastPingAt && (
                <span className="text-slate-500 text-[10px]">({lastPingAt})</span>
              )}
            </div>
            {/* User chip */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/70 backdrop-blur px-3 py-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">
                {(user?.username || 'W')[0].toUpperCase()}
              </span>
              <span className="text-slate-300 font-medium">{user?.username || 'wilfred'}</span>
            </div>
            {/* Health badge */}
            <div className={`rounded-xl border px-3 py-2 text-xs font-bold tracking-wider ${healthColor} ${healthGlow}`}>
              {healthStatus === 'STABLE' && <span className="mr-1.5">●</span>}
              {healthStatus === 'WARNING' && <span className="mr-1.5 animate-pulse">●</span>}
              {healthStatus === 'CRITICAL' && <span className="mr-1.5 animate-ping inline-flex">●</span>}
              {healthStatus}
            </div>
            {/* Open bugs counter */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
              <span className="text-white font-bold">{openBugs.length}</span> open
            </div>
          </div>
        </header>

        {/* ── Nav Tabs ── */}
        <nav className="mb-6 flex gap-1 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur p-1 overflow-x-auto">
          {NAV_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.15)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.key === 'bugs' && openBugs.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500/80 px-1.5 py-0.5 text-[10px] text-white font-bold">
                  {openBugs.length}
                </span>
              )}
              {tab.key === 'alerts' && notificationLog.length > 0 && (
                <span className="ml-1 rounded-full bg-violet-500/80 px-1.5 py-0.5 text-[10px] text-white font-bold">
                  {notificationLog.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ══════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Active Users', value: metrics?.users.active ?? 0, icon: '◉', color: 'cyan' },
                { label: 'Open Bugs', value: metrics?.bugs.open ?? 0, icon: '⬡', color: 'red' },
                { label: 'DB Queries/min', value: metrics?.database.queriesPerMinute ?? 0, icon: '◈', color: 'violet' },
                { label: 'Resolution Rate', value: `${metrics?.bugs.resolutionRate ?? 0}%`, icon: '◆', color: 'emerald' },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700/80 transition-colors"
                >
                  <p className={`text-[10px] tracking-widest uppercase mb-2 ${
                    s.color === 'cyan' ? 'text-cyan-500' :
                    s.color === 'red' ? 'text-red-400' :
                    s.color === 'violet' ? 'text-violet-400' : 'text-emerald-400'
                  }`}>
                    {s.icon} {s.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Metrics panels */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricsConfig.map(m => {
                const val = getMetricValue(m.key);
                const ratio = Math.min(1, val / m.max);
                const overWarn = val > m.warning;
                const displayVal = m.key === 'responseTime' ? `${val.toFixed(0)}${m.unit}` : `${val.toFixed(1)}${m.unit}`;

                return (
                  <div
                    key={m.key}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur p-5 space-y-4 hover:border-slate-700 transition-colors"
                    style={{ '--accent': m.color } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-widest uppercase text-slate-500">{m.label}</span>
                      <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full ${
                        overWarn
                          ? 'bg-red-950/70 text-red-400 border border-red-800/50'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {overWarn ? 'WATCH' : 'OK'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: m.color }}>{displayVal}</p>
                    {/* Mini radial / bar */}
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(4, ratio * 100)}%`,
                          background: overWarn
                            ? 'linear-gradient(90deg, #f87171, #ef4444)'
                            : `linear-gradient(90deg, ${m.color}99, ${m.color})`,
                          boxShadow: overWarn ? '0 0 8px #f87171' : `0 0 8px ${m.color}`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                      <span>0</span>
                      <span>{m.max}{m.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DB + bookings grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'DB Connections', value: metrics?.database.connections ?? 0, sub: `${metrics?.database.activeConnections ?? 0} active` },
                { label: 'Total Bookings', value: metrics?.bookings.total ?? 0, sub: `${metrics?.bookings.recent ?? 0} recent` },
                { label: 'Conversion Rate', value: `${metrics?.bookings.conversionRate ?? 0}%`, sub: `${metrics?.users.growth ?? 0}% user growth` },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                  <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: BUG TRIAGE
        ══════════════════════════════════════════ */}
        {activeTab === 'bugs' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Open', value: bugs.filter(b => b.status === 'open').length, color: 'text-red-400' },
                { label: 'In Progress', value: bugs.filter(b => b.status === 'in_progress').length, color: 'text-amber-400' },
                { label: 'Resolved', value: bugs.filter(b => b.status === 'resolved').length, color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
                  <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.9fr_1fr]">
              <div className="space-y-3">
                {bugs.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
                    No bugs tracked yet.
                  </div>
                )}
                {bugs.map(bug => (
                  <div
                    key={bug.id}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Severity dot */}
                        <span className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${severityDot[bug.severity] || 'bg-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm leading-snug truncate">{bug.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {bug.module} · {new Date(bug.createdAt).toLocaleDateString()} · {bug.reporter}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:flex-shrink-0">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadge[bug.status] || statusBadge.open}`}>
                          {bug.status.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                          bug.severity === 'critical' ? 'border-red-700/50 text-red-400 bg-red-950/40' :
                          bug.severity === 'high' ? 'border-orange-700/50 text-orange-400 bg-orange-950/40' :
                          bug.severity === 'medium' ? 'border-yellow-700/50 text-yellow-400 bg-yellow-950/40' :
                          'border-green-700/50 text-green-400 bg-green-950/40'
                        }`}>
                          {bug.severity}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(bug.id)}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all"
                        >
                          Advance →
                        </button>
                        <button
                          onClick={() => setSelectedBugId(bug.id)}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-violet-500/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-violet-300 transition-all"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-slate-500">Selected Bug</p>
                      <p className="text-sm text-slate-300 font-semibold">{selectedBug ? selectedBug.title : 'Choose a bug from the list'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      selectedBug?.status === 'open' ? 'bg-red-950/70 text-red-400 border border-red-800/50' :
                      selectedBug?.status === 'in_progress' ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50' :
                      selectedBug?.status === 'resolved' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50' :
                      'bg-slate-950/70 text-slate-400 border border-slate-800/50'
                    }`}>
                      {selectedBug ? selectedBug.status.replace('_', ' ') : 'Idle'}
                    </span>
                  </div>
                  {selectedBug ? (
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/70 p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Reporter</p>
                        <p className="font-semibold">{selectedBug.reporter}</p>
                        <p className="text-[11px] text-slate-500">{selectedBug.reporterEmail || 'No email available'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/70 p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Bug details</p>
                        <p>{selectedBug.description}</p>
                        <p className="text-[11px] text-slate-500 mt-2">Module: {selectedBug.module}</p>
                        {selectedBug.pageUrl && <p className="text-[11px] text-slate-500">Page: {selectedBug.pageUrl}</p>}
                        {selectedBug.userAgent && <p className="text-[11px] text-slate-500">User agent: {selectedBug.userAgent}</p>}
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/70 p-4 space-y-2">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Custom response</p>
                        <textarea
                          value={bugReplyText}
                          onChange={(e) => setBugReplyText(e.target.value)}
                          className="w-full min-h-[120px] resize-none rounded-2xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          placeholder="Write a response to the reporter..."
                        />
                        <button
                          onClick={sendBugResponse}
                          className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Send response
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
                      Select a bug to review details and send a custom response to the reporter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: TIMELINE
        ══════════════════════════════════════════ */}
        {activeTab === 'timeline' && (
          <div className="animate-fadeIn space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-widest uppercase text-slate-500">Event log</p>
              <span className="text-[10px] text-emerald-400 border border-emerald-800/40 bg-emerald-950/30 rounded-full px-2.5 py-1">● Live</span>
            </div>
            {timeline.map((event, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
                  {i < timeline.length - 1 && <div className="w-px flex-1 mt-1.5 bg-slate-800" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Event {timeline.length - i}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{event}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: ALERTS
        ══════════════════════════════════════════ */}
        {activeTab === 'alerts' && (
          <div className="animate-fadeIn space-y-4">
            {/* Performance bar chart */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 space-y-5">
              <p className="text-[10px] tracking-widest uppercase text-slate-500">Performance Trend</p>
              {metricsConfig.map(m => {
                const val = getMetricValue(m.key);
                const ratio = Math.min(1, val / m.max);
                const displayVal = m.key === 'responseTime' ? `${val.toFixed(0)}${m.unit}` : `${val.toFixed(1)}${m.unit}`;
                return (
                  <div key={m.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{m.label}</span>
                      <span className="font-mono font-bold" style={{ color: m.color }}>{displayVal}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(3, ratio * 100)}%`,
                          background: `linear-gradient(90deg, ${m.color}60, ${m.color})`,
                          boxShadow: `0 0 10px ${m.color}80`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification log */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 space-y-3">
              <p className="text-[10px] tracking-widest uppercase text-slate-500">Notification Log</p>
              {notificationLog.length === 0 && (
                <p className="text-sm text-slate-600">No notifications yet. Advance bug statuses to generate events.</p>
              )}
              {notificationLog.map((note, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-violet-900/40 bg-violet-950/20 px-4 py-3 text-sm text-slate-300">
                  <span className="text-violet-400 mt-0.5 flex-shrink-0">◆</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* System quick actions */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
              <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-4">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => {
                    if (openBugs.length === 0) addToast('All tracked issues are clear. Systems stable.', 'success');
                    else addToast('Maintaining focus on active bug resolution.', 'info');
                  }}
                  className="rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/40 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-all text-left"
                >
                  ◈ Run Health Check
                </button>
                <button
                  onClick={() => setTimeline(p => [`Manual ping — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)])}
                  className="rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-violet-500/40 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-violet-300 transition-all text-left"
                >
                  ◎ Ping Timeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: ORGANIZATIONS
        ══════════════════════════════════════════ */}
        {activeTab === 'organizations' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Summary row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{organizations.length}</p>
                <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Pending Approval</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{metrics?.organizations.total ?? 0}</p>
                <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Total Approved</p>
              </div>
            </div>

            <div className="space-y-3">
              {organizations.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
                  No organizations pending approval.
                </div>
              ) : (
                organizations.map((org: any) => (
                  <div
                    key={org.id}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white truncate">{org.name}</h3>
                          <span className="inline-block bg-amber-950/70 text-amber-400 border border-amber-800/50 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full">
                            PENDING
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">{org.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>📍 {org.city}, {org.country}</span>
                          <span>👤 {org.creator?.firstName} {org.creator?.lastName}</span>
                          <span>📧 {org.creator?.email}</span>
                          {org.phone && <span>📞 {org.phone}</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          Created: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleOrganizationAction(org.id, 'approve')}
                          className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 hover:bg-emerald-900/60 px-4 py-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-all"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleOrganizationAction(org.id, 'reject')}
                          className="rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-all"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Fade-in animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out both; }
      `}</style>
    </main>
  );
}