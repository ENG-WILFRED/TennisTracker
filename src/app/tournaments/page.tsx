'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { getAllTournaments, getTournamentStats } from '@/actions/tournaments';

interface TournamentData {
  id: string;
  name: string;
  description?: string | null;
  eventType: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  location?: string | null;
  prizePool?: number | null;
  entryFee?: number | null;
  registrations: any[];
  bracket?: any;
  matches: any[];
  organizationId: string;
}

interface TournamentStats {
  id: string;
  name: string;
  totalParticipants: number;
  matchesCompleted: number;
  totalMatches: number;
  status: string;
  winner?: {
    firstName: string;
    lastName: string;
  };
  bracketType?: string;
  prizePool?: number;
}

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true);
        const data = await getAllTournaments();
        const statsPromises = data.map((t: TournamentData) => getTournamentStats(t.id));
        const stats = await Promise.all(statsPromises);
        const validStats = stats.filter((s) => s !== null) as TournamentStats[];
        setTournaments(validStats);
      } catch (error) {
        console.error('Error loading tournaments:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'active') return t.status === 'active' || t.status === 'in_progress';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen py-8 bg-gradient-to-br from-green-50 to-sky-50 w-full px-4">
        <div className="w-full">
          <PageHeader
            title="Tournaments"
            description="Browse tournaments, view standings, and track results."
            navItems={[{ label: 'Dashboard', href: '/dashboard' }]}
          />
          <div className="mt-8 flex items-center justify-center">
            <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-green-50 to-sky-50 w-full px-4">
      <div className="w-full">
        <PageHeader
          title="Tournaments"
          description="Browse tournaments, view standings, and track results."
          navItems={[{ label: 'Dashboard', href: '/dashboard' }]}
        />

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-green-100">
            <div className="text-sm font-medium text-gray-600">Total Tournaments</div>
            <div className="text-3xl font-bold text-green-700 mt-1">{tournaments.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-sky-100">
            <div className="text-sm font-medium text-gray-600">Active Tournaments</div>
            <div className="text-3xl font-bold text-sky-700 mt-1">
              {tournaments.filter((t) => t.status === 'active' || t.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-purple-100">
            <div className="text-sm font-medium text-gray-600">Completed Tournaments</div>
            <div className="text-3xl font-bold text-purple-700 mt-1">
              {tournaments.filter((t) => t.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-orange-100">
            <div className="text-sm font-medium text-gray-600">Total Prize Pool</div>
            <div className="text-3xl font-bold text-orange-700 mt-1">
              ${tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-8 flex gap-2 border-b border-gray-200">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-3 font-medium transition-all border-b-2 ${
                filter === tab
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredTournaments.length})
            </button>
          ))}
        </div>

        {/* Tournaments Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTournaments && filteredTournaments.length > 0 ? (
            filteredTournaments.map((tournament: TournamentStats) => (
              <div
                key={tournament.id}
                className="group bg-white shadow-md hover:shadow-xl rounded-xl p-6 border border-gray-100 hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Tournament Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 truncate">{tournament.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {tournament.bracketType ? tournament.bracketType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Tournament'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                    {tournament.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                {/* Tournament Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-green-50 to-sky-50 rounded-lg p-3 border border-green-100">
                    <div className="text-xs font-medium text-gray-600">Participants</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">{tournament.totalParticipants}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                    <div className="text-xs font-medium text-gray-600">Matches</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {tournament.matchesCompleted}/{tournament.totalMatches}
                    </div>
                  </div>
                  {tournament.prizePool && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-100">
                      <div className="text-xs font-medium text-gray-600">Prize Pool</div>
                      <div className="text-2xl font-bold text-yellow-700 mt-1">${tournament.prizePool.toLocaleString()}</div>
                    </div>
                  )}
                  {tournament.winner && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                      <div className="text-xs font-medium text-gray-600">Winner</div>
                      <div className="text-sm font-bold text-purple-700 mt-1">
                        {tournament.winner.firstName} {tournament.winner.lastName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">Progress</span>
                    <span className="text-xs font-bold text-gray-900">
                      {tournament.totalMatches > 0
                        ? `${Math.round((tournament.matchesCompleted / tournament.totalMatches) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: tournament.totalMatches > 0 ? `${(tournament.matchesCompleted / tournament.totalMatches) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm font-medium text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/tournaments/${tournament.id}/bracket`}
                    className="px-4 py-2.5 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all font-medium text-sm"
                  >
                    Bracket
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-sky-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No tournaments found</h3>
                <p className="text-gray-500 mb-4">Start by creating a tournament</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
