'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Rule {
  label: string;
  value?: string | null;
}

interface RulesData {
  [category: string]: Rule[];
}

const categoryInfo: Record<string, { icon: string; gradient: string; description: string }> = {
  'scoring': {
    icon: '🎯',
    gradient: 'from-emerald-500 to-teal-600',
    description: 'Understand the point system, game scoring, set counting, and match structure in professional tennis.'
  },
  'basic-rules': {
    icon: '⚖️',
    gradient: 'from-blue-500 to-cyan-600',
    description: 'Learn the fundamental rules that govern how tennis is played, from serving to point completion.'
  },
  'court-and-equipment': {
    icon: '🏐',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Master the court dimensions, equipment specifications, and technical requirements for official play.'
  },
  'key-violations': {
    icon: '⚡',
    gradient: 'from-rose-500 to-pink-600',
    description: 'Discover the rules you must avoid breaking to keep the game flowing and maintain fair play.'
  },
};

export default function TeachingDetailPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [rules, setRules] = useState<RulesData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const categoryKey = categorySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch('/api/rules');
        if (!response.ok) throw new Error('Failed to fetch rules');
        const data: RulesData = await response.json();
        setRules(data);
      } catch (error) {
        console.error('Error fetching rules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const categoryData = rules[categoryKey] || [];
  const info = categoryInfo[categorySlug] || { icon: '📚', gradient: 'from-slate-500 to-slate-600', description: 'Tennis teachings' };

  return (
    <div className="w-full min-h-screen py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Teachings
        </Link>

        {/* Header */}
        <div className={`bg-gradient-to-r ${info.gradient} rounded-3xl p-12 text-white mb-12 shadow-xl`}>
          <div className="flex items-center gap-6 mb-6">
            <div className="text-6xl">{info.icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold">{categoryKey}</h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl">{info.description}</p>
        </div>

        {/* Content */}
        {categoryData.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <p className="text-xl text-slate-600">No data available for this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoryKey === 'Scoring' ? (
              // Scoring items with special layout
              categoryData.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-slate-200 group"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {item.label}
                      </h3>
                      {item.value && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-slate-600">Represented as:</span>
                          <span className="text-2xl font-bold text-emerald-600">{item.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Other categories list
              categoryData.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200 flex gap-6 group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.label}
                    </h3>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-8 text-white text-center shadow-xl">
          <h3 className="text-2xl font-bold mb-3">Want to improve faster?</h3>
          <p className="text-white/90 mb-6">Book a session with an expert coach who can teach you proper technique and strategy.</p>
          {isLoggedIn ? (
            <Link
              href="/coaches"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg"
            >
              Find a Coach
            </Link>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg"
            >
              Find a Coach
            </button>
          )}
        </div>

        {/* Login Modal */}
        {showLoginModal && !isLoggedIn && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowLoginModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600">Sign in to book a coaching session and start your tennis journey</p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-gray-600 text-center">
                    Creating an account is free and takes less than 2 minutes. You'll have access to:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Book sessions with expert coaches
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Track your progress and statistics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Compete in tournaments
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-center"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
