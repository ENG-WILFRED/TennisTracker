'use client';

import React, { useState } from 'react';
import { Match, Player, Organization, MatchFilter, MembershipApplication, MEMBERSHIP_TIERS, POSITIONS } from './types';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
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

      <div className="grid gap-4 xl:grid-cols-2">
        <FindNearbyPeople onMessageClick={onMessageClick} onChallengeClick={onChallengeClick} />
        <FindNearbyCourts />
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
            className="rounded-xl px-4 py-3 font-semibold w-full"
            style={{ background: '#243e24', color: '#e8f5e0' }}
          >
            View full details
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
}) {
  return (
    <SectionCard title="Apply to Join" subtitle="Submit your application to any listed organization">
      <div className="flex flex-col gap-4">
        <FormField label="Choose Organization">
          <select value={applyOrg} onChange={(event) => setApplyOrg(event.target.value)} style={inputStyle}>
            <option value="">Select an organization...</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {POSITIONS.map((position) => (
            <button
              key={position.value}
              onClick={() => setApplyPosition(position.value)}
              className="flex flex-col gap-1 rounded-3xl p-4 text-left transition-all duration-150"
              style={{
                background: applyPosition === position.value ? '#2d5a27' : '#132915',
                border: `1px solid ${applyPosition === position.value ? '#7dc142' : '#243e24'}`,
                color: '#e8f5e0',
                minHeight: 110,
              }}
            >
              <span className="text-sm font-bold">{position.label}</span>
              <span className="text-xs" style={{ color: '#a7d16c' }}>{position.description}</span>
            </button>
          ))}
        </div>

        <FormField label="Your Email">
          <input
            type="email"
            value={applyEmail}
            placeholder="you@example.com"
            onChange={(event) => setApplyEmail(event.target.value)}
            style={inputStyle}
          />
        </FormField>

        <ActionBtn fullWidth onClick={handleApply}>Submit Application</ActionBtn>

        {applicationResult ? (
          <div
            className="rounded-3xl p-4 text-sm"
            style={{
              background: applicationResult.toLowerCase().includes('success') ? '#5fc45f18' : '#152b17',
              border: `1px solid ${applicationResult.toLowerCase().includes('success') ? '#5fc45f' : '#2d5a35'}`,
              color: applicationResult.toLowerCase().includes('success') ? '#a8d84e' : '#b7d6a7',
            }}
          >
            {applicationResult}
          </div>
        ) : null}

        <p className="text-xs leading-relaxed rounded-3xl p-4" style={{ background: '#142d17', color: '#9dc877', border: `1px solid #243e24` }}>
          Your application will be saved to the database and reviewed by the organization. Approved applications may require membership payment to complete the join process.
        </p>
      </div>
    </SectionCard>
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
}: {
  selectedOrg: Organization | null;
  selectedOrgDetails?: Organization | null;
  purchaseMembership: (tier: MembershipTierOption) => void;
  loadingPayment: boolean;
  paymentStatus: string;
}) {
  const membershipTiers = (selectedOrgDetails?.membershipTiers ?? MEMBERSHIP_TIERS).map(normalizeMembershipTier);

  return (
    <SectionCard
      title="Membership"
      subtitle={selectedOrg ? `Choose a tier for ${selectedOrg.name}` : 'Select an organization to view membership options'}
    >
      <div className="flex flex-col gap-4">
        {selectedOrg ? (
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
        ) : (
          <p style={{ color: '#7aaa6a' }}>Pick an organization from the Organizations tab to review available membership tiers.</p>
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

export function CommunitySection({
  suggestedUsers,
  followingUsers,
  onFollow,
}: {
  suggestedUsers: any[];
  followingUsers: Set<string>;
  onFollow: (userId: string) => void;
}) {
  const mockUsers = suggestedUsers.length > 0 ? suggestedUsers : [
    { id: '1', name: 'James Kipchoge', role: 'Elite Player', followers: 1250, following: 89, img: '👤', verified: true },
    { id: '2', name: 'Elena Rodriguez', role: 'Coach', followers: 890, following: 145, img: '👤', verified: true },
    { id: '3', name: 'Maria Santos', role: 'Tennis Trainer', followers: 456, following: 234, img: '👤', verified: false },
    { id: '4', name: 'Ibrahim Hassan', role: 'Player', followers: 234, following: 567, img: '👤', verified: false },
    { id: '5', name: 'Priya Patel', role: 'Coach', followers: 2100, following: 312, img: '👤', verified: true },
    { id: '6', name: 'David Kim', role: 'Pro Player', followers: 3450, following: 198, img: '👤', verified: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Community" subtitle="Connect with players, coaches, and enthusiasts">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-xl p-5 flex flex-col gap-4 "
              style={{ background: '#1b2f1b', border: `1px solid #243e24` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: '#2d5a27' }}
                  >
                    {user.img}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold truncate" style={{ color: '#e8f5e0' }}>
                        {user.name}
                      </h3>
                      {user.verified && <span style={{ color: '#7dc142' }}>✓</span>}
                    </div>
                    <p className="text-xs" style={{ color: '#7aaa6a' }}>
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 text-center" style={{ background: '#132915' }}>
                  <div className="text-xs font-bold" style={{ color: '#7dc142' }}>
                    {user.followers}
                  </div>
                  <div className="text-[10px]" style={{ color: '#7aaa6a' }}>
                    Followers
                  </div>
                </div>
                <div className="rounded-lg p-2 text-center" style={{ background: '#132915' }}>
                  <div className="text-xs font-bold" style={{ color: '#4a9eff' }}>
                    {user.following}
                  </div>
                  <div className="text-[10px]" style={{ color: '#7aaa6a' }}>
                    Following
                  </div>
                </div>
              </div>

              <ActionBtn
                fullWidth
                variant={followingUsers.has(user.id) ? 'ghost' : 'primary'}
                onClick={() => !followingUsers.has(user.id) && onFollow(user.id)}
              >
                {followingUsers.has(user.id) ? '✓ Following' : '+ Follow'}
              </ActionBtn>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Featured Communities" subtitle="Join these active communities">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Tennis Enthusiasts', members: 5234, topic: 'General discussion' },
            { name: 'Competitive Players', members: 2109, topic: 'Tournament tips & strategy' },
            { name: 'Coaching Resources', members: 1856, topic: 'Training methods & drills' },
            { name: 'Match Analysis', members: 3421, topic: 'Game breakdowns & replays' },
          ].map((community) => (
            <div
              key={community.name}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: '#1b2f1b', border: `1px solid #243e24` }}
            >
              <div>
                <h4 className="text-sm font-bold" style={{ color: '#e8f5e0' }}>
                  {community.name}
                </h4>
                <p className="text-xs mt-1" style={{ color: '#7aaa6a' }}>
                  {community.topic}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#7aaa6a' }}>
                  👥 {community.members.toLocaleString()} members
                </span>
                <ActionBtn variant="ghost" onClick={() => {}}>
                  Join
                </ActionBtn>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
