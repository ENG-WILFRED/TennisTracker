'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { searchPlayers, sendChallengeRequest } from '@/lib/nearby';

export function PlayerSearchChallenge({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Enter a player email, username, or name to search.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await searchPlayers(query.trim(), organizationId);
      setResults(Array.isArray(response.results) ? response.results : []);
      if (!Array.isArray(response.results) || response.results.length === 0) {
        setError('No players found for that search. Try a different email, username, or name.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChallenge = async (playerId: string, playerName: string, isFormal: boolean) => {
    if (!user?.id) {
      setError('Please sign in to send a challenge.');
      return;
    }

    try {
      const result = await sendChallengeRequest(user.id, playerId, isFormal);
      alert(result?.message || `Challenge sent to ${playerName}.`);
    } catch (err) {
      console.error('Challenge send failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to send challenge.');
    }
  };

  return (
    <div className="rounded-3xl border border-[#2d5a35] bg-[#152515] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#7dc142] font-bold">Player Search</div>
          <h2 className="mt-2 text-2xl font-black text-white">Search by email or username</h2>
          <p className="mt-2 text-sm text-[#c2dbb0]">Find a player and choose whether the challenge should be formal or informal.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, username or name"
            className="w-full rounded-2xl border border-[#1e3321] bg-[#0f1f0f] px-4 py-3 text-sm text-[#e8f5e0] outline-none focus:border-[#7dc142]"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-2xl bg-[#7dc142] px-4 py-3 text-sm font-semibold text-[#0f1f0f] hover:bg-[#a8d84e] transition-colors disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-600 bg-red-600/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((player) => (
            <div key={player.userId} className="rounded-3xl border border-[#1e3321] bg-[#0f1f0f] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-[#e8f5e0]">{player.name || player.username || player.email}</div>
                  <div className="text-xs text-[#7aaa6a] mt-1">{player.email} · @{player.username}</div>
                  <div className="mt-1 text-[11px] text-[#4d8a56]">Rating {player.ratingPoints ?? 'N/A'} · Rank #{player.ranking ?? '—'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendChallenge(player.userId, player.name || player.username || player.email, false)}
                    className="rounded-2xl bg-[#1e3321] border border-[#7dc142]/40 px-3 py-2 text-xs font-semibold text-[#7dc142] hover:bg-[#243d1b] transition"
                  >
                    Informal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChallenge(player.userId, player.name || player.username || player.email, true)}
                    className="rounded-2xl bg-[#7dc142] px-3 py-2 text-xs font-semibold text-[#0f1f0f] hover:bg-[#a8d84e] transition"
                  >
                    Formal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
