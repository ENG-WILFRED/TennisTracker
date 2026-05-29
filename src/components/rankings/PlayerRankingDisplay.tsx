/**
 * Player Ranking Display Component
 * 
 * Shows all ranking dimensions with:
 * - Current scores and ranks
 * - Trend indicators
 * - Historical sparklines
 * - Traceability links to source events
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RankingDimension {
  name: string;
  icon: string;
  color: string;
  score: number;
  rank: number | null;
  trend: 'up' | 'down' | 'stable';
  movement: number;
  metadata?: Record<string, any>;
}

interface RankingEvent {
  id: string;
  eventType: string;
  impactedDimensions: string[];
  scoreChange: number;
  reason: string;
  sourceEventId: string;
  timestamp: Date;
}

interface PlayerRankingProps {
  playerId: string;
  organizationId: string;
  rankings?: {
    competitiveRank: {
      score: number;
      rank: number | null;
      trend: 'up' | 'down' | 'stable';
      movement: number;
      matchesWon?: number;
      matchesLost?: number;
      winRate?: number;
    };
    developmentScore: {
      score: number;
      rank: number | null;
      trend: 'up' | 'down' | 'stable';
      movement: number;
      sessionsAttended?: number;
    };
    activityScore: {
      score: number;
      rank: number | null;
      trend: 'up' | 'down' | 'stable';
      movement: number;
      consecutiveDaysActive?: number;
    };
    overallIndex: {
      score: number;
      rank: number | null;
      trend: 'up' | 'down' | 'stable';
      movement: number;
    };
    recentEvents?: RankingEvent[];
  };
}

const RankingCard: React.FC<{ dimension: RankingDimension; onViewDetails: (id: string) => void }> = ({
  dimension,
  onViewDetails,
}) => {
  const trendIcon = dimension.trend === 'up' ? '↑' : dimension.trend === 'down' ? '↓' : '→';
  const trendColor = dimension.trend === 'up' ? 'text-green-600' : dimension.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className={`rounded-lg border-2 p-4 ${dimension.color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{dimension.name}</p>
          <p className="mt-2 text-3xl font-bold">{Math.round(dimension.score)}</p>
          {dimension.rank && <p className="text-sm text-gray-500">Rank #{dimension.rank}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl">{dimension.icon}</p>
          <p className={`mt-2 text-lg font-semibold ${trendColor}`}>
            {trendIcon} {Math.abs(dimension.movement).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
};

const RankingEventCard: React.FC<{ event: RankingEvent; onViewTrace: (eventId: string) => void }> = ({
  event,
  onViewTrace,
}) => {
  const eventEmojis: Record<string, string> = {
    MATCH_COMPLETED: '🎾',
    COACHING_SESSION_ATTENDED: '👨‍🏫',
    BOOKING_COMPLETED: '📅',
    COACH_FEEDBACK_SUBMITTED: '⭐',
    PLAYER_INACTIVITY: '😴',
  };

  return (
    <div className="border-l-4 border-blue-500 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span>{eventEmojis[event.eventType] || '📊'}</span>
            <p className="text-sm font-semibold">{event.reason}</p>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {event.impactedDimensions.join(', ')} • {new Date(event.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className={`font-bold ${event.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {event.scoreChange > 0 ? '+' : ''}{event.scoreChange.toFixed(0)}
          </p>
          <button
            onClick={() => onViewTrace(event.id)}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export const PlayerRankingDisplay: React.FC<PlayerRankingProps> = ({
  playerId,
  organizationId,
  rankings,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  if (!rankings) {
    return (
      <div className="rounded-lg border border-gray-300 p-6 text-center">
        <p className="text-gray-600">Loading rankings...</p>
      </div>
    );
  }

  const dimensions: RankingDimension[] = [
    {
      name: 'Competitive Rank',
      icon: '🏆',
      color: 'border-yellow-400 bg-yellow-50',
      score: rankings.competitiveRank.score,
      rank: rankings.competitiveRank.rank,
      trend: rankings.competitiveRank.trend,
      movement: rankings.competitiveRank.movement,
      metadata: {
        wins: rankings.competitiveRank.matchesWon,
        losses: rankings.competitiveRank.matchesLost,
        winRate: rankings.competitiveRank.winRate,
      },
    },
    {
      name: 'Development Score',
      icon: '📈',
      color: 'border-blue-400 bg-blue-50',
      score: rankings.developmentScore.score,
      rank: rankings.developmentScore.rank,
      trend: rankings.developmentScore.trend,
      movement: rankings.developmentScore.movement,
      metadata: {
        sessions: rankings.developmentScore.sessionsAttended,
      },
    },
    {
      name: 'Activity Score',
      icon: '⚡',
      color: 'border-green-400 bg-green-50',
      score: rankings.activityScore.score,
      rank: rankings.activityScore.rank,
      trend: rankings.activityScore.trend,
      movement: rankings.activityScore.movement,
      metadata: {
        consecutive: rankings.activityScore.consecutiveDaysActive,
      },
    },
    {
      name: 'Overall Index',
      icon: '⭐',
      color: 'border-purple-400 bg-purple-50',
      score: rankings.overallIndex.score,
      rank: rankings.overallIndex.rank,
      trend: rankings.overallIndex.trend,
      movement: rankings.overallIndex.movement,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Ranking Dimensions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dimensions.map(dimension => (
          <RankingCard
            key={dimension.name}
            dimension={dimension}
            onViewDetails={setSelectedEventId}
          />
        ))}
      </div>

      {/* Metadata Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Performance Summary</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {rankings.competitiveRank.matchesWon !== undefined && (
            <>
              <div>
                <p className="text-sm text-gray-600">Matches Won</p>
                <p className="text-xl font-bold">{rankings.competitiveRank.matchesWon}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Matches Lost</p>
                <p className="text-xl font-bold">{rankings.competitiveRank.matchesLost}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-xl font-bold">{rankings.competitiveRank.winRate?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions Attended</p>
                <p className="text-xl font-bold">{rankings.developmentScore.sessionsAttended}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Ranking Events */}
      {rankings.recentEvents && rankings.recentEvents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Ranking Changes</h3>
            <Link
              href={`/player/${playerId}/rankings/history`}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {rankings.recentEvents.slice(0, 5).map(event => (
              <RankingEventCard
                key={event.id}
                event={event}
                onViewTrace={id => {
                  setSelectedEventId(id);
                  setShowEventDetails(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Traceability Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          ℹ️ Each ranking change is traceable back to its source (match, coaching session, booking, or
          rating). Click "View" on any event to see the full details.
        </p>
      </div>

      {/* Event Details Modal Placeholder */}
      {showEventDetails && selectedEventId && (
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <button
            onClick={() => setShowEventDetails(false)}
            className="mb-2 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Close Details
          </button>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Event ID:</strong> {selectedEventId}
            </p>
            <p>
              <strong>Load full event trace here with source details</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankingDisplay;
