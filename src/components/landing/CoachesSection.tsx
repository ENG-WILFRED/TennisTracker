'use client';
import { useEffect, useState } from 'react';
import { Users, Award, Star, ArrowRight, Mail, Loader } from 'lucide-react';

interface Coach {
  id: string;
  name: string;
  role: string;
  expertise: string;
  photo: string;
  studentCount: number;
}

export default function CoachesSection() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCoachId, setLoadingCoachId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoaches() {
      try {
        setLoading(true);
        const res = await fetch('/api/coaches');
        
        if (!res.ok) {
          setCoaches([]);
          return;
        }
        const data = await res.json();
        setCoaches(data || []);
      } catch (err) {
        console.error('Failed to fetch coaches:', err);
        setCoaches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCoaches();
  }, []);

  return (
    <section id="coaches" className="w-full py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Professional Coaching Staff
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Meet Our Expert Coaches
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl">
              Learn from certified professionals with years of experience and proven track records
            </p>
          </div>
          <a 
            href="/coaches" 
            className="group px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            View All Coaches
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-lg text-slate-600 mt-4">Loading coaches...</p>
          </div>
        ) : (!coaches || coaches.length === 0) ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg text-slate-600">No coaches available yet.</p>
            <p className="text-sm text-slate-500 mt-2">Seed the database or add a coach to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.slice(0, 3).map((coach, index) => (
              <div 
                key={coach.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200"
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Profile Photo - Top Left */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={coach.photo ?? '/images/coach-placeholder.jpg'}
                          alt={coach.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {/* Top Coach Badge */}
                      <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5 shadow-md">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    
                    {/* Name & Role */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {coach.name}
                      </h3>
                      <p className="text-emerald-600 font-semibold text-sm">
                        {coach.role}
                      </p>
                    </div>
                  </div>

                  {/* Expertise */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Expertise</p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {coach.expertise ?? 'General Coaching'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-slate-600">Students</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">
                        {coach.studentCount || 0}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-slate-600">Rating</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">4.9</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <a 
                    href={`/coaches/${coach.id}`} 
                    onClick={() => setLoadingCoachId(coach.id)}
                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {loadingCoachId === coach.id ? (
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
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center" title="5+ Years Experience">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center" title="Certified Professional">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center" title="Top Rated">
                    <Users className="w-4 h-4 text-emerald-600" />
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