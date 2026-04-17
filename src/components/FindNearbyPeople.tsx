'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Users, Zap, MessageCircle, Send } from 'lucide-react';

interface NearbyPerson {
  id: string;
  name: string;
  username: string;
  city: string;
  nationality: string;
  photo: string;
  wins: number;
  matchesPlayed: number;
  level: string;
  distance: number;
}

interface FindNearbyPeopleProps {
  onSelectPerson?: (person: NearbyPerson) => void;
  onMessageClick?: (personId: string, personName: string) => void;
  onChallengeClick?: (personId: string, personName: string) => void;
  radius?: number;
}

// Spectator dashboard green theme colors
const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  card2: '#1b2f1b',
  card3: '#203520',
  cardBorder: '#2d5a35',
  border: '#243e24',
  mid: '#2d5a27',
  bright: '#3a7230',
  lime: '#7dc142',
  accent: '#a8d84e',
  yellow: '#f0c040',
  blue: '#4a9eff',
  red: '#d94f4f',
  text: '#e8f5e0',
  text2: '#c2dbb0',
  muted: '#7aaa6a',
  muted2: '#5e8e50',
  success: '#5fc45f',
  danger: '#e57373',
};

export const FindNearbyPeople: React.FC<FindNearbyPeopleProps> = ({
  onSelectPerson,
  onMessageClick,
  onChallengeClick,
  radius = 5,
}) => {
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(radius);

  // Get user's current location and fetch nearby people
  const fetchNearbyPeople = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        setError('Geolocation not supported by your browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setHasLocation(true);

          try {
            const response = await fetch(
              `/api/players/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}&limit=20`
            );

            if (!response.ok) {
              throw new Error('Failed to fetch nearby people');
            }

            const data = await response.json();
            setNearbyPeople(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch nearby people');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setError(`Location access denied: ${error.message}`);
          setLoading(false);
        }
      );
    } catch (err) {
      setError('Failed to get location');
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: G.card, border: `1px solid ${G.cardBorder}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6" style={{ color: G.lime }} />
          <h2 className="text-xl font-bold" style={{ color: G.lime }}>Find People Near You</h2>
        </div>
      </div>

      {/* Location and Radius Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="50"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: G.card2,
              outline: 'none',
            }}
          />
          <span className="text-sm font-semibold w-20" style={{ color: G.text }}>{radiusKm} km</span>
        </div>

        <button
          onClick={fetchNearbyPeople}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
          style={{
            background: G.lime,
            color: G.dark,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Finding People...' : 'Find People Near Me'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: 'rgba(217,79,79,.1)',
            border: `1px solid ${G.danger}`,
            color: G.danger,
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {hasLocation && (
        <div className="flex flex-col gap-3">
          {nearbyPeople.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: G.success }} />
                <span className="font-semibold" style={{ color: G.text }}>
                  {nearbyPeople.length} people found nearby
                </span>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {nearbyPeople.map((person) => (
                  <div
                    key={person.id}
                    className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                    style={{ background: G.card2, border: `1px solid ${G.border}` }}
                  >
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate" style={{ color: G.text }}>
                            {person.name}
                          </h3>
                          <span
                            className="inline-block text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ background: `${G.blue}22`, color: G.blue }}
                          >
                            {person.level}
                          </span>
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: G.accent }}>
                          {person.distance} km away
                        </span>
                      </div>

                      <p className="text-sm" style={{ color: G.muted }}>@{person.username}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" style={{ color: G.muted }} />
                          <span style={{ color: G.muted }}>{person.city}</span>
                        </div>
                        <span style={{ color: G.muted }}>{person.wins}W / {person.matchesPlayed}P</span>
                        <span style={{ color: G.muted }}>{person.nationality}</span>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2">
                      {onMessageClick && (
                        <button
                          onClick={() => onMessageClick(person.id, person.name)}
                          className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:opacity-90"
                          style={{ background: G.success, color: '#fff' }}
                          title="Send Direct Message"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">DM</span>
                        </button>
                      )}
                      {onChallengeClick && (
                        <button
                          onClick={() => onChallengeClick(person.id, person.name)}
                          className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:opacity-90"
                          style={{ background: G.yellow, color: G.dark }}
                          title="Send Challenge"
                        >
                          <Zap className="w-3 h-3" />
                          <span className="hidden sm:inline">Challenge</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : !loading ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: G.muted2 }} />
              <p style={{ color: G.muted }}>No players found within {radiusKm} km</p>
              <p className="text-xs mt-1" style={{ color: G.muted2 }}>Try increasing the radius</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
