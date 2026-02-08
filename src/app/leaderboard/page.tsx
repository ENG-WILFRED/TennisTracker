"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/actions/matches";
import ExtrasPanel from '@/components/ExtrasPanel';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 py-10 px-4 flex flex-col items-center w-full">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-sky-700 tracking-tight">Leaderboard</h1>
        <p className="mt-2 text-sky-600">
          Top performing players this season
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-emerald-50 z-10">
                <tr>
                  <th className="px-4 py-3 text-center text-emerald-800 font-semibold">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-emerald-800 font-semibold">
                    Player
                  </th>
                  <th className="px-4 py-3 text-center text-emerald-800 font-semibold">
                    Wins
                  </th>
                  <th className="px-4 py-3 text-center text-emerald-800 font-semibold">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-emerald-800 font-semibold">
                    Played
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-b-0 hover:bg-sky-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-center font-medium text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-sky-700">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{p.username}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {p.matchesWon}
                    </td>
                    <td className="px-4 py-4 text-center font-medium">
                      {p.totalScore ?? 0}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {p.matchesPlayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-full max-w-6xl px-4 mt-8">
          <ExtrasPanel />
        </div>
        </>
      )}

      <footer className="mt-10 text-gray-500 text-sm text-center">
        &copy; {new Date().getFullYear()} Pwani University Tennis Club
      </footer>
    </div>
  );
}
