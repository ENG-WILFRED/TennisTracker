'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Trophy, Globe, ArrowRight, Loader, TrendingUp } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  username: string;
  matchesWon: number;
  matchesPlayed: number;
  nationality: string;
  bio: string;
  photo: string;
}

export default function PlayersSection() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        const res = await fetch('/api/players');
        
        if (!res.ok) {
          setPlayers([]);
          return;
        }
        const data = await res.json();
        setPlayers(data || []);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const getWinRate = (wins: number, played: number) => {
    if (played === 0) return 0;
    return Math.round((wins / played) * 100);
  };

  return (
    <section id="players" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Trophy className="w-4 h-4" />
              Elite Players
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Featured Players
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl">
              Discover talented players from around the world and track their journey to excellence
            </p>
          </div>
          <Link 
            href="/players" 
            className="group px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            View All Players
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="text-lg text-slate-600 mt-4">Loading players...</p>
          </div>
        ) : (!players || players.length === 0) ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg text-slate-600">No players available yet.</p>
            <p className="text-sm text-slate-500 mt-2">Seed the database to see players here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.slice(0, 3).map((player) => (
              <div 
                key={player.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200"
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Profile Photo & Basic Info */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={player.photo ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'}
                          alt={player.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {/* Top Player Badge */}
                      <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5 shadow-md">
                        <Trophy className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    
                    {/* Name & Origin */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <Globe className="w-3.5 h-3.5" />
                        {player.nationality || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                      {player.bio || 'Passionate tennis player'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-slate-600">Wins</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {player.matchesWon || 0}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-slate-600">Win Rate</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {getWinRate(player.matchesWon || 0, player.matchesPlayed || 0)}%
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Matches Played</p>
                    <p className="text-lg font-bold text-slate-900">{player.matchesPlayed || 0}</p>
                  </div>

                  {/* Action Button */}
                  <Link 
                    href={`/players/${player.id}`}
                    onClick={() => setLoadingPlayerId(player.id)}
                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {loadingPlayerId === player.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        View Profile
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Link>
                </div>

                {/* Achievement Badges */}
                <div className="px-6 pb-6 flex gap-2 justify-center border-t border-slate-100 pt-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center" title="Active Player">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center" title="Matches Played">
                    <Trophy className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center" title="International">
                    <Globe className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
