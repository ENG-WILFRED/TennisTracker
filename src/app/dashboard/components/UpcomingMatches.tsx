import React, { JSX } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function UpcomingMatches({ upcomingMatches }: { upcomingMatches: any[] }) {
  const router = useRouter();

  // Calculate time until match
  const getTimeUntilMatch = (scheduledAt: string) => {
    if (!scheduledAt) return null;
    const now = new Date();
    const matchTime = new Date(scheduledAt);
    const diffMs = matchTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return { text: 'Past due', urgent: true };
    if (diffHours < 2) return { text: `In ${diffHours}h`, urgent: true };
    if (diffHours < 24) return { text: `In ${diffHours}h`, urgent: false };
    if (diffDays < 7) return { text: `In ${diffDays}d`, urgent: false };
    return { text: `${diffDays} days`, urgent: false };
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      player: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
        )
      },
      referee: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        )
      },
      'ball crew': {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        )
      }
    };

    const roleKey = role?.toLowerCase() || 'player';
    const config = roleMap[roleKey] || roleMap.player;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.icon}
        {role}
      </span>
    );
  };

  return (
    <div className="w-full mt-4 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Upcoming Matches</h2>
              <p className="text-green-100 text-xs">
                {upcomingMatches?.length || 0} {upcomingMatches?.length === 1 ? 'match' : 'matches'} scheduled
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/matches')}
            className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-semibold shadow-md"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View All
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {(!upcomingMatches || upcomingMatches.length === 0) ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-5 shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-gray-800 font-bold text-lg mb-2">No Upcoming Matches</h4>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              You don't have any matches scheduled at the moment. Check back later or schedule a new match.
            </p>
            <Button 
              onClick={() => router.push('/matches/schedule')} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Match
              </span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {upcomingMatches.map((match: any) => {
              const timeInfo = getTimeUntilMatch(match.scheduledAt);
              const isUrgent = timeInfo?.urgent;
              
              return (
                <div 
                  key={match.id}
                  className={`group relative rounded-xl p-5 border-2 transition-all duration-200 ${
                    isUrgent 
                      ? 'bg-gradient-to-br from-orange-50 via-white to-red-50 border-orange-300 hover:border-orange-400 hover:shadow-xl' 
                      : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-green-300 hover:shadow-lg'
                  }`}
                >
                  {/* Urgent Badge */}
                  {isUrgent && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {timeInfo.text}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-5">
                    {/* Opponent Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg ring-4 ring-white group-hover:ring-green-100 transition-all">
                        <span className="text-xl font-bold">
                          {match.opponent?.firstName?.[0]}{match.opponent?.lastName?.[0]}
                        </span>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex-1 min-w-0">
                      {/* Top Section */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-green-600 transition-colors">
                            {match.opponent?.firstName} {match.opponent?.lastName}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            @{match.opponent?.username}
                          </p>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {getRoleBadge(match.role)}
                            {match.round && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {match.round}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time Display */}
                        {!isUrgent && timeInfo && (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-600">
                              {timeInfo.text}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          {match.scheduledAt ? (
                            <>
                              <div className="font-semibold text-gray-900 text-sm">
                                {new Date(match.scheduledAt).toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  month: 'long', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(match.scheduledAt).toLocaleTimeString('en-US', { 
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-semibold text-gray-500">
                              Time to be determined
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button 
                          onClick={() => router.push(`/matches/${match.id}`)}
                          className="flex-1 min-w-[120px] bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Details
                          </span>
                        </Button>
                        <Button 
                          onClick={() => router.push(`/matches/${match.id}/sync`)}
                          variant="outline"
                          className="flex-1 min-w-[120px] border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Sync Calendar
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info (Location if available) */}
                  {match.location && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{match.location}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">
                {upcomingMatches.filter(m => m.role?.toLowerCase() === 'player').length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">As Player</div>
            </div>
            <div className="border-x border-gray-200">
              <div className="text-xl font-bold text-gray-900">
                {upcomingMatches.filter(m => m.role?.toLowerCase() === 'referee').length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">As Referee</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {upcomingMatches.filter(m => m.scheduledAt && getTimeUntilMatch(m.scheduledAt)?.urgent).length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Coming Soon</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}