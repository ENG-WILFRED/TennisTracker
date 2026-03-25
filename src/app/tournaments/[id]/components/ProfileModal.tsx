import React from 'react';
import { Tournament, LeaderboardPlayer } from './types';

export function ProfileModal({ t, user, leaderboard, onClose }: { t: Tournament; user: any; leaderboard: LeaderboardPlayer[]; onClose: () => void }) {
  const userRank = leaderboard.find(p => p.isMe)?.rank || null;
  const isRegistered = t.applicationStatus !== 'none';

  return (
    <div className="fixed top-4 right-4 z-[300] bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[12px] w-80 overflow-hidden shadow-lg animate-[modalIn_0.2s_ease]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-[#a3d45e]">Your Tournament Status</div>
          <button onClick={onClose} className="text-[#5a7242] hover:text-[#a3d45e]">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {user?.firstName} {user?.lastName}</div>
          <div><strong>Registered:</strong> {isRegistered ? 'Yes' : 'No'}</div>
          {isRegistered && <div><strong>Status:</strong> {t.applicationStatus}</div>}
          {userRank && <div><strong>Rank:</strong> #{userRank}</div>}
          {t.myResult && (
            <>
              <div><strong>Wins:</strong> {t.myResult.wins}</div>
              <div><strong>Losses:</strong> {t.myResult.losses}</div>
              {t.myResult.winnings && <div><strong>Winnings:</strong> ${t.myResult.winnings}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}