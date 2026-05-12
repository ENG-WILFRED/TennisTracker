'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, Award, Target } from 'lucide-react';

interface PlayerProgressData {
  player: {
    id: string;
    name: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
  };
  stats: {
    totalCompletedSessions: number;
    totalRatedSessions: number;
    averageRating: string;
    averageTechniqueRating: string;
    averageMentalRating: string;
    averageFitnessRating: string;
    averageTeamworkRating: string;
  };
  trend: {
    last3MonthsAverage: string | null;
    totalRatingsInLast3Months: number;
    improvement: string | null;
  };
}

interface PlayerProgressProps {
  playerId: string;
  isEmbedded?: boolean;
}

const G = {
  page: '#081107',
  card: '#0f1f0f',
  cardSoft: '#152515',
  cardBorder: '#243e24',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  accent: '#79bf3e',
  accentSoft: '#79bf3e22',
  warning: '#f0c040',
  success: '#7dc142',
};

const StatCard = ({
  label,
  value,
  unit,
  icon: Icon,
  color = G.accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ className: string; style: any }>;
  color?: string;
}) => (
  <div
    style={{
      background: G.cardSoft,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}
  >
    {Icon && (
      <Icon
        className="h-6 w-6 flex-shrink-0"
        style={{ color }}
      />
    )}
    <div>
      <div style={{ fontSize: '12px', color: G.muted, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: color,
          marginTop: '4px',
        }}
      >
        {value} {unit}
      </div>
    </div>
  </div>
);

const RatingBar = ({
  label,
  rating,
  color = G.accent,
}: {
  label: string;
  rating: string | number;
  color?: string;
}) => {
  const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating;
  const percentage = (ratingNum / 5) * 100;

  return (
    <div className="mb-4">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '12px',
        }}
      >
        <span style={{ color: G.text }}>{label}</span>
        <span style={{ color, fontWeight: 'bold' }}>
          {ratingNum.toFixed(1)}/5
        </span>
      </div>
      <div
        style={{
          height: '6px',
          background: G.cardSoft,
          borderRadius: '3px',
          overflow: 'hidden',
          border: `1px solid ${G.cardBorder}`,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export const PlayerProgress: React.FC<PlayerProgressProps> = ({
  playerId,
  isEmbedded = false,
}) => {
  const [data, setData] = useState<PlayerProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!playerId) {
        setError('Player ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/players/${playerId}/progress`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch player progress');
        }

        const progressData = await response.json();
        setData(progressData);
        setError(null);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load progress data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [playerId]);

  if (loading) {
    return (
      <div style={{ padding: isEmbedded ? '0' : '20px' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[#243e24] rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-[#243e24] rounded-lg" />
            <div className="h-24 bg-[#243e24] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: '20px',
          background: G.cardSoft,
          borderRadius: '12px',
          border: `1px solid ${G.cardBorder}`,
          textAlign: 'center',
          color: G.muted,
        }}
      >
        <p>{error || 'Unable to load progress data'}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: isEmbedded ? 'transparent' : G.page,
        padding: isEmbedded ? '0' : '20px',
        borderRadius: isEmbedded ? '0' : '12px',
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <TrendingUp className="h-6 w-6" style={{ color: G.accent }} />
          Training Progress
        </h2>
        <p className="text-sm text-[#a8d84e]">
          Track improvements based on coach ratings
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <StatCard
          label="Completed Sessions"
          value={data.stats.totalCompletedSessions}
          icon={Award}
        />
        <StatCard
          label="Rated Sessions"
          value={data.stats.totalRatedSessions}
          icon={BarChart3}
          color={G.warning}
        />
        <StatCard
          label="Average Rating"
          value={data.stats.averageRating}
          unit="/5"
          icon={Target}
          color={G.success}
        />
        <StatCard
          label="3-Month Avg"
          value={data.trend.last3MonthsAverage || '—'}
          unit={data.trend.last3MonthsAverage ? '/5' : ''}
          color={G.accent}
        />
      </div>

      {/* Performance Breakdown */}
      <div
        style={{
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h3 className="text-lg font-bold text-white mb-4">
          Performance Breakdown
        </h3>

        <RatingBar
          label="Overall Performance"
          rating={data.stats.averageRating}
          color={G.accent}
        />
        <RatingBar
          label="Technique & Skills"
          rating={data.stats.averageTechniqueRating}
          color={G.warning}
        />
        <RatingBar
          label="Mental Toughness"
          rating={data.stats.averageMentalRating}
          color={G.success}
        />
        <RatingBar
          label="Fitness & Stamina"
          rating={data.stats.averageFitnessRating}
          color={G.accent}
        />
        <RatingBar
          label="Teamwork & Attitude"
          rating={data.stats.averageTeamworkRating}
          color={G.warning}
        />
      </div>

      {/* Trend Analysis */}
      {data.trend.last3MonthsAverage && (
        <div
          style={{
            background: G.accentSoft,
            border: `1px solid ${G.accent}40`,
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3 className="text-sm font-bold text-white mb-3">
            Recent Progress
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div style={{ fontSize: '12px', color: G.muted, marginBottom: '4px' }}>
                3-Month Average
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: G.accent,
                }}
              >
                {data.trend.last3MonthsAverage}/5
              </div>
            </div>
            {data.trend.improvement && (
              <div>
                <div style={{ fontSize: '12px', color: G.muted, marginBottom: '4px' }}>
                  Improvement
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color:
                      parseFloat(data.trend.improvement) > 0
                        ? G.success
                        : parseFloat(data.trend.improvement) < 0
                        ? '#ff6b6b'
                        : G.muted,
                  }}
                >
                  {parseFloat(data.trend.improvement) > 0 ? '+' : ''}
                  {data.trend.improvement}
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: G.muted, marginTop: '10px' }}>
            Based on {data.trend.totalRatingsInLast3Months} sessions in the last 3 months
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.stats.totalRatedSessions === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: G.cardSoft,
            borderRadius: '12px',
            border: `1px solid ${G.cardBorder}`,
          }}
        >
          <Target className="mx-auto mb-4 h-10 w-10" style={{ color: G.muted }} />
          <p style={{ color: G.muted, fontSize: '14px' }}>
            No ratings yet. Complete sessions with your coach to start tracking progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerProgress;
