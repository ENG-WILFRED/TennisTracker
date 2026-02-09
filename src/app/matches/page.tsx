"use client";
import { useEffect, useState } from "react";
import { getAllPlayers, getCurrentPoolsAndMatches, savePoolWinner, createGroupStage } from "@/actions/matches";
import { useRouter } from "next/navigation";
import Button from '@/components/Button';

export default function MatchesPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [scores, setScores] = useState<{ [key: string]: { a: number; b: number } }>({});
  const [winners, setWinners] = useState<{ [key: string]: "a" | "b" | null }>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [groupsCreated, setGroupsCreated] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Record<string, boolean>>({});
  const [primaryPlayerId, setPrimaryPlayerId] = useState<string | null>(null);
  const [defaultVenue, setDefaultVenue] = useState('Main Court');
  const [defaultDate, setDefaultDate] = useState('');
  const [matchMeta, setMatchMeta] = useState<Record<string, { venue?: string; scheduledAt?: string }>>({});
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllPlayers(), getCurrentPoolsAndMatches()])
      .then(([playersData, matchesData]) => {
        setPlayers(playersData);
        setMatches(matchesData);
        const sel: Record<string, boolean> = {};
        playersData.forEach((p: any) => { sel[p.id] = true });
        setSelectedPlayerIds(sel);
        setDefaultDate(new Date().toISOString().slice(0,10));
        const mm: Record<string, any> = {};
        matchesData.forEach((m: any) => { mm[m.id] = { venue: defaultVenue, scheduledAt: defaultDate } });
        setMatchMeta(mm);
        setLoading(false);
      });
  }, []);

  async function handleCreateGroups() {
    setShuffling(true);
    const pool = players.filter(p => selectedPlayerIds[p.id]);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    await createGroupStage(shuffled);
    setGroupsCreated(true);
    const matchesData = await getCurrentPoolsAndMatches();
    setMatches(matchesData);
    const mm: Record<string, any> = {};
    matchesData.forEach((m: any) => { mm[m.id] = { venue: defaultVenue, scheduledAt: defaultDate } });
    setMatchMeta(mm);
    setShuffling(false);
    setToast({ type: "success", message: "Groups created!" });
    setTimeout(() => setToast(null), 1200);
  }

  function handleScoreChange(matchId: string, who: "a" | "b", value: number) {
    setScores((prev) => ({ ...prev, [matchId]: { ...(prev[matchId] || { a: 0, b: 0 }), [who]: value } }));
  }

  async function handleConfirmWinner(matchId: string, winner: "a" | "b") {
    setConfirming(matchId);
    const match = matches.find((m) => m.id === matchId);
    const winnerId = winner === "a" ? match.playerA.id : match.playerB.id;
    await savePoolWinner(matchId, winnerId);
    setWinners((prev) => ({ ...prev, [matchId]: winner }));
    setToast({ type: "success", message: "Winner saved!" });
    setConfirming(null);
    setTimeout(() => setToast(null), 1500);
  }

  const allMatchesHaveWinner = matches.length > 0 && matches.every(m => winners[m.id]);

  const toastClass = (t: any) =>
    t?.type === 'success'
      ? 'mb-6 px-6 py-3 rounded-xl font-semibold text-center min-w-[220px] shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-800'
      : t?.type === 'error'
      ? 'mb-6 px-6 py-3 rounded-xl font-semibold text-center min-w-[220px] shadow-lg bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-400 text-red-700'
      : 'mb-6 px-6 py-3 rounded-xl font-semibold text-center min-w-[220px] shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 text-blue-800';

  return (
    <div className="min-h-screen app-bg py-8 px-4">
      <div className="w-full">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Pool Matches</h1>
              <p className="text-green-100">Manage tournament groups and track match results</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm transition-all"
              >
                Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/leaderboard')}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm transition-all"
              >
                Leaderboard
              </Button>
              <Button 
                onClick={() => router.push('/knockout')}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm transition-all"
              >
                Knockout
              </Button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="flex justify-center mb-6">
            <div className={toastClass(toast)}>
              <div className="flex items-center gap-2 justify-center">
                {toast.type === 'success' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {/* Setup Section */}
            {!groupsCreated && (
              <div className="space-y-6">
                {/* Title */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">Setup Tournament Groups</h2>
                    <p className="text-sm text-gray-600">Select players and configure match settings</p>
                  </div>
                </div>

                {/* Player Selection */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="font-bold text-green-900">Select Active Players</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-auto p-4 bg-white rounded-lg border border-green-100">
                    {players.map((p) => (
                      <label 
                        key={p.id} 
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group"
                      >
                        <input 
                          type="checkbox" 
                          checked={!!selectedPlayerIds[p.id]} 
                          onChange={(e) => setSelectedPlayerIds(s => ({ ...s, [p.id]: e.target.checked }))}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 group-hover:text-green-800">
                            {p.firstName} {p.lastName}
                          </span>
                        </div>
                        <input 
                          type="radio" 
                          name="primary" 
                          checked={primaryPlayerId === p.id} 
                          onChange={() => setPrimaryPlayerId(p.id)}
                          className="w-4 h-4 text-green-600"
                          title="Set as primary player"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>{Object.values(selectedPlayerIds).filter(Boolean).length} players selected</span>
                  </div>
                </div>

                {/* Match Settings */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="font-bold text-blue-900">Default Match Settings</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input 
                          value={defaultVenue} 
                          onChange={e => setDefaultVenue(e.target.value)} 
                          placeholder="Enter venue" 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Match Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input 
                          type="date" 
                          value={defaultDate} 
                          onChange={e => setDefaultDate(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Groups Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleCreateGroups} 
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Shuffle Selected & Create Groups</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Matches Table */}
            {groupsCreated && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">Match Results</h2>
                    <p className="text-sm text-gray-600">Record scores and declare winners</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        <th className="p-4 text-left font-bold">Pool</th>
                        <th className="p-4 text-left font-bold">Player A</th>
                        <th className="p-4 text-center font-bold">Match Details</th>
                        <th className="p-4 text-left font-bold">Player B</th>
                        <th className="p-4 text-center font-bold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m, idx) => {
                        const score = scores[m.id] || { a: 0, b: 0 };
                        const winner = winners[m.id];
                        const meta = matchMeta[m.id] || { venue: defaultVenue, scheduledAt: defaultDate };
                        return (
                          <tr key={m.id} className={`border-b hover:bg-green-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            {/* Pool */}
                            <td className="p-4">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm">
                                {m.pool}
                              </div>
                            </td>

                            {/* Player A */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                                  {m.playerA.firstName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{m.playerA.firstName} {m.playerA.lastName}</div>
                                  <div className="text-sm text-gray-500">@{m.playerA.username}</div>
                                </div>
                              </div>
                            </td>

                            {/* Score & Details */}
                            <td className="p-4">
                              <div className="space-y-3">
                                {/* Score inputs */}
                                <div className="flex items-center justify-center gap-3">
                                  <input 
                                    type="number" 
                                    value={score.a} 
                                    onChange={(e) => handleScoreChange(m.id, 'a', Number(e.target.value || 0))} 
                                    className="w-16 h-12 text-center text-lg font-bold border-2 border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-cyan-50"
                                  />
                                  <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow-sm">
                                    VS
                                  </div>
                                  <input 
                                    type="number" 
                                    value={score.b} 
                                    onChange={(e) => handleScoreChange(m.id, 'b', Number(e.target.value || 0))} 
                                    className="w-16 h-12 text-center text-lg font-bold border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                                  />
                                </div>

                                {/* Match metadata */}
                                <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <input 
                                      value={meta.venue} 
                                      onChange={(e) => setMatchMeta(prev => ({ ...prev, [m.id]: { ...(prev[m.id]||{}), venue: e.target.value } }))} 
                                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Venue"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <input 
                                      type="date" 
                                      value={meta.scheduledAt} 
                                      onChange={(e) => setMatchMeta(prev => ({ ...prev, [m.id]: { ...(prev[m.id]||{}), scheduledAt: e.target.value } }))} 
                                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Player B */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-sm">
                                  {m.playerB.firstName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{m.playerB.firstName} {m.playerB.lastName}</div>
                                  <div className="text-sm text-gray-500">@{m.playerB.username}</div>
                                </div>
                              </div>
                            </td>

                            {/* Winner Actions */}
                            <td className="p-4">
                              {!winner && (
                                <div className="flex flex-col gap-2">
                                  <Button 
                                    onClick={() => handleConfirmWinner(m.id, 'a')} 
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                                    disabled={confirming === m.id}
                                  >
                                    Confirm {m.playerA.firstName}
                                  </Button>
                                  <Button 
                                    onClick={() => handleConfirmWinner(m.id, 'b')} 
                                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                                    disabled={confirming === m.id}
                                  >
                                    Confirm {m.playerB.firstName}
                                  </Button>
                                </div>
                              )}
                              {winner && (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg px-4 py-3">
                                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <div>
                                    <div className="text-xs text-green-700 font-medium">Winner</div>
                                    <div className="text-sm font-bold text-green-900">
                                      {winner === 'a' ? m.playerA.firstName : m.playerB.firstName}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Proceed to Knockouts */}
            {allMatchesHaveWinner && (
              <div className="mt-8 text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 border-2 border-orange-300">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-orange-900 mb-2">All Matches Complete!</h3>
                <p className="text-orange-700 mb-6">Ready to advance to the knockout stage</p>
                <Button 
                  onClick={() => router.push('/knockout')} 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-xl px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <span>Proceed to Knockout Stage</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </Button>
              </div>
            )}
          </div>
        )}


        {/* Footer */}
        <footer className="mt-8 text-center pb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="text-gray-600 text-sm font-medium">
              &copy; {new Date().getFullYear()} Pwani University Tennis Club
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}