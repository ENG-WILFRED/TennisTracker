'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Deep forest green theme with lime accents and rich dark backgrounds

// ─── Utility Components ───────────────────────────────────────────────────────

const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}> = ({ children, className = '', glow = false }) => (
  <div
    className={`
      relative bg-[#111c12] border border-[#243d27] rounded-2xl p-5 overflow-hidden
      ${glow ? 'shadow-[0_0_30px_rgba(125,193,66,0.08)]' : ''}
      ${className}
    `}
  >
    {/* subtle inner top highlight */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7dc142]/20 to-transparent" />
    {children}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#7dc142]">{children}</span>
    {action && <span className="text-[10px] text-[#4d8a56] hover:text-[#7dc142] transition-colors cursor-pointer">{action}</span>}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: 'green' | 'dark' | 'outline' }> = ({ children, variant = 'dark' }) => {
  const styles = {
    green: 'bg-[#7dc142] text-[#0a1a0b] font-black',
    dark: 'bg-[#1e3321] text-[#7dc142] border border-[#2d5a35]',
    outline: 'border border-[#7dc142]/40 text-[#7dc142]',
  };
  return (
    <span className={`inline-flex items-center text-[10px] rounded-full px-2.5 py-0.5 font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
};

// ─── Profile Snapshot ─────────────────────────────────────────────────────────

export const ProfileSnapshot: React.FC<{
  user: any;
  playerData: any;
  showViewProfileButton?: boolean;
}> = ({ user, playerData, showViewProfileButton = true }) => {
  const displayName = `${user?.firstName || playerData?.player?.firstName || 'Player'} ${user?.lastName || playerData?.player?.lastName || ''}`.trim();

  return (
    <Card glow className="flex flex-col items-center text-center gap-3">
      <div className="relative">
        {user?.photo || playerData?.player?.photo ? (
          <img
            src={user?.photo || playerData?.player?.photo}
            alt={displayName}
            className="w-16 h-16 rounded-2xl border-2 border-[#7dc142]/60 object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2d5a27] to-[#1a3020] border-2 border-[#7dc142]/60 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#7dc142] border-2 border-[#111c12]" />
      </div>

      <div>
        <div className="font-black text-[#e8f5e0] text-sm tracking-wide">{displayName}</div>
        <div className="text-[#4d8a56] text-[11px] mt-0.5">
          Rank #{playerData?.rank ?? '—'} · {playerData?.player?.points ?? '—'} pts
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="dark">{playerData?.player?.matchesWon ?? '—'}W</Badge>
        <Badge variant="dark">{playerData?.player?.matchesLost ?? '—'}L</Badge>
        <Badge variant="green">
          {playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—'}
        </Badge>
      </div>

      {showViewProfileButton && (
        <Link href="/profile" className="w-full">
          <button className="w-full bg-[#1e3321] hover:bg-[#2d5a27] border border-[#2d5a35] hover:border-[#7dc142]/50 text-[#7dc142] text-xs font-bold rounded-xl py-2 transition-all">
            View Profile →
          </button>
        </Link>
      )}
    </Card>
  );
};

// ─── Upcoming Events ──────────────────────────────────────────────────────────

export const UpcomingEvents: React.FC<{
  events: { name: string; date: string; icon: string }[];
}> = ({ events }) => (
  <Card>
    <SectionLabel>📆 Upcoming Events</SectionLabel>
    <div className="space-y-2 mb-4">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex gap-3 items-center px-3 py-3 bg-[#0d160e] border border-[#1e3321] hover:border-[#7dc142]/40 rounded-xl transition-all cursor-pointer group"
        >
          <span className="text-xl">{e.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#e8f5e0] group-hover:text-[#a8d84e] transition-colors truncate">{e.name}</div>
            <div className="text-[10px] text-[#4d8a56] mt-0.5">{e.date}</div>
          </div>
          <span className="text-[#4d8a56] group-hover:text-[#7dc142] text-xs transition-colors">→</span>
        </div>
      ))}
    </div>
    <button className="w-full bg-[#7dc142] hover:bg-[#a8d84e] text-[#0a1a0b] text-xs font-black rounded-xl py-2.5 transition-colors">
      + Add Event
    </button>
  </Card>
);

// ─── Recent Results ───────────────────────────────────────────────────────────

const RecentResults: React.FC<{ results?: any[] }> = ({ results }) => (
  <Card>
    <SectionLabel action={<Link href="/matches">All Results →</Link>}>📋 Recent Results</SectionLabel>

    {!results || results.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[#1e3321] bg-[#0d160e] p-8 text-center">
        <div className="text-2xl mb-2">🎾</div>
        <div className="text-xs text-[#4d8a56]">No results yet. Match history will appear here once connected.</div>
      </div>
    ) : (
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#0d160e] border border-[#1e3321] hover:border-[#243d27] rounded-xl transition-colors">
            <span className={`text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
              r.result === 'W' ? 'bg-[#7dc142] text-[#0a1a0b]' : 'bg-red-950 text-red-400 border border-red-900'
            }`}>
              {r.result}
            </span>
            <span className="flex-1 text-xs font-semibold text-[#c8e8b8]">vs {r.opponent}</span>
            <span className="text-[11px] text-[#7dc142] font-mono font-bold">{r.score}</span>
            <span className="text-[9px] text-[#4d8a56] hidden sm:block">{r.date}</span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

// ─── Achievements ─────────────────────────────────────────────────────────────

const Achievements: React.FC<{ badges?: any[] }> = ({ badges }) => (
  <Card>
    <SectionLabel
      action={badges?.length ? `${badges.filter((b) => b.unlocked).length}/${badges.length} unlocked` : undefined}
    >
      🏅 Achievements
    </SectionLabel>

    {!badges || badges.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[#1e3321] bg-[#0d160e] p-8 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-xs text-[#4d8a56]">Achievements will display here once backend data is connected.</div>
      </div>
    ) : (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {badges.map((b) => (
          <div
            key={b.id || b.label}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
              b.unlocked
                ? 'bg-[#1e3321] border-[#7dc142]/50 shadow-[0_0_12px_rgba(125,193,66,0.1)]'
                : 'bg-[#0d160e] border-[#1e3321] opacity-35'
            }`}
          >
            <span className="text-2xl">{b.icon || '🏅'}</span>
            <span className="text-[9px] font-bold text-[#7aaa6a] text-center leading-tight px-1">{b.label || b.name}</span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

// ─── Stat Row ─────────────────────────────────────────────────────────────────

const StatBox: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`rounded-xl px-3 py-3 flex flex-col gap-0.5 ${accent ? 'bg-[#7dc142]' : 'bg-[#0d160e] border border-[#1e3321]'}`}>
    <span className={`text-[9px] uppercase tracking-widest font-bold ${accent ? 'text-[#0a1a0b]/60' : 'text-[#4d8a56]'}`}>{label}</span>
    <span className={`text-xl font-black ${accent ? 'text-[#0a1a0b]' : 'text-[#a8d84e]'}`}>{value}</span>
  </div>
);

// ─── Main DashboardHome ───────────────────────────────────────────────────────

interface DashboardHomeProps {
  playerData: any;
  upcomingMatches: any[];
  leaderboard: any[];
  activityFeed: any[];
  recentResults?: any[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  playerData,
  upcomingMatches,
  leaderboard,
  activityFeed,
  recentResults = [],
}) => {
  const [feedPost, setFeedPost] = useState('');
  const [sendingReminder, setSendingReminder] = useState<Record<string, boolean>>({});
  const [reminderStatus, setReminderStatus] = useState<Record<string, string>>({});
  const nextMatch = upcomingMatches?.[0];
  const playerName = playerData?.player?.firstName || 'Player';
  const opponentName = nextMatch?.opponent || 'Opponent';
  const matchDateText = nextMatch?.date ? new Date(nextMatch.date).toLocaleString() : 'TBD';
  const matchCourt = nextMatch?.court || nextMatch?.courtName || 'TBD';
  const matchType = nextMatch?.type || 'Singles';
  const leaderboardPresent = leaderboard?.length > 0;
  const activityPresent = activityFeed?.length > 0;

  const handleRemindCoach = async (coachId: string) => {
    const playerId = playerData?.player?.id;
    if (!playerId) return;

    setSendingReminder((prev) => ({ ...prev, [coachId]: true }));
    setReminderStatus((prev) => ({ ...prev, [coachId]: 'Sending reminder…' }));

    try {
      const response = await fetch(`/api/players/${encodeURIComponent(playerId)}/remind-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setReminderStatus((prev) => ({
          ...prev,
          [coachId]: result?.error || 'Unable to send reminder',
        }));
      } else {
        setReminderStatus((prev) => ({
          ...prev,
          [coachId]: result?.message || 'Reminder sent',
        }));
      }
    } catch (error) {
      setReminderStatus((prev) => ({
        ...prev,
        [coachId]: error instanceof Error ? error.message : 'Network error',
      }));
    } finally {
      setSendingReminder((prev) => ({ ...prev, [coachId]: false }));
    }
  };

  return (
    <div className="space-y-4 px-1">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', value: upcomingMatches?.length ?? '—', icon: '📅', sub: 'matches' },
          { label: 'Played', value: playerData?.player?.matchesPlayed ?? '—', icon: '🎾', sub: 'this season' },
          { label: 'Rank', value: playerData?.rank != null ? `#${playerData.rank}` : '—', icon: '🏅', sub: 'live ranking' },
          { label: 'Win Rate', value: playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—', icon: '📈', sub: 'overall' },
        ].map((s, i) => (
          <Card key={i} className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 rounded-xl bg-[#1e3321] flex items-center justify-center text-lg flex-shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-[#4d8a56] font-bold">{s.label}</div>
              <div className="text-xl font-black text-[#a8d84e] leading-none mt-0.5">{s.value}</div>
              <div className="text-[9px] text-[#2d5a27] mt-0.5">{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Next Match + Leaderboard ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Next Match Card – 2 cols */}
        <div className="lg:col-span-2">
          <Card glow className="h-full bg-gradient-to-br from-[#152817] to-[#0d160e] border-[#2d5a35]">
            <SectionLabel>🎾 Next Match</SectionLabel>

            {nextMatch ? (
              <>
                {/* Matchup */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#4d8a56] uppercase tracking-wider mb-1">You</div>
                    <div className="text-lg font-black text-[#e8f5e0] truncate">{playerName}</div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-[#1e3321] border border-[#7dc142]/30 flex items-center justify-center text-lg">⚔️</div>
                    <span className="text-[9px] font-black text-[#7dc142] tracking-widest uppercase">VS</span>
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] text-[#4d8a56] uppercase tracking-wider mb-1">Opponent</div>
                    <div className="text-lg font-black text-[#e8f5e0] truncate">{opponentName}</div>
                  </div>
                </div>

                {/* Match Meta */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Date', value: matchDateText, icon: '📅' },
                    { label: 'Court', value: matchCourt, icon: '📍' },
                    { label: 'Type', value: matchType, icon: '🏷️' },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#0d160e] border border-[#1e3321] rounded-xl px-3 py-2.5 text-center">
                      <div className="text-base">{m.icon}</div>
                      <div className="text-[9px] text-[#4d8a56] uppercase tracking-wider mt-1">{m.label}</div>
                      <div className="text-[11px] font-bold text-[#c8e8b8] mt-0.5 truncate">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-[#7dc142] hover:bg-[#a8d84e] text-[#0a1a0b] font-black text-xs rounded-xl py-2.5 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 bg-[#1e3321] hover:bg-[#2d5a27] border border-[#2d5a35] hover:border-[#7dc142]/50 text-[#7dc142] font-bold text-xs rounded-xl py-2.5 transition-colors">
                    Check In
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1e3321] border border-dashed border-[#2d5a35] flex items-center justify-center text-3xl">
                  🎾
                </div>
                <div>
                  <div className="text-sm font-bold text-[#e8f5e0]">No upcoming match</div>
                  <div className="text-xs text-[#4d8a56] mt-1 max-w-xs">
                    Match scheduling is not connected yet. Your next match details will appear once the backend provides them.
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button disabled className="bg-[#1e3321] border border-[#1e3321] text-[#4d8a56] text-xs rounded-xl px-4 py-2 cursor-not-allowed opacity-50">
                    View Details
                  </button>
                  <button disabled className="bg-[#1e3321] border border-[#1e3321] text-[#4d8a56] text-xs rounded-xl px-4 py-2 cursor-not-allowed opacity-50">
                    Check In
                  </button>
                </div>
              </div>
            )}

            {/* More upcoming */}
            {upcomingMatches.length > 1 && (
              <div className="mt-4 pt-4 border-t border-[#1e3321]">
                <div className="text-[9px] uppercase tracking-widest text-[#4d8a56] font-black mb-2">More Upcoming</div>
                <div className="space-y-1.5">
                  {upcomingMatches.slice(1).map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-lg hover:bg-[#1e3321] transition-colors cursor-pointer">
                      <span className="text-[#c8e8b8] font-medium">vs {m.opponent}</span>
                      <span className="text-[#4d8a56] text-[10px]">{new Date(m.date).toLocaleDateString()}</span>
                      <span className="text-[#7dc142] text-[10px]">{m.court || 'TBD'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Leaderboard – 1 col */}
        <Card className="flex flex-col">
          <SectionLabel action={<Link href="/leaderboard">View All →</Link>}>🏆 Leaderboard</SectionLabel>

          {leaderboardPresent ? (
            <div className="flex-1 space-y-1.5">
              {leaderboard.map((p: any) => (
                <div
                  key={p.rank}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all ${
                    p.rank === 1
                      ? 'bg-[#1e3321] border border-[#7dc142]/40 shadow-[0_0_12px_rgba(125,193,66,0.08)]'
                      : 'hover:bg-[#0d160e] border border-transparent hover:border-[#1e3321]'
                  }`}
                >
                  <span className="w-5 text-center text-xs flex-shrink-0">
                    {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : <span className="text-[#4d8a56] font-bold">{p.rank}</span>}
                  </span>
                  <span className={`flex-1 truncate ${p.rank <= 3 ? 'font-bold text-[#e8f5e0]' : 'text-[#c8e8b8]'}`}>{p.name}</span>
                  <span className="text-[#7dc142] font-black text-[10px] flex-shrink-0 font-mono">
                    {p.ratingPoints?.toLocaleString?.() ?? 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
              <div className="text-2xl">🏆</div>
              <div className="text-xs text-[#4d8a56]">Rankings will appear once backend data is available.</div>
            </div>
          )}

          <Link href="/leaderboard">
            <button className="w-full mt-4 py-2 text-xs text-[#4d8a56] hover:text-[#7dc142] border border-[#1e3321] hover:border-[#243d27] rounded-xl transition-all">
              See full rankings →
            </button>
          </Link>
        </Card>
      </div>

      {/* ── Stats + Activity Feed ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* My Stats – 2 cols */}
        <Card className="lg:col-span-2">
          <SectionLabel>📊 My Stats</SectionLabel>

          {/* Big three */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatBox label="Wins" value={playerData?.player?.matchesWon ?? '—'} />
            <StatBox label="Losses" value={playerData?.player?.matchesLost ?? '—'} />
            <StatBox label="Win %" value={playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—'} accent />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Sets Won', v: playerData?.player?.setsWon ?? '—' },
              { l: 'Sets Lost', v: playerData?.player?.setsLost ?? '—' },
              { l: 'Ranking', v: playerData?.rank != null ? `#${playerData.rank}` : '—' },
              { l: 'Points', v: playerData?.player?.points ?? '—' },
            ].map((s) => (
              <div key={s.l} className="bg-[#0d160e] border border-[#1e3321] rounded-xl px-3 py-2.5">
                <div className="text-[9px] uppercase tracking-widest text-[#4d8a56] font-bold">{s.l}</div>
                <div className="text-lg font-black text-[#a8d84e] mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Feed – 3 cols */}
        <Card className="lg:col-span-3 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#7dc142] flex-1">💬 Activity Feed</span>
            <div className="flex gap-2">
              <input
                value={feedPost}
                onChange={(e) => setFeedPost(e.target.value)}
                placeholder="Post an update…"
                className="bg-[#0d160e] border border-[#1e3321] focus:border-[#7dc142]/50 text-[#e8f5e0] rounded-xl px-3 py-2 text-xs w-full sm:w-44 outline-none transition-colors placeholder-[#4d8a56]"
              />
              <button
                disabled={!feedPost.trim()}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors flex-shrink-0 ${
                  feedPost.trim() ? 'bg-[#7dc142] hover:bg-[#a8d84e] text-[#0a1a0b]' : 'bg-[#1e3321] text-[#4d8a56] cursor-not-allowed'
                }`}
              >
                Post
              </button>
            </div>
          </div>

          {activityPresent ? (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52 flex-1">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex gap-3 px-3 py-3 bg-[#0d160e] border border-[#1e3321] rounded-xl hover:border-[#243d27] transition-colors">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{item.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div>
                      <span className="font-bold text-xs text-[#e8f5e0]">{item.user} </span>
                      <span className="text-xs text-[#7aaa6a]">{item.action}</span>
                    </div>
                    <div className="text-[9px] text-[#4d8a56] mt-1">{item.time}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 self-start mt-0.5">
                    <button className="bg-[#1e3321] hover:bg-[#2d5a27] text-[#7aaa6a] rounded-lg w-7 h-7 flex items-center justify-center text-xs transition-colors">👍</button>
                    <button className="bg-[#1e3321] hover:bg-[#2d5a27] text-[#7aaa6a] rounded-lg w-7 h-7 flex items-center justify-center text-xs transition-colors">💬</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2 rounded-xl border border-dashed border-[#1e3321] bg-[#0d160e]">
              <div className="text-2xl">💬</div>
              <div className="text-xs text-[#4d8a56] max-w-xs">Activity feed will display real updates once backend support is available.</div>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-3 border-t border-[#1e3321]">
            {[
              { icon: '🤝', label: 'Find a Partner' },
              { icon: '🔗', label: 'Quick Links' },
              { icon: '💡', label: 'Tennis Tips' },
            ].map((b) => (
              <button
                key={b.label}
                className="flex-1 bg-[#0d160e] border border-[#1e3321] hover:border-[#243d27] hover:bg-[#1e3321] text-[#c8e8b8] font-bold text-xs rounded-xl py-2.5 transition-all"
              >
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Coaches + Achievements + Recent Results ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionLabel action={<Link href="/coaches">View All →</Link>}>🏅 Coaches</SectionLabel>
          {playerData?.coaches && playerData.coaches.length > 0 ? (
            <div className="space-y-2">
              {playerData.coaches.slice(0, 6).map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#0d160e] border border-[#1e3321] rounded-xl hover:border-[#243d27] transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3321] flex items-center justify-center text-lg overflow-hidden">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>🏋️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#e8f5e0] truncate">{c.name}</div>
                      <div className="text-[11px] text-[#9fd78b] font-mono">{c.stats?.avgRating ? Number(c.stats.avgRating).toFixed(1) : '—'}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-[10px] text-[#4d8a56]">{c.role || 'Coach'}</div>
                      <div className="text-[10px] text-[#7dc142]">{c.stats?.ratingCount ? `(${c.stats.ratingCount})` : ''}</div>
                      {c.organization && (
                        <div className="ml-2 px-2 py-0.5 bg-[#0f2710] border border-[#243d27] rounded-full text-[10px] text-[#7dc142]">{c.organization.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[#7dc142] text-[10px] font-mono">{c.email || ''}</div>
                    <button
                      type="button"
                      onClick={() => handleRemindCoach(c.id)}
                      disabled={sendingReminder[c.id]}
                      className={`text-[10px] font-bold rounded-full px-3 py-1 transition-all ${sendingReminder[c.id]
                        ? 'bg-[#1e3321] text-[#4d8a56] border border-[#1e3321] cursor-not-allowed'
                        : 'bg-[#7dc142] text-[#0a1a0b] hover:bg-[#a8d84e]'}
                      `}
                    >
                      {sendingReminder[c.id] ? 'Sending…' : 'Remind Coach'}
                    </button>
                    {reminderStatus[c.id] && (
                      <span className="text-[9px] text-[#a8d84e] text-right">{reminderStatus[c.id]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-sm text-[#4d8a56]">No coaches found</div>
          )}
        </Card>

        <Achievements badges={playerData?.badges} />
        <RecentResults results={recentResults} />
      </div>

    </div>
  );
};

export default DashboardHome;