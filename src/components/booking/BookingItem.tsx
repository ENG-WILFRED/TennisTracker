'use client';

import React from 'react';

interface BookingItemProps {
  booking: any;
  canView?: boolean;
}

export function BookingItem({ booking, canView = false }: BookingItemProps) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const isPast = start < new Date();
  const durationHrs = Math.round((end.getTime() - start.getTime()) / 3600000);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-[#7dc142] text-[#0f1f0f]',
    cancelled: 'bg-red-900/60 text-red-400',
    completed: 'bg-[#2d5a35] text-[#7aaa6a]',
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${booking.status === 'cancelled' ? 'border-red-900/40 opacity-60' : 'border-[#2d5a35] hover:border-[#7dc142]/40'} bg-[#152515]`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-[#e8f5e0]">🎾 {booking.court?.name || 'Court Booking'}</div>
          <div className="text-xs text-[#7aaa6a] mt-0.5">
            {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${statusColors[booking.status] || 'bg-[#2d5a35] text-[#7aaa6a]'}`}>
          {booking.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">Start</div>
          <div className="text-xs font-bold text-[#e8f5e0]">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">End</div>
          <div className="text-xs font-bold text-[#e8f5e0]">{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">Duration</div>
          <div className="text-xs font-bold text-[#a8d84e]">{durationHrs}h</div>
        </div>
      </div>

      {canView && (
        <button className="w-full mt-3 py-2 text-[10px] font-bold bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7dc142] rounded-lg transition-colors">
          View Details →
        </button>
      )}
    </div>
  );
}
