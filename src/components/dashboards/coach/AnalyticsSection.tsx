'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

interface CoachStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalPlayers: number;
  activePlayers: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  completionRate: number;
  monthlyRevenue: { month: string; revenue: number }[];
  sessionsByType: { type: string; count: number }[];
  topPlayers: { name: string; sessions: number; revenue: number }[];
  recentReviews: { player: string; rating: number; comment: string; date: string }[];
  weeklyStats: { day: string; sessions: number; revenue: number }[];
  retentionRate: number;
  avgSessionDuration: number;
  newPlayersThisMonth: number;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; yellow?: boolean; red?: boolean; blue?: boolean }> = ({ children, yellow, red, blue }) => {
  const color = yellow ? G.yellow : red ? G.red : blue ? G.blue : G.lime;
  const bg = yellow ? 'rgba(239,192,64,.1)' : red ? 'rgba(217,79,79,.1)' : blue ? 'rgba(74,158,255,.1)' : 'rgba(121,191,62,.12)';
  const border = yellow ? 'rgba(239,192,64,.3)' : red ? 'rgba(217,79,79,.3)' : blue ? 'rgba(74,158,255,.3)' : 'rgba(121,191,62,.28)';
  return (
    <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: bg, border: `1px solid ${border}`, color, display: 'inline-block' }}>
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = G.lime, height = 4 }) => (
  <div style={{ height, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
  </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? G.yellow : G.border2, fontSize: 9 }}>★</span>
    ))}
  </div>
);

const MiniBarChart: React.FC<{ data: { label: string; value: number }[]; color?: string }> = ({ data, color = G.lime }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', background: color, borderRadius: '2px 2px 0 0', opacity: 0.85,
            height: `${(d.value / max) * 36}px`, minHeight: 2, transition: 'height 0.5s ease',
          }} />
          <span style={{ fontSize: 7, color: G.muted, whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsSection({ coachId }: { coachId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChart = (searchParams.get('analyticsTab') as 'revenue' | 'sessions') || 'revenue';
  
  const setActiveChart = (tab: 'revenue' | 'sessions') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('analyticsTab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const [stats, setStats] = useState<CoachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', paymentMethod: 'bank_transfer', bankDetails: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/coaches/stats?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          const completionRate = data.totalSessions > 0
            ? (data.completedSessions / data.totalSessions) * 100 : 0;
          setStats({ ...data, completionRate });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchWallet = async () => {
      try {
        const res = await fetch(`/api/coaches/wallet?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          setWallet(data);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };
    
    fetchStats();
    fetchWallet();
  }, [coachId]);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.amount || parseFloat(payoutForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (parseFloat(payoutForm.amount) > (wallet?.balance || 0)) {
      alert('Amount exceeds available balance');
      return;
    }
    
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/coaches/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          amount: parseFloat(payoutForm.amount),
          paymentMethod: payoutForm.paymentMethod,
          bankDetails: payoutForm.bankDetails,
        }),
      });

      if (res.ok) {
        alert('Payout request submitted successfully!');
        setPayoutForm({ amount: '', paymentMethod: 'bank_transfer', bankDetails: '' });
        setShowPayoutModal(false);
        // Refresh wallet data
        const walletRes = await fetch(`/api/coaches/wallet?coachId=${coachId}`);
        if (walletRes.ok) {
          const data = await walletRes.json();
          setWallet(data);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error submitting payout:', error);
      alert('Error submitting payout request');
    } finally {
      setPayoutLoading(false);
    }
  };

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;
  const card2 = { background: G.card2, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12 } as const;

  if (loading) return (
    <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 12 }}>Loading analytics...</div>
    </div>
  );

  if (!stats) return <div style={card}><div style={{ color: G.muted }}>No data available</div></div>;

  const chartData = activeChart === 'revenue'
    ? (stats.monthlyRevenue || []).map(d => ({ label: d.month, value: d.revenue }))
    : (stats.weeklyStats || []).map(d => ({ label: d.day, value: d.sessions }));

  const txCategoryIcon: Record<string, string> = { session: '🎾', payout: '💸', bonus: '🎁', refund: '↩️', default: '💳' };
  const filteredTx = wallet?.transactions ? wallet.transactions.filter((t: any) => txFilter === 'all' || t.type === txFilter) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>📊 Analytics & Performance</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Your coaching insights at a glance</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Tag>Last 30 days</Tag>
          <Tag yellow>↑ 12% growth</Tag>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
        {[
          { icon: '🎾', label: 'Total Sessions', value: stats.totalSessions, sub: `${stats.completedSessions} completed`, color: G.lime2 },
          { icon: '💰', label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, sub: `$${(stats.totalRevenue / Math.max(stats.completedSessions, 1)).toFixed(0)} avg/session`, color: G.lime2 },
          { icon: '👥', label: 'Active Players', value: stats.activePlayers, sub: `${stats.newPlayersThisMonth} new this month`, color: G.lime2 },
          { icon: '⭐', label: 'Avg Rating', value: `${stats.avgRating.toFixed(1)}★`, sub: `${stats.reviewCount} reviews`, color: G.yellow },
        ].map((kpi, i) => (
          <div key={i} style={card}>
            <div style={{ fontSize: 18, marginBottom: 5 }}>{kpi.icon}</div>
            <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: G.muted2, marginTop: 5 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Earnings & Payout Banner */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${G.card2}, ${G.card})`, borderLeft: `3px solid ${G.lime}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 4 }}>💸 Total Earned (All Time)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: G.lime2, lineHeight: 1 }}>${(wallet?.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 9.5, color: G.muted2, marginTop: 6 }}>
              Available to withdraw: <span style={{ color: G.lime, fontWeight: 800 }}>${(wallet?.balance || 0).toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={!wallet || wallet.balance <= 0 || payoutLoading}
              style={{
                background: wallet && wallet.balance > 0 ? G.lime : G.border,
                color: wallet && wallet.balance > 0 ? '#0a180a' : G.muted,
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontWeight: 800,
                fontSize: 11,
                cursor: wallet && wallet.balance > 0 ? 'pointer' : 'not-allowed',
                opacity: wallet && wallet.balance > 0 ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
            >
              💸 {payoutLoading ? 'Processing...' : 'Request Payout'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart + Session Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 11 }}>

        {/* Transactions */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionLabel>Transactions</SectionLabel>
            <div style={{ display: 'flex', gap: 3, background: G.dark, borderRadius: 6, padding: 3 }}>
              {(['all', 'credit', 'debit'] as const).map(f => (
                <button key={f} onClick={() => setTxFilter(f)} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, background: txFilter === f ? G.lime : 'transparent', color: txFilter === f ? '#0a180a' : G.muted, textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 400, overflowY: 'auto' }}>
            {filteredTx.length === 0 ? (
              <div style={{ textAlign: 'center', color: G.muted, fontSize: 10.5, padding: '20px 0' }}>No transactions</div>
            ) : (
              filteredTx.map((tx: any) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', background: G.card2, borderRadius: 8, border: `1px solid ${G.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: tx.type === 'credit' ? 'rgba(121,191,62,.15)' : 'rgba(217,79,79,.1)', border: `1px solid ${tx.type === 'credit' ? G.lime : G.red}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      {txCategoryIcon[tx.category || 'default']}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                      <div style={{ fontSize: 8.5, color: G.muted, marginTop: 1 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: tx.type === 'credit' ? G.lime2 : G.red }}>
                      {tx.type === 'credit' ? '+' : '–'}${tx.amount.toFixed(2)}
                    </div>
                    {tx.status && <div style={{ fontSize: 8, color: G.muted }}>{tx.status}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 11 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <SectionLabel>Recent Reviews</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: G.yellow }}>{stats.avgRating.toFixed(1)}</span>
              <StarRating rating={stats.avgRating} />
            </div>
          </div>
          {(stats.recentReviews || []).length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '14px 0' }}>No recent reviews available.</div>
          ) : (
            (stats.recentReviews || []).map((r, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < (stats.recentReviews || []).length - 1 ? `1px solid ${G.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: G.mid, border: `1px solid ${G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: G.lime }}>
                      {r.player?.[0] || 'P'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{r.player || 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <StarRating rating={Number.isFinite(r.rating) ? r.rating : 0} />
                    <span style={{ fontSize: 8.5, color: G.muted }}>{r.date || 'N/A'}</span>
                  </div>
                </div>
                <p style={{ fontSize: 10.5, color: G.text2, lineHeight: 1.55, margin: 0 }}>
                  "{r.comment || 'No comment yet'}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights Panel */}
      <div style={{ ...card, background: 'rgba(121,191,62,0.06)', border: `1px solid rgba(121,191,62,0.2)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: G.lime }}>💡 AI-Powered Coaching Insights</div>
          <Tag>Personalized</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
          {[
            { icon: '📈', title: 'Revenue Opportunity', body: 'Adding 2 group sessions/week could boost monthly revenue by ~$480 with your current player base.' },
            { icon: '🎯', title: 'Retention Alert', body: `${stats.totalPlayers - stats.activePlayers} players haven't booked in 30+ days. A follow-up message could recover them.` },
            { icon: '⏰', title: 'Peak Demand', body: 'Saturday bookings fill 3× faster. Consider adding a morning slot to capture that demand.' },
          ].map((ins, i) => (
            <div key={i} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 9, padding: 11 }}>
              <div style={{ fontSize: 16, marginBottom: 5 }}>{ins.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: G.lime2, marginBottom: 4 }}>{ins.title}</div>
              <p style={{ fontSize: 10, color: G.text2, lineHeight: 1.55, margin: 0 }}>{ins.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>💸 Request Payout</div>
                <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Withdraw your earnings</div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  color: G.lime,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Available Balance Info */}
            <div style={{
              background: G.card2,
              border: `1px solid ${G.border}`,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Available Balance</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: G.lime2 }}>
                ${(wallet?.balance || 0).toFixed(2)}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePayout} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Amount */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: G.text, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Withdrawal Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={wallet?.balance || 0}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.dark,
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    borderRadius: 8,
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: G.text, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Payment Method *
                </label>
                <select
                  value={payoutForm.paymentMethod}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.dark,
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    borderRadius: 8,
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>

              {/* Bank Details */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: G.text, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  {payoutForm.paymentMethod === 'bank_transfer' ? 'Bank Account Details *' : 'Account Email *'}
                </label>
                <textarea
                  value={payoutForm.bankDetails}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankDetails: e.target.value })}
                  placeholder={payoutForm.paymentMethod === 'bank_transfer' ? 'Enter your bank name, account number, and routing number' : 'Enter your PayPal or Stripe email'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.dark,
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    borderRadius: 8,
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: 80,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: G.card2,
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading || !payoutForm.amount}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: payoutLoading || !payoutForm.amount ? G.border : G.lime,
                    border: 'none',
                    color: payoutLoading || !payoutForm.amount ? G.muted : '#0a180a',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: payoutLoading || !payoutForm.amount ? 'not-allowed' : 'pointer',
                    opacity: payoutLoading || !payoutForm.amount ? 0.6 : 1,
                  }}
                >
                  {payoutLoading ? '⏳ Processing...' : '💸 Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}