'use client';

import React, { useState } from 'react';
import Link from 'next/link';
// ─── Reusable Card Shell ──────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1a3020] border border-[#2d5a35] rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-bold text-[#7dc142] tracking-wide">{children}</h3>
    {action}
  </div>
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const StatPill: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex-1 text-center rounded-lg py-2.5 ${highlight ? 'bg-[#7dc142]' : 'bg-[#2d5a27]'}`}>
    <div className={`text-xl font-black ${highlight ? 'text-[#0f1f0f]' : 'text-[#a8d84e]'}`}>{value}</div>
    <div className={`text-[10px] mt-0.5 ${highlight ? 'text-[#0f1f0f]/70' : 'text-[#7aaa6a]'}`}>{label}</div>
  </div>
);

// ─── ProfileSnapshot ──────────────────────────────────────────────────────────

export const ProfileSnapshot: React.FC<{ user: any; playerData: any; showViewProfileButton?: boolean }> = ({ user, playerData, showViewProfileButton = true }) => (
  <Card className="text-center">
    <div className="flex justify-center mb-3">
      {user?.photo ? (
        <img src={user.photo} alt={user.firstName} className="w-14 h-14 rounded-full border-2 border-[#7dc142] object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-[#3d7a32] border-2 border-[#7dc142] flex items-center justify-center text-2xl">👤</div>
      )}
    </div>
    <div className="font-black text-[#e8f5e0] text-sm">{user?.firstName ?? 'John'} {user?.lastName ?? 'Smith'}</div>
    <div className="text-[#7aaa6a] text-[10px] mt-0.5">Rank #{playerData?.rank || 5} · {playerData?.player?.points || 1050} pts</div>
    <div className="flex gap-2 mt-3 justify-center">
      <span className="bg-[#152515] text-[#e8f5e0] text-[10px] rounded px-2 py-0.5">{playerData?.player?.matchesWon || 18}W</span>
      <span className="bg-[#152515] text-[#e8f5e0] text-[10px] rounded px-2 py-0.5">{playerData?.player?.matchesLost || 5}L</span>
      <span className="bg-[#7dc142] text-[#0f1f0f] text-[10px] font-bold rounded px-2 py-0.5">{playerData?.player?.winRate || 78}%</span>
    </div>
    {showViewProfileButton && (
      <div className="mt-3 pt-3 border-t border-[#2d5a35]">
        <Link href="/profile">
          <button className="w-full bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7dc142] text-xs font-bold rounded-lg py-2 transition-colors">
            View Profile →
          </button>
        </Link>
      </div>
    )}
  </Card>
);

// ─── UpcomingEvents ───────────────────────────────────────────────────────────

export const UpcomingEvents: React.FC<{ events: { name: string; date: string; icon: string }[] }> = ({ events }) => (
  <Card>
    <SectionTitle>📆 Upcoming Events</SectionTitle>
    <div className="space-y-1.5 mb-3">
      {events.map((e, i) => (
        <div key={i} className="flex gap-2.5 items-center px-3 py-2.5 bg-[#152515] border border-[#2d5a35] rounded-lg hover:border-[#7dc142]/50 transition-colors">
          <span className="text-lg">{e.icon}</span>
          <div>
            <div className="text-xs font-semibold text-[#e8f5e0]">{e.name}</div>
            <div className="text-[10px] text-[#7aaa6a]">{e.date}</div>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] text-xs font-bold rounded-lg py-2 transition-colors">
      + Add Event
    </button>
  </Card>
);

// ─── Recent Results ───────────────────────────────────────────────────────────

const RecentResults: React.FC = () => {
  const results = [
    { opponent: 'Alex K.', score: '6-3, 6-4', result: 'W', date: 'Mar 22' },
    { opponent: 'Sam T.', score: '4-6, 7-5, 6-2', result: 'W', date: 'Mar 19' },
    { opponent: 'Mike R.', score: '3-6, 4-6', result: 'L', date: 'Mar 17' },
    { opponent: 'Chris D.', score: '6-1, 6-0', result: 'W', date: 'Mar 14' },
  ];
  return (
    <Card>
      <SectionTitle action={<Link href="/matches"><span className="text-[10px] text-[#7dc142] cursor-pointer hover:underline">All Results</span></Link>}>
        📋 Recent Results
      </SectionTitle>
      <div className="space-y-1.5">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#152515] border border-[#2d5a35] rounded-lg">
            <span className={`text-[10px] font-black w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${r.result === 'W' ? 'bg-[#7dc142] text-[#0f1f0f]' : 'bg-red-900/60 text-red-400'}`}>
              {r.result}
            </span>
            <span className="flex-1 text-xs font-semibold text-[#e8f5e0]">vs {r.opponent}</span>
            <span className="text-[10px] text-[#7aaa6a] font-mono">{r.score}</span>
            <span className="text-[9px] text-[#7aaa6a]">{r.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Achievements ──────────────────────────────────────────────────────────────

const Achievements: React.FC = () => {
  const badges = [
    { icon: '🏆', label: 'Champion', unlocked: true },
    { icon: '🔥', label: '5-Win Streak', unlocked: true },
    { icon: '⚡', label: 'Fastest Serve', unlocked: true },
    { icon: '🎯', label: 'Ace Master', unlocked: false },
    { icon: '💎', label: 'Diamond Tier', unlocked: false },
    { icon: '👑', label: 'League King', unlocked: false },
  ];
  return (
    <Card>
      <SectionTitle action={<span className="text-[10px] text-[#7aaa6a]">4 / 12 unlocked</span>}>
        🏅 Achievements
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {badges.map(b => (
          <div key={b.label} className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${b.unlocked ? 'bg-[#2d5a27] border-[#7dc142]' : 'bg-[#152515] border-[#2d5a35] opacity-40'}`}>
            <span className="text-xl">{b.icon}</span>
            <span className="text-[8px] font-bold text-[#7aaa6a] text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Main DashboardHome ────────────────────────────────────────────────────────

interface DashboardHomeProps {
  playerData: any;
  upcomingMatches: any[];
  leaderboard: any[];
  activityFeed: any[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  playerData,
  upcomingMatches,
  leaderboard,
  activityFeed,
}) => {
  const [feedPost, setFeedPost] = useState('');

  return (
    <div className="space-y-3">

      {/* ── Top KPI Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Upcoming Matches', value: upcomingMatches?.length || 0, icon: '📅', sub: 'next match planned' },
          { label: 'Matches Played', value: playerData?.player?.matchesPlayed ?? 0, icon: '🎾', sub: 'season total' },
          { label: 'Current Rank', value: `#${playerData?.rank ?? '-'}`, icon: '🏅', sub: 'live ranking' },
          { label: 'Win Rate', value: `${playerData?.player?.winRate ?? 0}%`, icon: '📈', sub: 'backend score' },
        ].map((s, i) => (
          <Card key={i} className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{s.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-[#7aaa6a] font-medium truncate">{s.label}</div>
              <div className="text-2xl font-black text-[#a8d84e] leading-tight">{s.value}</div>
              <div className="text-[9px] text-[#3d7a32] font-semibold mt-0.5">{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Main Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Next Match – spans 2 cols */}
        <Card className="col-span-1 lg:col-span-2 bg-gradient-to-br from-[#2d5a27] to-[#1a3020] border-[#7dc142]">
          <SectionTitle>
            <span className="text-[#a8d84e]">NEXT MATCH</span>
          </SectionTitle>
          <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="text-2xl font-black text-[#e8f5e0] leading-tight mb-1">
                John Smith <span className="text-[#7aaa6a] font-normal text-lg">vs</span> {upcomingMatches[0]?.opponent || 'Opponent'}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[#7aaa6a]">📅 {upcomingMatches[0]?.date || 'Tomorrow, 3:00 PM'}</span>
                <span className="text-xs text-[#7aaa6a]">📍 {upcomingMatches[0]?.court || 'Court 2'}</span>
                <span className="text-xs bg-[#7dc142]/20 text-[#7dc142] px-2 py-0.5 rounded-full border border-[#7dc142]/40">
                  {upcomingMatches[0]?.type || 'Singles'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button className="w-full sm:w-auto bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  View Details
                </button>
                <button className="w-full sm:w-auto bg-transparent text-[#7dc142] border border-[#7dc142] hover:bg-[#7dc142]/10 font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  Check In
                </button>
              </div>
            </div>
            <span className="text-7xl opacity-10 select-none">🎾</span>
          </div>

          {/* More upcoming */}
          {upcomingMatches.length > 1 && (
            <div className="mt-4 pt-3 border-t border-[#2d5a35]">
              <div className="text-[10px] text-[#7aaa6a] font-bold uppercase tracking-wider mb-2">More Upcoming</div>
              <div className="space-y-1">
                {upcomingMatches.slice(1).map((m: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 px-2 rounded hover:bg-[#2d5a27]/40 transition-colors">
                    <span className="text-[#e8f5e0]">vs {m.opponent} — {m.date}</span>
                    <span className="text-[#7dc142]">{m.court}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Leaderboard */}
        <Card>
          <SectionTitle action={<Link href="/leaderboard"><span className="text-[10px] text-[#7dc142] cursor-pointer hover:underline">View All</span></Link>}>
            🏆 Leaderboard
          </SectionTitle>
          <div className="space-y-1">
            {leaderboard.map((p: any) => (
              <div
                key={p.rank}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  p.rank === 1 ? 'bg-[#2d5a27] border border-[#7dc142]/40' : 'hover:bg-[#152515]'
                }`}
              >
                <span className="w-5 text-center text-xs flex-shrink-0">
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
                </span>
                <span className={`flex-1 text-[#e8f5e0] truncate ${p.rank <= 3 ? 'font-bold' : ''}`}>{p.name}</span>
                <span className="text-[#a8d84e] font-bold text-[10px] flex-shrink-0">{p.ratingPoints?.toLocaleString?.() ?? 0}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-1.5 text-xs text-[#7aaa6a] hover:text-[#e8f5e0] border border-[#2d5a35] rounded-lg transition-colors">
            See full rankings →
          </button>
        </Card>
      </div>

      {/* ── Stats + Activity Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* My Stats */}
        <Card className="flex flex-col gap-4">
          <SectionTitle>📊 My Stats</SectionTitle>

          <div className="flex gap-2">
            <StatPill label="Wins" value={playerData?.player?.matchesWon || 18} />
            <StatPill label="Losses" value={playerData?.player?.matchesLost || 5} />
            <StatPill label="Win Rate" value={`${playerData?.player?.winRate || 78}%`} highlight />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { l: 'Sets Won', v: playerData?.player?.setsWon || 38 },
              { l: 'Sets Lost', v: playerData?.player?.setsLost || 21 },
              { l: 'Ranking', v: `#${playerData?.rank || 5}` },
              { l: 'Points', v: playerData?.player?.points || 1050 },
            ].map(s => (
              <div key={s.l} className="bg-[#2d5a27] rounded-lg px-3 py-2">
                <div className="text-[9px] text-[#7aaa6a]">{s.l}</div>
                <div className="text-base font-black text-[#a8d84e]">{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle>💬 Activity Feed</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                value={feedPost}
                onChange={e => setFeedPost(e.target.value)}
                placeholder="Post an update…"
                className="bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-lg px-3 py-1.5 text-xs w-full sm:w-44 outline-none focus:border-[#7dc142] transition-colors placeholder-[#7aaa6a]"
              />
              <button className="w-full sm:w-auto bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
                Post ▼
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-56">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex gap-3 px-3 py-2.5 bg-[#0f1f0f] rounded-lg">
                <span className="text-2xl flex-shrink-0">{item.avatar}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#e8f5e0]">{item.user} </span>
                  <span className="text-xs text-[#7aaa6a]">{item.action}</span>
                  <div className="text-[9px] text-[#3d7a32] mt-1">{item.time}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0 self-start">
                  <button className="bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7aaa6a] rounded px-2 py-1 text-[10px] transition-colors">👍</button>
                  <button className="bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7aaa6a] rounded px-2 py-1 text-[10px] transition-colors">💬</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-[#2d5a35]">
            {[
              { icon: '🔗', label: 'Quick Links' },
              { icon: '🤝', label: 'Find a Partner' },
              { icon: '🎾', label: 'Tennis Tips' },
            ].map(b => (
              <button key={b.label} className="flex-1 bg-[#2d5a27] hover:bg-[#3d7a32] text-[#e8f5e0] font-bold text-xs rounded-lg py-2.5 transition-colors">
                {b.icon} {b.label} →
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Bottom Row: Achievements + Recent Results ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Achievements />
        <RecentResults />
      </div>

    </div>
  );
};

export default DashboardHome;
