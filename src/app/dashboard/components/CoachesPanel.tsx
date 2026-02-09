import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function CoachesPanel({ coaches }: { coaches: any[] }) {
  const router = useRouter();
  const list = (coaches && coaches.length > 0) ? coaches : [];
  let auth;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false } as any;
  }
  const { isLoggedIn, playerId } = auth;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Coaching Staff</h3>
              <p className="text-green-100 text-xs">{list.length} {list.length === 1 ? 'coach' : 'coaches'} available</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/register-coach')} 
            className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-semibold shadow-md"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Employ Coach
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {(!list || list.length === 0) ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="text-gray-700 font-semibold mb-2">No Coaches Yet</h4>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              Employ a coach to get professional training assistance and improve your game.
            </p>
            <Button 
              onClick={() => router.push('/register-coach')} 
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Add Your First Coach
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.slice(0, 6).map((c: any, index: number) => (
              <div 
                key={c.id}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">
                        {c.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors">
                          {c.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                            </svg>
                            {c.role}
                          </span>
                          {c.expertise && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                              {c.expertise}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Position Badge (optional) */}
                      {index < 3 && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">★</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Button */}
                    <div className="flex items-center gap-2 mt-3">
                        {isLoggedIn ? (
                          <button
                            onClick={() => router.push(`/contact?to=${encodeURIComponent(c.contact || '')}&title=${encodeURIComponent('Contact ' + c.name)}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 hover:border-green-300 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Coach
                          </button>
                        ) : (
                          <a href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 hover:border-green-300 transition-all">Login to Contact</a>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Show More Link */}
            {list.length > 6 && (
              <div className="text-center pt-2">
                <button 
                  onClick={() => router.push('/coaches')}
                  className="text-green-600 hover:text-green-700 font-semibold text-sm inline-flex items-center gap-1 group"
                >
                  View all {list.length} coaches
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}