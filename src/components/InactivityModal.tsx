'use client';

import { useEffect } from 'react';
import { AlertCircle, LogOut, CheckCircle } from 'lucide-react';

interface InactivityModalProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export default function InactivityModal({
  isOpen,
  onStayLoggedIn,
  onLogout,
}: InactivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-55 flex items-center justify-center z-50 px-4 py-6">
      <div className="w-full max-w-xl rounded-[28px] border border-[#2d5a35] bg-[#0d2211] shadow-[0_40px_90px_rgba(16,54,23,0.35)] overflow-hidden">
        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7dc142] text-[#0f1f0f] shadow-[0_10px_30px_rgba(125,193,66,0.25)]">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-[#e8f5e0]">Session Timeout</h2>
          <p className="mt-3 text-sm leading-6 text-[#c2dbb0]">
            Your session is about to expire after 30 minutes. Choose <span className="font-semibold text-[#a8d84e]">Stay Logged In</span> to refresh your token, or <span className="font-semibold text-[#e57373]">Logout</span> to invalidate and clear your session.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#233b23] px-4 py-3 text-sm font-semibold text-[#f7fbe6] transition hover:bg-[#304b31]"
            >
              <LogOut size={18} />
              Logout
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#7dc142] px-4 py-3 text-sm font-semibold text-[#0f1f0f] transition hover:bg-[#9dcc60]"
            >
              <CheckCircle size={18} />
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
