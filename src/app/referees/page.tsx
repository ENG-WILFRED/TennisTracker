'use client';
import { useEffect, useState } from 'react';
import { Gavel, Award, Users, Globe, TrendingUp, ArrowLeft, Star, Trophy, Shield, Loader, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

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
                const data = (await res.json()) as any;
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
        <main style={{ background: G.dark, minHeight: '100vh', color: G.text, padding: '20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ background: G.card, border: `2px solid ${G.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h1 style={{ fontSize: '32px', fontWeight: 900, color: G.lime, marginBottom: '12px' }}>
                                    🏆 Official Referees & Ball Crew
                                </h1>
                                <p style={{ fontSize: '14px', color: G.muted, marginBottom: '8px' }}>
                                    Certified professionals ensuring fair play and smooth match operations
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                                <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: '8px', padding: '16px' }}>
                                    <div style={{ fontSize: '12px', color: G.muted, marginBottom: '8px' }}>Total Referees</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: G.lime }}>{referees.length}</div>
                                </div>
                                <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: '8px', padding: '16px' }}>
                                    <div style={{ fontSize: '12px', color: G.muted, marginBottom: '8px' }}>Referees Matches</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: G.accent }}>
                                        {referees.reduce((sum, r) => sum + (r.matchesRefereed || 0), 0)}
                                    </div>
                                </div>
                                <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: '8px', padding: '16px' }}>
                                    <div style={{ fontSize: '12px', color: G.muted, marginBottom: '8px' }}>Ball Crew Matches</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: G.bright }}>
                                        {referees.reduce((sum, r) => sum + (r.ballCrewMatches || 0), 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'All Staff', value: 'all', count: referees.length },
                        { label: 'Referees', value: 'referees', count: referees.filter(r => r.matchesRefereed > 0).length },
                        { label: 'Ball Crew', value: 'ballcrew', count: referees.filter(r => r.ballCrewMatches > 0).length }
                    ].map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value as any)}
                            style={{
                                padding: '12px 20px',
                                background: filter === btn.value ? G.lime : G.card,
                                color: filter === btn.value ? G.dark : G.text,
                                border: `2px solid ${G.cardBorder}`,
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {btn.label} ({btn.count})
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: G.muted }}>
                        <div style={{ fontSize: '14px' }}>Loading referees...</div>
                    </div>
                ) : filteredReferees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: G.card, border: `2px solid ${G.cardBorder}`, borderRadius: '8px', color: G.muted }}>
                        <Gavel size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>No referees found</div>
                        <div style={{ fontSize: '13px', marginTop: '8px' }}>Try adjusting your filters</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredReferees.map((referee) => (
                            <div
                                key={referee.id}
                                style={{
                                    background: G.card,
                                    border: `1px solid ${G.cardBorder}`,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Profile Image */}
                                <div style={{ height: '160px', background: G.mid, overflow: 'hidden' }}>
                                    <img
                                        src={referee.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80'}
                                        alt={referee.firstName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>

                                {/* Content */}
                                <div style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: G.lime, marginBottom: '4px' }}>
                                        {referee.firstName} {referee.lastName}
                                    </div>
                                    <div style={{ fontSize: '12px', color: G.muted, marginBottom: '12px' }}>
                                        🌍 {referee.nationality || 'Unknown'}
                                    </div>

                                    {/* Bio */}
                                    <p style={{ fontSize: '12px', color: G.text, marginBottom: '12px', lineHeight: '1.4', opacity: 0.8 }}>
                                        {referee.bio || 'Experienced referee dedicated to maintaining the highest standards of fairness.'}
                                    </p>

                                    {/* Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                        <div style={{ background: G.mid, padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: G.muted, marginBottom: '4px' }}>Matches</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: G.lime }}>
                                                {referee.matchesRefereed || 0}
                                            </div>
                                        </div>
                                        <div style={{ background: G.mid, padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: G.muted, marginBottom: '4px' }}>Ball Crew</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: G.accent }}>
                                                {referee.ballCrewMatches || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certifications */}
                                    {referee.certifications && referee.certifications.length > 0 && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '11px', color: G.muted, marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
                                                Certifications
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {referee.certifications.slice(0, 2).map((cert, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            fontSize: '11px',
                                                            padding: '4px 10px',
                                                            background: G.mid,
                                                            border: `1px solid ${G.cardBorder}`,
                                                            borderRadius: '4px',
                                                            color: G.lime
                                                        }}
                                                    >
                                                        ✓ {cert}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <Link
                                        href={`/referees/${referee.id}`}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px',
                                            background: G.bright,
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => setLoadingRefereeId(referee.id)}
                                    >
                                        {loadingRefereeId === referee.id ? 'Loading...' : 'View Profile →'}
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