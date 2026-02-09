"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard } from "@/actions/matches";
import PageHeader from '@/components/PageHeader';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold shadow-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    }
    if (position === 2) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold shadow-lg">
          {position}
        </div>
      );
    }
    if (position === 3) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold shadow-lg">
          {position}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-semibold">
        {position}
      </div>
    );
  };

  const getWinRate = (won: number, played: number) => {
    if (!played) return 0;
    return Math.round((won / played) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4 flex flex-col items-center w-full">
      {/* Header */}
      <PageHeader
        title="Leaderboard"
        description="Top performing players this season"
        navItems={[
          { label: 'Dashboard', onClick: () => router.push('/dashboard') },
          { label: 'Matches', onClick: () => router.push('/matches') },
          { label: 'Leaderboard', active: true },
        ]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-60 gap-4">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading rankings...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {players.length >= 3 && (
            <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    {getPositionBadge(2)}
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-green-700">
                      {players[1].firstName?.[0]}{players[1].lastName?.[0]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {players[1].firstName} {players[1].lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">@{players[1].username}</p>
                  <div className="w-full bg-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Score</span>
                      <span className="text-lg font-bold text-green-600">{players[1].totalScore ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Wins</span>
                      <span className="text-sm font-semibold text-gray-700">{players[1].matchesWon}/{players[1].matchesPlayed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl p-8 border-2 border-green-300 transform md:scale-105 hover:shadow-3xl transition-all">
                <div className="flex flex-col items-center">
                  <div className="mb-4 relative">
                    {getPositionBadge(1)}
                    <div className="absolute -top-2 -right-2">
                      <span className="flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500"></span>
                      </span>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {players[0].firstName?.[0]}{players[0].lastName?.[0]}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {players[0].firstName} {players[0].lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">@{players[0].username}</p>
                  <div className="w-full bg-white rounded-lg p-4 shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Score</span>
                      <span className="text-2xl font-bold text-green-600">{players[0].totalScore ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Wins</span>
                      <span className="text-lg font-semibold text-gray-700">{players[0].matchesWon}/{players[0].matchesPlayed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    {getPositionBadge(3)}
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-green-700">
                      {players[2].firstName?.[0]}{players[2].lastName?.[0]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {players[2].firstName} {players[2].lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">@{players[2].username}</p>
                  <div className="w-full bg-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Score</span>
                      <span className="text-lg font-bold text-green-600">{players[2].totalScore ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Wins</span>
                      <span className="text-sm font-semibold text-gray-700">{players[2].matchesWon}/{players[2].matchesPlayed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mx-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Complete Rankings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-green-50 z-10">
                  <tr className="border-b-2 border-green-200">
                    <th className="px-6 py-4 text-center text-green-800 font-bold uppercase text-xs tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-green-800 font-bold uppercase text-xs tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-center text-green-800 font-bold uppercase text-xs tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 text-center text-green-800 font-bold uppercase text-xs tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-4 text-center text-green-800 font-bold uppercase text-xs tracking-wider">
                      Played
                    </th>
                    <th className="px-6 py-4 text-center text-green-800 font-bold uppercase text-xs tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => {
                    const winRate = getWinRate(p.matchesWon, p.matchesPlayed);
                    const isTopThree = idx < 3;
                    
                    return (
                      <tr
                        key={p.id}
                        className={`border-b last:border-b-0 hover:bg-green-50 transition-colors ${
                          isTopThree ? 'bg-green-25' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          {getPositionBadge(idx + 1)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-green-700">
                                {p.firstName?.[0]}{p.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {p.firstName} {p.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{p.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold text-lg">
                            {p.totalScore ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-900">
                          {p.matchesWon}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {p.matchesPlayed}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold text-gray-900">{winRate}%</span>
                            <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                                style={{ width: `${winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <footer className="mt-10 text-gray-500 text-sm text-center">
        <p>&copy; {new Date().getFullYear()} Pwani University Tennis Club</p>
        <p className="text-xs mt-1">Rankings updated in real-time</p>
      </footer>
    </div>
  );
}