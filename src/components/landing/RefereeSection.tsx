'use client';
import { useEffect, useState } from 'react';
import { Users, Award, Star, ArrowRight, Loader, Gavel } from 'lucide-react';

interface Referee {
  id: string;
  firstName: string;
  lastName: string;
  photo: string;
  nationality: string;
  bio: string;
  matchesRefereed: number;
  ballCrewMatches: number;
  experience: string;
  certifications: string[];
}

export default function RefereeSection() {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRefereeId, setLoadingRefereeId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReferees() {
      try {
        setLoading(true);
        const res = await fetch('/api/referees');
        
        if (!res.ok) {
          setReferees([]);
          return;
        }
        const data = await res.json();
        setReferees(data || []);
      } catch (err) {
        console.error('Failed to fetch referees:', err);
        setReferees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReferees();
  }, []);

  return (
    <section id="referees" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Gavel className="w-4 h-4" />
              Official Referees
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Meet Our Referees & Ball Crew
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl">
              Certified professionals ensuring fair play and smooth match operations
            </p>
          </div>
          <a 
            href="/referees" 
            className="group px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            View All Referees
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Referees Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="text-lg text-slate-600 mt-4">Loading referees...</p>
          </div>
        ) : (!referees || referees.length === 0) ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg text-slate-600">No referees available yet.</p>
            <p className="text-sm text-slate-500 mt-2">Seed the database or add a referee to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {referees.slice(0, 3).map((referee) => (
              <div 
                key={referee.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200"
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Profile Photo & Basic Info */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={referee.photo ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'}
                          alt={`${referee.firstName} ${referee.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {/* Referee Badge */}
                      <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5 shadow-md">
                        <Gavel className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    {/* Name & Origin */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {referee.firstName} {referee.lastName}
                      </h3>
                      <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <span>🌍</span>
                        {referee.nationality || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                      {referee.bio || 'Experienced referee'}
                    </p>
                  </div>

                  {/* Experience & Certifications */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Experience</p>
                        <p className="text-sm text-slate-700">{referee.experience || '5+ years'}</p>
                      </div>
                    </div>
                    {referee.certifications && referee.certifications.length > 0 && (
                      <div className="pt-3 border-t border-green-100">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-1">
                          {referee.certifications.slice(0, 2).map((cert, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-green-700 font-semibold border border-green-200">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Gavel className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-slate-600">Matches Ref'd</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {referee.matchesRefereed || 0}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-semibold text-slate-600">Ball Crew</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {referee.ballCrewMatches || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <a 
                    href={`/referees/${referee.id}`}
                    onClick={() => setLoadingRefereeId(referee.id)}
                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {loadingRefereeId === referee.id ? (
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
                  </a>
                </div>

                {/* Achievement Badges */}
                <div className="px-6 pb-6 flex gap-2 justify-center border-t border-slate-100 pt-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center" title="Official Referee">
                    <Gavel className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center" title="Certified">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center" title="Experienced">
                    <Star className="w-4 h-4 text-rose-600" />
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
