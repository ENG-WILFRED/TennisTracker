'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { searchPlayers, sendChallengeRequest } from '@/lib/nearby';
import { Card, Button, Input, colors } from '@vico/design-system';

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
    <Card className="border border-vico-border bg-vico-surface p-6">
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-vico-primary font-semibold">Player Search</div>
          <h2 className="mt-2 text-2xl font-black text-vico-text-primary">Search by email or username</h2>
          <p className="mt-2 text-sm text-vico-text-muted">Find a player and choose whether the challenge should be formal or informal.</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, username or name"
            className="w-full min-w-0"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            variant="primary"
            size="md"
            className="whitespace-nowrap"
          >
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-600 bg-red-600/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((player) => (
            <Card key={player.userId} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-vico-text-primary">{player.name || player.username || player.email}</div>
                  <div className="text-xs mt-1 text-vico-text-muted">{player.email} · @{player.username}</div>
                  <div className="mt-1 text-[11px] text-vico-accent">Rating {player.ratingPoints ?? 'N/A'} · Rank #{player.ranking ?? '—'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSendChallenge(player.userId, player.name || player.username || player.email, false)}
                    variant="secondary"
                    size="sm"
                    className="min-w-[96px]"
                  >
                    Informal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSendChallenge(player.userId, player.name || player.username || player.email, true)}
                    variant="primary"
                    size="sm"
                    className="min-w-[96px]"
                  >
                    Formal
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
