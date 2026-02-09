"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { getAllPlayers } from "@/actions/matches";

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactLoadingId, setContactLoadingId] = useState<string | null>(null);

  useEffect(() => {
    getAllPlayers().then(data => {
      setPlayers(data || []);
      setLoading(false);
    });
  }, []);

  const handleContactClick = (player: any) => {
    setContactLoadingId(player.id);
    const playerName = `${player.firstName} ${player.lastName}`.trim();
    router.push(`/contact?type=player&id=${player.id}&name=${encodeURIComponent(playerName)}&email=${encodeURIComponent(player.email || '')}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen py-8 bg-gradient-to-br from-green-50 to-sky-50 w-full px-4">
        <div className="w-full">
          <PageHeader
            title="Players"
            description="Browse club players, view profiles, and challenge them."
            navItems={[{ label: "Dashboard", href: "/dashboard" }]}
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
          title="Players"
          description="Browse club players, view profiles, and challenge them."
          navItems={[{ label: "Dashboard", href: "/dashboard" }]}
        />

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-green-100">
            <div className="text-sm font-medium text-gray-600">Total Players</div>
            <div className="text-3xl font-bold text-green-700 mt-1">{players?.length || 0}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-sky-100">
            <div className="text-sm font-medium text-gray-600">Active Members</div>
            <div className="text-3xl font-bold text-sky-700 mt-1">{players?.length || 0}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-5 border border-green-100">
            <div className="text-sm font-medium text-gray-600">Available to Play</div>
            <div className="text-3xl font-bold text-green-700 mt-1">{players?.length || 0}</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search players by name or email..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm font-medium">
              Search
            </button>
          </div>
        </div>

        {/* Players Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {players && players.length > 0 ? (
            players.map((p: any) => (
              <div 
                key={p.id} 
                className="group bg-white shadow-md hover:shadow-xl rounded-xl p-6 border border-gray-100 hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Player Avatar and Name */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-sky-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {p.firstName?.[0] || "P"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {p.email || p.phone || "No contact"}
                    </p>
                  </div>
                </div>

                {/* Player Stats */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-sky-50 rounded-lg">
                    <div className="text-xs text-gray-600 font-medium">Matches</div>
                    <div className="text-lg font-bold text-green-700 mt-0.5">0</div>
                  </div>
                  <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-sky-50 rounded-lg">
                    <div className="text-xs text-gray-600 font-medium">Wins</div>
                    <div className="text-lg font-bold text-sky-700 mt-0.5">0</div>
                  </div>
                  <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-sky-50 rounded-lg">
                    <div className="text-xs text-gray-600 font-medium">Rating</div>
                    <div className="text-lg font-bold text-green-700 mt-0.5">-</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex gap-2">
                  <Link 
                    href={`/players/${p.id}`}
                    className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm font-medium text-sm"
                  >
                    View Profile
                  </Link>
                  <button 
                    onClick={() => handleContactClick(p)}
                    disabled={contactLoadingId === p.id}
                    className="px-4 py-2.5 border border-sky-300 text-sky-700 rounded-lg hover:bg-sky-50 transition-all font-medium text-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {contactLoadingId === p.id ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Contact</span>
                      </>
                    ) : (
                      'Contact'
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-sky-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No players found</h3>
                <p className="text-gray-500 mb-4">Start by adding players to your club</p>
                <Link 
                  href="/players/new"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}