'use client';

interface DeveloperHeaderProps {

  pingLatency: number | null;
  pingStatus: 'idle' | 'ok' | 'failed';
  lastPingAt: string | null;
  user: any;
  healthStatus: string;
  healthColor: string;
  healthGlow: string;
  openBugs: any[];
  onLogout: () => void;
}

export function DeveloperHeader({
  pingLatency,
  pingStatus,
  lastPingAt,
  user,
  healthStatus,
  healthColor,
  healthGlow,
  openBugs,
  onLogout,
}: DeveloperHeaderProps) {
  return (
    <header className="mb-6 grid gap-4">
      <div className="flex flex-col gap-4 rounded-[32px] border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_16px_80px_rgba(15,23,42,0.35)] sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.4em] text-cyan-400 uppercase mb-2">Developer Console</p>
          <h1 className="text-3xl font-semibold text-white leading-tight">Developer dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Track service health, manage organizations, triage bugs, and review test results in one polished interface.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-xs text-slate-300 shadow-sm">
            <p className="text-slate-400">Connected as</p>
            <p className="mt-1 font-semibold text-white">{user?.username || 'Developer'}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-3xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-xs font-semibold text-cyan-200 transition hover:bg-slate-800/90"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Health status</p>
          <p className={`mt-3 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${healthColor} ${healthGlow}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            {healthStatus}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Last ping</p>
          <p className="mt-3 text-sm font-semibold text-white">{pingLatency ? `${pingLatency}ms` : 'Pending'}</p>
          <p className="mt-1 text-xs text-slate-500">{lastPingAt || 'Awaiting check'}</p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Open issues</p>
          <p className="mt-3 text-3xl font-semibold text-white">{openBugs.length}</p>
          <p className="mt-1 text-xs text-slate-500">Active bug reports</p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quick actions</p>
          <p className="mt-3 text-sm text-slate-300">Use the tabs below to access organizations, reports, and bug triage workflows.</p>
        </div>
      </div>
    </header>
  );
}
