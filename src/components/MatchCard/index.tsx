import React from 'react';
import { Match } from '../../types/match';
import { Player } from '../../types/player';

interface MatchCardProps {
  match: Match;
  players: Player[];
}

const MatchCard: React.FC<MatchCardProps> = ({ match, players }) => {
  const playerA = players.find(player => player.id === match.playerAId);
  const playerB = players.find(player => player.id === match.playerBId);
  const winner = players.find(player => player.id === match.winnerId);
  const scoreA = playerA ? match.score[playerA.id] ?? 0 : 0;
  const scoreB = playerB ? match.score[playerB.id] ?? 0 : 0;

  return (
    <div className="border-2 border-blue-500 rounded-lg p-4 my-4 bg-blue-50 transition-transform hover:scale-105">
      <h2 className="text-lg font-semibold">Match Round: {match.round}</h2>
      <div className="flex gap-4 mt-2">
        <div className="flex-1 bg-white rounded p-3 shadow-sm">
          <h3 className="text-md font-medium">{playerA?.name}</h3>
          <p className="text-sm text-gray-600">Score: {scoreA}</p>
        </div>
        <div className="flex-1 bg-white rounded p-3 shadow-sm">
          <h3 className="text-md font-medium">{playerB?.name}</h3>
          <p className="text-sm text-gray-600">Score: {scoreB}</p>
        </div>
      </div>
      <div className="mt-3 text-blue-700 font-semibold">
        <p>Status: {winner ? `${winner.name} wins!` : 'Match ongoing'}</p>
      </div>
    </div>
  );
};

export default MatchCard;
