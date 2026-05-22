'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@vico/design-system';

const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-[10px] font-black tracking-[0.15em] uppercase text-vico-primary">{children}</span>
    {action && <span className="text-[10px] text-vico-text-muted hover:text-vico-primary transition-colors cursor-pointer">{action}</span>}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: 'green' | 'dark' | 'outline' }> = ({ children, variant = 'dark' }) => {
  const styles = {
    green: 'bg-vico-primary text-vico-background font-black',
    dark: 'bg-vico-surface text-vico-primary border border-vico-border',
    outline: 'border border-vico-primary/40 text-vico-primary',
  };

  return (
    <span className={`inline-flex items-center text-[10px] rounded-full px-2.5 py-0.5 font-semibold ${styles[variant]}`}>
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
    <Card variant="glow" className="flex flex-col items-center text-center gap-3">
      <div className="relative">
        {user?.photo || playerData?.player?.photo ? (
          <img
            src={user?.photo || playerData?.player?.photo}
            alt={displayName}
            className="w-16 h-16 rounded-2xl border-2 border-vico-primary/60 object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vico-surfaceSecondary to-vico-surfaceTertiary border-2 border-vico-primary/60 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-vico-primary border-2 border-vico-background" />
      </div>

      <div>
        <div className="font-black text-vico-text-primary text-sm tracking-wide">{displayName}</div>
        <div className="text-vico-text-muted text-[11px] mt-0.5">
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
          <Button variant="secondary" size="sm" className="w-full justify-center">
            View Profile →
          </Button>
        </Link>
      )}
    </Card>
  );
};

export const UpcomingEvents: React.FC<{
  events: { name: string; date: string; icon: string }[];
}> = ({ events }) => (
  <Card>
    <SectionLabel>📆 Upcoming Events</SectionLabel>
    <div className="space-y-2 mb-4">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex gap-3 items-center px-3 py-3 bg-vico-background border border-vico-border hover:border-vico-primary/40 rounded-xl transition-all cursor-pointer group"
        >
          <span className="text-xl">{e.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-vico-text-primary group-hover:text-vico-accent transition-colors truncate">{e.name}</div>
            <div className="text-[10px] text-vico-text-muted mt-0.5">{e.date}</div>
          </div>
          <span className="text-vico-text-muted group-hover:text-vico-primary text-xs transition-colors">→</span>
        </div>
      ))}
    </div>
    <Button variant="primary" size="sm" className="w-full justify-center">
      + Add Event
    </Button>
  </Card>
);

const RecentResults: React.FC<{ results?: any[] }> = ({ results }) => (
  <Card>
    <SectionLabel action={<Link href="/matches">All Results →</Link>}>📋 Recent Results</SectionLabel>

    {!results || results.length === 0 ? (
      <div className="rounded-xl border border-dashed border-vico-border bg-vico-background p-8 text-center">
        <div className="text-2xl mb-2">🎾</div>
        <div className="text-xs text-vico-text-muted">No results yet. Match history will appear here once connected.</div>
      </div>
    ) : (
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-vico-background border border-vico-border hover:border-vico-primary/40 rounded-xl transition-colors">
            <span
              className={`text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                r.result === 'W' ? 'bg-vico-primary text-vico-background' : 'bg-red-950 text-red-400 border border-red-900'
              }`}
            >
              {r.result}
            </span>
            <span className="flex-1 text-xs font-semibold text-vico-text-primary">vs {r.opponent}</span>
            <span className="text-[11px] text-vico-primary font-mono font-bold">{r.score}</span>
            <span className="text-[9px] text-vico-text-muted hidden sm:block">{r.date}</span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const Achievements: React.FC<{ badges?: any[] }> = ({ badges }) => (
  <Card>
    <SectionLabel
      action={badges?.length ? `${badges.filter((b) => b.unlocked).length}/${badges.length} unlocked` : undefined}
    >
      🏅 Achievements
    </SectionLabel>

    {!badges || badges.length === 0 ? (
      <div className="rounded-xl border border-dashed border-vico-border bg-vico-background p-8 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-xs text-vico-text-muted">Achievements will display here once backend data is connected.</div>
      </div>
    ) : (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {badges.map((b) => (
          <div
            key={b.id || b.label}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
              b.unlocked
                ? 'bg-vico-surface border-vico-primary/50 shadow-[0_0_12px_rgba(125,193,66,0.1)]'
                : 'bg-vico-background border-vico-border opacity-35'
            }`}
          >
            <span className="text-2xl">{b.icon || '🏅'}</span>
            <span className="text-[9px] font-bold text-vico-text-muted text-center leading-tight px-1">{b.label || b.name}</span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const StatBox: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`rounded-xl px-3 py-3 flex flex-col gap-0.5 ${accent ? 'bg-vico-primary' : 'bg-vico-background border border-vico-border'}`}>
    <span className={`text-[9px] uppercase tracking-widest font-bold ${accent ? 'text-vico-background/80' : 'text-vico-text-muted'}`}>{label}</span>
    <span className={`text-xl font-black ${accent ? 'text-vico-background' : 'text-vico-accent'}`}>{value}</span>
  </div>
);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', value: upcomingMatches?.length ?? '—', icon: '📅', sub: 'matches' },
          { label: 'Played', value: playerData?.player?.matchesPlayed ?? '—', icon: '🎾', sub: 'this season' },
          { label: 'Rank', value: playerData?.rank != null ? `#${playerData.rank}` : '—', icon: '🏅', sub: 'live ranking' },
          { label: 'Win Rate', value: playerData?.player?.winRate != null ? `${playerData.player.winRate}%` : '—', icon: '📈', sub: 'overall' },
        ].map((s, i) => (
          <Card key={i} variant="elevated" className="flex items-center gap-3 py-4 bg-vico-surface border-vico-border">
            <div className="w-9 h-9 rounded-xl bg-vico-surfaceSecondary flex items-center justify-center text-lg flex-shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-vico-text-muted font-bold">{s.label}</div>
              <div className="text-xl font-black text-vico-accent leading-none mt-0.5">{s.value}</div>
              <div className="text-[9px] text-vico-text-muted mt-0.5">{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card variant="glow" className="h-full bg-gradient-to-br from-vico-surfaceSecondary to-vico-background border-vico-border">
            <SectionLabel>🎾 Next Match</SectionLabel>

            {nextMatch ? (
              <>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-vico-text-muted uppercase tracking-wider mb-1">You</div>
                    <div className="text-lg font-black text-vico-text-primary truncate">{playerName}</div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-vico-surface border border-vico-primary/30 flex items-center justify-center text-lg">⚔️</div>
                    <span className="text-[9px] font-black text-vico-primary tracking-widest uppercase">VS</span>
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] text-vico-text-muted uppercase tracking-wider mb-1">Opponent</div>
                    <div className="text-lg font-black text-vico-text-primary truncate">{opponentName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Date', value: matchDateText, icon: '📅' },
                    { label: 'Court', value: matchCourt, icon: '📍' },
                    { label: 'Type', value: matchType, icon: '🏷️' },
                  ].map((m) => (
                    <div key={m.label} className="bg-vico-background border border-vico-border rounded-xl px-3 py-2.5 text-center">
                      <div className="text-base">{m.icon}</div>
                      <div className="text-[9px] text-vico-text-muted uppercase tracking-wider mt-1">{m.label}</div>
                      <div className="text-[11px] font-bold text-vico-text-primary mt-0.5 truncate">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1 justify-center">
                    View Details
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1 justify-center">
                    Check In
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-vico-surface border border-dashed border-vico-border flex items-center justify-center text-3xl">
                  🎾
                </div>
                <div>
                  <div className="text-sm font-bold text-vico-text-primary">No upcoming match</div>
                  <div className="text-xs text-vico-text-muted mt-1 max-w-xs">
                    Match scheduling is not connected yet. Your next match details will appear once the backend provides them.
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <Button variant="secondary" size="sm" className="flex-1" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                    View Details
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                    Check In
                  </Button>
                </div>
              </div>
            )}

            {upcomingMatches.length > 1 && (
              <div className="mt-4 pt-4 border-t border-vico-border">
                <div className="text-[9px] uppercase tracking-widest text-vico-text-muted font-black mb-2">More Upcoming</div>
                <div className="space-y-1.5">
                  {upcomingMatches.slice(1).map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-lg hover:bg-vico-surface transition-colors cursor-pointer">
                      <span className="text-vico-text-primary font-medium">vs {m.opponent}</span>
                      <span className="text-vico-text-muted text-[10px]">{new Date(m.date).toLocaleDateString()}</span>
                      <span className="text-vico-primary text-[10px]">{m.court || 'TBD'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card className="flex flex-col bg-vico-surface border-vico-border">
          <SectionLabel action={<Link href="/leaderboard">View All →</Link>}>🏆 Leaderboard</SectionLabel>

          {leaderboardPresent ? (
            <div className="flex-1 space-y-1.5">
              {leaderboard.map((p: any) => (
                <div
                  key={p.rank}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all ${
                    p.rank === 1
                      ? 'bg-vico-surface border border-vico-primary/40 shadow-[0_0_12px_rgba(125,193,66,0.08)]'
                      : 'hover:bg-vico-background border border-transparent hover:border-vico-border'
                  }`}
                >
                  <span className="w-5 text-center text-xs flex-shrink-0">
                    {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : <span className="text-vico-text-muted font-bold">{p.rank}</span>}
                  </span>
                  <span className={`flex-1 truncate ${p.rank <= 3 ? 'font-bold text-vico-text-primary' : 'text-vico-text-muted'}`}>{p.name}</span>
                  <span className="text-vico-primary font-black text-[10px] flex-shrink-0 font-mono">
                    {p.ratingPoints?.toLocaleString?.() ?? 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
              <div className="text-2xl">🏆</div>
              <div className="text-xs text-vico-text-muted">Rankings will appear once backend data is available.</div>
            </div>
          )}

          <Link href="/leaderboard">
            <Button variant="secondary" size="sm" className="w-full mt-4 justify-center">
              See full rankings →
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-vico-surface border-vico-border">
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
              <div key={s.l} className="bg-vico-background border border-vico-border rounded-xl px-3 py-2.5">
                <div className="text-[9px] uppercase tracking-widest text-vico-text-muted font-bold">{s.l}</div>
                <div className="text-lg font-black text-vico-accent mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 flex flex-col bg-vico-surface border-vico-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-vico-primary flex-1">💬 Activity Feed</span>
            <div className="flex gap-2">
              <Input
                value={feedPost}
                onChange={(e) => setFeedPost(e.target.value)}
                placeholder="Post an update…"
                style={{ width: '100%', minWidth: 0, fontSize: '0.75rem' }}
              />
              <Button
                disabled={!feedPost.trim()}
                variant={feedPost.trim() ? 'primary' : 'secondary'}
                size="sm"
                className="flex-shrink-0"
                style={{ opacity: feedPost.trim() ? 1 : 0.5, cursor: feedPost.trim() ? 'pointer' : 'not-allowed' }}
              >
                Post
              </Button>
            </div>
          </div>

          {activityPresent ? (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52 flex-1">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex gap-3 px-3 py-3 bg-vico-background border border-vico-border rounded-xl hover:border-vico-primary/40 transition-colors">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{item.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div>
                      <span className="font-bold text-xs text-vico-text-primary">{item.user} </span>
                      <span className="text-xs text-vico-text-muted">{item.action}</span>
                    </div>
                    <div className="text-[9px] text-vico-text-muted mt-1">{item.time}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 self-start mt-0.5">
                    <Button variant="secondary" size="sm" className="bg-vico-surface hover:bg-vico-surfaceSecondary text-vico-text-muted rounded-lg w-7 h-7 p-0">
                      👍
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-vico-surface hover:bg-vico-surfaceSecondary text-vico-text-muted rounded-lg w-7 h-7 p-0">
                      💬
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2 rounded-xl border border-dashed border-vico-border bg-vico-background">
              <div className="text-2xl">💬</div>
              <div className="text-xs text-vico-text-muted max-w-xs">Activity feed will display real updates once backend support is available.</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-3 border-t border-vico-border">
            {[
              { icon: '🤝', label: 'Find a Partner' },
              { icon: '🔗', label: 'Quick Links' },
              { icon: '💡', label: 'Tennis Tips' },
            ].map((b) => (
              <Button key={b.label} variant="secondary" size="sm" className="flex-1 justify-center">
                {b.icon} {b.label}
              </Button>
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
