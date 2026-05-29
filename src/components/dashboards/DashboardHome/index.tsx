'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input, SessionsView, colors } from '@vico/design-system';

// Organization color scheme - simplified to 3 colors: dark, lime, muted
const G = {
  dark: '#1a3020',
  lime: '#7dc142',
  muted: '#7aaa6a',
  darkBg: '#0f1f0f',
  border: 'rgba(125, 193, 66, 0.28)', // more pronounced inner borders
  borderLight: 'rgba(125, 193, 66, 0.14)', // subtle dashed dividers
  outerBorder: 'rgba(125, 193, 66, 0.16)', // faint outer card borders
  accent: '#7dc142',
};

const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: G.lime }}>{children}</span>
    {action && <span className="text-[10px] transition-colors cursor-pointer" style={{ color: G.muted }}>{action}</span>}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: 'green' | 'dark' | 'outline' }> = ({ children, variant = 'dark' }) => {
  const styles = {
    green: { background: G.lime, color: G.darkBg, fontWeight: 900 },
    dark: { background: 'transparent', color: G.lime, border: `1px solid ${G.lime}` },
    outline: { border: `1px solid ${G.lime}`, color: G.lime },
  };

  return (
    <span className="inline-flex items-center text-[10px] rounded-full px-2.5 py-0.5 font-semibold" style={styles[variant]}>
      {children}
    </span>
  );
};

export const ProfileSnapshot: React.FC<{
  user: any;
  playerData: any;
  showViewProfileButton?: boolean;
}> = ({ user, playerData, showViewProfileButton = true }) => {
  const displayName = `${user?.firstName || playerData?.player?.firstName || 'Player'} ${user?.lastName || playerData?.player?.lastName || ''}`.trim();

  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
      <div className="relative">
        {user?.photo || playerData?.player?.photo ? (
          <img
            src={user?.photo || playerData?.player?.photo}
            alt={displayName}
            className="w-16 h-16 rounded-2xl border-2 object-cover"
            style={{ borderColor: G.lime }}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2" style={{ background: G.darkBg, borderColor: G.lime }}>
            👤
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2" style={{ background: G.lime, borderColor: G.darkBg }} />
      </div>

      <div>
        <div className="font-black text-sm tracking-wide" style={{ color: G.lime }}>{displayName}</div>
        <div className="text-[11px] mt-0.5" style={{ color: G.muted }}>
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
          <Button variant="primary" size="sm" className="w-full justify-center" style={{ background: G.lime, color: G.darkBg }}>
            View Profile →
          </Button>
        </Link>
      )}
    </div>
  );
};

export const UpcomingEvents: React.FC<{
  events: { name: string; date: string; icon: string }[];
}> = ({ events }) => (
  <div className="rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
    <SectionLabel>📆 Upcoming Events</SectionLabel>
    <div className="space-y-2 mb-4">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex gap-3 items-center px-3 py-3 rounded-xl transition-all cursor-pointer hover:opacity-80"
          style={{ background: G.darkBg, border: `1px solid ${G.border}` }}
        >
          <span className="text-xl">{e.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: G.lime }}>{e.name}</div>
            <div className="text-[10px] mt-0.5" style={{ color: G.muted }}>{e.date}</div>
          </div>
          <span className="text-xs transition-colors" style={{ color: G.muted }}>→</span>
        </div>
      ))}
    </div>
    <Button variant="primary" size="sm" className="w-full justify-center" style={{ background: G.lime, color: G.darkBg }}>
      + Add Event
    </Button>
  </div>
);

const RecentResults: React.FC<{ results?: any[] }> = ({ results }) => (
  <div className="rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
    <SectionLabel action={<Link href="/matches">All Results →</Link>}>📋 Recent Results</SectionLabel>

    {!results || results.length === 0 ? (
      <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ background: G.darkBg, borderColor: G.borderLight }}>
        <div className="text-2xl mb-2">🎾</div>
        <div className="text-xs" style={{ color: G.muted }}>No results yet. Match history will appear here once connected.</div>
      </div>
    ) : (
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors" style={{ background: G.darkBg }}>
            <span
              className="text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: r.result === 'W' ? G.lime : '#ff6b6b',
                color: r.result === 'W' ? G.darkBg : '#fff',
              }}
            >
              {r.result}
            </span>
            <span className="flex-1 text-xs font-semibold" style={{ color: G.lime }}>vs {r.opponent}</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#fff' }}>{r.score}</span>
            <span className="text-[9px] hidden sm:block" style={{ color: G.muted }}>{r.date}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const Achievements: React.FC<{ badges?: any[] }> = ({ badges }) => (
  <div className="rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
    <SectionLabel
      action={badges?.length ? `${badges.filter((b) => b.unlocked).length}/${badges.length} unlocked` : undefined}
    >
      🏅 Achievements
    </SectionLabel>

    {!badges || badges.length === 0 ? (
      <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ background: G.darkBg, borderColor: G.borderLight }}>
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-xs" style={{ color: G.muted }}>Achievements will display here once backend data is connected.</div>
      </div>
    ) : (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {badges.map((b) => (
          <div
            key={b.id || b.label}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
            style={{
              background: b.unlocked ? G.darkBg : G.darkBg,
              borderColor: b.unlocked ? G.border : G.borderLight,
              opacity: b.unlocked ? 1 : 0.35,
            }}
          >
            <span className="text-2xl">{b.icon || '🏅'}</span>
            <span className="text-[9px] font-bold text-center leading-tight px-1" style={{ color: G.muted }}>{b.label || b.name}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StatBox: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => (
  <div
    className="rounded-xl px-3 py-3 flex flex-col gap-0.5"
    style={{ background: accent ? colors.primary : colors.surfaceAccent, border: !accent ? `1px solid ${colors.border}` : 'none' }}
  >
    <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: accent ? colors.background : colors.textMuted }}>{label}</span>
    <span className="text-[var(--vico-font-size-xxl)] font-black" style={{ color: accent ? colors.background : colors.textPrimary }}>{value}</span>
  </div>
);

interface DashboardHomeProps {
  playerData: any;
  upcomingMatches: any[];
  leaderboard: any[];
  activityFeed: any[];
  recentResults?: any[];
  sessions?: any[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  playerData,
  upcomingMatches,
  leaderboard,
  activityFeed,
  recentResults = [],
  sessions = [],
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', value: upcomingMatches?.length ?? '—', icon: '📅', sub: 'matches' },
          { label: 'Played', value: playerData?.player?.matchesPlayed ?? '—', icon: '🎾', sub: 'this season' },
          { label: 'Rank', value: playerData?.rank != null ? `#${playerData.rank}` : '—', icon: '🏅', sub: 'live ranking' },
          { label: 'Win Rate', value: playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—', icon: '📈', sub: 'overall' },
        ].map((s, i) => (
          <div
            key={i}
            className="flex gap-3 items-center rounded-xl p-3"
            style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: G.darkBg }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[var(--vico-font-size-xs)] uppercase tracking-[0.06em] font-bold" style={{ color: G.muted }}>{s.label}</div>
              <div className="text-[var(--vico-font-size-xxl)] font-black mt-1" style={{ color: G.lime }}>{s.value}</div>
              <div className="text-[var(--vico-font-size-xs)] mt-1" style={{ color: G.muted }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 rounded-xl p-3" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <SectionLabel>🎾 Next Match</SectionLabel>

          {nextMatch ? (
            <>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--vico-font-size-xxs)] uppercase tracking-wider mb-1" style={{ color: G.muted }}>You</div>
                    <div className="text-lg font-black truncate" style={{ color: G.lime }}>{playerName}</div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: G.darkBg }}>⚔️</div>
                    <span className="text-[var(--vico-font-size-xxs)] font-black tracking-widest uppercase" style={{ color: G.lime }}>VS</span>
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[var(--vico-font-size-xxs)] uppercase tracking-wider mb-1" style={{ color: G.muted }}>Opponent</div>
                    <div className="text-lg font-black truncate" style={{ color: G.lime }}>{opponentName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Date', value: matchDateText, icon: '📅' },
                    { label: 'Court', value: matchCourt, icon: '📍' },
                    { label: 'Type', value: matchType, icon: '🏷️' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: G.darkBg, border: `1px solid ${G.border}` }}>
                      <div className="text-base">{m.icon}</div>
                      <div className="text-[var(--vico-font-size-xxs)] uppercase tracking-wider mt-1" style={{ color: G.muted }}>{m.label}</div>
                      <div className="text-[var(--vico-font-size-xs)] font-bold mt-0.5 truncate" style={{ color: G.lime }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1 justify-center" style={{ background: G.lime, color: G.dark }}>
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 justify-center" style={{ color: G.lime, border: `1px solid ${G.border}` }}>
                    Check In
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: G.dark, border: `1px dashed ${G.lime}` }}>🎾</div>
                <div>
                <div className="text-sm font-bold" style={{ color: G.lime }}>No upcoming match</div>
                  <div className="text-xs mt-1 max-w-xs" style={{ color: G.muted }}>
                    Match scheduling is not connected yet. Your next match details will appear once the backend provides them.
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <Button variant="ghost" size="sm" className="flex-1 opacity-50 cursor-not-allowed" disabled style={{ color: G.muted, border: `1px solid ${G.border}` }}>
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 opacity-50 cursor-not-allowed" disabled style={{ color: G.muted, border: `1px solid ${G.border}` }}>
                    Check In
                  </Button>
                </div>
              </div>
            )}

            {upcomingMatches.length > 1 && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${G.lime}` }}>
                <div className="text-[var(--vico-font-size-xxs)] uppercase tracking-widest font-black mb-2" style={{ color: G.muted }}>More Upcoming</div>
                <div className="space-y-1.5">
                  {upcomingMatches.slice(1).map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-lg cursor-pointer" style={{ background: 'transparent' }}>
                      <span className="font-medium" style={{ color: G.lime }}>vs {m.opponent}</span>
                      <span className="text-[10px]" style={{ color: G.muted }}>{new Date(m.date).toLocaleDateString()}</span>
                      <span className="text-[10px]" style={{ color: G.lime }}>{m.court || 'TBD'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        <div className="xl:col-span-5 flex flex-col rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <SectionLabel action={<Link href="/leaderboard">View All →</Link>}>🏆 Leaderboard</SectionLabel>

          {leaderboardPresent ? (
            <div className="flex-1 space-y-1.5">
              {leaderboard.map((p: any) => (
                <div
                  key={p.rank}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all"
                  style={{
                    background: p.rank === 1 ? G.darkBg : 'transparent',
                    border: `1px solid ${p.rank === 1 ? G.border : 'transparent'}`,
                    boxShadow: p.rank === 1 ? `0_0_12px_${G.lime}22` : 'none'
                  }}
                >
                  <span className="w-5 text-center text-xs flex-shrink-0">
                    {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : <span style={{ color: G.muted, fontWeight: 'bold' }}>{p.rank}</span>}
                  </span>
                  <span className={`flex-1 truncate`} style={{ color: p.rank <= 3 ? G.lime : G.muted, fontWeight: p.rank <= 3 ? 'bold' : 'normal' }}>{p.name}</span>
                  <span className="font-black text-[10px] flex-shrink-0 font-mono" style={{ color: G.accent }}>
                    {p.ratingPoints?.toLocaleString?.() ?? 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
              <div className="text-2xl">🏆</div>
              <div className="text-xs" style={{ color: G.muted }}>Rankings will appear once backend data is available.</div>
            </div>
          )}

          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="w-full mt-4 justify-center" style={{ color: G.lime, border: `1px solid ${G.border}` }}>
              See full rankings →
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <SectionLabel>📊 My Stats</SectionLabel>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatBox label="Wins" value={playerData?.player?.matchesWon ?? '—'} />
            <StatBox label="Losses" value={playerData?.player?.matchesLost ?? '—'} />
            <StatBox label="Win %" value={playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—'} accent />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Sets Won', v: playerData?.player?.setsWon ?? '—' },
              { l: 'Sets Lost', v: playerData?.player?.setsLost ?? '—' },
              { l: 'Ranking', v: playerData?.rank != null ? `#${playerData.rank}` : '—' },
              { l: 'Points', v: playerData?.player?.points ?? '—' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl px-3 py-2.5" style={{ background: colors.surfaceAccent, border: `1px solid ${colors.border}` }}>
                <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: colors.textMuted }}>{s.l}</div>
                <div className="text-lg font-black mt-0.5" style={{ color: colors.primary }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}` }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase flex-1" style={{ color: colors.primary }}>💬 Activity Feed</span>
            <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
              <div className="flex-1 min-w-0">
                <Input
                  value={feedPost}
                  onChange={(e) => setFeedPost(e.target.value)}
                  placeholder="Post an update…"
                  className="w-full min-w-0 text-[0.75rem]"
                />
              </div>
              <Button
                disabled={!feedPost.trim()}
                variant={feedPost.trim() ? 'primary' : 'secondary'}
                size="sm"
                className={`flex-shrink-0 ${feedPost.trim() ? '' : 'opacity-50 cursor-not-allowed'}`}
              >
                Post
              </Button>
            </div>
          </div>

          {activityPresent ? (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52 flex-1">
                {activityFeed.map((item, i) => (
                  <div key={i} className="flex gap-3 px-3 py-3 rounded-xl transition-colors" style={{ background: colors.surfaceAccent, border: `1px solid ${colors.border}` }}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{item.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div>
                        <span className="font-bold text-xs" style={{ color: colors.primary }}>{item.user} </span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>{item.action}</span>
                    </div>
                      <div className="text-[9px] mt-1" style={{ color: colors.textMuted }}>{item.time}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 self-start mt-0.5">
                      <Button variant="ghost" size="sm" className="rounded-lg w-7 h-7 p-0" style={{ color: colors.textMuted, border: `1px solid ${colors.cardBorder}` }}>
                      👍
                    </Button>
                      <Button variant="ghost" size="sm" className="rounded-lg w-7 h-7 p-0" style={{ color: colors.textMuted, border: `1px solid ${colors.cardBorder}` }}>
                      💬
                    </Button>
                  </div>
                </div>
                ))}
            </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2 rounded-xl border border-dashed" style={{ background: colors.surfaceAccent, borderColor: colors.cardBorder }}>
                <div className="text-2xl">💬</div>
                <div className="text-xs max-w-xs" style={{ color: colors.textMuted }}>Activity feed will display real updates once backend support is available.</div>
              </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-3" style={{ borderTop: `1px solid ${G.border}` }}>
            {[
              { icon: '🤝', label: 'Find a Partner' },
              { icon: '🔗', label: 'Quick Links' },
              { icon: '💡', label: 'Tennis Tips' },
            ].map((b) => (
              <Button key={b.label} variant="ghost" size="sm" className="flex-1 justify-center" style={{ color: colors.primary, border: `1px solid ${colors.border}` }}>
                {b.icon} {b.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <Achievements badges={playerData?.badges} />
        </div>
        <div className="xl:col-span-7 rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <RecentResults results={recentResults} />
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

      {sessions.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: G.dark, border: `1px solid ${G.outerBorder}` }}>
          <SessionsView
            sessions={sessions}
            showStats={true}
            onCreateSession={() => console.log('Create session')}
            onViewDetails={(id, title) => console.log('View details:', id, title)}
            title="📅 My Sessions"
            subtitle="Create and manage coaching sessions"
          />
        </div>
      )}
    </div>
    </div>
  );
};

export default DashboardHome;
