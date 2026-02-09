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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Section with Background */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-xl">
            <span className="text-4xl font-bold text-gray-700">
              {player.firstName?.[0]}{player.lastName?.[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-8 pb-8">
        {/* Name and Username */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-lg text-gray-500">@{player.username}</p>
        </div>

        {/* Rank Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full font-semibold mb-4 shadow-md">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>Rank #{rank}</span>
        </div>

        {/* Player Details */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            {player.nationality || 'Not specified'}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {player.gender || 'Not specified'}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {player.email}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <p className={`text-gray-700 leading-relaxed ${!player.bio && 'italic text-gray-400'}`}>
            {player.bio || 'No bio yet. Add a short intro about yourself.'}
          </p>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge: any, index: number) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-lg text-sm font-medium text-gray-700"
                  title={badge.description}
                >
                  {badge.icon && <span className="text-lg">{badge.icon}</span>}
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="solid" className="flex-1 min-w-[120px]">
            Message
          </Button>
          <Button variant="outline" className="flex-1 min-w-[120px]">
            Challenge
          </Button>
          <Button variant="outline" className="flex-1 min-w-[120px]">
            Follow
          </Button>
        </div>

        <Button onClick={onEdit} variant="outline" className="w-full">
          Edit Profile
        </Button>

        {/* Toast Notification */}
        {toast && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">{toast}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
        <p className="text-sm text-gray-500">
          Member since {player.createdAt ? new Date(player.createdAt).getFullYear() : '—'}
        </p>
      </div>
    </div>
  );
}