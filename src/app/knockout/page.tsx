"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllPlayers,
  getGroupStandings,
  createGroupStage,
  getCurrentPoolsAndMatches,
  savePoolWinner,
  createSemifinalsFromGroups,
  createFinalsFromSemis,
  getKnockoutMatches,
  saveKnockoutScore,
} from "@/actions/matches";

const SCORE_STEPS = [15, 30, 40, 45];

export default function KnockoutPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>({});
  const [scores, setScores] = useState<{ [matchId: string]: { a: number; b: number } }>({});
  const [tiebreaks, setTiebreaks] = useState<{ [matchId: string]: { a: boolean[]; b: boolean[] } }>({});
  const [winners, setWinners] = useState<{ [matchId: string]: "a" | "b" | null }>({});
  const [stage, setStage] = useState<"group" | "semis" | "finals" | "done">("group");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const router = useRouter();

  // Load players and group matches
  useEffect(() => {
    setLoading(true);
    Promise.all([getAllPlayers(), getCurrentPoolsAndMatches(), getGroupStandings()])
      .then(([playersData, matchesData, standingsData]) => {
        setPlayers(playersData);
        setMatches(matchesData);
        setStandings(standingsData);
        setStage(matchesData.length && matchesData[0].pool ? "group" : "semis");
        setLoading(false);
      });
  }, []);

  // Checkbox handler for normal points
  function handlePointCheckbox(matchId: string, who: "a" | "b", point: number, checked: boolean) {
    setScores((prev) => {
      const prevScore = prev[matchId] || { a: 0, b: 0 };
      let newScore = { ...prevScore };
      if (checked) {
        if (newScore[who] < point) newScore[who] = point;
      } else {
        if (newScore[who] >= point) newScore[who] = SCORE_STEPS.filter(s => s < point).pop() || 0;
      }
      return { ...prev, [matchId]: newScore };
    });
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
      if (checked) {
        newTB[who === "a" ? "b" : "a"][idx] = false;
      }
      return { ...prev, [matchId]: newTB };
    });
  }

  // Confirm winner
  async function handleConfirmWinner(matchId: string, winner: "a" | "b", aId: string, bId: string) {
    const winnerId = winner === "a" ? aId : bId;
    await savePoolWinner(matchId, winnerId);
    setWinners((prev) => ({ ...prev, [matchId]: winner }));
    setToast({ type: "success", message: "Winner saved!" });
    setTimeout(() => setToast(null), 1200);
    // Reload matches and standings
    const [matchesData, standingsData] = await Promise.all([
      getCurrentPoolsAndMatches(),
      getGroupStandings(),
    ]);
    setMatches(matchesData);
    setStandings(standingsData);
  }

  // Check if all group matches have a winner
  const allGroupMatchesHaveWinner = matches.length > 0 && matches.every(m => m.winnerId);

  // Proceed to semifinals
  async function handleProceedToSemis() {
    setToast({ type: "info", message: "Creating semifinals..." });
    await createSemifinalsFromGroups();
    setStage("semis");
    setToast({ type: "success", message: "Semifinals created!" });
    setTimeout(() => setToast(null), 1200);
    // Reload matches
    const knockoutMatches = await getKnockoutMatches();
    setMatches(knockoutMatches);
  }

  // Proceed to finals
  async function handleProceedToFinals() {
    setToast({ type: "info", message: "Creating finals..." });
    await createFinalsFromSemis();
    setStage("finals");
    setToast({ type: "success", message: "Finals created!" });
    setTimeout(() => setToast(null), 1200);
    // Reload matches
    const knockoutMatches = await getKnockoutMatches();
    setMatches(knockoutMatches);
  }

  // Render group standings
  function renderStandings() {
    return (
      <div className="flex flex-wrap gap-8 mb-8">
        {Object.entries(standings).map(([group, players]) => (
          <div key={group} className="min-w-[220px]">
            <h2 className="text-sky-700 font-bold mb-2">Group {group}</h2>
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-2 text-center text-emerald-800 font-semibold">Player</th>
                  <th className="p-2 text-center text-emerald-800 font-semibold">Wins</th>
                  <th className="p-2 text-center text-emerald-800 font-semibold">Losses</th>
                  <th className="p-2 text-center text-emerald-800 font-semibold">Played</th>
                </tr>
              </thead>
              <tbody>
                {(players as any[]).map((row: any) => (
                  <tr key={row.player.id} className="border-b last:border-b-0">
                    <td className="p-2 text-left align-middle">{row.player.firstName} {row.player.lastName}</td>
                    <td className="p-2 text-center align-middle">{row.wins}</td>
                    <td className="p-2 text-center align-middle">{row.losses}</td>
                    <td className="p-2 text-center align-middle">{row.played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  // Render matches (group or knockout)
  function renderMatches() {
    return (
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-emerald-50">
            <th className="p-3 text-emerald-800 font-semibold">Group</th>
            <th className="p-3 text-emerald-800 font-semibold">Player A</th>
            <th className="p-3 text-center text-emerald-800 font-semibold">Score</th>
            <th className="p-3 text-emerald-800 font-semibold">Player B</th>
            <th className="p-3 text-center text-emerald-800 font-semibold">Winner</th>
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
              <tr key={m.id} className="border-b last:border-b-0">
                <td className="p-3 text-center align-middle">{m.group || '-'} </td>
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
                            <input type="checkbox" checked={score.a >= pt} onChange={e => handlePointCheckbox(m.id, 'a', pt, e.target.checked)} disabled={!!winner} className="accent-emerald-500 mr-2" />
                            <span className="font-semibold">{pt}</span>
                          </label>
                        ))}
                      </div>
                      <span className="font-bold text-lg text-emerald-700 px-2">:</span>
                      <div className="flex flex-col items-center ml-2">
                        {SCORE_STEPS.map((pt) => (
                          <label key={pt} className="mb-1 inline-flex items-center">
                            <input type="checkbox" checked={score.b >= pt} onChange={e => handlePointCheckbox(m.id, 'b', pt, e.target.checked)} disabled={!!winner} className="accent-sky-500 mr-2" />
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
                            <input type="checkbox" checked={tiebreak.a[idx]} onChange={e => handleTiebreakCheckbox(m.id, 'a', idx, e.target.checked)} disabled={!!winner || tiebreak.b[idx]} className="accent-emerald-500 mr-2" />
                            <span className="font-semibold">TB</span>
                          </label>
                        ))}
                      </div>
                      <span className="font-bold text-lg text-orange-400 px-2">Tiebreak</span>
                      <div className="flex flex-col items-center ml-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <label key={idx} className="mb-1 inline-flex items-center">
                            <input type="checkbox" checked={tiebreak.b[idx]} onChange={e => handleTiebreakCheckbox(m.id, 'b', idx, e.target.checked)} disabled={!!winner || tiebreak.a[idx]} className="accent-sky-500 mr-2" />
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
                  {!winner && !isTiebreak && ((score.a === 45 && score.b < 40) || (score.b === 45 && score.a < 40)) && (
                    <button onClick={() => handleConfirmWinner(m.id, score.a === 45 ? 'a' : 'b', m.playerA.id, m.playerB.id)} className="bg-emerald-500 text-white font-bold px-3 py-1 rounded-md">Confirm Winner</button>
                  )}
                  {!winner && isTiebreak && canConfirmTiebreak && (
                    <button onClick={() => handleConfirmWinner(m.id, tiebreakA === 2 ? 'a' : 'b', m.playerA.id, m.playerB.id)} className="bg-emerald-500 text-white font-bold px-3 py-1 rounded-md">Confirm Winner</button>
                  )}
                  {winner && <span className="text-emerald-600 font-bold">Winner: {winner === 'a' ? m.playerA.firstName : m.playerB.firstName}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // Always show standings and matches, even if all are completed
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 py-8 flex flex-col items-center">
      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => router.push('/dashboard')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-md">Dashboard</button>
        <button onClick={() => router.push('/matches')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-md">Back to Pools</button>
        <button onClick={() => router.push('/leaderboard')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-md">Leaderboard</button>
      </div>
      <h1 className="text-3xl font-extrabold text-sky-700 mb-6 text-center">World Cup Style Tournament</h1>
      {toast && <div className="mb-6 px-6 py-3 rounded-lg font-bold text-center min-w-[220px] shadow bg-indigo-100 border border-indigo-400 text-indigo-800">{toast.message}</div>}
      {loading && (
        <div className="m-8 text-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-sky-200 rounded-full animate-spin mx-auto" />
        </div>
      )}
      {!loading && (
        <>
          {renderStandings()}
          {renderMatches()}
          {stage === 'group' && allGroupMatchesHaveWinner && (
            <div className="text-center mt-8">
              <button onClick={handleProceedToSemis} className="bg-orange-400 text-white font-bold rounded-md px-6 py-3 shadow">Proceed to Semifinals</button>
            </div>
          )}
          {stage === 'semis' && matches.length === 2 && matches.every(m => m.winnerId) && (
            <div className="text-center mt-8">
              <button onClick={handleProceedToFinals} className="bg-orange-400 text-white font-bold rounded-md px-6 py-3 shadow">Proceed to Final</button>
            </div>
          )}
          {stage === 'finals' && matches.length === 2 && matches.every(m => m.winnerId) && (
            <div className="text-center mt-8 font-extrabold text-emerald-600 text-xl">
              🏆 Champion: {(() => {
                const final = matches.find(m => m.group === 'F');
                if (final && final.winnerId) {
                  const winner = final.playerA.id === final.winnerId ? final.playerA : final.playerB;
                  return `${winner.firstName} ${winner.lastName}`;
                }
                return '';
              })()}
              <br />
              🥉 3rd Place: {(() => {
                const third = matches.find(m => m.group === '3P');
                if (third && third.winnerId) {
                  const winner = third.playerA.id === third.winnerId ? third.playerA : third.playerB;
                  return `${winner.firstName} ${winner.lastName}`;
                }
                return '';
              })()}
            </div>
          )}
        </>
      )}
      <footer className="mt-8 text-gray-500 text-sm">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
    </div>
  );
}

// styles migrated to Tailwind classes