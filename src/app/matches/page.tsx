"use client";
import { useEffect, useState } from "react";
import { getAllPlayers, getCurrentPoolsAndMatches, savePoolWinner, createGroupStage } from "@/actions/matches";
import { useRouter } from "next/navigation";
import Button from '@/components/Button';
import ExtrasPanel from '@/components/ExtrasPanel';

const SCORE_STEPS = [15, 30, 40];

export default function MatchesPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [scores, setScores] = useState<{ [key: string]: { a: number; b: number } }>({});
  const [tiebreaks, setTiebreaks] = useState<{ [key: string]: { a: boolean[]; b: boolean[] } }>({});
  const [winners, setWinners] = useState<{ [key: string]: "a" | "b" | null }>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [groupsCreated, setGroupsCreated] = useState(false);
  const router = useRouter();

  // On mount, fetch pools/matches from DB
  useEffect(() => {
    setLoading(true);
    Promise.all([getAllPlayers(), getCurrentPoolsAndMatches()])
      .then(([playersData, matchesData]) => {
        setPlayers(playersData);
        setMatches(matchesData);
        // Optionally, set scores/winners from DB if you store them
        setLoading(false);
      });
  }, []);

  // Shuffle and create groups
  async function handleCreateGroups() {
    setLoading(true);
    // Shuffle players
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    // Call backend to create groups and matches
    await createGroupStage(shuffled);
    setGroupsCreated(true);
    // Reload matches
    const matchesData = await getCurrentPoolsAndMatches();
    setMatches(matchesData);
    setLoading(false);
    setToast({ type: "success", message: "Groups created!" });
    setTimeout(() => setToast(null), 1200);
  }

  // Checkbox handler for normal points
  function handlePointCheckbox(matchId: string, who: "a" | "b", point: number, checked: boolean) {
    setScores((prev) => {
      const prevScore = prev[matchId] || { a: 0, b: 0 };
      let newScore = { ...prevScore };
      if (checked) {
        // Add this point if not already at or above
        if (newScore[who] < point) newScore[who] = point;
      } else {
        // Remove this point and any above
        if (newScore[who] >= point) newScore[who] = SCORE_STEPS.filter(s => s < point).pop() || 0;
      }
      return { ...prev, [matchId]: newScore };
    });
    // Reset tiebreakers if unchecking from 40
    if (point === 40 && !checked) {
      setTiebreaks((prev) => ({ ...prev, [matchId]: { a: [false, false, false], b: [false, false, false] } }));
    }
  }

  // Checkbox handler for tiebreaker points
  function handleTiebreakCheckbox(matchId: string, who: "a" | "b", idx: number, checked: boolean) {
    setTiebreaks((prev) => {
      const prevTB = prev[matchId] || { a: [false, false, false], b: [false, false, false] };
      const newTB = {
        a: [...prevTB.a],
        b: [...prevTB.b],
      };
      newTB[who][idx] = checked;
      // Only allow one player to check a given tiebreak point
      if (checked) {
        newTB[who === "a" ? "b" : "a"][idx] = false;
      }
      return { ...prev, [matchId]: newTB };
    });
  }

  // Confirm winner
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

  // Check if all matches have a winner
  const allMatchesHaveWinner = matches.length > 0 && matches.every(m => winners[m.id]);

  const toastClass = (t: any) =>
    t?.type === 'success'
      ? 'mb-6 px-6 py-3 rounded-lg font-bold text-center min-w-[220px] shadow bg-green-100 border border-green-500 text-green-800'
      : t?.type === 'error'
      ? 'mb-6 px-6 py-3 rounded-lg font-bold text-center min-w-[220px] shadow bg-red-100 border border-red-400 text-red-700'
      : 'mb-6 px-6 py-3 rounded-lg font-bold text-center min-w-[220px] shadow bg-indigo-100 border border-indigo-400 text-indigo-800';

  return (
    <div className="min-h-screen app-bg py-8 flex flex-col items-center">
      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button onClick={() => router.push('/leaderboard')}>Leaderboard</Button>
        <Button onClick={() => router.push('/knockout')}>Knockout</Button>
      </div>
      <h1 className="text-3xl font-extrabold text-green-800 mb-6 text-center">Pool Matches</h1>
      {toast && <div className={toastClass(toast)}>{toast.message}</div>}
      {loading && (
        <div className="m-8 text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-green-200 rounded-full animate-spin mx-auto" />
        </div>
      )}
      {!loading && (
        <div className="w-full max-w-full bg-white rounded-2xl shadow p-8 mb-8">
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#166534", marginBottom: "1.5rem" }}>
            Pool Matches & Scoring
          </h2>
          {!groupsCreated && (
              <div className="text-center my-8">
              <Button onClick={handleCreateGroups} className="px-6 py-3">Shuffle & Create Groups</Button>
            </div>
          )}
          {groupsCreated && (
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-green-50">
                  <th className="p-3 text-left text-green-800 font-semibold">Pool</th>
                  <th className="p-3 text-left text-green-800 font-semibold">Player A</th>
                  <th className="p-3 text-center text-green-800 font-semibold">Score</th>
                  <th className="p-3 text-left text-green-800 font-semibold">Player B</th>
                  <th className="p-3 text-center text-green-800 font-semibold">Winner</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const score = scores[m.id] || { a: 0, b: 0 };
                  const winner = winners[m.id];
                  const isTiebreak = score.a === 40 && score.b === 40 && !winner;
                  const tiebreak = tiebreaks[m.id] || { a: [false, false, false], b: [false, false, false] };
                  const tiebreakA = tiebreak.a.filter(Boolean).length;
                  const tiebreakB = tiebreak.b.filter(Boolean).length;
                  const canConfirmTiebreak =
                    (tiebreakA === 2 || tiebreakB === 2) && tiebreakA !== tiebreakB;
                  return (
                    <tr key={m.id} className="border-b">
                      <td className="p-3 text-center align-middle">{m.pool}</td>
                      <td className="p-3 align-middle">
                        <span className="font-semibold text-sky-700">{m.playerA.firstName} {m.playerA.lastName}</span>
                        <div className="text-gray-500 text-sm">({m.playerA.username})</div>
                      </td>
                      <td className="p-3 text-center align-middle">
                        {!isTiebreak ? (
                          <div className="flex items-center justify-center">
                            <div className="flex flex-col items-center mr-2">
                              {SCORE_STEPS.map((pt) => (
                                <label key={pt} className="mb-1 inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={score.a >= pt}
                                    onChange={e => handlePointCheckbox(m.id, "a", pt, e.target.checked)}
                                    disabled={!!winner}
                                    className="accent-green-500 mr-2"
                                  />
                                  <span className="font-semibold">{pt}</span>
                                </label>
                              ))}
                            </div>
                            <span className="font-bold text-lg text-green-700 px-2">:</span>
                            <div className="flex flex-col items-center ml-2">
                              {SCORE_STEPS.map((pt) => (
                                <label key={pt} className="mb-1 inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={score.b >= pt}
                                    onChange={e => handlePointCheckbox(m.id, "b", pt, e.target.checked)}
                                    disabled={!!winner}
                                    className="accent-sky-500 mr-2"
                                  />
                                  <span className="font-semibold">{pt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="flex flex-col items-center mr-2">
                              {Array.from({ length: 3 }).map((_, idx) => (
                                <label key={idx} className="mb-1 inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={tiebreak.a[idx]}
                                    onChange={e => handleTiebreakCheckbox(m.id, "a", idx, e.target.checked)}
                                    disabled={!!winner || tiebreak.b[idx]}
                                    className="accent-green-500 mr-2"
                                  />
                                  <span className="font-semibold">TB</span>
                                </label>
                              ))}
                            </div>
                            <span className="font-bold text-lg text-orange-400 px-2">Tiebreak</span>
                            <div className="flex flex-col items-center ml-2">
                              {Array.from({ length: 3 }).map((_, idx) => (
                                <label key={idx} className="mb-1 inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={tiebreak.b[idx]}
                                    onChange={e => handleTiebreakCheckbox(m.id, "b", idx, e.target.checked)}
                                    disabled={!!winner || tiebreak.a[idx]}
                                    className="accent-sky-500 mr-2"
                                  />
                                  <span className="font-semibold">TB</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-middle">
                        <span className="font-semibold text-sky-700">{m.playerB.firstName} {m.playerB.lastName}</span>
                        <div className="text-gray-500 text-sm">({m.playerB.username})</div>
                      </td>
                      <td className="p-3 text-center align-middle">
                        {!winner && !isTiebreak && (
                          ((score.a === 45 && score.b < 40) || (score.b === 45 && score.a < 40)) && (
                            <Button onClick={() => handleConfirmWinner(m.id, score.a === 45 ? "a" : "b")} className="bg-green-500 text-white font-bold px-3 py-1 rounded-md">Confirm Winner</Button>
                          )
                        )}
                        {!winner && isTiebreak && canConfirmTiebreak && (
                          <Button onClick={() => handleConfirmWinner(m.id, tiebreakA === 2 ? "a" : "b")} className="bg-green-500 text-white font-bold px-3 py-1 rounded-md">Confirm Winner</Button>
                        )}
                        {winner && (
                          <span className="text-green-600 font-bold">Winner: {winner === "a" ? m.playerA.firstName : m.playerB.firstName}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {allMatchesHaveWinner && (
            <div className="text-center mt-8">
              <Button onClick={() => router.push('/knockout')} className="bg-orange-400 text-white font-bold rounded-md px-6 py-3 shadow">Proceed to Knockouts</Button>
            </div>
          )}
        </div>
      )}
      <div className="w-full max-w-6xl px-4 mt-8">
        <ExtrasPanel />
      </div>
      <footer className="mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Pwani University Tennis Club
      </footer>
    </div>
  );
}


const confirmBtnStyle = {
  background: "#22c55e",
  color: "#fff",
  fontWeight: 700,
  borderRadius: "0.5rem",
  border: "none",
  padding: "0.4rem 1rem",
  cursor: "pointer",
  fontSize: "1rem",
  boxShadow: "0 2px 8px rgba(34,197,94,0.08)",
};

const thStyle = {
  padding: "0.7rem",
  textAlign: "center" as const,
  color: "#166534",
  fontWeight: 700,
  fontSize: "1.05rem",
  background: "#f0fdf4",
};

const tdStyleCenter = {
  padding: "0.7rem",
  textAlign: "center" as const,
  verticalAlign: "middle",
};

const tdStyleRight = {
  padding: "0.7rem",
  textAlign: "right" as const,
  verticalAlign: "middle",
};

const tdStyleLeft = {
  padding: "0.7rem",
  textAlign: "left" as const,
  verticalAlign: "middle",
};