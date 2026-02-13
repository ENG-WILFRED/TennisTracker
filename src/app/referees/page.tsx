'use client';
import { useEffect, useState } from 'react';
import { Gavel, Award, Users, Globe, TrendingUp, ArrowLeft, Star, Trophy, Shield, Loader, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

export default function RefereesPage() {
    const [referees, setReferees] = useState<Referee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'referees' | 'ballcrew'>('all');
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

    const filteredReferees = referees.filter((ref) => {
        if (filter === 'referees') return ref.matchesRefereed > 0;
        if (filter === 'ballcrew') return ref.ballCrewMatches > 0;
        return true;
    });

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-rose-300 rounded-full blur-3xl opacity-10"></div>
            </div>

            <div className="relative w-full mx-auto py-12 px-4">
                {/* Header */}
                <div className="mb-12">
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-pink-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                                    <Gavel className="w-5 h-5" />
                                    Official Referees & Ball Crew
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-700 bg-clip-text text-transparent mb-4 leading-tight">
                                    Referees & Ball Crew
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-700 font-medium">
                                    Meet the certified professionals ensuring fair play and smooth match operations
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="flex gap-4">
                                <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white rounded-2xl p-6 shadow-xl min-w-[120px]">
                                    <Trophy className="w-8 h-8 mb-2" />
                                    <p className="text-3xl font-black">{referees.length}</p>
                                    <p className="text-sm font-semibold opacity-90">Total Staff</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    {/* Section anchors for referee-specific header navigation */}
                    <div id="overview" />
                    <div id="matches" />
                    <div id="ballcrew" />
                    <div id="stats" />

                {/* Filter Tabs */}
                <div className="mb-8 flex gap-4 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 ${filter === 'all'
                                ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-2xl shadow-pink-300/50'
                                : 'bg-white/80 backdrop-blur text-slate-700 border-2 border-pink-200 hover:border-pink-400 shadow-lg'
                            }`}
                    >
                        <Shield className="w-5 h-5 inline mr-2" />
                        All Staff ({referees.length})
                    </button>
                    <button
                        onClick={() => setFilter('referees')}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 ${filter === 'referees'
                                ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-2xl shadow-pink-300/50'
                                : 'bg-white/80 backdrop-blur text-slate-700 border-2 border-pink-200 hover:border-pink-400 shadow-lg'
                            }`}
                    >
                        <Gavel className="w-5 h-5 inline mr-2" />
                        Referees
                    </button>
                    <button
                        onClick={() => setFilter('ballcrew')}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 ${filter === 'ballcrew'
                                ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-2xl shadow-pink-300/50'
                                : 'bg-white/80 backdrop-blur text-slate-700 border-2 border-pink-200 hover:border-pink-400 shadow-lg'
                            }`}
                    >
                        <Users className="w-5 h-5 inline mr-2" />
                        Ball Crew
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-24">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent shadow-lg"></div>
                        <p className="text-xl text-slate-700 mt-6 font-semibold">Loading referees...</p>
                    </div>
                ) : filteredReferees.length === 0 ? (
                    <div className="text-center py-24 bg-white/70 backdrop-blur-xl rounded-3xl border-2 border-dashed border-pink-300 shadow-xl">
                        <Gavel className="w-20 h-20 text-pink-400 mx-auto mb-6" />
                        <p className="text-2xl text-slate-700 font-bold">No referees found</p>
                        <p className="text-lg text-slate-500 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredReferees.map((referee) => (
                            <div
                                key={referee.id}
                                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-pink-200 group hover:border-pink-400 transform hover:-translate-y-2"
                            >
                                {/* Top Section with Photo */}
                                <div className="relative h-48 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-600 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-fuchsia-600/30 mix-blend-overlay"></div>
                                    <img
                                        src={referee.photo ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80'}
                                        alt={`${referee.firstName} ${referee.lastName}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                                    {/* Floating Badge */}
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-pink-600 fill-pink-600" />
                                            <span className="text-xs font-bold text-pink-600">Certified</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Name & Role */}
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        {referee.firstName} {referee.lastName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-pink-600 font-bold text-sm mb-4 bg-pink-50 rounded-full px-3 py-1 inline-flex">
                                        <Globe className="w-4 h-4" />
                                        {referee.nationality || 'Unknown'}
                                    </div>

                                    {/* Bio */}
                                    <p className="text-slate-600 text-sm leading-relaxed mb-5 line-clamp-2">
                                        {referee.bio || 'Experienced referee dedicated to maintaining the highest standards of fairness and professionalism in every match.'}
                                    </p>

                                    {/* Experience */}
                                    <div className="bg-gradient-to-br from-pink-100 to-fuchsia-100 rounded-2xl p-4 mb-4 border-2 border-pink-200 shadow-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="w-5 h-5 text-pink-600" />
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Experience</p>
                                        </div>
                                        <p className="text-base font-black text-pink-700">
                                            {referee.experience || '5+ years'}
                                        </p>
                                    </div>

                                    {/* Certifications */}
                                    {referee.certifications && referee.certifications.length > 0 && (
                                        <div className="mb-5">
                                            <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Certifications</p>
                                            <div className="flex flex-wrap gap-2">
                                                {referee.certifications.map((cert, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-pink-200 to-fuchsia-200 text-pink-800 text-xs font-bold rounded-full border-2 border-pink-300 shadow-sm"
                                                    >
                                                        {cert}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 border-2 border-pink-400 shadow-lg text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gavel className="w-4 h-4" />
                                                <p className="text-xs font-bold uppercase tracking-wide opacity-90">Matches</p>
                                            </div>
                                            <p className="text-3xl font-black">
                                                {referee.matchesRefereed || 0}
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-2xl p-4 border-2 border-fuchsia-400 shadow-lg text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4" />
                                                <p className="text-xs font-bold uppercase tracking-wide opacity-90">Ball Crew</p>
                                            </div>
                                            <p className="text-3xl font-black">
                                                {referee.ballCrewMatches || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Link
                                        href={`/referees/${referee.id}`}
                                        className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 hover:from-pink-600 hover:via-fuchsia-600 hover:to-pink-700 text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-105 border-2 border-pink-400 flex items-center justify-center"
                                        onClick={() => setLoadingRefereeId(referee.id)}
                                    >
                                        {loadingRefereeId === referee.id ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span className="ml-2">Loading...</span>
                                            </>
                                        ) : (
                                            <>
                                                View Profile
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}