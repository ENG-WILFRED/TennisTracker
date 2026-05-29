'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface TournamentCard {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  participantsCount?: number;
  entryFee?: number;
}

const statusLabels: Record<string, { label: string; badge: string }> = {
  upcoming: { label: 'Upcoming', badge: 'bg-yellow-100 text-yellow-800' },
  ongoing: { label: 'Ongoing', badge: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', badge: 'bg-slate-100 text-slate-800' },
  active: { label: 'Active', badge: 'bg-green-100 text-green-800' },
};

export default function CoachTournamentsSection() {
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTournaments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tournaments');
        if (!res.ok) {
          throw new Error('Failed to load tournaments');
        }
        const data = await res.json();
        if (isMounted) {
          setTournaments(data || []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Unable to load tournaments');
          setTournaments([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTournaments();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleTournaments = tournaments.slice(0, 6);

  return (
    <div className="w-full min-h-screen overflow-y-auto px-4 py-6 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Coach Access</p>
            <h2 className="text-3xl font-bold text-white">Tournaments</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Browse tournaments available on the platform and open a coach entrance into the event details.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tournaments"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-600 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-600/20"
            >
              View all tournaments
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-black/10">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center text-slate-400">Loading tournaments…</div>
          ) : error ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center text-slate-300">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-500"
              >
                Retry
              </button>
            </div>
          ) : visibleTournaments.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center text-slate-400">No tournaments are available yet.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleTournaments.map((tournament) => {
                const status = statusLabels[tournament.status] || { label: tournament.status || 'Unknown', badge: 'bg-slate-100 text-slate-800' };
                return (
                  <div key={tournament.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-md shadow-black/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          <span>🏆</span>
                          <span>{tournament.organization?.name || 'Platform Tournament'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                        <p className="text-sm leading-6 text-slate-400 line-clamp-3">{tournament.description || 'No description available.'}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>{status.label}</span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/80 px-4 py-3">
                        <span>Players registered</span>
                        <span className="font-semibold text-white">{tournament.participantsCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/80 px-4 py-3">
                        <span>Entry fee</span>
                        <span className="font-semibold text-white">${tournament.entryFee ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/80 px-4 py-3">
                        <span>Dates</span>
                        <span className="font-semibold text-white">
                          {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                          {tournament.endDate ? ` – ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/tournaments/${tournament.id}?source=coach`}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                      >
                        Coach entrance
                      </Link>
                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
