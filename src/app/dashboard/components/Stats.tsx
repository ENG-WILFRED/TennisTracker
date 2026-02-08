import React from 'react';

export default function Stats({ player }: { player: any }) {
  const played = player?.matchesPlayed || 0;
  const won = player?.matchesWon || 0;
  const lost = player?.matchesLost || 0;
  const winPct = played ? Math.round((won / played) * 100) : 0;

  return (
    <div className="w-full mx-auto my-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-500">{played}</div>
          <div className="text-gray-500">Matches Played</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-500">{won}</div>
          <div className="text-gray-500">Matches Won</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-500">{winPct}%</div>
          <div className="text-gray-500">Win Rate</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{lost}</div>
          <div className="text-gray-500">Matches Lost</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player?.matchesRefereed || 0}</div>
          <div className="text-gray-500">Refereed</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player?.matchesBallCrew || 0}</div>
          <div className="text-gray-500">Ball Crew</div>
        </div>
      </div>
    </div>
  );
}
