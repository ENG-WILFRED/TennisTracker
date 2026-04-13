'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   Tailwind-safe colour tokens (extend in tailwind.config if needed)
   All hex values match Dashboard Color Codes.md
───────────────────────────────────────────── */
const G = {
  dark:       '#0f1f0f',
  sidebar:    '#152515',
  card:       '#1a3020',
  card2:      '#1b2f1b',
  card3:      '#203520',
  cardBorder: '#2d5a35',
  border:     '#243e24',
  mid:        '#2d5a27',
  bright:     '#3a7230',
  lime:       '#7dc142',
  accent:     '#a8d84e',
  yellow:     '#f0c040',
  blue:       '#4a9eff',
  red:        '#d94f4f',
  text:       '#e8f5e0',
  text2:      '#c2dbb0',
  muted:      '#7aaa6a',
  muted2:     '#5e8e50',
  success:    '#5fc45f',
  danger:     '#e57373',
};

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const NAV_SECTIONS = [
  { label: 'Home',          icon: '🏠' },
  { label: 'Watch Match',   icon: '🎥' },
  { label: 'Players',       icon: '👤' },
  { label: 'Organizations', icon: '🏢' },
  { label: 'Apply',         icon: '📝' },
  { label: 'Membership',    icon: '💳' },
];

const AVAILABLE_PLAYERS = [
  { id: 'p1', name: 'Amina N.',   country: 'KEN', ranking: '#14', wins: 12, bio: 'Aggressive baseline player with fast court coverage.' },
  { id: 'p2', name: 'Samuel M.', country: 'UGA', ranking: '#21', wins: 9,  bio: 'Power server and strong volley game.' },
  { id: 'p3', name: 'Lina K.',   country: 'RSA', ranking: '#8',  wins: 18, bio: 'Smart tactical player with excellent footwork.' },
];

const MOCK_ORGS = [
  { id: 'org1', name: 'Nairobi Tennis Club',     city: 'Nairobi',    country: 'Kenya',        members: 128, coaches: 12, events: 24, contact: 'info@naitc.org',      description: 'Premier Nairobi club offering courts, clinics, and events for all levels.' },
  { id: 'org2', name: 'Kampala Smash Academy',   city: 'Kampala',    country: 'Uganda',       members: 94,  coaches: 8,  events: 18, contact: 'team@kmsa.org',       description: 'Developing competitive players with expert training programs.' },
  { id: 'org3', name: 'Cape Town Tennis Hub',    city: 'Cape Town',  country: 'South Africa', members: 142, coaches: 15, events: 30, contact: 'hello@ctthub.co.za',  description: 'Social and competitive tennis community with premium facilities.' },
];

const MEMBERSHIP_TIERS = [
  { name: 'Bronze', cost: 20, color: '#cd7f32', perks: ['Basic platform access', 'Event alerts & updates', 'Member newsletter'] },
  { name: 'Silver', cost: 45, color: '#aaaaaa', perks: ['All Bronze benefits', 'Priority court booking', 'Members-only clinics'] },
  { name: 'Gold',   cost: 80, color: '#f0c040', perks: ['All Silver benefits',  'Exclusive VIP events',  'VIP lounge access'] },
];

const POSITIONS = [
  { label: 'Player',  value: 'player',  description: 'Join a team or club roster.' },
  { label: 'Coach',   value: 'coach',   description: 'Training and clinic coaching role.' },
  { label: 'Referee', value: 'referee', description: 'Officiate matches and tournaments.' },
];

const LIVE_MATCH = {
  event:       'Summer Showcase Final',
  court:       'Court 1',
  score:       '4–3',
  players:     ['Amina N.', 'Samuel M.'],
  status:      '2nd set',
  winnerChance:'Amina 62%',
};

/* ─────────────────────────────────────────────
   Shared primitives
───────────────────────────────────────────── */
function StatPill({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3 flex-1 min-w-[80px]"
      style={{ background: G.card2, border: `1px solid ${G.border}` }}
    >
      <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>{label}</span>
      <span className="text-lg font-bold" style={{ color: accent ? G.lime : G.text }}>{value}</span>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${color || G.lime}22`, color: color || G.lime, border: `1px solid ${color || G.lime}44` }}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: G.card, border: `1px solid ${G.cardBorder}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wide" style={{ color: G.lime }}>{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: G.muted }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function NavBtn({
  section, active, onClick,
}: { section: { label: string; icon: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150"
      style={{
        background: active ? G.mid : 'transparent',
        color:      active ? G.text : G.muted,
        border:     `1px solid ${active ? G.lime : 'transparent'}`,
      }}
    >
      <span className="text-base leading-none">{section.icon}</span>
      <span>{section.label}</span>
    </button>
  );
}

function ActionBtn({
  children, onClick, variant = 'primary', disabled = false, fullWidth = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: G.lime,   color: G.dark,  border: 'none' },
    secondary: { background: G.mid,    color: G.text,  border: `1px solid ${G.cardBorder}` },
    ghost:     { background: 'transparent', color: G.muted, border: `1px solid ${G.cardBorder}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-[.98]'}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: G.muted }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: G.card2, border: `1px solid ${G.cardBorder}`,
  borderRadius: 12, color: G.text, padding: '10px 14px', fontSize: 14,
  outline: 'none', fontFamily: 'inherit',
};

/* ─────────────────────────────────────────────
   Section renderers
───────────────────────────────────────────── */
function HomeSection({
  match, players, selectedOrg, setActiveSection,
}: {
  match: typeof LIVE_MATCH;
  players: typeof AVAILABLE_PLAYERS;
  selectedOrg: typeof MOCK_ORGS[number] | null;
  setActiveSection: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Live match hero */}
      <SectionCard title="Live Right Now" subtitle={`${match.court} · ${match.status}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Score block */}
          <div
            className="flex-1 rounded-xl p-5 flex flex-col justify-between gap-4"
            style={{ background: G.dark, border: `1px solid ${G.cardBorder}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Badge>🔴 Live</Badge>
                <h3 className="text-lg font-extrabold mt-2" style={{ color: G.text }}>{match.event}</h3>
                <p className="text-sm mt-1" style={{ color: G.muted }}>{match.players[0]} vs {match.players[1]}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <StatPill label="Score"  value={match.score}       accent />
              <StatPill label="Status" value={match.status}             />
              <StatPill label="Edge"   value={match.winnerChance} accent />
            </div>
            <ActionBtn fullWidth onClick={() => setActiveSection('Watch Match')}>▶ Launch Stream</ActionBtn>
          </div>

          {/* Side cards */}
          <div className="flex flex-col gap-3 sm:w-56">
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Next Up</span>
              <span className="text-sm font-bold" style={{ color: G.text }}>Junior Cup Semis</span>
              <span className="text-xs" style={{ color: G.muted }}>Tomorrow · 4:00 PM</span>
            </div>
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Top Player</span>
              <span className="text-sm font-bold" style={{ color: G.text }}>{players[0]?.name}</span>
              <span className="text-xs" style={{ color: G.muted }}>{players[0]?.country} · {players[0]?.ranking}</span>
            </div>
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Spotlight Club</span>
              <span className="text-sm font-bold" style={{ color: G.text }}>{selectedOrg?.name}</span>
              <span className="text-xs" style={{ color: G.muted }}>{selectedOrg?.city}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Watch Live',      icon: '🎥', section: 'Watch Match'   },
          { label: 'Browse Players',  icon: '👤', section: 'Players'       },
          { label: 'Find a Club',     icon: '🏢', section: 'Organizations' },
          { label: 'Apply to Join',   icon: '📝', section: 'Apply'         },
          { label: 'Get Membership',  icon: '💳', section: 'Membership'    },
        ].map((q) => (
          <button
            key={q.label}
            onClick={() => setActiveSection(q.section)}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-left transition-all hover:opacity-90 active:scale-[.97]"
            style={{ background: G.card2, border: `1px solid ${G.cardBorder}`, color: G.text2 }}
          >
            <span className="text-xl leading-none">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WatchSection({ match }: { match: typeof LIVE_MATCH }) {
  return (
    <SectionCard title="Live Match Broadcast" subtitle="High-quality stream · Live commentary">
      <div
        className="rounded-xl p-5 flex flex-col gap-5"
        style={{ background: G.dark, border: `1px solid ${G.cardBorder}` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge>🔴 Live</Badge>
            <h3 className="text-xl font-extrabold mt-2" style={{ color: G.text }}>{match.event}</h3>
            <p className="text-sm mt-1" style={{ color: G.muted }}>{match.court} · {match.status}</p>
          </div>
          <ActionBtn>Watch Live</ActionBtn>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatPill label="Current Score"    value={match.score}        accent />
          <StatPill label="Win Probability"  value={match.winnerChance} accent />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: G.muted }}>Contestants</p>
            {match.players.map((p) => (
              <div key={p} className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: G.lime }} />
                <span className="text-sm font-semibold" style={{ color: G.text }}>{p}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: G.muted }}>Stream Info</p>
            <p className="text-sm leading-relaxed" style={{ color: G.muted2 }}>
              Center Court · Live commentary · Crowd mic on
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PlayersSection({
  players, selectedPlayer, setSelectedPlayer,
}: {
  players: typeof AVAILABLE_PLAYERS;
  selectedPlayer: typeof AVAILABLE_PLAYERS[number] | null;
  setSelectedPlayer: (p: typeof AVAILABLE_PLAYERS[number]) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title="Player Directory" subtitle={`${players.length} active players`}>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(p)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:opacity-90"
              style={{
                background: selectedPlayer?.id === p.id ? G.mid : G.card2,
                border: `1px solid ${selectedPlayer?.id === p.id ? G.lime : G.border}`,
                color: G.text,
              }}
            >
              <div>
                <p className="text-sm font-bold">{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: G.muted }}>{p.country} · {p.wins} wins</p>
              </div>
              <Badge>{p.ranking}</Badge>
            </button>
          ))}
        </div>
      </SectionCard>

      {selectedPlayer && (
        <SectionCard title="Player Profile">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold" style={{ color: G.text }}>{selectedPlayer.name}</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: G.muted }}>{selectedPlayer.bio}</p>
            </div>
            <Badge color={G.lime}>{selectedPlayer.ranking}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Country"     value={selectedPlayer.country} />
            <StatPill label="Match Wins"  value={selectedPlayer.wins} accent />
          </div>
          <ActionBtn fullWidth variant="secondary">View full profile →</ActionBtn>
        </SectionCard>
      )}
    </div>
  );
}

function OrgsSection({
  orgs, selectedOrg, setSelectedOrg,
}: {
  orgs: typeof MOCK_ORGS;
  selectedOrg: typeof MOCK_ORGS[number] | null;
  setSelectedOrg: (o: typeof MOCK_ORGS[number]) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title="Clubs & Organizations" subtitle={`${orgs.length} featured`}>
        <div className="flex flex-col gap-2">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setSelectedOrg(org)}
              className="flex items-start justify-between rounded-xl px-4 py-3 text-left transition-all hover:opacity-90 gap-3"
              style={{
                background: selectedOrg?.id === org.id ? G.mid : G.card2,
                border: `1px solid ${selectedOrg?.id === org.id ? G.lime : G.border}`,
                color: G.text,
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{org.name}</p>
                <p className="text-xs mt-0.5" style={{ color: G.muted }}>
                  {org.members} members · {org.coaches} coaches
                </p>
              </div>
              <span className="text-xs whitespace-nowrap mt-0.5 shrink-0" style={{ color: G.muted }}>{org.city}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {selectedOrg && (
        <SectionCard title="Organization Details">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold leading-snug" style={{ color: G.text }}>{selectedOrg.name}</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: G.muted }}>{selectedOrg.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Members"  value={selectedOrg.members} accent />
            <StatPill label="Coaches"  value={selectedOrg.coaches}       />
            <StatPill label="Events"   value={selectedOrg.events}        />
          </div>
          <div className="text-xs" style={{ color: G.muted2 }}>📧 {selectedOrg.contact}</div>
          <div className="flex flex-col gap-2">
            <ActionBtn fullWidth>Explore memberships</ActionBtn>
            <ActionBtn fullWidth variant="ghost">View full org info</ActionBtn>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function ApplySection({
  orgs, applyOrg, setApplyOrg, applyPosition, setApplyPosition,
  applyEmail, setApplyEmail, handleApply, applicationResult,
}: {
  orgs: typeof MOCK_ORGS; applyOrg: string; setApplyOrg: (v: string) => void;
  applyPosition: string; setApplyPosition: (v: string) => void;
  applyEmail: string; setApplyEmail: (v: string) => void;
  handleApply: () => void; applicationResult: string;
}) {
  return (
    <SectionCard title="Apply to Join" subtitle="Submit your application to any listed organization">
      <div className="flex flex-col gap-4">
        <FormField label="Choose Organization">
          <select value={applyOrg} onChange={(e) => setApplyOrg(e.target.value)} style={inputStyle}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POSITIONS.map((pos) => (
            <button
              key={pos.value}
              onClick={() => setApplyPosition(pos.value)}
              className="flex flex-col gap-1 rounded-xl p-3 text-left transition-all"
              style={{
                background: applyPosition === pos.value ? G.mid : G.card2,
                border: `1px solid ${applyPosition === pos.value ? G.lime : G.border}`,
                color: G.text,
              }}
            >
              <span className="text-sm font-bold">{pos.label}</span>
              <span className="text-xs" style={{ color: G.muted }}>{pos.description}</span>
            </button>
          ))}
        </div>

        <FormField label="Your Email">
          <input
            type="email" value={applyEmail} placeholder="you@example.com"
            onChange={(e) => setApplyEmail(e.target.value)} style={inputStyle}
          />
        </FormField>

        <ActionBtn fullWidth onClick={handleApply}>Submit Application</ActionBtn>

        {applicationResult && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: applicationResult.includes('successfully') ? `${G.success}18` : G.card2,
              border: `1px solid ${applicationResult.includes('successfully') ? G.success : G.cardBorder}`,
              color: applicationResult.includes('successfully') ? G.success : G.text2,
            }}
          >
            {applicationResult.includes('successfully') ? '✅ ' : '⚠️ '}{applicationResult}
          </div>
        )}

        <p className="text-xs leading-relaxed rounded-xl p-3" style={{ background: G.card2, color: G.muted, border: `1px solid ${G.border}` }}>
          Your application will be reviewed by the organization. Approved applications may require membership payment to finalize.
        </p>
      </div>
    </SectionCard>
  );
}

function MembershipSection({
  selectedOrg, purchaseMembership, loadingPayment, paymentStatus, checkoutUrl,
}: {
  selectedOrg: typeof MOCK_ORGS[number] | null;
  purchaseMembership: (tier: typeof MEMBERSHIP_TIERS[number]) => void;
  loadingPayment: boolean;
  paymentStatus: string;
  checkoutUrl: string;
}) {
  return (
    <SectionCard title="Membership Plans" subtitle={`For ${selectedOrg?.name ?? 'selected organization'} · Powered by Stripe`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MEMBERSHIP_TIERS.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col gap-4 rounded-2xl p-5"
            style={{ background: G.card2, border: `1px solid ${G.cardBorder}` }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold" style={{ color: tier.color }}>{tier.name}</span>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
              </div>
              <div className="text-3xl font-black mt-2" style={{ color: G.lime }}>
                ${tier.cost}<span className="text-sm font-normal" style={{ color: G.muted }}>/mo</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-xs" style={{ color: G.text2 }}>
                  <span style={{ color: G.lime }}>✓</span> {perk}
                </li>
              ))}
            </ul>
            <ActionBtn fullWidth onClick={() => purchaseMembership(tier)} disabled={loadingPayment}>
              {loadingPayment ? 'Processing…' : `Get ${tier.name}`}
            </ActionBtn>
          </div>
        ))}
      </div>

      {paymentStatus && (
        <div className="rounded-xl p-3 text-sm" style={{ background: G.card2, border: `1px solid ${G.cardBorder}`, color: G.text2 }}>
          {paymentStatus}
        </div>
      )}
      {checkoutUrl && (
        <a href={checkoutUrl} target="_blank" rel="noreferrer" className="text-sm font-bold hover:underline" style={{ color: G.lime }}>
          Open Stripe checkout →
        </a>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export const SpectatorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeSection,     setActiveSection]     = useState('Home');
  const [mobileNavOpen,     setMobileNavOpen]      = useState(false);
  const [players,           setPlayers]            = useState(AVAILABLE_PLAYERS);
  const [selectedPlayer,    setSelectedPlayer]     = useState<typeof AVAILABLE_PLAYERS[number]>(AVAILABLE_PLAYERS[0]);
  const [orgs,              setOrgs]               = useState(MOCK_ORGS);
  const [selectedOrg,       setSelectedOrg]        = useState<typeof MOCK_ORGS[number]>(MOCK_ORGS[0]);
  const [applyOrg,          setApplyOrg]           = useState(MOCK_ORGS[0].id);
  const [applyPosition,     setApplyPosition]      = useState('player');
  const [applyEmail,        setApplyEmail]         = useState(user?.email || '');
  const [applicationResult, setApplicationResult] = useState('');
  const [paymentStatus,     setPaymentStatus]      = useState('');
  const [checkoutUrl,       setCheckoutUrl]        = useState('');
  const [loadingPayment,    setLoadingPayment]     = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const list = data.filter((i: any) => i.role === 'player').slice(0, 6).map((i: any) => ({
            id:      i.id,
            name:    `${i.firstName} ${i.lastName}`,
            country: i.email?.split('@')[1]?.slice(0, 3).toUpperCase() || 'UNK',
            ranking: '#' + Math.floor(5 + Math.random() * 20),
            wins:    8 + Math.floor(Math.random() * 12),
            bio:     'Top competitive performer with strong all-court play.',
          }));
          if (list.length) { setPlayers(list); setSelectedPlayer(list[0]); }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (orgs.length) { setSelectedOrg(orgs[0]); setApplyOrg(orgs[0].id); }
  }, [orgs]);

  const handleApply = async () => {
    if (!applyEmail || !applyPosition || !applyOrg) {
      setApplicationResult('Please choose an org, position, and provide your email.');
      return;
    }
    setApplicationResult('Submitting…');
    await new Promise((r) => setTimeout(r, 650));
    setApplicationResult(`Application for ${applyPosition} at ${orgs.find((o) => o.id === applyOrg)?.name} submitted successfully.`);
  };

  const purchaseMembership = async (tier: typeof MEMBERSHIP_TIERS[number]) => {
    if (!user?.id || !selectedOrg?.id) { setPaymentStatus('User or org not available.'); return; }
    setLoadingPayment(true);
    setPaymentStatus('Creating checkout session…');
    try {
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tier.cost, currency: 'usd', userId: user.id,
          eventId: selectedOrg.id, bookingType: 'amenity_booking',
          metadata: { membershipTier: tier.name, organization: selectedOrg.name },
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setPaymentStatus(result.error || 'Payment session creation failed.');
      } else if (result.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        setPaymentStatus(`Ready for checkout — ${tier.name} tier.`);
        window.open(result.checkoutUrl, '_blank');
      } else {
        setPaymentStatus('Checkout URL not returned.');
      }
    } catch (e: any) {
      setPaymentStatus(e?.message || 'Payment request failed.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Watch Match':   return <WatchSection match={LIVE_MATCH} />;
      case 'Players':       return <PlayersSection players={players} selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} />;
      case 'Organizations': return <OrgsSection orgs={orgs} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} />;
      case 'Apply':         return (
        <ApplySection
          orgs={orgs} applyOrg={applyOrg} setApplyOrg={setApplyOrg}
          applyPosition={applyPosition} setApplyPosition={setApplyPosition}
          applyEmail={applyEmail} setApplyEmail={setApplyEmail}
          handleApply={handleApply} applicationResult={applicationResult}
        />
      );
      case 'Membership':    return (
        <MembershipSection
          selectedOrg={selectedOrg} purchaseMembership={purchaseMembership}
          loadingPayment={loadingPayment} paymentStatus={paymentStatus} checkoutUrl={checkoutUrl}
        />
      );
      default:              return (
        <HomeSection match={LIVE_MATCH} players={players} selectedOrg={selectedOrg} setActiveSection={handleSectionChange} />
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: G.dark, color: G.text, fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Mobile top bar ── */}
      <header
        className="flex items-center justify-between px-4 py-3 lg:hidden sticky top-0 z-30"
        style={{ background: G.sidebar, borderBottom: `1px solid ${G.cardBorder}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: G.lime, color: G.dark }}
          >V</div>
          <span className="text-sm font-bold" style={{ color: G.lime }}>Spectator</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold hidden sm:block" style={{ color: G.muted }}>
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex flex-col gap-1 p-2 rounded-lg"
            style={{ background: G.card2 }}
            aria-label="Toggle navigation"
          >
            <span className="block w-4 h-0.5" style={{ background: mobileNavOpen ? G.lime : G.muted }} />
            <span className="block w-4 h-0.5" style={{ background: mobileNavOpen ? G.lime : G.muted }} />
            <span className="block w-4 h-0.5" style={{ background: mobileNavOpen ? G.lime : G.muted }} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileNavOpen(false)}
        >
          <nav
            className="absolute top-[52px] left-0 right-0 p-4 flex flex-col gap-2"
            style={{ background: G.sidebar, borderBottom: `1px solid ${G.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_SECTIONS.map((s) => (
              <NavBtn key={s.label} section={s} active={activeSection === s.label} onClick={() => handleSectionChange(s.label)} />
            ))}
          </nav>
        </div>
      )}

      {/* ── Desktop + content layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop left sidebar ── */}
        <aside
          className="hidden lg:flex flex-col gap-4 w-52 shrink-0 p-4 overflow-y-auto"
          style={{ background: G.sidebar, borderRight: `1px solid ${G.cardBorder}` }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${G.cardBorder}` }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: G.lime, color: G.dark }}
            >V</div>
            <div>
              <div className="text-xs font-bold tracking-widest" style={{ color: G.lime }}>VICO</div>
              <div className="text-[9px] tracking-wider uppercase" style={{ color: G.muted }}>Tennis Tracker</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV_SECTIONS.map((s) => (
              <NavBtn key={s.label} section={s} active={activeSection === s.label} onClick={() => handleSectionChange(s.label)} />
            ))}
          </nav>

          {/* User card */}
          <div
            className="mt-auto rounded-xl p-3 flex flex-col gap-1"
            style={{ background: G.card2, border: `1px solid ${G.border}` }}
          >
            <span className="text-[10px] uppercase tracking-wider" style={{ color: G.muted }}>Signed in as</span>
            <span className="text-sm font-bold" style={{ color: G.text }}>{user?.firstName} {user?.lastName}</span>
            <Badge>Spectator</Badge>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-extrabold tracking-wide" style={{ color: G.text }}>
                  {activeSection}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: G.muted }}>
                  {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Badge color={G.lime}>🔴 Live</Badge>
            </div>
            {renderContent()}
          </div>
        </main>

        {/* ── Desktop right sidebar ── */}
        <aside
          className="hidden xl:flex flex-col gap-4 w-64 shrink-0 p-4 overflow-y-auto"
          style={{ background: G.sidebar, borderLeft: `1px solid ${G.cardBorder}` }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: G.muted }}>Quick Panel</p>

          {/* Live match widget */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: G.card2, border: `1px solid ${G.cardBorder}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Live Match</span>
              <Badge>🔴 Live</Badge>
            </div>
            <p className="text-sm font-bold leading-snug" style={{ color: G.text }}>{LIVE_MATCH.event}</p>
            <p className="text-xs" style={{ color: G.muted }}>{LIVE_MATCH.score} · {LIVE_MATCH.status}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center rounded-lg py-1.5 text-xs font-bold" style={{ background: G.dark, color: G.text2 }}>{LIVE_MATCH.players[0]}</div>
              <span className="text-xs font-black" style={{ color: G.lime }}>vs</span>
              <div className="flex-1 text-center rounded-lg py-1.5 text-xs font-bold" style={{ background: G.dark, color: G.text2 }}>{LIVE_MATCH.players[1]}</div>
            </div>
            <ActionBtn fullWidth onClick={() => handleSectionChange('Watch Match')}>▶ Watch Now</ActionBtn>
          </div>

          {/* Top player widget */}
          <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Top Player</span>
            <p className="text-sm font-bold" style={{ color: G.text }}>{players[0]?.name}</p>
            <p className="text-xs" style={{ color: G.muted }}>{players[0]?.country} · {players[0]?.ranking} · {players[0]?.wins} wins</p>
            <ActionBtn fullWidth variant="ghost" onClick={() => handleSectionChange('Players')}>View all players</ActionBtn>
          </div>

          {/* Org spotlight widget */}
          <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>Org Spotlight</span>
            <p className="text-sm font-bold" style={{ color: G.text }}>{selectedOrg?.name}</p>
            <p className="text-xs" style={{ color: G.muted }}>{selectedOrg?.city}, {selectedOrg?.country}</p>
            <p className="text-xs" style={{ color: G.muted2 }}>{selectedOrg?.members} members · {selectedOrg?.events} events</p>
            <ActionBtn fullWidth variant="ghost" onClick={() => handleSectionChange('Organizations')}>Explore clubs</ActionBtn>
          </div>

          {/* CTA */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: `${G.lime}10`, border: `1px solid ${G.cardBorder}` }}
          >
            <p className="text-xs font-semibold" style={{ color: G.lime }}>Ready to compete?</p>
            <p className="text-xs leading-relaxed" style={{ color: G.muted }}>Apply to join a club as a player, coach, or referee.</p>
            <ActionBtn fullWidth onClick={() => handleSectionChange('Apply')}>Apply Now</ActionBtn>
          </div>
        </aside>
      </div>
    </div>
  );
};