'use client';

import { DeveloperBug, statusBadge, severityDot } from './types';

interface DeveloperBugTriageProps {
  bugs: DeveloperBug[];
  selectedBugId: string | null;
  bugReplyText: string;
  onUpdateStatus: (bugId: string) => void;
  onSelectBug: (bugId: string) => void;
  onSendBugResponse: () => void;
  onBugReplyTextChange: (text: string) => void;
}

export function DeveloperBugTriage({
  bugs,
  selectedBugId,
  bugReplyText,
  onUpdateStatus,
  onSelectBug,
  onSendBugResponse,
  onBugReplyTextChange,
}: DeveloperBugTriageProps) {
  const openBugs = bugs.filter(b => b.status !== 'resolved');
  const selectedBug = bugs.find((b) => b.id === selectedBugId) || null;

  return (
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
                    onClick={() => onUpdateStatus(bug.id)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all"
                  >
                    Advance →
                  </button>
                  <button
                    onClick={() => onSelectBug(bug.id)}
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
                    onChange={(e) => onBugReplyTextChange(e.target.value)}
                    className="w-full min-h-[120px] resize-none rounded-2xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Write a response to the reporter..."
                  />
                  <button
                    onClick={onSendBugResponse}
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
  );
}