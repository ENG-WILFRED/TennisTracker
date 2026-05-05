'use client';

interface DeveloperTimelineProps {
  timeline: string[];
}

export function DeveloperTimeline({ timeline }: DeveloperTimelineProps) {
  return (
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
  );
}