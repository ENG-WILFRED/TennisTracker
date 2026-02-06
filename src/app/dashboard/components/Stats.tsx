import React from 'react';

export default function Stats({ player }: { player: any }) {
  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player.matchesPlayed}</div>
          <div className="text-gray-500">Matches Played</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player.matchesWon}</div>
          <div className="text-gray-500">Matches Won</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player.matchesLost}</div>
          <div className="text-gray-500">Matches Lost</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player.matchesRefereed}</div>
          <div className="text-gray-500">Refereed</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-500">{player.matchesBallCrew}</div>
          <div className="text-gray-500">Ball Crew</div>
        </div>
      </div>
    </div>
  );
}
