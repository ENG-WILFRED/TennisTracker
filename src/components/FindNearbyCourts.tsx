'use client';

import React, { useState } from 'react';
import { MapPin, Home, Clock, AlertCircle } from 'lucide-react';

interface NearbyCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  surface: string;
  lights: boolean;
  indoorOutdoor: string;
  image: string;
  organization: string;
  organizationLogo: string;
  distance: number;
}

interface FindNearbyCourtsProps {
  onSelectCourt?: (court: NearbyCourt) => void;
  onBookClick?: (courtId: string, courtName: string) => void;
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

export const FindNearbyCourts: React.FC<FindNearbyCourtsProps> = ({
  onSelectCourt,
  onBookClick,
  radius = 10,
}) => {
  const [nearbyCourts, setNearbyCourts] = useState<NearbyCourt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(radius);

  // Get user's current location and fetch nearby courts
  const fetchNearbyCourts = async () => {
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
              `/api/courts/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}&limit=15`
            );

            if (!response.ok) {
              throw new Error('Failed to fetch nearby courts');
            }

            const data = await response.json();
            setNearbyCourts(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch nearby courts');
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
          <Home className="w-6 h-6" style={{ color: G.lime }} />
          <h2 className="text-xl font-bold" style={{ color: G.lime }}>Find Courts Near You</h2>
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
          onClick={fetchNearbyCourts}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
          style={{
            background: G.lime,
            color: G.dark,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Finding Courts...' : 'Find Courts Near Me'}
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
          {nearbyCourts.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" style={{ color: G.success }} />
                <span className="font-semibold" style={{ color: G.text }}>
                  {nearbyCourts.length} courts found nearby
                </span>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {nearbyCourts.map((court) => (
                  <div
                    key={court.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: G.card2, border: `1px solid ${G.border}` }}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 p-4">
                      <img
                        src={court.image}
                        alt={court.name}
                        className="w-full sm:w-16 h-32 sm:h-16 rounded object-cover flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold truncate" style={{ color: G.text }}>
                            {court.name}
                          </h3>
                          <span
                            className="inline-block text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap self-start"
                            style={{ background: G.accent + '22', color: G.accent }}
                          >
                            {court.distance} km
                          </span>
                        </div>

                        <p className="text-xs truncate mb-1" style={{ color: G.muted }}>
                          <span className="font-medium">{court.organization}</span>
                        </p>

                        <div className="flex items-center gap-2 text-xs mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: G.muted }} />
                          <span className="truncate" style={{ color: G.muted }}>{court.address}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-medium"
                            style={{ background: G.mid, color: G.text }}
                          >
                            {court.surface}
                          </span>
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-medium"
                            style={{ background: G.mid, color: G.text }}
                          >
                            {court.indoorOutdoor}
                          </span>
                          {court.lights && (
                            <span
                              className="inline-block px-2 py-1 rounded text-xs font-medium"
                              style={{ background: G.yellow + '22', color: G.yellow }}
                            >
                              🔆 Lights
                            </span>
                          )}
                        </div>
                      </div>

                      {onBookClick && (
                        <button
                          onClick={() => onBookClick(court.id, court.name)}
                          className="rounded-lg px-3 py-2 text-xs font-medium transition-all hover:opacity-90 whitespace-nowrap self-start sm:self-center"
                          style={{ background: G.blue, color: '#fff' }}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : !loading ? (
            <div className="text-center py-8">
              <Home className="w-8 h-8 mx-auto mb-2" style={{ color: G.muted2 }} />
              <p style={{ color: G.muted }}>No courts found within {radiusKm} km</p>
              <p className="text-xs mt-1" style={{ color: G.muted2 }}>Try increasing the radius</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
