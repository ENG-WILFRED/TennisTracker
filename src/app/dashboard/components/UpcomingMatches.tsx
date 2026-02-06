import React from 'react';

export default function UpcomingMatches({ upcomingMatches }: { upcomingMatches: any[] }) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-4 bg-white rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold text-green-800 mb-3">Upcoming Matches</h2>
      {upcomingMatches.length === 0 ? (
        <div className="text-gray-500">No upcoming matches scheduled.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-green-50">
                <th className="p-2 text-green-800 font-semibold">Opponent</th>
                <th className="p-2 text-center text-green-800 font-semibold">Role</th>
                <th className="p-2 text-center text-green-800 font-semibold">Round</th>
                <th className="p-2 text-center text-green-800 font-semibold">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMatches.map((match: any) => (
                <tr key={match.id} className="border-b">
                  <td className="p-2">{match.opponent.firstName} {match.opponent.lastName} <span className="text-gray-500 text-sm">({match.opponent.username})</span></td>
                  <td className="p-2 text-center text-teal-700 font-semibold">{match.role}</td>
                  <td className="p-2 text-center">{match.round}</td>
                  <td className="p-2 text-center">{match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : 'TBD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
