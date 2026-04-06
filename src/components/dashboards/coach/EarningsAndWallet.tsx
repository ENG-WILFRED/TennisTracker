'use client';

import React, { useEffect, useState } from 'react';

const G = {
  dark: '#0a180a', sidebar: '#0f1e0f', card: '#162616', card2: '#1b2f1b', card3: '#203520',
  border: '#243e24', border2: '#326832', mid: '#2a5224', bright: '#3a7230',
  lime: '#79bf3e', lime2: '#a8d84e', text: '#e4f2da', text2: '#c2dbb0',
  muted: '#5e8e50', muted2: '#7aaa68', yellow: '#efc040', red: '#d94f4f', blue: '#4a9eff',
};

interface Transaction {
  id: string; type: 'credit' | 'debit'; amount: number;
  description: string; createdAt: string; category?: string; status?: string;
}

interface Wallet {
  id: string; balance: number; totalEarned: number;
  totalWithdrawn: number; pendingBalance: number;
  transactions: Transaction[];
  monthlyGoal?: number;
  thisMonthEarned?: number;
  monthlyRevenue?: { month: string; revenue: number }[];
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>{children}</div>
);

const Tag = ({ children, yellow, red, color }: { children: React.ReactNode; yellow?: boolean; red?: boolean; color?: string }) => {
  const c = color || (yellow ? G.yellow : red ? G.red : G.lime);
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${c}22`, border: `1px solid ${c}44`, color: c, display: 'inline-block' }}>{children}</span>;
};

const ProgressBar = ({ value, color = G.lime, height = 5 }: { value: number; color?: string; height?: number }) => (
  <div style={{ height, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 5 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.7s ease' }} />
  </div>
);

const MiniBarChart = ({ data, color = G.lime }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', background: color, borderRadius: '2px 2px 0 0', opacity: 0.8, height: `${(d.value / max) * 40}px`, minHeight: 2 }} />
          <span style={{ fontSize: 7.5, color: G.muted, whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const txCategoryIcon: Record<string, string> = { session: '🎾', payout: '💸', bonus: '🎁', refund: '↩️', default: '💳' };

export default function EarningsAndWallet({ coachId }: { coachId: string }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [payoutForm, setPayoutForm] = useState({ amount: '', paymentMethod: 'bank_transfer', bankDetails: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/coaches/wallet?coachId=${coachId}`);
        if (res.ok) {
          const d = await res.json();
          setWallet(d);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachId]);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coaches/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coachId, amount: parseFloat(payoutForm.amount), paymentMethod: payoutForm.paymentMethod, bankDetails: payoutForm.bankDetails }) });
      if (res.ok) { setPayoutForm({ amount: '', paymentMethod: 'bank_transfer', bankDetails: '' }); setShowPayoutForm(false); }
      else { const err = await res.json(); alert(err.error); }
    } catch { }
  };

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;
  const inputSt = { width: '100%', padding: '8px 11px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 7, fontSize: 11.5, outline: 'none', boxSizing: 'border-box' } as const;

  if (loading) return <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted, fontSize: 12 }}>Loading wallet...</div>;

  if (!wallet) return <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted, fontSize: 12 }}>No wallet data available</div>;

  const goalPct = wallet.monthlyGoal ? Math.round((wallet.thisMonthEarned! / wallet.monthlyGoal) * 100) : 0;
  const filteredTx = wallet.transactions.filter(t => txFilter === 'all' || t.type === txFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>💰 Earnings & Wallet</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Track income and request payouts</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag yellow>↑ 12% this month</Tag>
          <button onClick={() => setShowPayoutForm(!showPayoutForm)} disabled={wallet.balance <= 0}
            style={{ background: showPayoutForm ? G.border : G.lime, color: showPayoutForm ? G.text : '#0a180a', border: 'none', borderRadius: 7, padding: '7px 13px', fontWeight: 800, fontSize: 10.5, cursor: wallet.balance > 0 ? 'pointer' : 'not-allowed', opacity: wallet.balance > 0 ? 1 : 0.5 }}>
            {showPayoutForm ? '✕ Cancel' : '💸 Request Payout'}
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
        {[
          { icon: '💳', label: 'Available', value: `$${wallet.balance.toFixed(2)}`, color: G.lime2, sub: 'Ready to withdraw' },
          { icon: '📈', label: 'Total Earned', value: `$${wallet.totalEarned.toLocaleString()}`, color: G.lime, sub: 'All time' },
          { icon: '⏳', label: 'Pending', value: `$${wallet.pendingBalance.toFixed(2)}`, color: G.yellow, sub: 'Awaiting clearance' },
          { icon: '💸', label: 'Withdrawn', value: `$${wallet.totalWithdrawn.toLocaleString()}`, color: G.muted2, sub: 'All time' },
        ].map((b, i) => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 11, padding: '13px 12px' }}>
            <div style={{ fontSize: 16, marginBottom: 5 }}>{b.icon}</div>
            <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{b.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: b.color, lineHeight: 1.1, marginTop: 3 }}>{b.value}</div>
            <div style={{ fontSize: 8.5, color: G.muted2, marginTop: 4 }}>{b.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 11 }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* Monthly Goal */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionLabel>Monthly Goal</SectionLabel>
              <Tag yellow>{goalPct}% reached</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: G.text2 }}>This Month</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: G.lime2 }}>${wallet.thisMonthEarned?.toLocaleString()} <span style={{ color: G.muted, fontWeight: 400 }}>/ ${wallet.monthlyGoal?.toLocaleString()}</span></span>
            </div>
            <ProgressBar value={goalPct} color={goalPct >= 100 ? G.lime : G.yellow} height={7} />
            {goalPct >= 80 && goalPct < 100 && <div style={{ fontSize: 9.5, color: G.yellow, marginTop: 6 }}>🎯 Almost there! ${((wallet.monthlyGoal || 0) - (wallet.thisMonthEarned || 0)).toFixed(0)} to go.</div>}
            {goalPct >= 100 && <div style={{ fontSize: 9.5, color: G.lime, marginTop: 6 }}>🎉 Monthly goal achieved!</div>}
          </div>

          {/* Revenue Chart */}
          {wallet.monthlyRevenue && wallet.monthlyRevenue.length > 0 && (
            <div style={card}>
              <SectionLabel>6-Month Revenue</SectionLabel>
              <MiniBarChart data={wallet.monthlyRevenue.map(d => ({ label: d.month, value: d.revenue }))} color={G.lime} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 9, borderTop: `1px solid ${G.border}` }}>
                <div><div style={{ fontSize: 8, color: G.muted }}>TOTAL</div><div style={{ fontSize: 13, fontWeight: 800, color: G.lime2 }}>${wallet.monthlyRevenue.reduce((a, d) => a + d.revenue, 0).toLocaleString()}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 8, color: G.muted }}>AVG/MO</div><div style={{ fontSize: 13, fontWeight: 800, color: G.lime2 }}>${Math.round(wallet.monthlyRevenue.reduce((a, d) => a + d.revenue, 0) / wallet.monthlyRevenue.length).toLocaleString()}</div></div>
              </div>
            </div>
          )}


          {/* Payout Form */}
          {showPayoutForm && (
            <div style={card}>
              <SectionLabel>Payout Request</SectionLabel>
              <form onSubmit={handlePayout} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>AMOUNT (MAX ${wallet.balance.toFixed(2)})</label>
                  <input style={inputSt} type="number" step="0.01" max={wallet.balance} placeholder="0.00" value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>PAYMENT METHOD</label>
                  <select style={inputSt} value={payoutForm.paymentMethod} onChange={e => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="mpesa">📱 M-Pesa</option>
                    <option value="stripe">💳 Stripe</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>ACCOUNT / PHONE DETAILS</label>
                  <textarea style={{ ...inputSt, resize: 'none' }} rows={2} placeholder="Account number or phone..." value={payoutForm.bankDetails} onChange={e => setPayoutForm({ ...payoutForm, bankDetails: e.target.value })} />
                </div>
                <button type="submit" style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}>
                  ✓ Confirm Payout Request
                </button>
              </form>
            </div>
          )}
        </div>

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
              filteredTx.map(tx => (
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
    </div>
  );
}