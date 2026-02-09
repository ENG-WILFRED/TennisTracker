'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Target, Scale, Dribbble, AlertCircle, ChevronLeft, ChevronRight, ArrowRight, Loader } from 'lucide-react';

interface Rule {
  label: string;
  value?: string | null;
}

interface RulesData {
  [category: string]: Rule[];
}

export default function RulesSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rules, setRules] = useState<RulesData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const tennisImages = [
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
    'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=800&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80',
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % tennisImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % tennisImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + tennisImages.length) % tennisImages.length);
  };

  const categories = [
    { key: 'Scoring', icon: Target, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-100', dotColor: 'bg-emerald-600', textColor: 'text-emerald-600' },
    { key: 'Basic Rules', icon: Scale, color: 'blue', gradient: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-600', textColor: 'text-blue-600' },
    { key: 'Court & Equipment', icon: Dribbble, color: 'amber', gradient: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-100', dotColor: 'bg-amber-600', textColor: 'text-amber-600' },
    { key: 'Key Violations', icon: AlertCircle, color: 'rose', gradient: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-100', dotColor: 'bg-rose-600', textColor: 'text-rose-600' },
  ];

  if (isLoading) {
    return (
      <section id="rules" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">Loading rules...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="rules" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            Tennis Fundamentals
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Master the Game
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
            Everything you need to know to play tennis like a professional
          </p>
          <button
            onClick={() => {
              setIsNavigating(true);
              router.push('/teachings');
            }}
            disabled={isNavigating}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg group"
          >
            {isNavigating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                View Full Teachings
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Side - Rules in 2x2 Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            {categories.map(({ key, icon: Icon, gradient, bgColor, dotColor, textColor }) => {
              const ruleData = rules[key];
              if (!ruleData || ruleData.length === 0) return null;

              return (
                <div
                  key={key}
                  className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200"
                >
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{key}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {key === 'Scoring' ? (
                      <div className="space-y-2">
                        {ruleData.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <span className="font-medium text-slate-700 text-sm">{item.label}</span>
                            <span className={`${textColor} font-bold`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {ruleData.map((rule, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                            </div>
                            <span className="text-slate-700 text-sm leading-snug">{rule.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                </div>
                
              );
              
            })}
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-white">
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    Professional Tennis in Action
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Study professional techniques and match dynamics
                  </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 border-t border-slate-200">
                  <div className="p-3 text-center border-r border-slate-200">
                    <div className="text-xl font-bold text-emerald-600">78</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Length (ft)</div>
                  </div>
                  <div className="p-3 text-center border-r border-slate-200">
                    <div className="text-xl font-bold text-blue-600">27</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Width (ft)</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-xl font-bold text-amber-600">3.5</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Net (ft)</div>
                  </div>
                </div>
          </div>

          {/* Right Side - Carousel (spans full height) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                {/* Image Container - Increased height */}
                <div className="relative h-[700px] overflow-hidden bg-slate-900">
                  {tennisImages.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Tennis action ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        idx === currentImageIndex
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-105'
                      }`}
                    />
                  ))}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg hover:scale-110 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg hover:scale-110 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                    {currentImageIndex + 1} / {tennisImages.length}
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {tennisImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? 'bg-white w-8'
                            : 'bg-white/40 hover:bg-white/70 w-1.5'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}