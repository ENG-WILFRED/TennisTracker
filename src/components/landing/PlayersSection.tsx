'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Player {
  id: string;
  name: string;
  username: string;
  wins: number;
  matchesPlayed: number;
  level: string;
  img: string;
}

export default function PlayersSection() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section id="players" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Featured Players</h2>
            <p className="text-xl text-gray-600">Browse active players and track their journey to excellence</p>
          </div>
          <Link href="/players" className="mt-6 md:mt-0 group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg flex items-center gap-2">
            View All Players
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-12">
              <p className="text-lg text-gray-700">Loading players...</p>
            </div>
          ) : !players || players.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-12">
              <p className="text-lg text-gray-700">No players available yet. Seed the database to see players here.</p>
            </div>
          ) : (
            players.map((player) => (
              <div key={player.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={player.img} 
                    alt={player.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 inline-block">
                      {player.level}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{player.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Match Record</div>
                    <div className="text-2xl font-bold text-green-600">{player.wins}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full py-2 text-green-600 font-semibold hover:bg-green-50 rounded-lg transition-colors">
                      View Profile →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
