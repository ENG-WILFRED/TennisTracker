'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/components/ui/ToastContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

import { DeveloperMetrics as MetricsType, DeveloperBug, NavTab, NAV_TABS } from './developer/types';
import { DeveloperHeader } from './developer/DeveloperHeader';
import { DeveloperMetrics } from './developer/DeveloperMetrics';
import { DeveloperOrgList } from './developer/DeveloperOrgList';
import { DeveloperBugTriage } from './developer/DeveloperBugTriage';
import { DeveloperTestReports } from './developer/DeveloperTestReports';
import { DeveloperTimeline } from './developer/DeveloperTimeline';
import { DeveloperAlerts } from './developer/DeveloperAlerts';
import { useDeveloperSocket } from './developer/useDeveloperSocket';
import { useAutoPing } from './developer/useAutoPing';
import { useDeveloperDataLoader } from './developer/useDeveloperDataLoader';
import { useHealthStatus } from './developer/useHealthStatus';
import { useOrganizationActions } from './developer/useOrganizationActions';
import { useBugActions } from './developer/useBugActions';
import { useTestRunner } from './developer/useTestRunner';

export function DeveloperDashboard() {
  const { user } = useAuth();
  const { currentRole } = useRole();
  const { addToast } = useToast();
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [bugs, setBugs] = useState<DeveloperBug[]>([]);
  const [metrics, setMetrics] = useState<MetricsType | null>(null);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [bugReplyText, setBugReplyText] = useState('');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string[]>(['Realtime monitor initialized', 'Bug tracker synced', 'Health check completed']);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [testReports, setTestReports] = useState<any[]>([]);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState<Record<string, any>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Load initial data
  useDeveloperDataLoader((data) => {
    setMetrics(data.metrics);
    setOrganizations(data.orgs);
    setTestReports(data.reports);
    setIsLoading(false);
  });

  // Setup WebSocket connection and listeners
  useDeveloperSocket(
    (metricsData) => setMetrics(metricsData),
    (newBug) => setBugs(p => [newBug, ...p]),
    (data) => setBugs(p => p.map(b => b.id === data.id ? { ...b, status: data.status } : b)),
    async (data) => {
      setIsRunningTests(false);
      setRunningTestId(null);
      const reportsRes = await authenticatedFetch('/api/developer/test-results/stats?days=7');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setTestReports(reportsData.testRuns || []);
      }
    },
    (event) => setTimeline(p => [event, ...p.slice(0, 9)]),
    (note) => setNotificationLog(p => [note, ...p.slice(0, 7)])
  );

  // Setup auto-pinging
  useAutoPing(
    (latency, status, time) => {
      setPingLatency(latency);
      setPingStatus(status);
      setLastPingAt(time);
    },
    (event) => setTimeline(p => [event, ...p.slice(0, 9)])
  );

  // Load bugs on mount
  useEffect(() => {
    const loadBugs = async () => {
      try {
        const r = await authenticatedFetch('/api/developer/bugs?limit=20');
        if (r.ok) {
          const d = await r.json();
          setBugs(d.bugReports || []);
        }
      } catch {
        console.error('Failed to load bugs');
      }
    };
    loadBugs();
  }, []);

  // Health status calculations
  const { healthStatus, healthColor, healthGlow } = useHealthStatus(metrics);

  // Organization management
  const refreshOrganizations = useCallback(async () => {
    const orgsResponse = await authenticatedFetch('/api/developer/organizations?status=all');
    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      setOrganizations(orgsData.organizations || orgsData.pending || []);
    }
  }, []);

  const { handleOrganizationAction, handleEmailOrg } = useOrganizationActions(
    (action, orgName) => setNotificationLog(p => [`${action.charAt(0).toUpperCase() + action.slice(1)} organization: ${orgName}`, ...p.slice(0, 7)]),
    refreshOrganizations
  );

  // Bug management
  const { handleUpdateStatus, sendBugResponse: executeSendBugResponse } = useBugActions(
    (bugId, status) => setBugs(p => p.map(b => b.id === bugId ? { ...b, status } : b)),
    (event) => setTimeline(p => [event, ...p.slice(0, 9)])
  );

  // Test runner
  const { triggerTestRun } = useTestRunner((event) => setTimeline(p => [event, ...p.slice(0, 9)]));

  // Wrap sendBugResponse for the component
  const sendBugResponse = useCallback(async () => {
    const selectedBug = bugs.find(b => b.id === selectedBugId) || null;
    await executeSendBugResponse(
      selectedBug,
      bugReplyText,
      () => setBugReplyText(''),
      (event) => setTimeline(p => [event, ...p.slice(0, 9)])
    );
  }, [selectedBugId, bugReplyText, bugs, executeSendBugResponse]);

  const triggerTest = useCallback(
    (suite: string) => triggerTestRun(suite, setRunningTestId, setIsRunningTests),
    [triggerTestRun]
  );

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        addToast('Logged out successfully', 'success');
        router.push('/login');
      } else {
        addToast('Failed to logout', 'error');
      }
    } catch {
      addToast('Failed to logout', 'error');
    }
  }, [addToast, router]);

  // Memoized computed values
  const openBugs = useMemo(() => bugs.filter(b => b.status !== 'resolved'), [bugs]);
  const orgsByStatus = useMemo(() => ({
    pending: organizations.filter(o => o.status === 'pending'),
    approved: organizations.filter(o => o.status === 'approved'),
    suspended: organizations.filter(o => o.status === 'suspended'),
    rejected: organizations.filter(o => o.status === 'rejected'),
  }), [organizations]);

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
      style={{ fontFamily: "'DM Mono', 'JetBrains Mono', 'Fira Code', monospace" }}
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

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-visible">
        <DeveloperHeader
          pingLatency={pingLatency}
          pingStatus={pingStatus}
          lastPingAt={lastPingAt}
          user={user}
          healthStatus={healthStatus}
          healthColor={healthColor}
          healthGlow={healthGlow}
          openBugs={openBugs}
          onLogout={handleLogout}
        />

        {/* ── Responsive Navigation ── */}
        <div className="mb-6 grid gap-3 relative z-50">
          <div className="sm:hidden relative z-50">
            <label htmlFor="developer-tab-select" className="sr-only">Select dashboard tab</label>
            <select
              id="developer-tab-select"
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value as NavTab)}
              className="w-full rounded-2xl border border-slate-700/90 bg-slate-950/90 px-4 py-3 text-sm text-slate-200 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            >
              {NAV_TABS.map(tab => (
                <option key={tab.key} value={tab.key} className="bg-slate-950 text-slate-200">
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          <nav className="hidden sm:flex gap-1 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur p-1 overflow-x-auto">
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
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <DeveloperMetrics metrics={metrics} />}
        {activeTab === 'organizations' && (
          <DeveloperOrgList
            organizations={organizations}
            pendingOrganizations={orgsByStatus.pending}
            approvedOrganizations={orgsByStatus.approved}
            suspendedOrganizations={orgsByStatus.suspended}
            rejectedOrganizations={orgsByStatus.rejected}
            onOrganizationAction={handleOrganizationAction}
            onEmailOrg={handleEmailOrg}
            onRefresh={refreshOrganizations}
          />
        )}
        {activeTab === 'bugs' && (
          <DeveloperBugTriage
            bugs={bugs}
            selectedBugId={selectedBugId}
            bugReplyText={bugReplyText}
            onUpdateStatus={(id) => handleUpdateStatus(id, bugs.find(b => b.id === id))}
            onSelectBug={setSelectedBugId}
            onSendBugResponse={sendBugResponse}
            onBugReplyTextChange={setBugReplyText}
          />
        )}
        {activeTab === 'reports' && (
          <DeveloperTestReports
            testReports={testReports}
            runningTestId={runningTestId}
            testProgress={testProgress}
            isRunningTests={isRunningTests}
            onTriggerTestRun={triggerTest}
          />
        )}
        {activeTab === 'timeline' && <DeveloperTimeline timeline={timeline} />}
        {activeTab === 'alerts' && (
          <DeveloperAlerts
            metrics={metrics}
            notificationLog={notificationLog}
            onManualPing={() => setTimeline(p => [`Manual ping — ${new Date().toLocaleTimeString()}`, ...p.slice(0, 9)])}
            onHealthCheck={() => {
              if (openBugs.length === 0) addToast('All tracked issues are clear. Systems stable.', 'success');
              else addToast('Maintaining focus on active bug resolution.', 'info');
            }}
          />
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