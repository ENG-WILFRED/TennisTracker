import React from 'react';
import Button from '@/components/Button';

type Props = {
  players: any[];
  matches: any[];
  standings: any;
  scores: { [matchId: string]: { a: number; b: number } };
  tiebreaks: { [matchId: string]: { a: boolean[]; b: boolean[] } };
  winners: { [matchId: string]: "a" | "b" | null };
  stage: "group" | "semis" | "finals" | "done";
  loading: boolean;
  toast: { type: "success" | "error" | "info"; message: string } | null;
  allGroupMatchesHaveWinner: boolean;
  onPointChange: (matchId: string, who: "a" | "b", point: number, checked: boolean) => void;
  onTiebreakChange: (matchId: string, who: "a" | "b", idx: number, checked: boolean) => void;
  onConfirmWinner: (matchId: string, winner: "a" | "b", aId: string, bId: string) => Promise<void> | void;
  onProceedToSemis: () => Promise<void> | void;
  onProceedToFinals: () => Promise<void> | void;
};

export default function KnockoutClient(props: Props) {
  const {
    players,
    matches,
    standings,
    scores,
    tiebreaks,
    winners,
    stage,
    loading,
    toast,
    allGroupMatchesHaveWinner,
    onPointChange,
    onTiebreakChange,
    onConfirmWinner,
    onProceedToSemis,
    onProceedToFinals,
  } = props;

  const SCORE_STEPS = [15, 30, 40, 45];

  function renderStandings() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {Object.entries(standings).map(([group, players]) => (
          <div key={group} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-emerald-700 mb-3">Group {group}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 font-medium">Player</th>
                  <th className="text-center text-gray-500 font-medium">W</th>
                  <th className="text-center text-gray-500 font-medium">L</th>
                </tr>
              </thead>
              <tbody>
                {(players as any[]).map((row: any) => (
                  <tr key={row.player.id} className="border-t last:border-b-0">
                    <td className="py-2">{row.player.firstName} {row.player.lastName}</td>
                    <td className="py-2 text-center">{row.wins}</td>
                    <td className="py-2 text-center">{row.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  function renderMatches() {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
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
              const isTiebreak = score.a === 40 && score.b === 40 && !winner;
              const tiebreak = tiebreaks[m.id] || { a: [false, false, false], b: [false, false, false] };
              const tiebreakA = tiebreak.a.filter(Boolean).length;
              const tiebreakB = tiebreak.b.filter(Boolean).length;
              const canConfirmTiebreak = (tiebreakA === 2 || tiebreakB === 2) && tiebreakA !== tiebreakB;
              return (
                <tr key={m.id} className={`border-b hover:bg-green-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="p-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm">{m.pool}</div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">{m.playerA.firstName.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-gray-900">{m.playerA.firstName} {m.playerA.lastName}</div>
                        <div className="text-sm text-gray-500">@{m.playerA.username}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 w-full">
                    <div className="space-y-3 w-full">
                      {!isTiebreak ? (
                        <div className="flex items-start justify-center gap-6 w-full">
                          <div className="flex-1 flex flex-col items-center">
                            {SCORE_STEPS.map((pt) => (
                              <label key={pt} className="mb-1 inline-flex items-center">
                                <input type="checkbox" checked={score.a >= pt} onChange={e => onPointChange(m.id, 'a', pt, e.target.checked)} disabled={!!winner} className="accent-emerald-500 mr-2" />
                                <span className="font-semibold">{pt}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex-none flex items-center justify-center">
                            <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow-sm">VS</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            {SCORE_STEPS.map((pt) => (
                              <label key={pt} className="mb-1 inline-flex items-center">
                                <input type="checkbox" checked={score.b >= pt} onChange={e => onPointChange(m.id, 'b', pt, e.target.checked)} disabled={!!winner} className="accent-sky-500 mr-2" />
                                <span className="font-semibold">{pt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-center gap-6 w-full">
                          <div className="flex-1 flex flex-col items-center">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <label key={idx} className="mb-1 inline-flex items-center">
                                <input type="checkbox" checked={tiebreak.a[idx]} onChange={e => onTiebreakChange(m.id, 'a', idx, e.target.checked)} disabled={!!winner || tiebreak.b[idx]} className="accent-emerald-500 mr-2" />
                                <span className="font-semibold">TB</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex-none flex items-center justify-center">
                            <div className="font-bold text-lg text-orange-400">Tiebreak</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <label key={idx} className="mb-1 inline-flex items-center">
                                <input type="checkbox" checked={tiebreak.b[idx]} onChange={e => onTiebreakChange(m.id, 'b', idx, e.target.checked)} disabled={!!winner || tiebreak.a[idx]} className="accent-sky-500 mr-2" />
                                <span className="font-semibold">TB</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-sm text-gray-600">Venue: {m.venue || 'TBD'}</div>
                        <div className="text-sm text-gray-600">Date: {m.scheduledAt || '-'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-sm">{m.playerB.firstName.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-gray-900">{m.playerB.firstName} {m.playerB.lastName}</div>
                        <div className="text-sm text-gray-500">@{m.playerB.username}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    {!winner && !isTiebreak && ((score.a === 45 && score.b < 40) || (score.b === 45 && score.a < 40)) && (
                      <Button onClick={() => onConfirmWinner(m.id, score.a === 45 ? 'a' : 'b', m.playerA.id, m.playerB.id)} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg">Confirm Winner</Button>
                    )}
                    {!winner && isTiebreak && canConfirmTiebreak && (
                      <Button onClick={() => onConfirmWinner(m.id, tiebreakA === 2 ? 'a' : 'b', m.playerA.id, m.playerB.id)} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg">Confirm Winner</Button>
                    )}
                    {winner && <div className="text-emerald-600 font-bold">Winner: {winner === 'a' ? m.playerA.firstName : m.playerB.firstName}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 py-8 w-full px-4">
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
              <button onClick={onProceedToSemis} className="px-6 py-3">Proceed to Semifinals</button>
            </div>
          )}
          {stage === 'semis' && matches.length === 2 && matches.every(m => m.winnerId) && (
            <div className="text-center mt-8">
              <button onClick={onProceedToFinals} className="px-6 py-3">Proceed to Final</button>
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
