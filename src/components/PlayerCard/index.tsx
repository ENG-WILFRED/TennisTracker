import React from 'react';
interface PlayerCardProps {
  player: any;
}

const G = {
  card: '#1a3020',
  cardBorder: '#2d5a35',
  dark: '#0f1f0f',
  primary: '#7dc142',
  primaryHover: '#a8d84e',
  text: '#d8e8b6',
  muted: '#7aaa6a',
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <div
      style={{
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 10,
        padding: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        color: G.text,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: player.photo ? `url(${player.photo}) center/cover` : G.dark,
          border: `2px solid ${G.primary}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: G.primaryHover,
        }}
      >
        {!player.photo && `${player.firstName?.charAt(0) || ''}${player.lastName?.charAt(0) || ''}`}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{player.firstName} {player.lastName}</div>
        <div style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>@{player.username} • {player.email}</div>

        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: G.muted }}>Matches</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: G.primary }}>{(player as any).matchesPlayed ?? (player as any).matches_played ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: G.muted }}>Won</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: G.primaryHover }}>{(player as any).matchesWon ?? (player as any).matches_won ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: G.muted }}>Win Rate</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: G.primary }}>{typeof (player as any).winRate === 'number' ? ((player as any).winRate).toFixed(1) + '%' : (player as any).winRate ?? '0%'} </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
