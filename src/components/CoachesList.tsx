"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function CoachesPanel({ coaches, isDashboard = false }: { coaches: any[], isDashboard?: boolean }) {
  const router = useRouter();
  const list = (coaches && coaches.length > 0) ? coaches : [];

  // Calculate stats
  const totalCoaches = list.length;
  const specializations = [...new Set(list.map(c => c.expertise).filter(Boolean))];
  const displayedCoaches = isDashboard ? list.slice(0, 3) : list;

  let auth;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false } as any;
  }
  const { isLoggedIn } = auth;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 px-6 py-5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-2 ring-white/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-green-50 text-sm font-medium">
                  {totalCoaches} {totalCoaches === 1 ? 'coach' : 'coaches'} available
                </p>
                {specializations.length > 0 && (
                  <>
                    <span className="text-green-200">•</span>
                    <p className="text-green-50 text-sm">
                      {specializations.length} {specializations.length === 1 ? 'specialty' : 'specialties'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          {isLoggedIn && (
            <Button 
              onClick={() => router.push('/register-coach')} 
              className="bg-white text-green-600 hover:bg-green-50 hover:scale-105 px-5 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Employ Coach
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {(!list || list.length === 0) ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-5 shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="text-gray-800 font-bold text-lg mb-2">No Coaches Yet</h4>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Employ a coach to get professional training assistance and take your tennis game to the next level.
            </p>
            <Button 
              onClick={() => router.push('/register-coach')} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Coach
              </span>
            </Button>
          </div>
        ) : (
          <div className={`${isDashboard ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
            {displayedCoaches.map((c: any, index: number) => {
              const isTopCoach = index < 3;
              const [isContactLoading, setIsContactLoading] = useState(false);
              
              const handleContactClick = () => {
                setIsContactLoading(true);
                const coachName = `${c.firstName || c.name?.split(' ')[0] || c.name} ${c.lastName || c.name?.split(' ').slice(1).join(' ') || ''}`.trim();
                router.push(`/contact?type=coach&id=${c.id}&name=${encodeURIComponent(coachName)}`);
              };
              
              return (
                <div 
                  key={c.id}
                  className={`group relative rounded-xl p-5 border-2 transition-all duration-200 ${
                    isTopCoach 
                      ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200 hover:border-green-400 hover:shadow-xl' 
                      : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-lg'
                  }`}
                >
                  {/* Top Coach Ribbon */}
                  {isTopCoach && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Top {index + 1}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-5">
                    {/* Avatar with Status Indicator */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg ring-4 ring-white group-hover:ring-green-100 transition-all">
                        {c.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photo} alt={c.name} className="w-16 h-16 object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {c.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Online Status (optional) */}
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 border-3 border-white rounded-full shadow-sm" title="Available" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-xl group-hover:text-green-600 transition-colors mb-1">
                            {c.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                              </svg>
                              {c.role}
                            </span>
                            {c.expertise && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                                {c.expertise}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info (optional) */}
                      {(c.yearsExperience || c.rating) && (
                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                          {c.yearsExperience && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {c.yearsExperience}+ years
                            </div>
                          )}
                          {c.rating && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {c.rating}/5.0
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                            {isLoggedIn ? (
                              <button
                                onClick={handleContactClick}
                                disabled={isContactLoading}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                              >
                                {isContactLoading ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Redirecting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Contact
                                  </>
                                )}
                              </button>
                            ) : (
                              <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all">Login to Contact</a>
                            )}
                        <button
                          onClick={() => router.push(`/coaches/${c.id}`)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border-2 border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 hover:border-green-400 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show More Section */}
            {!isDashboard && list.length > 6 && (
              <div className="text-center pt-4 col-span-full">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-200 text-blue-700 font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            )}

            {isDashboard && list.length > 3 && (
              <div className="text-center pt-4">
                <button 
                  onClick={() => router.push('/coaches')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-200 text-gray-700 font-semibold hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all group"
                >
                  View all {list.length} coaches
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer (optional) */}
      {list.length > 0 && specializations.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Specializations:</span>
            {specializations.slice(0, 4).map((spec, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600"
              >
                {spec}
              </span>
            ))}
            {specializations.length > 4 && (
              <span className="text-xs text-gray-500">
                +{specializations.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}