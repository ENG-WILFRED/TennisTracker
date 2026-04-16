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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Find People Near You</h2>
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
          onClick={fetchNearbyPeople}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Finding People...' : 'Find People Near Me'}
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
          {nearbyPeople.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">
                  {nearbyPeople.length} people found nearby
                </span>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {nearbyPeople.map((person) => (
                  <div
                    key={person.id}
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={person.photo}
                        alt={person.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {person.name}
                          </h3>
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                            {person.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">@{person.username}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{person.city}</span>
                          <span className="font-semibold text-blue-600">
                            {person.distance} km away
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-600 mt-1">
                          <span>{person.wins}W / {person.matchesPlayed}P</span>
                          <span>{person.nationality}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {onMessageClick && (
                          <button
                            onClick={() => onMessageClick(person.id, person.name)}
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            title="Send Direct Message"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>DM</span>
                          </button>
                        )}
                        {onChallengeClick && (
                          <button
                            onClick={() => onChallengeClick(person.id, person.name)}
                            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            title="Send Challenge"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Challenge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No players found within {radiusKm} km</p>
              <p className="text-xs mt-1">Try increasing the radius</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
