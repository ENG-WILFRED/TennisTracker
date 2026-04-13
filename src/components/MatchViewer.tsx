import React, { useState, useEffect } from 'react';
import { useMatchWebSocket, MatchUpdate } from '@/hooks/useMatchWebSocket';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

interface MatchViewerProps {
  matchId: string;
  onClose?: () => void;
}

interface MatchData {
  id: string;
  playerA: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  playerB: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  event: {
    name: string;
  };
  status: string;
  scoreSetA?: string;
  scoreSetB?: string;
  scoreSetC?: string;
  servingPlayerId?: string;
}

interface ScoreState {
  sets: {
    playerA: number[];
    playerB: number[];
  };
  currentSet: number;
  currentGame: {
    playerA: number;
    playerB: number;
    isDeuce: boolean;
    advantage: 'A' | 'B' | null;
  };
  serving: 'A' | 'B';
  violations: {
    playerA: string[];
    playerB: string[];
  };
}

const MatchViewer: React.FC<MatchViewerProps> = ({ matchId, onClose }) => {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreState, setScoreState] = useState<ScoreState>({
    sets: {
      playerA: [0, 0, 0],
      playerB: [0, 0, 0],
    },
    currentSet: 0,
    currentGame: {
      playerA: 0,
      playerB: 0,
      isDeuce: false,
      advantage: null,
    },
    serving: 'A',
    violations: {
      playerA: [],
      playerB: [],
    },
  });

  const { isConnected, updates, connectionError } = useMatchWebSocket(matchId);

  // Tennis scoring logic
  const getPointDisplay = (points: number): string => {
    switch (points) {
      case 0: return '0';
      case 1: return '15';
      case 2: return '30';
      case 3: return '40';
      default: return '40';
    }
  };

  const getGameScoreDisplay = (game: typeof scoreState.currentGame): string => {
    if (game.isDeuce) {
      if (game.advantage === 'A') return 'Adv A';
      if (game.advantage === 'B') return 'Adv B';
      return 'Deuce';
    }

    return `${getPointDisplay(game.playerA)} - ${getPointDisplay(game.playerB)}`;
  };

  function parseSetScore(score?: string): [number, number] {
    if (!score) return [0, 0];
    const [a, b] = score.split('-').map((value) => Number(value.trim()) || 0);
    return [a, b];
  }

  function getCompletedSetCount(sets: Array<[number, number]>): number {
    return sets.filter(([a, b]) => {
      if (a >= 6 && a - b >= 2) return true;
      if (b >= 6 && b - a >= 2) return true;
      return false;
    }).length;
  }

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await authenticatedFetch(`/api/matches/${matchId}`);
        if (response.ok) {
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
        } else {
          console.error('Failed to fetch match');
        }
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Handle incoming WebSocket updates
  useEffect(() => {
    if (updates.length > 0) {
      const latestUpdate = updates[updates.length - 1];
      if (latestUpdate.type === 'score_update' && latestUpdate.data) {
        setScoreState(prev => ({
          ...prev,
          ...latestUpdate.data,
        }));
      } else if (latestUpdate.type === 'violation' && latestUpdate.data) {
        setScoreState(prev => ({
          ...prev,
          violations: latestUpdate.data.violations,
        }));
      } else if (latestUpdate.type === 'match_complete') {
        // Match completed, could show completion message
        console.log('Match completed:', latestUpdate.data);
      }
    }
  }, [updates]);

  if (loading) {
    return (
      <div style={{ padding: 20, color: G.text, background: G.dark, minHeight: '100vh' }}>
        Loading match...
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ padding: 20, color: G.text, background: G.dark, minHeight: '100vh' }}>
        Match not found
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: G.dark,
      zIndex: 1000,
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: G.lime,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isConnected ? G.lime : connectionError ? G.yellow : G.red,
              }} />
              <span style={{ fontSize: 12, color: G.muted2 }}>
                {isConnected ? 'Live' : connectionError ? 'Connection Error' : 'Offline'}
              </span>
            </div>
            {connectionError && (
              <div style={{
                marginTop: 8,
                padding: 8,
                background: G.red,
                color: G.text,
                borderRadius: 4,
                fontSize: 12,
              }}>
                ⚠️ {connectionError}
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Match Viewer
          </h1>
          <div style={{ fontSize: 16, color: G.muted2 }}>
            {match.event.name}
          </div>
        </div>

        {/* Players */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
          <div style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {match.playerA.user.firstName} {match.playerA.user.lastName}
            </div>
            <div style={{ fontSize: 14, color: G.muted2 }}>Player A</div>
            {scoreState.serving === 'A' && (
              <div style={{ marginTop: 10, color: G.yellow }}>🎾 Serving</div>
            )}
          </div>

          <div style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {match.playerB.user.firstName} {match.playerB.user.lastName}
            </div>
            <div style={{ fontSize: 14, color: G.muted2 }}>Player B</div>
            {scoreState.serving === 'B' && (
              <div style={{ marginTop: 10, color: G.yellow }}>🎾 Serving</div>
            )}
          </div>
        </div>

        {/* Score Display */}
        <div style={{
          background: G.card,
          border: `1px solid ${G.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 30,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Score</h3>

          {/* Sets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 20 }}>
            {[0, 1, 2].map(setIndex => (
              <div key={setIndex} style={{
                background: G.card2,
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: 15,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: G.muted2, marginBottom: 8 }}>Set {setIndex + 1}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {scoreState.sets.playerA[setIndex]} - {scoreState.sets.playerB[setIndex]}
                </div>
              </div>
            ))}
          </div>

          {/* Current Game */}
          <div style={{
            background: G.card2,
            border: `1px solid ${G.border}`,
            borderRadius: 8,
            padding: 15,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: G.muted2, marginBottom: 8 }}>Current Game</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {getGameScoreDisplay(scoreState.currentGame)}
            </div>
          </div>
        </div>

        {/* Violations */}
        {(scoreState.violations.playerA.length > 0 || scoreState.violations.playerB.length > 0) && (
          <div style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 30,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Violations</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                  {match.playerA.user.firstName} {match.playerA.user.lastName}
                </h4>
                {scoreState.violations.playerA.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {scoreState.violations.playerA.map((v, i) => (
                      <div key={i} style={{ fontSize: 11, color: G.red }}>• {v}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: G.muted2 }}>No violations</div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                  {match.playerB.user.firstName} {match.playerB.user.lastName}
                </h4>
                {scoreState.violations.playerB.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {scoreState.violations.playerB.map((v, i) => (
                      <div key={i} style={{ fontSize: 11, color: G.red }}>• {v}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: G.muted2 }}>No violations</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchViewer;