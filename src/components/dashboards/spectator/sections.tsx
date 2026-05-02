'use client';

import React, { useState } from 'react';
import { Match, Player, Organization, MatchFilter, MembershipApplication, MEMBERSHIP_TIERS, POSITIONS } from './types';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import { CommunityView } from '@/components/community/CommunityView';
import { Badge, SectionCard, StatPill, ActionBtn, FormField, inputStyle } from './ui';

type MembershipTierOption = {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  monthlyPrice?: number;
  benefits?: string[] | string | null;
  perks?: string[] | string | null;
};

const normalizeMembershipTier = (tier: MembershipTierOption) => {
  let benefitsArray: string[] = [];
  
  const benefits = tier.benefits ?? tier.perks;
  if (benefits) {
    if (Array.isArray(benefits)) {
      benefitsArray = benefits;
    } else if (typeof benefits === 'string') {
      try {
        benefitsArray = JSON.parse(benefits);
      } catch {
        benefitsArray = benefits.split(',').map(b => b.trim()).filter(b => b);
      }
    }
  }
  
  return {
    id: tier.id ?? tier.name,
    name: tier.name,
    description: tier.description ?? '',
    monthlyPrice: tier.monthlyPrice ?? tier.cost ?? 0,
    benefits: benefitsArray,
  };
};

export function HomeSection({
  user,
  memberships,
  currentRole,
  match,
  matches,
  players,
  selectedOrg,
  setActiveSection,
  onMessageClick,
  onChallengeClick,
}: {
  user: { firstName?: string; lastName?: string; email?: string; photo?: string | null } | null;
  memberships: Array<{ orgId: string; orgName: string; role: string }>;
  currentRole: string | null;
  match: Match | null;
  matches: Match[];
  players: Player[];
  selectedOrg: Organization | null;
  setActiveSection: (s: string) => void;
  onMessageClick: (personId: string, personName: string) => void;
  onChallengeClick: (personId: string, personName: string) => void;
}) {
  const profileName = `${user?.firstName || 'Spectator'} ${user?.lastName || ''}`.trim();
  const registeredOrgs = memberships.filter((membership) => membership.orgId && membership.orgName !== 'Platform');
  const upcomingMatches = matches.filter((upcoming) => upcoming.status === 'PENDING').slice(0, 3);
  const currentMembership = registeredOrgs.find((membership) => membership.role === currentRole) || registeredOrgs[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <SectionCard title={`Welcome back, ${user?.firstName || 'Spectator'}`} subtitle={`Viewing as ${currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : 'Spectator'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold" style={{ color: '#e8f5e0' }}>{profileName}</h2>
              <p className="text-sm mt-1" style={{ color: '#7aaa6a' }}>
                {user?.email ?? 'No email available'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: '#7dc142' }}>
                {user?.photo ? (
                  <img src={user.photo} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#132915] text-2xl">👀</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #203720` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Registered Clubs</p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#e8f5e0' }}>{registeredOrgs.length}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #203720` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Current Role</p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#e8f5e0' }}>{currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : 'Spectator'}</p>
            </div>
          </div>

          {currentMembership && (
            <div className="rounded-xl p-4 mt-4" style={{ background: '#0f1f0f', border: `1px solid #2d5a35` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Active membership</p>
              <p className="text-sm font-semibold mt-2" style={{ color: '#e8f5e0' }}>{currentMembership.orgName}</p>
              <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>As {currentMembership.role}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveSection('Membership')}
            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: '#243e24', color: '#e8f5e0', border: '1px solid #7dc142' }}
          >
            Open Membership Dashboard
          </button>
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard title="Incoming Matches" subtitle={upcomingMatches.length ? `${upcomingMatches.length} upcoming` : 'No upcoming matches'}>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((upcoming) => (
                  <div key={upcoming.id} className="rounded-2xl p-3" style={{ background: '#132917', border: `1px solid #243e24` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>{upcoming.event || 'Upcoming Match'}</p>
                        <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>{upcoming.playerA?.name || 'Player A'} vs {upcoming.playerB?.name || 'Player B'}</p>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#7aaa6a' }}>{upcoming.scheduledTime || upcoming.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#7aaa6a' }}>No pending matches. Check the Matches tab for more events.</p>
            )}
          </SectionCard>

          <SectionCard title="Registered Organizations" subtitle={`${registeredOrgs.length} active`}>
            {registeredOrgs.length > 0 ? (
              <div className="space-y-3">
                {registeredOrgs.map((membership) => (
                  <div key={membership.orgId} className="rounded-2xl p-3" style={{ background: '#132917', border: `1px solid #243e24` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>{membership.orgName}</p>
                        <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Role: {membership.role}</p>
                      </div>
                      <Badge color="#7dc142">{membership.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#7aaa6a' }}>You have not joined any organizations yet.</p>
            )}
          </SectionCard>
        </div>
      </div>

    </div>
  );
}

export function WatchSection({ match }: { match: Match }) {
  return (
    <SectionCard title="Live Match Broadcast" subtitle="High-quality stream · Live commentary">
      <div
        className="rounded-xl p-5 flex flex-col gap-5"
        style={{ background: '#0f1f0f', border: `1px solid #2d5a35` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge>🔴 Live</Badge>
            <h3 className="text-xl font-extrabold mt-2" style={{ color: '#e8f5e0' }}>{match.event || 'Live Match'}</h3>
            <p className="text-sm mt-1" style={{ color: '#7aaa6a' }}>
              {match.court || 'Center Court'} · {match.status}
            </p>
          </div>
          <ActionBtn>Watch Live</ActionBtn>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatPill label="Current Score" value={match.score} accent />
          <StatPill label="Match Status" value={match.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: '#1b2f1b', border: `1px solid #243e24` }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7aaa6a' }}>Contestants</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#7dc142' }} />
                <span className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>{match.playerA?.name || 'Player A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#4a9eff' }} />
                <span className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>{match.playerB?.name || 'Player B'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1b2f1b', border: `1px solid #243e24` }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7aaa6a' }}>Stream Info</p>
            <p className="text-sm leading-relaxed" style={{ color: '#5e8e50' }}>
              {match.court || 'Center Court'} · Live commentary · Crowd mic on
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function PlayersSection({
  players,
  selectedPlayer,
  setSelectedPlayer,
}: {
  players: Player[];
  selectedPlayer: Player | null;
  setSelectedPlayer: (p: Player) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title="Player Directory" subtitle={`${players.length} active players`}>
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {players.length === 0 ? (
            <p style={{ color: '#7aaa6a' }}>No players found.</p>
          ) : (
            players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:opacity-90"
                style={{
                  background: selectedPlayer?.id === player.id ? '#2d5a27' : '#1b2f1b',
                  border: `1px solid ${selectedPlayer?.id === player.id ? '#7dc142' : '#243e24'}`,
                  color: '#e8f5e0',
                }}
              >
                <div className="flex items-center gap-3">
                  <img src={player.img} alt={player.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{player.name}</p>
                    <p className="text-xs" style={{ color: '#7aaa6a' }}>
                      {player.nationality} · {player.wins} wins · {player.matchesPlayed} matches
                    </p>
                  </div>
                </div>
                <Badge>{player.level}</Badge>
              </button>
            ))
          )}
        </div>
      </SectionCard>

      {selectedPlayer && (
        <SectionCard title="Player Profile">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedPlayer.img} alt={selectedPlayer.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h3 className="text-xl font-extrabold" style={{ color: '#e8f5e0' }}>{selectedPlayer.name}</h3>
                  <p className="text-sm" style={{ color: '#7aaa6a' }}>{selectedPlayer.username}</p>
                </div>
              </div>
              {selectedPlayer.bio && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#7aaa6a' }}>{selectedPlayer.bio}</p>
              )}
            </div>
            <Badge color="#7dc142">{selectedPlayer.level}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Country" value={selectedPlayer.nationality} />
            <StatPill label="Match Wins" value={selectedPlayer.wins} accent />
            <StatPill label="Total Matches" value={selectedPlayer.matchesPlayed} />
            <StatPill label="Win Rate" value={`${selectedPlayer.matchesPlayed > 0 ? Math.round((selectedPlayer.wins / selectedPlayer.matchesPlayed) * 100) : 0}%`} />
          </div>
          <ActionBtn fullWidth variant="secondary" className="mt-4">View full profile →</ActionBtn>
        </SectionCard>
      )}
    </div>
  );
}

export function OrgsSection({
  orgs,
  selectedOrg,
  selectedOrgDetails,
  setSelectedOrg,
  onExploreMemberships,
  onApplyRole,
  onViewFullDetails,
  viewFullDetails,
  purchaseMembership,
  loadingPayment,
  paymentStatus,
}: {
  orgs: Organization[];
  selectedOrg: Organization | null;
  selectedOrgDetails: Organization | null;
  setSelectedOrg: (org: Organization) => void;
  onExploreMemberships: () => void;
  onApplyRole: (orgId: string, role: string) => void;
  onViewFullDetails: (orgId: string) => void;
  viewFullDetails: boolean;
  purchaseMembership: (tier: MembershipTierOption) => void;
  loadingPayment: boolean;
  paymentStatus: string;
}) {
  const org = selectedOrgDetails || selectedOrg;
  const membershipTiers = (org?.membershipTiers || MEMBERSHIP_TIERS).map(normalizeMembershipTier);
  const coaches = org?.members?.filter((member) => member.role === 'coach') || [];
  const referees = org?.members?.filter((member) => member.role === 'referee') || [];
  const players = org?.members?.filter((member) => member.role === 'player') || [];
  const isOrgSelected = Boolean(selectedOrg);
  const summaryView = isOrgSelected && !viewFullDetails;

  const detailsPane = selectedOrg ? (
    summaryView ? (
      <SectionCard title="Organization Summary" subtitle={`Quick view for ${selectedOrg.name}`}>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-extrabold" style={{ color: '#e8f5e0' }}>{selectedOrg.name}</h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#7aaa6a' }}>{selectedOrg.description || 'No description available.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Contact</p>
              <p className="text-sm font-semibold mt-2" style={{ color: '#e8f5e0' }}>{selectedOrg.email || selectedOrg.contact || 'Not listed'}</p>
              <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>{selectedOrg.phone || selectedOrg.address || ''}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Location</p>
              <p className="text-sm font-semibold mt-2" style={{ color: '#e8f5e0' }}>{selectedOrg.city || 'Unknown city'}</p>
              <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>{selectedOrg.country || 'Unknown country'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Members" value={selectedOrg._count.members} accent />
            <StatPill label="Courts" value={selectedOrg._count.courts} />
            <StatPill label="Events" value={selectedOrg._count.events} />
            <StatPill label="Coaches" value={selectedOrg.members?.filter((member) => member.role === 'coach').length ?? 0} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Basic courts</p>
              <p className="text-sm mt-3" style={{ color: '#e8f5e0' }}>{selectedOrg.courts?.length ?? 0} courts available</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Upcoming events</p>
              <p className="text-sm mt-3" style={{ color: '#e8f5e0' }}>{selectedOrg.events?.length ?? 0} events scheduled</p>
            </div>
          </div>

          <button
            onClick={() => onViewFullDetails(selectedOrg.id)}
            className="rounded-xl px-4 py-3 font-semibold w-full text-left"
            style={{ background: '#243e24', color: '#e8f5e0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span>View full details</span>
              <span style={{ color: '#7aaa6a', fontSize: 12 }}>/organization/{selectedOrg.id}</span>
            </div>
          </button>
        </div>
      </SectionCard>
    ) : (
      <SectionCard title="Organization Details" subtitle={`Full profile for ${org?.name || selectedOrg.name}`}>
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Contact</p>
            <p className="text-sm font-semibold mt-2" style={{ color: '#e8f5e0' }}>{org?.email || org?.contact || selectedOrg.email || selectedOrg.contact || 'Not listed'}</p>
            <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>{org?.phone || selectedOrg.phone || org?.address || selectedOrg.address || ''}</p>
          </div>

          <div className="rounded-2xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Location</p>
            <p className="text-sm font-semibold mt-2" style={{ color: '#e8f5e0' }}>{org?.city || selectedOrg.city || 'Unknown city'}</p>
            <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>{org?.country || selectedOrg.country || 'Unknown country'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Courts</p>
              <p className="text-sm mt-2" style={{ color: '#e8f5e0' }}>{org?.courts?.length ?? selectedOrg.courts?.length ?? 0} courts</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Events</p>
              <p className="text-sm mt-2" style={{ color: '#e8f5e0' }}>{org?.events?.length ?? selectedOrg.events?.length ?? 0} events</p>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: '#0f1f0f', border: `1px solid #243e24` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Summary</p>
            <p className="text-sm mt-3" style={{ color: '#e8f5e0' }}>{org?.description || selectedOrg.description || 'No description available.'}</p>
          </div>
        </div>
      </SectionCard>
    )
  ) : (
    <SectionCard title="Organization Details" subtitle="Select an organization to see full details">
      <p style={{ color: '#7aaa6a' }}>Choose an organization from the list to view courts, events, staff, and membership options.</p>
    </SectionCard>
  );

  return (
    <div className={`grid grid-cols-1 ${isOrgSelected ? 'lg:grid-cols-[1fr_1.1fr]' : ''} gap-4`}>
      <SectionCard title="Clubs & Organizations" subtitle={`${orgs.length} featured`}>
        <div className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {orgs.length === 0 ? (
            <p style={{ color: '#7aaa6a' }}>No organizations found.</p>
          ) : (
            orgs.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedOrg(candidate)}
                className="flex items-start justify-between rounded-xl px-4 py-3 text-left transition-all hover:opacity-90 gap-3"
                style={{
                  background: selectedOrg?.id === candidate.id ? '#2d5a27' : '#1b2f1b',
                  border: `1px solid ${selectedOrg?.id === candidate.id ? '#7dc142' : '#243e24'}`,
                  color: '#e8f5e0',
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{candidate.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7aaa6a' }}>
                    {candidate._count.members} members · {candidate._count.courts} courts
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap mt-0.5 flex-shrink-0" style={{ color: '#7aaa6a' }}>{candidate.city}</span>
              </button>
            ))
          )}
        </div>
      </SectionCard>

      {detailsPane}
    </div>
  );
}

const ROLE_DETAILS: Record<string, string[]> = {
  player: [
    'Join a team or club roster and access match schedules.',
    'Receive event invites, training updates, and court booking priority.',
    'Ideal for athletes who want a more active role in the club.',
  ],
  coach: [
    'Lead training sessions, clinics, and player development programs.',
    'Manage schedules, communicate with athletes, and support coaching operations.',
    'Best for experienced coaches or trainers wanting club membership access.',
  ],
  referee: [
    'Officiate matches, manage scorekeeping, and support tournament operations.',
    'Receive referee assignments and event notifications from the organization.',
    'Perfect for certified officials or those interested in match oversight.',
  ],
};

export function ApplySection({
  orgs,
  applyOrg,
  setApplyOrg,
  applyPosition,
  setApplyPosition,
  applyEmail,
  setApplyEmail,
  handleApply,
  applicationResult,
  applications = [],
  onRemind,
}: {
  orgs: Organization[];
  applyOrg: string;
  setApplyOrg: (value: string) => void;
  applyPosition: string;
  setApplyPosition: (value: string) => void;
  applyEmail: string;
  setApplyEmail: (value: string) => void;
  handleApply: () => void;
  applicationResult: string;
  applications?: Array<{ id: string; organizationId: string; organizationName?: string; position: string; status: string; appliedAt: string }>;
  onRemind?: (application: any) => void;
}) {
  const [remindingId, setRemindingId] = React.useState<string | null>(null);

  const handleRemindClick = async (app: any) => {
    setRemindingId(app.id);
    try {
      if (onRemind) {
        await onRemind(app);
      }
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Applied Organizations Section */}
      {applications && applications.length > 0 && (
        <SectionCard title="Your Applications" subtitle={`${applications.length} active`}>
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl p-4"
                style={{
                  background: '#132917',
                  border: `1px solid ${app.status === 'approved' ? '#7dc142' : '#243e24'}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>
                      {app.organizationName || 'Organization'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>
                      Role: <span style={{ color: '#a7d16c' }}>{app.position}</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      color={app.status === 'approved' ? '#7dc142' : '#7aaa6a'}
                    >
                      {app.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                    </Badge>
                    {app.status === 'pending' && (
                      <button
                        onClick={() => handleRemindClick(app)}
                        disabled={remindingId === app.id}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: remindingId === app.id ? '#0f1f0f' : '#2d5a27',
                          color: remindingId === app.id ? '#7aaa6a' : '#e8f5e0',
                          border: `1px solid ${remindingId === app.id ? '#243e24' : '#7dc142'}`,
                          cursor: remindingId === app.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {remindingId === app.id ? 'Sending...' : 'Remind'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Apply Form Section */}
      <SectionCard
        title="Apply to Join"
        subtitle="Select an organization and choose your role. You can apply for multiple roles in the same organization."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: '#d8e8c2' }}>
            Complete the form below to request membership with the organization. You can apply for different roles (player, coach, referee) in the same organization. Once submitted, your application is sent to the organization for review and confirmation.
          </p>

          <FormField label="Organization">
            <select value={applyOrg} onChange={(event) => setApplyOrg(event.target.value)} style={inputStyle}>
              <option value="">Select an organization...</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>Role Selection</div>
                <div className="text-xs" style={{ color: '#a7d16c' }}>
                  Choose the role that best matches how you want to participate with the organization.
                </div>
              </div>
              <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: '#7dc142' }}>
                {applyPosition ? `Selected: ${applyPosition}` : 'Choose one'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {POSITIONS.map((position) => (
                <button
                  key={position.value}
                  onClick={() => setApplyPosition(position.value)}
                  className="flex flex-col gap-3 rounded-3xl p-4 text-left transition-all duration-150"
                  style={{
                    background: applyPosition === position.value ? '#2d5a27' : '#132915',
                    border: `1px solid ${applyPosition === position.value ? '#7dc142' : '#243e24'}`,
                    color: '#e8f5e0',
                    minHeight: 150,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{position.label}</span>
                    <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: '#a7d16c' }}>
                      {applyPosition === position.value ? 'Selected' : 'Tap to select'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#b8d48a' }}>{position.description}</p>
                  <ul className="list-disc pl-4 text-[11px] leading-snug" style={{ color: '#c8e3a1' }}>
                    {ROLE_DETAILS[position.value]?.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <FormField label="Your Email">
            <input
              type="email"
              disabled
              value={applyEmail}
              placeholder="you@example.com"
              onChange={(event) => setApplyEmail(event.target.value)}
              style={inputStyle}
            />
          </FormField>

          <ActionBtn fullWidth onClick={handleApply}>Submit Application</ActionBtn>

          {applicationResult ? (
            <div
              className="rounded-3xl p-4 text-sm font-medium"
              style={{
                background: applicationResult.includes('✓') || applicationResult.toLowerCase().includes('reminder') ? '#5fc45f18' : '#ff44441a',
                border: `1px solid ${applicationResult.includes('✓') || applicationResult.toLowerCase().includes('reminder') ? '#5fc45f' : '#ff4444'}`,
                color: applicationResult.includes('✓') || applicationResult.toLowerCase().includes('reminder') ? '#a8d84e' : '#ff8888',
              }}
            >
              {applicationResult}
            </div>
          ) : null}

          <div className="rounded-3xl border p-4 text-sm" style={{ background: '#0e2212', borderColor: '#243e24', color: '#c7d9a4' }}>
            <div className="font-semibold" style={{ color: '#e2f1c7' }}>What happens after you apply</div>
            <ol className="mt-3 space-y-2 list-decimal pl-5 text-xs leading-relaxed">
              <li>We save your request and send it to the selected organization.</li>
              <li>The organization reviews your email, role choice, and membership request.</li>
              <li>Once approved, the organization will confirm your membership and notify you here.</li>
            </ol>
            <div className="mt-3 text-[11px]" style={{ color: '#9cc87d' }}>
              If approved, you may receive instructions for any membership payment or next steps required to complete the join process.
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function MatchesSection({
  matches,
  filter,
  setFilter,
  page,
  setPage,
  sort,
  setSort,
  hasMore,
  loading,
}: {
  matches: Match[];
  filter: MatchFilter;
  setFilter: (value: MatchFilter) => void;
  page: number;
  setPage: (value: number) => void;
  sort: 'latest' | 'oldest';
  setSort: (value: 'latest' | 'oldest') => void;
  hasMore: boolean;
  loading: boolean;
}) {
  const filterOptions = [
    { key: 'all', label: 'All Matches', icon: '📊' },
    { key: 'ongoing', label: 'Live Now', icon: '🔴' },
    { key: 'upcoming', label: 'Upcoming', icon: '⏰' },
    { key: 'past', label: 'Completed', icon: '✅' },
  ] as const;

  if (loading) {
    return (
      <SectionCard title="Matches" subtitle={`Loading page ${page}...`}>
        <div className="text-center py-10" style={{ color: '#7aaa6a' }}>
          Loading match results...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filter === option.key ? 'scale-105' : ''}`}
              style={{
                background: filter === option.key ? '#2d5a27' : '#1b2f1b',
                border: `1px solid ${filter === option.key ? '#7dc142' : '#243e24'}`,
                color: '#e8f5e0',
              }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as 'latest' | 'oldest')}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: '#1b2f1b', border: '1px solid #243e24', color: '#e8f5e0' }}
          >
            <option value="latest">Latest to Oldest</option>
            <option value="oldest">Oldest to Latest</option>
          </select>
        </div>
      </div>

      {matches.length === 0 ? (
        <SectionCard title="No Matches Found" subtitle={`No ${filter} matches available`}>
          <p style={{ color: '#7aaa6a' }}>Check back later for updates.</p>
        </SectionCard>
      ) : (
        <div className="grid gap-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-xl p-4 transition-all hover:opacity-90"
              style={{ background: '#1b2f1b', border: `1px solid #243e24` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color={match.status === 'ONGOING' ? '#d94f4f' : match.status === 'COMPLETED' ? '#5fc45f' : '#4a9eff'}>
                      {match.status === 'ONGOING' ? '🔴' : match.status === 'COMPLETED' ? '✅' : '⏰'} {match.status}
                    </Badge>
                    {match.event && (
                      <span className="text-xs font-semibold" style={{ color: '#7aaa6a' }}>{match.event}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold truncate" style={{ color: '#e8f5e0' }}>
                      {match.playerA?.name || 'TBD'} vs {match.playerB?.name || 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#7aaa6a' }}>
                    <span>{match.court || 'Court TBD'}</span>
                    <span>{new Date(match.date).toLocaleDateString()}</span>
                    {match.scheduledTime && <span>{match.scheduledTime}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold mb-1" style={{ color: '#7dc142' }}>{match.score}</div>
                  {match.winner && (
                    <div className="text-xs" style={{ color: '#5fc45f' }}>
                      Winner: {match.winner.name}
                    </div>
                  )}
                  {match.status === 'ONGOING' && <ActionBtn onClick={() => {}}>Watch Live</ActionBtn>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: page === 1 ? '#182217' : '#243e24',
            color: page === 1 ? '#5f7d5f' : '#e8f5e0',
            border: `1px solid ${page === 1 ? '#243e24' : '#7dc142'}`,
          }}
        >
          Previous
        </button>
        <span className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: !hasMore ? '#182217' : '#243e24',
            color: !hasMore ? '#5f7d5f' : '#e8f5e0',
            border: `1px solid ${!hasMore ? '#243e24' : '#7dc142'}`,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function MessagesSection({ userId }: { userId: string }) {
  return <MessagingPanel userId={userId} userType="spectator" />;
}

export function MembershipSection({
  selectedOrg,
  selectedOrgDetails,
  purchaseMembership,
  loadingPayment,
  paymentStatus,
  applications = [],
  onViewOrg,
}: {
  selectedOrg: Organization | null;
  selectedOrgDetails?: Organization | null;
  purchaseMembership: (tier: MembershipTierOption) => void;
  loadingPayment: boolean;
  paymentStatus: string;
  applications?: MembershipApplication[];
  onViewOrg?: (orgId: string) => void;
}) {
  const membershipTiers = (selectedOrgDetails?.membershipTiers ?? MEMBERSHIP_TIERS).map(normalizeMembershipTier);
  const activeMemberships = applications.filter((app) => app.status === 'approved');
  const pendingApplications = applications.filter((app) => app.status === 'pending');
  const selectedOrgMembership = selectedOrg ? activeMemberships.find((app) => app.organizationId === selectedOrg.id) : undefined;
  const selectedOrgPending = selectedOrg ? pendingApplications.find((app) => app.organizationId === selectedOrg.id) : undefined;

  return (
    <SectionCard
      title="Membership Dashboard"
      subtitle="Approved memberships, role access, and next actions"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
          <p className="text-sm font-semibold" style={{ color: '#7aaa6a' }}>Membership summary</p>
          <p className="text-lg font-bold mt-2" style={{ color: '#e8f5e0' }}>
            {activeMemberships.length > 0
              ? `You belong to ${activeMemberships.length} organization${activeMemberships.length === 1 ? '' : 's'}`
              : 'You are not yet an active member of any organization.'}
          </p>
          <p className="text-sm mt-2" style={{ color: '#7aaa6a' }}>
            {activeMemberships.length > 0
              ? 'Manage your memberships, open the organization portal, and track role-specific access from one place.'
              : 'Pick an organization, choose a membership tier, or submit a role application to get started.'}
          </p>
        </div>

        {activeMemberships.length > 0 && (
          <div className="grid gap-3">
            {activeMemberships.map((membership) => (
              <div key={membership.id} className="rounded-xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: '#7aaa6a' }}>Active membership</p>
                    <p className="text-xl font-semibold mt-2" style={{ color: '#e8f5e0' }}>{membership.organizationName}</p>
                    <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Role: {membership.position}</p>
                    <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Status: Approved</p>
                  </div>
                  {onViewOrg ? (
                    <ActionBtn
                      variant="secondary"
                      onClick={() => onViewOrg(membership.organizationId)}
                    >
                      Open organization
                    </ActionBtn>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingApplications.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
            <p className="text-sm font-semibold" style={{ color: '#f3d55b' }}>Pending applications</p>
            <div className="space-y-3 mt-3">
              {pendingApplications.map((app) => (
                <div key={app.id} className="rounded-2xl p-3" style={{ background: '#0f1f0f', border: `1px solid #243e24` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#e8f5e0' }}>{app.organizationName}</p>
                      <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Role: {app.position}</p>
                      <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    {onViewOrg ? (
                      <ActionBtn variant="secondary" onClick={() => onViewOrg(app.organizationId)}>
                        View organization
                      </ActionBtn>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedOrg ? (
          selectedOrgMembership ? (
            <div className="rounded-xl p-4" style={{ background: '#132917', border: `1px solid #243e24` }}>
              <p className="text-sm font-semibold" style={{ color: '#7aaa6a' }}>Already a member</p>
              <p className="text-lg font-bold mt-2" style={{ color: '#e8f5e0' }}>
                {selectedOrg.name}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Role: {selectedOrgMembership.position}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {onViewOrg && (
                  <ActionBtn variant="secondary" onClick={() => onViewOrg(selectedOrg.id)}>
                    View organization portal
                  </ActionBtn>
                )}
              </div>
            </div>
          ) : selectedOrgPending ? (
            <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
              <p className="text-sm font-semibold" style={{ color: '#f3d55b' }}>Application in review</p>
              <p className="text-lg font-bold mt-2" style={{ color: '#e8f5e0' }}>{selectedOrg.name}</p>
              <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>Role: {selectedOrgPending.position}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {membershipTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: '#1b2f1b', border: `1px solid #243e24` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: '#e8f5e0' }}>{tier.name}</h3>
                      <p className="text-xs" style={{ color: '#7aaa6a' }}>${tier.monthlyPrice.toFixed(0)} / month</p>
                    </div>
                    <span className="h-2 w-2 rounded-full" style={{ background: '#7dc142' }} />
                  </div>
                  <div className="space-y-1 text-xs" style={{ color: '#7aaa6a' }}>
                    {(Array.isArray(tier.benefits) ? tier.benefits : []).map((perk) => (
                      <div key={perk}>• {perk}</div>
                    ))}
                  </div>
                  <ActionBtn
                    fullWidth
                    variant="secondary"
                    disabled={loadingPayment}
                    onClick={() => purchaseMembership(tier)}
                  >
                    {loadingPayment ? 'Processing…' : `Choose ${tier.name}`}
                  </ActionBtn>
                </div>
              ))}
            </div>
          )
        ) : (
          <p style={{ color: '#7aaa6a' }}>Select an organization from the Organizations tab to review member access options and membership tiers.</p>
        )}

        {paymentStatus ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: paymentStatus.toLowerCase().includes('ready') ? '#5fc45f18' : '#1b2f1b',
              border: `1px solid ${paymentStatus.toLowerCase().includes('ready') ? '#5fc45f' : '#243e24'}`,
              color: paymentStatus.toLowerCase().includes('ready') ? '#5fc45f' : '#c2dbb0',
            }}
          >
            {paymentStatus}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

export function CommunitySection() {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Community"
        subtitle="Share posts, react, and comment on the same experience as other dashboards"
      >
        <CommunityView isEmbedded={true} />
      </SectionCard>

      <SectionCard
        title="Groups"
        subtitle="Community groups coming soon"
      >
        <div className="rounded-xl p-4" style={{ background: '#111f12', border: `1px solid #243e24` }}>
          <p className="text-sm" style={{ color: '#e8f5e0' }}>
            Community groups are coming soon. For now, you can view and comment on all public posts here.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export function CreateOrgSection({
  orgFormData,
  setOrgFormData,
  handleCreateOrg,
  orgLoading,
  orgError,
  orgSuccess,
  setOrgSuccess,
  pendingOrgs = [],
  onRemindOrg,
}: {
  orgFormData: {
    name: string;
    description: string;
    city: string;
    country: string;
    phone: string;
    email: string;
  };
  setOrgFormData: (data: any) => void;
  handleCreateOrg: () => void;
  orgLoading: boolean;
  orgError: string;
  orgSuccess: boolean;
  setOrgSuccess: (value: boolean) => void;
  pendingOrgs?: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
  onRemindOrg?: (orgId: string) => Promise<void>;
}) {
  const [remindingOrgId, setRemindingOrgId] = React.useState<string | null>(null);

  const handleRemind = async (orgId: string) => {
    setRemindingOrgId(orgId);
    try {
      if (onRemindOrg) {
        await onRemindOrg(orgId);
      }
    } finally {
      setRemindingOrgId(null);
    }
  };

  return (
    <SectionCard title="Create Your Organization" subtitle="Start your own sports organization or club">
      <div className="flex flex-col gap-4">
        {/* Show pending organizations if any */}
        {pendingOrgs.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#1b2f1b', border: '1px solid #243e24' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#f3d55b' }}>
              ⏳ Organizations Pending Approval ({pendingOrgs.length})
            </p>
            <div className="space-y-3">
              {pendingOrgs.map((org) => (
                <div
                  key={org.id}
                  className="rounded-2xl p-3 flex items-center justify-between gap-3"
                  style={{ background: '#132917', border: '1px solid #243e24' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#e8f5e0' }}>
                      {org.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>
                      Created: {new Date(org.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemind(org.id)}
                    disabled={remindingOrgId === org.id}
                    className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: remindingOrgId === org.id ? '#0f1f0f' : '#2d5a27',
                      color: remindingOrgId === org.id ? '#7aaa6a' : '#e8f5e0',
                      border: `1px solid ${remindingOrgId === org.id ? '#243e24' : '#7dc142'}`,
                      cursor: remindingOrgId === org.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {remindingOrgId === org.id ? 'Sending...' : 'Remind'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!orgSuccess ? (
          <>
            <div className="rounded-xl p-4" style={{ background: '#0f1f0f', border: `1px solid #243e24` }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7dc142', marginBottom: 12 }}>
                📋 Basic Information
              </p>
              
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Elite Tennis Club"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    style={{
                      ...inputStyle,
                      background: '#132915',
                      border: '1px solid #243e24',
                      color: '#e8f5e0',
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Nairobi"
                      value={orgFormData.city}
                      onChange={(e) => setOrgFormData({ ...orgFormData, city: e.target.value })}
                      style={{
                        ...inputStyle,
                        background: '#132915',
                        border: '1px solid #243e24',
                        color: '#e8f5e0',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="Kenya"
                      value={orgFormData.country}
                      onChange={(e) => setOrgFormData({ ...orgFormData, country: e.target.value })}
                      style={{
                        ...inputStyle,
                        background: '#132915',
                        border: '1px solid #243e24',
                        color: '#e8f5e0',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="contact@org.com"
                      value={orgFormData.email}
                      onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                      style={{
                        ...inputStyle,
                        background: '#132915',
                        border: '1px solid #243e24',
                        color: '#e8f5e0',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+254700000000"
                      value={orgFormData.phone}
                      onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                      style={{
                        ...inputStyle,
                        background: '#132915',
                        border: '1px solid #243e24',
                        color: '#e8f5e0',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Tell us about your organization..."
                    value={orgFormData.description}
                    onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                    rows={4}
                    style={{
                      ...inputStyle,
                      background: '#132915',
                      border: '1px solid #243e24',
                      color: '#e8f5e0',
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

            {orgError && (
              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: '#ff5e5e18',
                  border: '1px solid #d94f4f',
                  color: '#ff8a8a',
                }}
              >
                {orgError}
              </div>
            )}

            <ActionBtn
              fullWidth
              disabled={orgLoading || !orgFormData.name.trim()}
              onClick={handleCreateOrg}
            >
              {orgLoading ? 'Creating Organization...' : '✨ Create Organization'}
            </ActionBtn>

            <div className="rounded-xl p-3" style={{ background: '#142d17', border: '1px solid #243e24' }}>
              <p className="text-xs" style={{ color: '#7aaa6a', lineHeight: 1.5 }}>
                💡 Once created, your organization will appear in the developer portal for confirmation. You'll be set as the admin and can start managing courts, events, and members.
              </p>
            </div>
          </>
        ) : (
          <div>
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: '#5fc45f18',
                border: '1px solid #5fc45f',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 className="text-lg font-bold" style={{ color: '#5fc45f', marginBottom: 8 }}>
                Organization Created Successfully!
              </h3>
              <p style={{ color: '#a8d84e', marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
                {orgFormData.name} has been created. It will appear in the developer portal for confirmation. You've been set as the organization admin.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg p-3" style={{ background: '#0f1f0f', border: '1px solid #243e24' }}>
                  <div style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600 }}>LOCATION</div>
                  <div style={{ fontSize: 13, color: '#e8f5e0', marginTop: 4 }}>
                    {orgFormData.city}, {orgFormData.country}
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#0f1f0f', border: '1px solid #243e24' }}>
                  <div style={{ fontSize: 11, color: '#7aaa6a', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: 13, color: '#e8f5e0', marginTop: 4 }}>
                    {orgFormData.email || 'Not provided'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrgSuccess(false);
                  setOrgFormData({ name: '', description: '', city: '', country: '', phone: '', email: '' });
                }}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: '#5fc45f', color: '#0a180a', border: 'none', cursor: 'pointer' }}
              >
                Create Another Organization
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export function FindPeopleSection({ 
  onMessageClick, 
  onChallengeClick 
}: { 
  onMessageClick: (personId: string, personName: string) => void;
  onChallengeClick: (personId: string, personName: string) => void;
}) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#7dc142', marginBottom: 8 }}>
          👥 Find People Near You
        </h2>
        <p style={{ color: '#6a8a6a', fontSize: 14 }}>
          Discover and connect with tennis players in your area
        </p>
      </div>
      <div style={{ 
        background: '#0f1f0f', 
        borderRadius: 12, 
        padding: 20, 
        border: '1px solid #2d5a35' 
      }}>
        <FindNearbyPeople 
          onMessageClick={onMessageClick} 
          onChallengeClick={onChallengeClick}
        />
      </div>
    </div>
  );
}

export function FindCourtsSection() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#7dc142', marginBottom: 8 }}>
          🎾 Find Courts Near You
        </h2>
        <p style={{ color: '#6a8a6a', fontSize: 14 }}>
          Find and book available tennis courts in your area
        </p>
      </div>
      <div style={{ 
        background: '#0f1f0f', 
        borderRadius: 12, 
        padding: 20, 
        border: '1px solid #2d5a35' 
      }}>
        <FindNearbyCourts />
      </div>
    </div>
  );
}
