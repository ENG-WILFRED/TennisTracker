import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useMatchWebSocket } from '@/hooks/useMatchWebSocket';

interface MatchData {
  id: string;
  playerA: { id: string; user: { firstName: string; lastName: string } };
  playerB: { id: string; user: { firstName: string; lastName: string } };
  event: { name: string };
  status: string;
  scoreSetA?: string;
  scoreSetB?: string;
  scoreSetC?: string;
  winnerId?: string;
  servingPlayerId?: string;
  lastResetReason?: string;
  lastResetAt?: string;
}

interface ScoreState {
  sets: { playerA: number[]; playerB: number[] };
  currentSet: number;
  currentGame: { playerA: number; playerB: number; isDeuce: boolean; advantage: 'A' | 'B' | null };
  serving: 'A' | 'B';
  violations: { playerA: string[]; playerB: string[] };
}

interface MatchOfficiationProps {
  matchId: string;
  onClose?: () => void;
  onMatchComplete?: () => void;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function getPointDisplay(points: number): string {
  return (['0', '15', '30', '40'] as const)[Math.min(points, 3)] ?? '40';
}

function getGameScoreDisplay(game: ScoreState['currentGame']): string {
  if (game.isDeuce) {
    if (game.advantage === 'A') return 'Adv A';
    if (game.advantage === 'B') return 'Adv B';
    return 'Deuce';
  }
  return `${getPointDisplay(game.playerA)} — ${getPointDisplay(game.playerB)}`;
}

function getSetWinner(a: number, b: number): 'A' | 'B' | null {
  if (a >= 6 && a - b >= 2) return 'A';
  if (b >= 6 && b - a >= 2) return 'B';
  return null;
}

function parseSetScore(score?: string): [number, number] {
  if (!score) return [0, 0];
  const [a, b] = score.split('-').map((value) => Number(value.trim()) || 0);
  return [a, b];
}

function getCompletedSetCount(sets: Array<[number, number]>): number {
  return sets.filter(([a, b]) => getSetWinner(a, b) !== null).length;
}

function getMatchWinner(sets: { playerA: number[]; playerB: number[] }): 'A' | 'B' | null {
  const winsA = sets.playerA.reduce((count, a, index) => getSetWinner(a, sets.playerB[index]) === 'A' ? count + 1 : count, 0);
  const winsB = sets.playerB.reduce((count, b, index) => getSetWinner(sets.playerA[index], b) === 'B' ? count + 1 : count, 0);
  if (winsA >= 2) return 'A';
  if (winsB >= 2) return 'B';
  return null;
}

function getOppositeServer(server: 'A' | 'B'): 'A' | 'B' {
  return server === 'A' ? 'B' : 'A';
}

function buildServerSequence(count: number, start: 'A' | 'B'): ('A' | 'B')[] {
  return Array.from({ length: count }, (_, index) => (index % 2 === 0 ? start : getOppositeServer(start)));
}

function getSetStartServers(state: ScoreState): ('A' | 'B')[] {
  const setStarts: ('A' | 'B')[] = ['A', 'A', 'A'];
  const completedGamesPerSet = state.sets.playerA.map((a, index) => a + state.sets.playerB[index]);
  const currentSetCount = completedGamesPerSet[state.currentSet];
  setStarts[state.currentSet] = currentSetCount % 2 === 0
    ? state.serving
    : getOppositeServer(state.serving);

  for (let index = state.currentSet - 1; index >= 0; index--) {
    const games = completedGamesPerSet[index];
    const nextSetStart = setStarts[index + 1];
    setStarts[index] = games % 2 === 0 ? nextSetStart : getOppositeServer(nextSetStart);
  }

  return setStarts;
}

function getGameServerSequence(setIndex: number, state: ScoreState): ('A' | 'B')[] {
  const completedGames = state.sets.playerA[setIndex] + state.sets.playerB[setIndex];
  if (completedGames === 0) return [];
  const setStarts = getSetStartServers(state);
  return buildServerSequence(completedGames, setStarts[setIndex]);
}

const initialScoreState: ScoreState = {
  sets: { playerA: [0, 0, 0], playerB: [0, 0, 0] },
  currentSet: 0,
  currentGame: { playerA: 0, playerB: 0, isDeuce: false, advantage: null },
  serving: 'A',
  violations: { playerA: [], playerB: [] },
};

const MatchOfficiation: React.FC<MatchOfficiationProps> = ({ matchId, onClose, onMatchComplete }) => {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreState, setScoreState] = useState<ScoreState>(initialScoreState);
  const [lastScoreState, setLastScoreState] = useState<ScoreState | null>(null);
  const [lastGameAnalytics, setLastGameAnalytics] = useState<{
    setIndex: number;
    gameNumber: number;
    winner: 'A' | 'B';
    server: 'A' | 'B';
    finalScore: { playerA: number; playerB: number };
  } | null>(null);

  const { isConnected, updates, sendUpdate, connectionError } = useMatchWebSocket(matchId);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;
      try {
        const response = await authenticatedFetch(`/api/matches/${matchId}`);
        if (!response.ok) {
          console.error('Failed to fetch match');
          return;
        }

        const data = await response.json();
        setMatch(data);

        const savedSets: Array<[number, number]> = [
          parseSetScore(data.scoreSetA),
          parseSetScore(data.scoreSetB),
          parseSetScore(data.scoreSetC),
        ];

        setScoreState((prev) => ({
          ...prev,
          sets: {
            playerA: savedSets.map(([a]) => a),
            playerB: savedSets.map(([, b]) => b),
          },
          currentSet: Math.min(getCompletedSetCount(savedSets), 2),
          serving: data.servingPlayerId === data.playerB?.id ? 'B' : 'A',
        }));
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  useEffect(() => {
    if (updates.length === 0) return;
    const latestUpdate = updates[updates.length - 1];
    if (latestUpdate.type === 'score_update' && latestUpdate.data) {
      setScoreState((prev) => ({
        ...prev,
        ...latestUpdate.data,
      }));
    }
  }, [updates]);

  const saveSetScoresToDb = async (state: ScoreState) => {
    if (!match) return;

    try {
      await authenticatedFetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreSetA: `${state.sets.playerA[0]}-${state.sets.playerB[0]}`,
          scoreSetB: `${state.sets.playerA[1]}-${state.sets.playerB[1]}`,
          scoreSetC: `${state.sets.playerA[2]}-${state.sets.playerB[2]}`,
          servingPlayerId: state.serving === 'A' ? match.playerA.id : match.playerB.id,
        }),
      });
    } catch (error) {
      console.error('Failed to save set scores:', error);
    }
  };

  const saveGameResetReasonToDb = async (reason: string) => {
    if (!match) return;

    try {
      await authenticatedFetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreSetA: `${scoreState.sets.playerA[0]}-${scoreState.sets.playerB[0]}`,
          scoreSetB: `${scoreState.sets.playerA[1]}-${scoreState.sets.playerB[1]}`,
          scoreSetC: `${scoreState.sets.playerA[2]}-${scoreState.sets.playerB[2]}`,
          servingPlayerId: scoreState.serving === 'A' ? match.playerA.id : match.playerB.id,
          resetReason: reason,
        }),
      });
    } catch (error) {
      console.error('Failed to save reset reason:', error);
    }
  };

  const addPoint = (player: 'A' | 'B') => {
    if (lastGameAnalytics && scoreState.currentGame.playerA === 0 && scoreState.currentGame.playerB === 0) {
      setLastGameAnalytics(null);
    }

    const prevState = scoreState;
    let gameEnded = false;

    setScoreState((prev) => {
      const currentWinner = getMatchWinner(prev.sets);
      if (currentWinner) return prev;

      const next: ScoreState = {
        sets: { playerA: [...prev.sets.playerA], playerB: [...prev.sets.playerB] },
        currentSet: prev.currentSet,
        currentGame: { ...prev.currentGame },
        serving: prev.serving,
        violations: { playerA: [...prev.violations.playerA], playerB: [...prev.violations.playerB] },
      };

      const pKey = player === 'A' ? 'playerA' : 'playerB';
      const g = next.currentGame;

      if (g.isDeuce) {
        if (!g.advantage) {
          g.advantage = player;
        } else if (g.advantage === player) {
          next.sets[pKey][next.currentSet]++;
          g.playerA = 0;
          g.playerB = 0;
          g.isDeuce = false;
          g.advantage = null;
          gameEnded = true;
        } else {
          g.advantage = null;
        }
      } else {
        g[pKey]++;
        if (g.playerA >= 3 && g.playerB >= 3) {
          g.isDeuce = true;
          g.advantage = null;
        } else if (g[pKey] >= 4) {
          next.sets[pKey][next.currentSet]++;
          g.playerA = 0;
          g.playerB = 0;
          g.isDeuce = false;
          g.advantage = null;
          gameEnded = true;
        }
      }

      const setWinner = getSetWinner(next.sets.playerA[next.currentSet], next.sets.playerB[next.currentSet]);
      const nextMatchWinner = getMatchWinner(next.sets);
      if (setWinner && !nextMatchWinner && next.currentSet < 2) {
        next.currentSet += 1;
      }

      if (gameEnded && !nextMatchWinner) {
        next.serving = next.serving === 'A' ? 'B' : 'A';
      }

      if (gameEnded) {
        const completedGames = prev.sets.playerA[prev.currentSet] + prev.sets.playerB[prev.currentSet];
        setLastGameAnalytics({
          setIndex: prev.currentSet,
          gameNumber: completedGames + 1,
          winner: player,
          server: prev.serving,
          finalScore: {
            playerA: next.sets.playerA[prev.currentSet],
            playerB: next.sets.playerB[prev.currentSet],
          },
        });
      }

      sendUpdate({
        type: 'score_update',
        data: {
          sets: next.sets,
          currentSet: next.currentSet,
          currentGame: next.currentGame,
          serving: next.serving,
        },
      });

      if (setWinner) {
        saveSetScoresToDb(next);
      }

      return next;
    });

    if (gameEnded) {
      setLastScoreState(null);
    } else {
      setLastScoreState(prevState);
    }
  };

  const addViolation = (player: 'A' | 'B', violation: string) => {
    const key = player === 'A' ? 'playerA' : 'playerB';
    setScoreState((prev) => {
      const newState = {
        ...prev,
        violations: { ...prev.violations, [key]: [...prev.violations[key], violation] },
      };

      sendUpdate({
        type: 'violation',
        data: {
          player,
          violation,
          violations: newState.violations,
        },
      });

      return newState;
    });
  };

  const undoLastPoint = async () => {
    if (!lastScoreState) return;
    setScoreState(lastScoreState);
    setLastScoreState(null);

    sendUpdate({
      type: 'score_update',
      data: {
        sets: lastScoreState.sets,
        currentSet: lastScoreState.currentSet,
        currentGame: lastScoreState.currentGame,
        serving: lastScoreState.serving,
      },
    });

    await saveSetScoresToDb(lastScoreState);
  };

  const resetMatch = async () => {
    if (!match) return;
    if (!canResetCurrentGame || isMatchDecided) {
      alert('Reset is only available when a game has more than one point and the match is still active. Use undo if only one point was scored.');
      return;
    }

    const reason = window.prompt('Why are you resetting the current game? Please provide a detailed reason.');
    if (!reason || !reason.trim()) {
      alert('Reset cancelled. A detailed reason is required to reset the current game.');
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      alert('Please provide a more detailed reason (at least 10 characters).');
      return;
    }

    setLastScoreState(scoreState);
    setScoreState((prev) => ({
      ...prev,
      currentGame: { playerA: 0, playerB: 0, isDeuce: false, advantage: null },
    }));

    sendUpdate({
      type: 'score_update',
      data: {
        sets: scoreState.sets,
        currentSet: scoreState.currentSet,
        currentGame: { playerA: 0, playerB: 0, isDeuce: false, advantage: null },
        serving: scoreState.serving,
      },
    });

    await saveGameResetReasonToDb(trimmedReason);
  };

  const completedSetCount = getCompletedSetCount([
    [scoreState.sets.playerA[0], scoreState.sets.playerB[0]],
    [scoreState.sets.playerA[1], scoreState.sets.playerB[1]],
    [scoreState.sets.playerA[2], scoreState.sets.playerB[2]],
  ]);
  const matchWinner = getMatchWinner(scoreState.sets);
  const winnerSetCount = matchWinner === 'A'
    ? scoreState.sets.playerA.reduce((count, a, index) => getSetWinner(a, scoreState.sets.playerB[index]) === 'A' ? count + 1 : count, 0)
    : matchWinner === 'B'
      ? scoreState.sets.playerB.reduce((count, b, index) => getSetWinner(scoreState.sets.playerA[index], b) === 'B' ? count + 1 : count, 0)
      : 0;
  const isMatchCompleteAllowed = matchWinner !== null;
  const isMatchDecided = matchWinner !== null;
  const currentGamePointCount = scoreState.currentGame.playerA + scoreState.currentGame.playerB;
  const isGameStarted = currentGamePointCount > 0 || scoreState.currentGame.isDeuce || scoreState.currentGame.advantage !== null;
  const canResetCurrentGame = isGameStarted && (currentGamePointCount > 1 || scoreState.currentGame.isDeuce || scoreState.currentGame.advantage !== null);
  const showUseUndoHint = isGameStarted && currentGamePointCount === 1 && !isMatchDecided;
  const isGameOverReview = !isGameStarted && lastGameAnalytics !== null;
  const isBetweenGames = isGameOverReview && !isMatchDecided;
  const servingName = match ? (scoreState.serving === 'A' ? match.playerA.user.firstName : match.playerB.user.firstName) : '';

  const saveMatch = async () => {
    if (!match) return;
    if (!isMatchCompleteAllowed) {
      alert('A player must win two sets before marking the match finished.');
      return;
    }

    try {
      const winnerKey = matchWinner === 'A' ? match.playerA.id : match.playerB.id;
      const payload = {
        scoreSetA: `${scoreState.sets.playerA[0]}-${scoreState.sets.playerB[0]}`,
        scoreSetB: `${scoreState.sets.playerA[1]}-${scoreState.sets.playerB[1]}`,
        scoreSetC: `${scoreState.sets.playerA[2]}-${scoreState.sets.playerB[2]}`,
        status: 'completed',
        winnerId: winnerKey,
        servingPlayerId: scoreState.serving === 'A' ? match.playerA.id : match.playerB.id,
      };
      const response = await authenticatedFetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        sendUpdate({
          type: 'match_complete',
          data: payload,
        });
        onMatchComplete?.();
        onClose?.();
      } else {
        alert('Failed to save match');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error saving match');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a180a] text-[#e4f2da] flex items-center justify-center px-4 py-8">
        <div className="text-sm text-[#7aaa68]">Loading match...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="fixed inset-0 bg-[#0a180a] text-[#e4f2da] flex items-center justify-center px-4 py-8">
        <div className="text-sm text-[#7aaa68]">Match not found</div>
      </div>
    );
  }

  const playerAName = `${match.playerA.user.firstName} ${match.playerA.user.lastName}`;
  const playerBName = `${match.playerB.user.firstName} ${match.playerB.user.lastName}`;
  const violations = ['Delay', 'Coaching', 'Equipment', 'Conduct'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a180a]">
      <div className="mx-auto  px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#79bf3e66] bg-transparent px-4 py-2 text-sm font-semibold text-[#79bf3e] transition hover:bg-[#1f341f]/80"
          >
            ← Back to task
          </button>
          <div className="flex items-center gap-3 text-sm text-[#c2dbb0]">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-[#79bf3e]' : connectionError ? 'bg-[#efc040]' : 'bg-[#c94040]'}`} />
            <span>{isConnected ? 'Live' : connectionError ? 'Connection Error' : 'Offline'}</span>
          </div>
        </div>

        {connectionError && (
          <div className="mb-5 rounded-2xl bg-[#c94040] px-4 py-3 text-sm text-[#e4f2da]">
            ⚠️ {connectionError}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#e4f2da]">Match officiation</h1>
          <p className="mt-2 text-sm text-[#7aaa68]">{match.event.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {(['A', 'B'] as const).map((player) => {
            const isA = player === 'A';
            const u = isA ? match.playerA.user : match.playerB.user;
            const isServing = scoreState.serving === player;
            return (
              <div
                key={player}
                className={`rounded-[1rem] border p-5 transition ${isServing ? 'border-[#79bf3e] bg-[#1b2f1b]' : 'border-[#3a442b] bg-[#162616]'}`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#79bf3e55] bg-[#79bf3e1a] text-base font-semibold text-[#a8d84e]">
                  {getInitials(u.firstName, u.lastName)}
                </div>
                <div className="text-lg font-semibold text-[#e4f2da]">{u.firstName} {u.lastName}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#5e8e50]">Player {player}</div>
                {isServing && (
                  <div className="mt-3 inline-flex rounded-full bg-[#efc040] px-3 py-1 text-xs font-semibold text-[#2a1e00]">
                    Serving
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-6 rounded-[1rem] border border-[#3a442b] bg-[#162616] p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#5e8e50]">Score</div>
          <div className="grid gap-3 md:grid-cols-3 mb-5">
            {[0, 1, 2].map((i) => {
              const isActive = i === scoreState.currentSet;
              const gameServerSequence = getGameServerSequence(i, scoreState);
              return (
                <div key={i} className={`rounded-2xl border p-4 text-center ${isActive ? 'border-[#79bf3e]' : 'border-[#3a442b] bg-[#1b2f1b]'}`}>
                  <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-[#7aaa68]">Set {i + 1}</div>
                  <div className="text-3xl font-semibold text-[#e4f2da]">{scoreState.sets.playerA[i]} — {scoreState.sets.playerB[i]}</div>
                  {gameServerSequence.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-[#c2dbb0]">
                      {gameServerSequence.map((server, gameIndex) => (
                        <span key={gameIndex} className="inline-flex items-center gap-1 rounded-full border border-[#7aaa68]/30 bg-[#7aaa68]/10 px-2 py-1 text-[10px]">
                          <span className="font-semibold text-[#e4f2da]">G{gameIndex + 1}:</span>
                          <span>{server === 'A' ? match?.playerA.user.firstName : match?.playerB.user.firstName}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isGameOverReview && !isMatchDecided ? (
            <div className="rounded-[1rem] border border-[#79bf3e66] bg-gradient-to-r from-[#79bf3e14] to-transparent p-5 text-center">
              <div className="text-[11px] uppercase tracking-[0.32em] text-[#7aaa68] mb-2">Current game</div>
              <div className="text-4xl font-semibold text-[#a8d84e]">{getGameScoreDisplay(scoreState.currentGame)}</div>
            </div>
          ) : null}
        </div>

        {isGameOverReview && lastGameAnalytics ? (
          <div className="mb-6 rounded-[1rem] border border-[#4a9eff] bg-[#0f2033] p-6">
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Last game analytics</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#4a9eff]/40 bg-[#12243a] p-4 text-sm text-[#c2dbb0]">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Set</div>
                <div className="mt-2 text-lg font-semibold text-[#e4f2da]">{lastGameAnalytics.setIndex + 1}</div>
              </div>
              <div className="rounded-2xl border border-[#4a9eff]/40 bg-[#12243a] p-4 text-sm text-[#c2dbb0]">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Game</div>
                <div className="mt-2 text-lg font-semibold text-[#e4f2da]">G{lastGameAnalytics.gameNumber}</div>
              </div>
              <div className="rounded-2xl border border-[#4a9eff]/40 bg-[#12243a] p-4 text-sm text-[#c2dbb0]">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Winner</div>
                <div className="mt-2 text-lg font-semibold text-[#e4f2da]">{lastGameAnalytics.winner === 'A' ? match?.playerA.user.firstName : match?.playerB.user.firstName}</div>
              </div>
              <div className="rounded-2xl border border-[#4a9eff]/40 bg-[#12243a] p-4 text-sm text-[#c2dbb0]">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Server</div>
                <div className="mt-2 text-lg font-semibold text-[#e4f2da]">{lastGameAnalytics.server === 'A' ? match?.playerA.user.firstName : match?.playerB.user.firstName}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#4a9eff]/30 bg-[#4a9eff10] p-4 text-sm text-[#c2dbb0]">
              <div className="text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Set score after game</div>
              <div className="mt-2 text-lg font-semibold text-[#e4f2da]">{lastGameAnalytics.finalScore.playerA} — {lastGameAnalytics.finalScore.playerB}</div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#4a9eff]/30 bg-[#4a9eff10] p-4 text-sm text-[#c2dbb0]">
              <div className="font-semibold text-[#e4f2da]">Add any remaining violations before final submission.</div>
              <p className="mt-2 text-xs text-[#7aaa68]">Review the last completed game and record any violations before you complete the match.</p>
            </div>
          </div>
        ) : !isMatchDecided ? (
          <div className="mb-6 rounded-[1rem] border border-[#4a9eff] bg-[#0f2033] p-6">
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#7aaa68]">Reset current game</div>
            <p className="text-sm leading-6 text-[#c2dbb0]">
              If a point or game was awarded incorrectly, reset only the current game and keep set scores intact. Provide a detailed reason when resetting more than one point.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={resetMatch}
                disabled={!canResetCurrentGame || isMatchDecided}
                className={`inline-flex w-full justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${(!canResetCurrentGame || isMatchDecided)
                  ? 'cursor-not-allowed border-[#203520] bg-[#0d1b1b] text-[#7aaa68]/60'
                  : 'border-[#4a9eff] bg-[#0f2f47] text-[#4a9eff] hover:bg-[#164569]'}`}
              >
                Reset current game
              </button>
              <button
                type="button"
                onClick={undoLastPoint}
                disabled={!lastScoreState || currentGamePointCount === 0}
                className={`inline-flex w-full justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${(!lastScoreState || currentGamePointCount === 0)
                  ? 'cursor-not-allowed border-[#203520] bg-[#0d1b1b] text-[#7aaa68]/60'
                  : 'border-[#7aaa68] bg-[#203520] text-[#7aaa68] hover:bg-[#26422f]'}`}
              >
                Undo last point
              </button>
            </div>
            {showUseUndoHint && (
              <p className="mt-3 text-xs text-[#7aaa68]">Only one point has been scored in this game — use undo instead of reset.</p>
            )}
            {match.lastResetReason && (
              <div className="mt-4 rounded-2xl border border-[#4a9eff]/30 bg-[#4a9eff10] p-4 text-sm text-[#c2dbb0]">
                <div className="mb-2 font-semibold text-[#e4f2da]">Last reset reason</div>
                <div>{match.lastResetReason}</div>
                {match.lastResetAt && (
                  <div className="mt-2 text-xs text-[#7aaa68]">{new Date(match.lastResetAt).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="mb-6 rounded-[1rem] border border-[#3a442b] bg-[#162616] p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#5e8e50]">Controls</div>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {(['A', 'B'] as const).map((player) => {
              const u = player === 'A' ? match.playerA.user : match.playerB.user;
              return (
                <button
                  key={player}
                  type="button"
                  onClick={() => addPoint(player)}
                  disabled={isMatchDecided}
                  className={`rounded-2xl px-4 py-4 text-sm font-semibold transition ${isMatchDecided ? 'cursor-not-allowed bg-[#203520] text-[#7aaa68]/60' : 'bg-[#79bf3e] text-[#0a180a] hover:bg-[#8dd54e]'}`}
                >
                  <div>Point to</div>
                  <div className="mt-1 text-xs text-[#0a180abb]">{u.firstName} {u.lastName}</div>
                </button>
              );
            })}
          </div>
          {!isGameOverReview && (
            <>
              <div className="rounded-2xl border border-[#4a9eff4d] bg-[#0f2f47] px-4 py-4 text-sm font-semibold text-[#4a9eff]">
                Current game server: <span className="font-semibold text-[#e4f2da]">{servingName}</span>
              </div>
              {isGameStarted && !isMatchDecided && (
                <p className="mt-3 text-xs text-[#7aaa68]">Serving is auto-toggled after each completed game; manual toggle has been removed.</p>
              )}
            </>
          )}
        </div>

        <div className="mb-6 rounded-[1rem] border border-[#3a442b] bg-[#162616] p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#5e8e50]">Violations</div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(['A', 'B'] as const).map((player) => {
              const u = player === 'A' ? match.playerA.user : match.playerB.user;
              const vKey = player === 'A' ? 'playerA' : 'playerB';
              const vList = scoreState.violations[vKey];
              return (
                <div key={player}>
                  <h4 className="mb-3 text-sm font-semibold text-[#c2dbb0]">{u.firstName} {u.lastName}</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {violations.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => addViolation(player, v)}
                        className="rounded-xl border border-[#c94040]/30 bg-[#c94040]/10 px-3 py-2 text-left text-xs text-[#f08080] transition hover:bg-[#c94040]/20"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                  {vList.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[#7aaa68]">Violations ({vList.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {vList.map((v, i) => (
                          <span key={i} className="rounded-full bg-[#c94040]/15 px-3 py-1 text-[10px] text-[#f08080]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-[1rem] border border-[#3a442b] bg-[#162616] p-6 text-center">
          <div className="mb-3 text-sm text-[#7aaa68]">Completed sets: {completedSetCount} / 3</div>
          {matchWinner && (
            <div className="mb-4 rounded-2xl border border-[#79bf3e] bg-[#79bf3e10] px-4 py-3 text-sm text-[#a8d84e]">
              Match winner: <span className="font-semibold text-[#e4f2da]">{matchWinner === 'A' ? playerAName : playerBName}</span> in {winnerSetCount} set{winnerSetCount > 1 ? 's' : ''}.
            </div>
          )}
          <button
            type="button"
            onClick={saveMatch}
            disabled={!isMatchCompleteAllowed}
            className={`inline-flex items-center justify-center rounded-2xl px-8 py-4 text-base font-semibold transition ${isMatchCompleteAllowed ? 'bg-[#79bf3e] text-[#0a180a] hover:bg-[#8dd54e]' : 'cursor-not-allowed bg-[#203520] text-[#7aaa68]/70'}`}
          >
            Complete & save match
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchOfficiation;
