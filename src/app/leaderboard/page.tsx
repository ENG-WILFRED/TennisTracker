"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/actions/matches";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold text-sky-700 mb-8">Leaderboard</h1>
      {loading ? (
        <div className="m-8 text-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-sky-200 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <table className="w-full max-w-lg bg-white rounded-xl shadow border-collapse mb-8">
          <thead>
            <tr className="bg-emerald-50">
              <th className="p-3 text-center text-emerald-800 font-bold">Rank</th>
              <th className="p-3 text-left text-emerald-800 font-bold">Player</th>
              <th className="p-3 text-center text-emerald-800 font-bold">Wins</th>
              <th className="p-3 text-center text-emerald-800 font-bold">Score</th>
              <th className="p-3 text-center text-emerald-800 font-bold">Played</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="p-3 text-center align-middle">{idx + 1}</td>
                <td className="p-3 align-middle">
                  <span className="font-semibold text-sky-700">{p.firstName} {p.lastName}</span>
                  <div className="text-gray-500 text-sm">({p.username})</div>
                </td>
                <td className="p-3 text-center align-middle">{p.matchesWon}</td>
                <td className="p-3 text-center align-middle">{p.totalScore ?? 0}</td>
                <td className="p-3 text-center align-middle">{p.matchesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <footer className="mt-8 text-gray-500 text-sm">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
    </div>
  );
}