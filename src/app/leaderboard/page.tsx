'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, colors, Input, toast, toastOptions } from '@vico/design-system';

const G = {
  page: colors.dark,
  surface: colors.surface,
  card: colors.surfaceSecondary,
  surfaceAccent: colors.surfaceAccent,
  border: colors.border,
  muted: colors.textMuted,
  text: colors.textPrimary,
  dim: colors.textMuted,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
  soft: colors.surfaceSecondary,
};

interface LeaderboardPlayer {
  id: string;
  playerId: string;
  rank: number;
  name: string;
  photo?: string | null;
  ratingPoints?: number | null;
  matchesWon?: number | null;
  matchesLost?: number | null;
  winRate?: number | null;
  organization?: { id: string; name: string } | null;
  trend?: 'up' | 'down';
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [minPoints, setMinPoints] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard?limit=1000');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard', error);
      toast.error('Unable to load leaderboard. Please try again.', toastOptions);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (typeof window === 'undefined') {
      router.back();
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');

      if (from) {
        // If 'from' query param exists, navigate there
        router.push(from);
        return;
      }

      // Fallback: browser history back
      router.back();
    } catch (err) {
      router.back();
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredPlayers = useMemo(
    () => players.filter((player) => {
      const matchesName = nameFilter.trim()
        ? player.name.toLowerCase().includes(nameFilter.toLowerCase())
        : true;
      const matchesOrg = orgFilter.trim()
        ? player.organization?.name.toLowerCase().includes(orgFilter.toLowerCase())
        : true;
      const matchesPoints = minPoints.trim()
        ? (player.ratingPoints ?? 0) >= Number(minPoints)
        : true;
      return matchesName && matchesOrg && matchesPoints;
    }),
    [nameFilter, orgFilter, minPoints, players]
  );

  const sortedPlayers = useMemo(
    () => filteredPlayers
      .slice()
      .sort((a, b) => (b.ratingPoints ?? 0) - (a.ratingPoints ?? 0) || a.rank - b.rank),
    [filteredPlayers]
  );

  const summaryText = filteredPlayers.length === players.length
    ? `${players.length} players found across the system`:
      `${filteredPlayers.length} players matching your search`;

  return (
    <div style={{ minHeight: '100vh', background: G.page, color: G.text, padding: '24px 16px' }}>
      <div className="mx-auto w-full" >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.22em]" style={{ color: G.accent }}>
              <span>🏆</span>
              <span>Global leaderboard</span>
            </div>
            <div>
              <h1 className="text-3xl font-black" style={{ color: G.text }}>All players & rankings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: G.muted }}>
                Browse every player in the system, see their current ranking and match record, and challenge them directly. Rankings are displayed by highest points first, with a green dashboard theme throughout.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-6">
            <Button onClick={handleBackClick} size="sm" variant="ghost">Back to dashboard</Button>
            <Button onClick={fetchLeaderboard} size="sm" variant="secondary" className="whitespace-nowrap">
              Refresh leaderboard
            </Button>
          </div>remove this section completely then move the refresh to the top right then back to the dashboard to the top left then  add a filter  bar by name by org by  points  then for the actions we dont have to show them just remove the buttons let when we hover we show click to view profile  and challenge 
        </div>

        <Card style={{ background: G.soft, border: `1px solid ${G.border}` }}>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: G.text }}>Rankings</h2>
                  <p className="text-sm" style={{ color: G.muted }}>{summaryText}. Filter by name, organization, or minimum points.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filter by name"
                className="w-full"
                style={{ background: colors.surfaceAccent, borderColor: colors.border, color: G.text }}
              />
              <Input
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                placeholder="Filter by organization"
                className="w-full"
                style={{ background: colors.surfaceAccent, borderColor: colors.border, color: G.text }}
              />
              <Input
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Min points"
                className="w-full"
                type="number"
                min={0}
                style={{ background: colors.surfaceAccent, borderColor: colors.border, color: G.text }}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0" style={{ borderCollapse: 'separate' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.surfaceAccent }}>
                      {['#', 'Player', 'Club', 'Pts', 'W / L', 'Win Rate', 'Trend'].map((heading) => (
                        <th
                          key={heading}
                          className="py-3 px-3 text-left text-[11px] uppercase tracking-[0.2em]"
                          style={{ color: G.text, fontWeight: 700 }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-sm" style={{ color: G.muted }}>
                          Loading leaderboard...
                        </td>
                      </tr>
                    ) : filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-sm" style={{ color: G.muted }}>
                          No players found. Try another search term.
                        </td>
                      </tr>
                    ) : (
                      sortedPlayers.map((player) => {
                        const initials = player.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr
                            key={player.id}
                            className="group cursor-pointer transition hover:shadow-lg relative"
                            style={{ backgroundColor: colors.surface, transition: 'background-color 0.2s ease' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = colors.surfaceAccent; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = colors.surface; }}
                            onClick={() => {
                              toast(`Navigating to ${player.name}...`, toastOptions);
                              setTimeout(() => router.push(`/players/profile/${player.playerId}`), 220);
                            }}
                          >
                            <td className="px-3 py-3 text-sm" style={{ color: G.text }}>{player.rank}</td>
                            <td className="px-3 py-3 relative" style={{ overflow: 'visible' }}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black" style={{ backgroundColor: colors.surfaceAccent, color: G.accent }}>
                                  {player.photo ? (
                                    <img src={player.photo} alt={player.name} className="h-12 w-12 rounded-2xl object-cover" />
                                  ) : (
                                    initials || '??'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold" style={{ color: G.text }}>{player.name}</div>
                                  <div className="text-[11px]" style={{ color: G.muted }}>{player.id}</div>
                                </div>
                              </div>
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa8] opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                                Click to see profile and challenge
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm" style={{ color: G.muted }}>{player.organization?.name || 'Independent'}</td>
                            <td className="px-3 py-3 text-sm" style={{ color: G.text }}>{player.ratingPoints ?? 0}</td>
                            <td className="px-3 py-3 text-sm" style={{ color: G.text }}>
                              {player.matchesWon ?? 0} / {player.matchesLost ?? 0}
                            </td>
                            <td className="px-3 py-3 text-sm" style={{ color: G.accent }}>
                              {player.winRate != null ? `${player.winRate}%` : '—'}
                            </td>
                            <td className="px-3 py-3 text-sm" style={{ color: player.trend === 'up' ? G.success : player.trend === 'down' ? G.danger : G.muted }}>
                              {player.trend === 'up' ? '⬆️' : player.trend === 'down' ? '⬇️' : '—'}
                            </td>
                            <td className="px-3 py-3 text-sm relative overflow-visible" style={{ width: '32px', whiteSpace: 'nowrap' }}>
                              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-[#8b8fa8] opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                                Click to view profile and challenge
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}

