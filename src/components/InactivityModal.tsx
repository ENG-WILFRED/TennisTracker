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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-yellow-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Session Timeout</h2>
        </div>

        <p className="text-gray-600 mb-6">
          You've been inactive for a while. Would you like to stay logged in or logout for security?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
          >
            <CheckCircle size={18} />
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
