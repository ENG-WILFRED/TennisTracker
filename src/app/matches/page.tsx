'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchViewer from '@/components/MatchViewer';
import MatchOfficiation from '@/components/MatchOfficiation';
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

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matchId);
  const [canOfficiate, setCanOfficiate] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await authenticatedFetch('/api/matches');
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Check if user can officiate this match
  useEffect(() => {
    const checkOfficiationPermission = async () => {
      if (!matchId) return;

      try {
        // Check if user is assigned as referee for this match's tasks
        const response = await authenticatedFetch(`/api/referee/matches/${matchId}/permission`);
        if (response.ok) {
          const data = await response.json();
          setCanOfficiate(data.canOfficiate);
        }
      } catch (error) {
        console.error('Error checking officiation permission:', error);
      }
    };

    checkOfficiationPermission();
  }, [matchId]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (selectedMatchId) {
    if (canOfficiate) {
      return (
        <MatchOfficiation
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          onMatchComplete={() => {
            setSelectedMatchId(null);
            // Refresh matches list
            window.location.reload();
          }}
        />
      );
    } else {
      return (
        <MatchViewer
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      );
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: G.dark, color: G.text, padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 30 }}>Matches</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 16, color: G.muted2 }}>Loading matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 16, color: G.muted2 }}>No matches found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {matches.map((match: any) => (
              <div
                key={match.id}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedMatchId(match.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = G.card2;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = G.card;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      {match.playerA?.name || 'TBD'} vs {match.playerB?.name || 'TBD'}
                    </div>
                    <div style={{ fontSize: 14, color: G.muted2, marginBottom: 4 }}>
                      {match.status === 'COMPLETED'
                        ? `Played on ${new Date(match.date).toLocaleDateString()}`
                        : match.scheduledTime
                        ? `Scheduled for ${new Date(match.scheduledTime).toLocaleString()}`
                        : 'Not scheduled'}
                    </div>
                    <div style={{ fontSize: 12, color: G.muted }}>
                      {match.status === 'COMPLETED' ? `Results: ${match.score}` : `Current: ${match.score || 'Not started'}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: match.status === 'COMPLETED' ? G.lime + '22' : G.yellow + '22',
                      color: match.status === 'COMPLETED' ? G.lime : G.yellow,
                      border: `1px solid ${match.status === 'COMPLETED' ? G.lime : G.yellow}`,
                    }}>
                      {match.status}
                    </div>
                    {match.winner && (
                      <div style={{ fontSize: 12, color: G.lime, marginTop: 8 }}>
                        Winner: {match.winner.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}