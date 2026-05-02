'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';

export default function DashboardFindPeoplePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleMessageClick = (personId: string, personName: string) => {
    router.push(chatUrlForUser(personId, personName));
  };

  const handleChallenge = async (personId: string, personName: string) => {
    if (!user?.id) {
      setStatusMessage('Please sign in to send a challenge.');
      return;
    }

    try {
      await sendChallengeRequest(user.id, personId);
      setStatusMessage(`Challenge request sent to ${personName}.`);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to send challenge request.');
    }
  };

  const dashboardPath = user?.id ? `/dashboard/coach/${user.id}` : '/dashboard';

  return (
    <div className="min-h-screen bg-[#0f1e0f] text-white py-8 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[#7dc142]">Coach Tools</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Find People Near You</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Search for nearby players, message them directly, or send a challenge request from a dedicated page.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(dashboardPath)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-[#3f8a2f] bg-[#122d12] px-4 py-3 text-sm text-[#d6f7b9]">
            {statusMessage}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-[#122212] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
          <FindNearbyPeople onMessageClick={handleMessageClick} onChallengeClick={handleChallenge} />
        </div>
      </div>
    </div>
  );
}
