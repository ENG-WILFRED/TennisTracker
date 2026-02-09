'use client';
import { useState, useEffect } from 'react';
import { Target, Scale, Dribbble, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Rule {
  label: string;
  value?: string | null;
}

interface RulesData {
  [category: string]: Rule[];
}

export default function TeachingsPage() {
  const [rules, setRules] = useState<RulesData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

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

  const categories = [
    { key: 'Scoring', icon: Target, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { key: 'Basic Rules', icon: Scale, color: 'blue', gradient: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { key: 'Court & Equipment', icon: Dribbble, color: 'amber', gradient: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { key: 'Key Violations', icon: AlertCircle, color: 'rose', gradient: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-screen py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse text-lg text-gray-600">Loading teachings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            Tennis Teachings
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Master Tennis Rules & Scoring
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Learn everything you need to know about tennis rules, scoring systems, court regulations, and key violations to play the game like a pro.
          </p>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map(({ key, icon: Icon, color, gradient, bgColor, borderColor }) => {
            const ruleData = rules[key];
            if (!ruleData || ruleData.length === 0) return null;

            return (
              <div key={key} className={`${bgColor} ${borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{key}</h3>
                
                <div className={`space-y-2 mb-6`}>
                  {ruleData.slice(0, 3).map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${color}-600 mt-1.5 flex-shrink-0`}></div>
                      <p className="text-sm text-slate-700">{rule.label}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/teachings/${key.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`inline-flex items-center gap-2 text-${color}-600 hover:text-${color}-700 font-semibold group`}
                >
                  View More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          {categories.map(({ key, icon: Icon, color, gradient, bgColor, borderColor }) => {
            const ruleData = rules[key];
            if (!ruleData || ruleData.length === 0) return null;

            return (
              <div key={key} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className={`bg-gradient-to-r ${gradient} p-8 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{key}</h2>
                      <p className="text-white/80">Complete guide to {key.toLowerCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {key === 'Scoring' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ruleData.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-lg">{item.label}</p>
                            {item.value && <p className="text-slate-600 mt-1">Represented as: <span className="font-bold">{item.value}</span></p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ruleData.map((rule, idx) => (
                        <div key={idx} className="flex gap-4 p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center flex-shrink-0 font-bold text-${color}-600`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{rule.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-12 text-white shadow-xl">
            <h3 className="text-3xl font-bold mb-4">Ready to Master Tennis?</h3>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Now that you understand the rules and scoring, book a session with one of our expert coaches to improve your game.
            </p>
            {isLoggedIn ? (
              <Link
                href="/coaches"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg"
              >
                Book a Coach
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg"
              >
                Book a Coach
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
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
