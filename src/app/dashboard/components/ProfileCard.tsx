import React from 'react';
import Button from '@/components/Button';

interface Props {
  player: any;
  rank: number;
  badges: any[];
  onEdit: () => void;
  toast?: string | null;
}

export default function ProfileCard({ player, rank, badges, onEdit, toast }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 w-full shadow-lg">
      <div className="flex items-start gap-6 mb-4">
        <img
          src={player.photo || '/tennis-ball.svg'}
          alt={player.firstName}
          className="w-28 h-28 rounded-full object-cover border-4 border-green-500 bg-green-50 flex-shrink-0"
        />
        <div className="flex-1">
          <div className="text-2xl font-extrabold text-green-800">
            {player.firstName} {player.lastName}{' '}
            <span className="text-gray-500 text-sm">({player.username})</span>
          </div>
          <div className="mt-2 text-teal-800 font-semibold">Rank: #{rank}</div>
          <div className="text-gray-500 mt-1">{player.nationality} · {player.gender} · {player.email}</div>
          <div className="text-gray-700 mt-3 mb-3">{player.bio || 'No bio yet. Add a short intro about yourself.'}</div>

          <div className="flex gap-2 flex-wrap mb-3">
            {badges.map((badge: any) => (
              <span key={badge.id} title={badge.description} className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-green-700 font-semibold text-sm">
                {badge.icon && <img src={badge.icon} alt="" className="w-4 h-4" />}
                {badge.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">Message</Button>
            <Button variant="outline">Challenge</Button>
            <Button variant="outline">Follow</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
          <div>
          <Button onClick={onEdit} className="shadow-sm hover:bg-green-600">Edit Profile</Button>
          {toast && <div className="text-green-700 font-semibold inline-block ml-3">{toast}</div>}
        </div>
        <div className="text-right text-sm text-gray-500">Member since {player.createdAt ? new Date(player.createdAt).getFullYear() : '—'}</div>
      </div>
    </div>
  );
}
