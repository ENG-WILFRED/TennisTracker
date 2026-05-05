'use client';

import { DeveloperMetrics as MetricsType, metricsConfig } from './types';

interface DeveloperAlertsProps {
  metrics: MetricsType | null;
  notificationLog: string[];
  onManualPing: () => void;
  onHealthCheck: () => void;
}

export function DeveloperAlerts({
  metrics,
  notificationLog,
  onManualPing,
  onHealthCheck,
}: DeveloperAlertsProps) {
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

  return (
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
            onClick={onHealthCheck}
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/40 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-all text-left"
          >
            ◈ Run Health Check
          </button>
          <button
            onClick={onManualPing}
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-violet-500/40 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-violet-300 transition-all text-left"
          >
            ◎ Ping Timeline
          </button>
        </div>
      </div>
    </div>
  );
}