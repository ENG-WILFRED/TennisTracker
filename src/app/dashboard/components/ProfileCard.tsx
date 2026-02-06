import React from 'react';

interface Props {
  player: any;
  rank: number;
  badges: any[];
  onEdit: () => void;
  toast?: string | null;
}

export default function ProfileCard({ player, rank, badges, onEdit, toast }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg">
      <div className="flex items-center gap-6 mb-4">
        <img
          src={player.photo || '/tennis-ball.svg'}
          alt={player.firstName}
          className="w-24 h-24 rounded-full object-cover border-4 border-green-500 bg-green-50"
        />
        <div className="flex-1">
          <div className="text-xl font-extrabold text-green-800">
            {player.firstName} {player.lastName}{' '}
            <span className="text-gray-500 text-sm">({player.username})</span>
          </div>
          <div className="mt-1 text-teal-800 font-semibold">Rank: #{rank}</div>
          <div className="text-gray-500 mt-1">{player.nationality} | {player.gender} | {player.email}</div>
        </div>
      </div>
      <div className="text-gray-700 mb-3">{player.bio}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {badges.map((badge: any) => (
          <span key={badge.id} title={badge.description} className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-green-700 font-semibold text-sm">
            {badge.icon && <img src={badge.icon} alt="" className="w-4 h-4" />}
            {badge.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onEdit} className="bg-green-500 text-white font-bold px-4 py-2 rounded-md shadow-sm hover:bg-green-600">Edit Profile</button>
        {toast && <div className="text-green-700 font-semibold">{toast}</div>}
      </div>
    </div>
  );
}
