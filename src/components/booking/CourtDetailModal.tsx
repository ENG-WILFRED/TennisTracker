'use client';

import React from 'react';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1a3020] border border-[#2d5a35] rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const COURT_FEATURES: Record<string, string[]> = {
  default: ['🌞 Outdoor', '💡 Floodlit', '🔒 Access Card', '🪑 Seating'],
};

interface CourtDetailModalProps {
  court: any;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CourtDetailModal({ court, isOpen, onConfirm, onCancel }: CourtDetailModalProps) {
  if (!isOpen || !court) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-[#7dc142] mb-1">🎾 {court.name}</h2>
            <p className="text-sm text-[#7aaa6a]">{court.surface || 'Hard Court'}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#7aaa6a] hover:text-[#e8f5e0] transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Features */}
        <div className="mb-6">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8d84e] mb-2 block">
            Features & Amenities
          </label>
          <div className="flex flex-wrap gap-2">
            {(COURT_FEATURES[court.id] || COURT_FEATURES.default).map(f => (
              <span key={f} className="text-xs bg-[#2d5a27] text-[#7dc142] px-3 py-1.5 rounded-lg border border-[#7dc142]/30">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#152515] rounded-lg p-3">
            <div className="text-[9px] text-[#7aaa6a] font-semibold mb-1">Surface</div>
            <div className="text-sm font-bold text-[#e8f5e0]">{court.surface || 'Hard'}</div>
          </div>
          <div className="bg-[#152515] rounded-lg p-3">
            <div className="text-[9px] text-[#7aaa6a] font-semibold mb-1">Type</div>
            <div className="text-sm font-bold text-[#e8f5e0]">Indoor/Outdoor</div>
          </div>
          <div className="bg-[#152515] rounded-lg p-3">
            <div className="text-[9px] text-[#7aaa6a] font-semibold mb-1">Hourly Rate</div>
            <div className="text-sm font-bold text-[#a8d84e]">$45/hr</div>
          </div>
          <div className="bg-[#152515] rounded-lg p-3">
            <div className="text-[9px] text-[#7aaa6a] font-semibold mb-1">Booking</div>
            <div className="text-sm font-bold text-[#7dc142]">Available</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8d84e] mb-2 block">
            About This Court
          </label>
          <p className="text-xs text-[#7aaa6a] leading-relaxed">
            A premium {court.surface || 'hard'} court equipped with professional-grade floodlights and seating areas. 
            Perfect for competitive matches and casual practice sessions.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-[#2d5a35] text-[#7dc142] font-bold hover:bg-[#2d5a27] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-[#7dc142] text-[#0f1f0f] font-bold hover:bg-[#a8d84e] transition-colors"
          >
            Confirm & Continue
          </button>
        </div>
      </Card>
    </div>
  );
}
