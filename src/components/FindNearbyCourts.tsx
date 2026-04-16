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

interface FindNearbyCortsProps {
  onSelectCourt?: (court: NearbyCourt) => void;
  onBookClick?: (courtId: string, courtName: string) => void;
  radius?: number;
}

export const FindNearbyCourts: React.FC<FindNearbyCortsProps> = ({
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Find Courts Near You</h2>
        </div>
      </div>

      {/* Location and Radius Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="range"
            min="1"
            max="50"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-600 w-20">{radiusKm} km</span>
        </div>

        <button
          onClick={fetchNearbyCourts}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Finding Courts...' : 'Find Courts Near Me'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {hasLocation && (
        <div className="mt-4">
          {nearbyCourts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">
                  {nearbyCourts.length} courts found nearby
                </span>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {nearbyCourts.map((court) => (
                  <div
                    key={court.id}
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex gap-3 p-3">
                      <img
                        src={court.image}
                        alt={court.name}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {court.name}
                          </h3>
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                            {court.distance} km
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 truncate">
                          <span className="font-medium">{court.organization}</span>
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{court.address}</span>
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {court.surface}
                          </span>
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {court.indoorOutdoor}
                          </span>
                          {court.lights && (
                            <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                              🔆 Lights
                            </span>
                          )}
                        </div>
                      </div>

                      {onBookClick && (
                        <button
                          onClick={() => onBookClick(court.id, court.name)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium h-fit transition-colors whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="text-center py-6 text-gray-500">
              <Home className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No courts found within {radiusKm} km</p>
              <p className="text-xs mt-1">Try increasing the radius</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
