import React from 'react';
import { Player } from '../../types/player';

interface PlayerCardProps {
  player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-4">
      <img src={player.photo} alt={player.name} className="w-20 h-20 rounded-full object-cover" />
      <div>
        <h2 className="text-lg font-semibold">{player.name}</h2>
        <p className="text-sm text-gray-600">
          Matches Played: {player.matches_played} <br />
          Matches Refereed: {player.matches_refereed} <br />
          Matches as Ball Crew: {player.matches_ball_crew}
        </p>
      </div>
    </div>
  );
};

export default PlayerCard;
