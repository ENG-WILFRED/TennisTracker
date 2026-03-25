'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ─── Tiny SVG Charts ──────────────────────────────────────────────────────────

const BarChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t transition-all ${i === data.length - 1 ? 'bg-[#7dc142]' : 'bg-[#3d7a32]'}`}
          style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
        />
      ))}
    </div>
  );
};

const LineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 120},${40 - ((v - min) / (max - min)) * 34}`)
    .join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dc142" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7dc142" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${pts} 120,40`} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke="#7dc142" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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

export const ProfileSnapshot: React.FC<{ user: any; playerData: any }> = ({ user, playerData }) => (
  <Card className="text-center">
    <div className="flex justify-center mb-3">
      {user?.photo ? (
        <img src={user.photo} alt={user.firstName} className="w-14 h-14 rounded-full border-2 border-[#7dc142] object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-[#3d7a32] border-2 border-[#7dc142] flex items-center justify-center text-2xl">👤</div>
      )}
    </div>
    <div className="font-black text-[#e8f5e0] text-sm">{user?.firstName ?? 'John'} {user?.lastName ?? 'Smith'}</div>
    <div className="text-[#7aaa6a] text-[10px] mt-0.5">Rank #{playerData?.rank || 5} · {playerData?.points || 1050} pts</div>
    <div className="flex gap-2 mt-3 justify-center">
      <span className="bg-[#152515] text-[#e8f5e0] text-[10px] rounded px-2 py-0.5">{playerData?.matchesWon || 18}W</span>
      <span className="bg-[#152515] text-[#e8f5e0] text-[10px] rounded px-2 py-0.5">{playerData?.matchesLost || 5}L</span>
      <span className="bg-[#7dc142] text-[#0f1f0f] text-[10px] font-bold rounded px-2 py-0.5">{playerData?.winRate || 78}%</span>
    </div>
    <div className="mt-3 pt-3 border-t border-[#2d5a35]">
      <Link href="/profile">
        <button className="w-full bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7dc142] text-xs font-bold rounded-lg py-2 transition-colors">
          View Profile →
        </button>
      </Link>
    </div>
  </Card>
);

// ─── FriendsOnline ────────────────────────────────────────────────────────────

export interface FriendItem {
  name: string;
  status: 'online' | 'away' | 'offline';
  avatar: string;
}

export const FriendsOnline: React.FC<{ friends: FriendItem[] }> = ({ friends }) => (
  <Card>
    <SectionTitle action={<span className="text-[10px] text-[#7dc142] cursor-pointer hover:underline">See All</span>}>
      🟢 Friends Online
    </SectionTitle>
    <div className="space-y-1.5">
      {friends.map((f, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#152515] border border-[#2d5a35] rounded-lg hover:border-[#7dc142]/50 transition-colors cursor-pointer">
          <span className="text-xl">{f.avatar}</span>
          <span className="flex-1 text-xs font-semibold text-[#e8f5e0]">{f.name}</span>
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: f.status === 'online' ? '#5fc45f' : f.status === 'away' ? '#ffa726' : '#666' }}
          />
        </div>
      ))}
    </div>
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

// ─── Quick Actions ─────────────────────────────────────────────────────────────

const QuickActions: React.FC = () => (
  <Card>
    <SectionTitle>⚡ Quick Actions</SectionTitle>
    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: '🎾', label: 'Book Court' },
        { icon: '🤝', label: 'Find Partner' },
        { icon: '🏆', label: 'Enter Tournament' },
        { icon: '📊', label: 'View Stats' },
      ].map(a => (
        <button key={a.label} className="flex flex-col items-center gap-1.5 py-3 bg-[#152515] border border-[#2d5a35] rounded-xl hover:border-[#7dc142]/60 hover:bg-[#2d5a27]/30 transition-all group">
          <span className="text-xl">{a.icon}</span>
          <span className="text-[10px] font-bold text-[#7aaa6a] group-hover:text-[#7dc142] transition-colors">{a.label}</span>
        </button>
      ))}
    </div>
  </Card>
);

// ─── Weather / Court Conditions ────────────────────────────────────────────────

const CourtConditions: React.FC = () => (
  <Card>
    <SectionTitle>🌤️ Court Conditions</SectionTitle>
    <div className="flex items-center gap-3 mb-3">
      <span className="text-4xl">🌤️</span>
      <div>
        <div className="text-2xl font-black text-[#a8d84e]">28°C</div>
        <div className="text-xs text-[#7aaa6a]">Partly Cloudy · Wind 12 km/h</div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Humidity', value: '55%' },
        { label: 'UV Index', value: '6' },
        { label: 'Visibility', value: 'Good' },
      ].map(w => (
        <div key={w.label} className="text-center bg-[#152515] rounded-lg py-2">
          <div className="text-sm font-bold text-[#a8d84e]">{w.value}</div>
          <div className="text-[9px] text-[#7aaa6a]">{w.label}</div>
        </div>
      ))}
    </div>
    <div className="mt-2.5 px-3 py-2 bg-[#2d5a27]/40 border border-[#3d7a32] rounded-lg text-[10px] text-[#7dc142] font-semibold">
      ✅ Conditions are ideal for play today
    </div>
  </Card>
);

// ─── Recent Results ────────────────────────────────────────────────────────────

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
      <div className="grid grid-cols-6 gap-2">
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
    <div className="space-y-4">

      {/* ── Top KPI Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Upcoming Matches', value: upcomingMatches?.length || 3, icon: '📅', sub: 'next: tomorrow' },
          { label: 'Players Online', value: 12, icon: '🟢', sub: 'in your area' },
          { label: 'My Ranking', value: `#${playerData?.rank || 5}`, icon: '🏅', sub: '↑ 2 this week' },
          { label: 'Win Rate', value: `${playerData?.winRate || 78}%`, icon: '📈', sub: 'last 30 days' },
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
      <div className="grid grid-cols-3 gap-4">

        {/* Next Match – spans 2 cols */}
        <Card className="col-span-2 bg-gradient-to-br from-[#2d5a27] to-[#1a3020] border-[#7dc142]">
          <SectionTitle>
            <span className="text-[#a8d84e]">NEXT MATCH</span>
          </SectionTitle>
          <div className="flex justify-between items-start">
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
              <div className="flex gap-2 mt-4">
                <button className="bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  View Details
                </button>
                <button className="bg-transparent text-[#7dc142] border border-[#7dc142] hover:bg-[#7dc142]/10 font-bold text-xs px-4 py-2 rounded-lg transition-colors">
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
                <span className="text-[#a8d84e] font-bold text-[10px] flex-shrink-0">{p.pts.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-1.5 text-xs text-[#7aaa6a] hover:text-[#e8f5e0] border border-[#2d5a35] rounded-lg transition-colors">
            See full rankings →
          </button>
        </Card>
      </div>

      {/* ── Stats + Activity Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* My Stats */}
        <Card className="flex flex-col gap-4">
          <SectionTitle>📊 My Stats</SectionTitle>

          <div className="flex gap-2">
            <StatPill label="Wins" value={playerData?.matchesWon || 18} />
            <StatPill label="Losses" value={playerData?.matchesLost || 5} />
            <StatPill label="Win Rate" value={`${playerData?.winRate || 78}%`} highlight />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#7aaa6a] mb-1.5">
              <span>Matches Played (12 mo)</span>
              <span className="text-[#7dc142]">↗</span>
            </div>
            <div className="bg-[#0f1f0f] rounded-lg px-3 pt-2 pb-1">
              <BarChart data={[12, 18, 14, 22, 16, 25, 20, 18, 24, 21, 19, 23]} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#7aaa6a] mb-1.5">
              <span>Performance Trend</span>
              <span className="text-[#7dc142]">↗</span>
            </div>
            <div className="bg-[#0f1f0f] rounded-lg px-3 pt-2 pb-1">
              <LineChart data={[40, 55, 48, 62, 58, 70, 65, 72, 68, 78, 74, 80]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Sets Won', v: playerData?.setsWon || 38 },
              { l: 'Sets Lost', v: playerData?.setsLost || 21 },
              { l: 'Ranking', v: `#${playerData?.rank || 5}` },
              { l: 'Points', v: playerData?.points || 1050 },
            ].map(s => (
              <div key={s.l} className="bg-[#2d5a27] rounded-lg px-3 py-2">
                <div className="text-[9px] text-[#7aaa6a]">{s.l}</div>
                <div className="text-base font-black text-[#a8d84e]">{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Feed – spans 2 cols */}
        <Card className="col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionTitle>💬 Activity Feed</SectionTitle>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <input
                value={feedPost}
                onChange={e => setFeedPost(e.target.value)}
                placeholder="Post an update…"
                className="bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-lg px-3 py-1.5 text-xs w-44 outline-none focus:border-[#7dc142] transition-colors placeholder-[#7aaa6a]"
              />
              <button className="bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
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

          <div className="flex gap-2 pt-1 border-t border-[#2d5a35]">
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

      {/* ── Bottom Row: Achievements + Recent Results + Sidebar Widgets ──── */}
      <Achievements />

      <div className="grid grid-cols-3 gap-4">
        <RecentResults />
        <CourtConditions />
        <QuickActions />
      </div>

      {/* ── Sidebar extras (Friends + Events) ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <FriendsOnline
          friends={[
            { name: 'Alex Kim', status: 'online', avatar: '🧑' },
            { name: 'Sara Patel', status: 'online', avatar: '👩' },
            { name: 'Chris Do', status: 'away', avatar: '🧔' },
            { name: 'Mia Torres', status: 'offline', avatar: '👩‍🦱' },
          ]}
        />
        <UpcomingEvents
          events={[
            { name: 'Club Championship', date: 'Apr 5 · 9:00 AM', icon: '🏆' },
            { name: 'Doubles Friendly', date: 'Apr 10 · 4:00 PM', icon: '🎾' },
            { name: 'Coaching Session', date: 'Apr 14 · 7:00 AM', icon: '🎓' },
          ]}
        />
      </div>

    </div>
  );
};

export default DashboardHome;