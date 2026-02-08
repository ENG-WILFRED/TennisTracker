import React from 'react';
import Button from '@/components/Button';

export default function UpcomingMatches({ upcomingMatches }: { upcomingMatches: any[] }) {
  return (
    <div className="w-full mt-4 bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-green-800">Upcoming Matches</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">View All</Button>
        </div>
      </div>

      {(!upcomingMatches || upcomingMatches.length === 0) ? (
        <div className="text-gray-500">No upcoming matches scheduled.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {upcomingMatches.map((match: any) => (
            <div key={match.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="font-semibold text-green-800">{match.opponent.firstName} {match.opponent.lastName} <span className="text-gray-500 text-sm">({match.opponent.username})</span></div>
                <div className="text-sm text-gray-500">{match.round} · {match.role} · {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : 'TBD'}</div>
              </div>
                <div className="flex gap-2">
                <Button className="text-sm">Details</Button>
                <Button variant="outline" className="text-sm">Sync</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
