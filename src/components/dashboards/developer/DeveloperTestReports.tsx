'use client';

interface DeveloperTestReportsProps {
  testReports: any[];
  runningTestId: string | null;
  testProgress: Record<string, any>;
  isRunningTests: boolean;
  onTriggerTestRun: (suite: string) => void;
}

export function DeveloperTestReports({
  testReports,
  runningTestId,
  testProgress,
  isRunningTests,
  onTriggerTestRun,
}: DeveloperTestReportsProps) {
  return (
    <div className="animate-fadeIn space-y-4">
      {/* Test Runner Controls */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
        <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-4">Run Tests</p>

        {isRunningTests && runningTestId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-cyan-300">Tests Running...</p>
              <p className="text-xs text-slate-400">{testProgress.progress?.toFixed(0) || 0}%</p>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${testProgress.progress || 0}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-400">Total</p>
                <p className="font-bold text-slate-300">{testProgress.summary?.total || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-emerald-400">Passed</p>
                <p className="font-bold text-emerald-300">{testProgress.summary?.passed || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-red-400">Failed</p>
                <p className="font-bold text-red-300">{testProgress.summary?.failed || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-amber-400">Skipped</p>
                <p className="font-bold text-amber-300">{testProgress.summary?.skipped || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: 'All Tests', suite: 'all', icon: '▶' },
              { name: 'Auth', suite: 'auth', icon: '🔐' },
              { name: 'Booking', suite: 'court-booking', icon: '📅' },
              { name: 'WebSocket', suite: 'websocket', icon: '🔌' },
              { name: 'Payment', suite: 'payment', icon: '💳' },
            ].map(test => (
              <button
                key={test.suite}
                onClick={() => onTriggerTestRun(test.suite)}
                disabled={isRunningTests}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-all"
              >
                {test.icon} {test.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Test reports summary */}
      {testReports.length > 0 && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-4">Test Statistics (Last 7 Days)</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-emerald-900/30 p-3 border border-emerald-700/30">
              <p className="text-xs text-emerald-300 font-semibold">Total Passed</p>
              <p className="text-lg font-bold text-emerald-400">{testReports[0]?.overallStats?.passedResults || 0}</p>
            </div>
            <div className="rounded-lg bg-red-900/30 p-3 border border-red-700/30">
              <p className="text-xs text-red-300 font-semibold">Total Failed</p>
              <p className="text-lg font-bold text-red-400">{testReports[0]?.overallStats?.failedResults || 0}</p>
            </div>
            <div className="rounded-lg bg-blue-900/30 p-3 border border-blue-700/30">
              <p className="text-xs text-blue-300 font-semibold">Pass Rate</p>
              <p className="text-lg font-bold text-blue-400">{(testReports[0]?.overallStats?.passRate || 0).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-amber-900/30 p-3 border border-amber-700/30">
              <p className="text-xs text-amber-300 font-semibold">Total Results</p>
              <p className="text-lg font-bold text-amber-400">{testReports[0]?.overallStats?.totalResults || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test runs list */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 space-y-3">
        <p className="text-[10px] tracking-widest uppercase text-slate-500">Recent Test Runs</p>
        {testReports.length === 0 ? (
          <p className="text-sm text-slate-600">No test runs available.</p>
        ) : (
          testReports[0]?.testRuns?.map((run: any, i: number) => (
            <div key={i} className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">{run.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${run.status === 'PASSED' ? 'bg-emerald-900/60 text-emerald-300' : run.status === 'FAILED' ? 'bg-red-900/60 text-red-300' : 'bg-amber-900/60 text-amber-300'}`}>
                  {run.status}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 mb-2">
                <div>✓ {run.passedTests || 0} passed</div>
                <div>✗ {run.failedTests || 0} failed</div>
                <div>⊘ {run.skippedTests || 0} skipped</div>
                <div>⏱ {((run.duration || 0) / 1000).toFixed(2)}s</div>
              </div>
              <p className="text-xs text-slate-500">{new Date(run.startTime).toLocaleString()}</p>
            </div>
          ))
        )}

        {/* Latest failures */}
        {testReports[0]?.latestFailures?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/70">
            <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-3">Latest Failures</p>
            <div className="space-y-2">
              {testReports[0].latestFailures.map((failure: any, i: number) => (
                <div key={i} className="rounded-lg border border-red-700/30 bg-red-900/20 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-300">{failure.testName}</p>
                      <p className="text-xs text-slate-400 mt-1">{failure.error}</p>
                    </div>
                    <span className="text-xs text-slate-500 ml-2">{((failure.duration || 0) / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}