import React from 'react';

export default function Stats({ player }: { player: any }) {
  const played = player?.matchesPlayed || 0;
  const won = player?.matchesWon || 0;
  const lost = player?.matchesLost || 0;
  const winPct = played ? Math.round((won / played) * 100) : 0;

  const primaryStats = [
    {
      value: played,
      label: 'Matches Played',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      highlight: true,
    },
    {
      value: won,
      label: 'Matches Won',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      highlight: true,
    },
    {
      value: `${winPct}%`,
      label: 'Win Rate',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      highlight: true,
    },
  ];

  const secondaryStats = [
    {
      value: lost,
      label: 'Matches Lost',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    {
      value: player?.matchesRefereed || 0,
      label: 'Refereed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: player?.matchesBallCrew || 0,
      label: 'Ball Crew',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full mx-auto my-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {primaryStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-lg text-white">
                {stat.icon}
              </div>
              {stat.highlight && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Additional Stats
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondaryStats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 hover:border-green-300 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Win/Loss Visual Indicator */}
      {played > 0 && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Performance Overview</span>
            <span className="text-xs text-gray-500">{played} total matches</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600"
              style={{ width: `${winPct}%` }}
              title={`${won} wins`}
            />
            <div
              className="bg-gradient-to-r from-red-400 to-red-600"
              style={{ width: `${100 - winPct}%` }}
              title={`${lost} losses`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600 font-medium">{won} Wins</span>
            <span className="text-red-600 font-medium">{lost} Losses</span>
          </div>
        </div>
      )}
    </div>
  );
}