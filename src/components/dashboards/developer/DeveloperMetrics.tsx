'use client';

import { DeveloperMetrics as MetricsType, metricsConfig } from './types';

interface DeveloperMetricsProps {
  metrics: MetricsType | null;
}

export function DeveloperMetrics({ metrics }: DeveloperMetricsProps) {
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
            className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700/80 transition-colors"
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
              className="rounded-2xl border border-slate-800/50 bg-slate-900/60 backdrop-blur p-5 space-y-4 hover:border-slate-700 transition-colors"
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
          <div key={s.label} className="rounded-2xl border border-slate-800/50 bg-slate-900/60 p-4">
            <p className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}