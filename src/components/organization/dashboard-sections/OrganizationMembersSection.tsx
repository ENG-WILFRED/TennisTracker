'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken, refreshAccessToken } from '@/lib/tokenManager';

const G = {
  dark: '#0a1a0a',
  sidebar: '#0f1f0f',
  card: '#111e11',
  cardBorder: '#1e3d20',
  cardHover: '#162616',
  mid: '#1e4020',
  bright: '#2e6b28',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  textSoft: '#b8d8a8',
  muted: '#5a8a4a',
  yellow: '#f0c040',
  red: '#e05050',
  blue: '#4ab0d0',
  orange: '#e08030',
  glass: 'rgba(125,193,66,0.07)',
  courtLine: 'rgba(125,193,66,0.15)',
};

const ROLE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; actions: string[] }> = {
  player: {
    icon: '🎾',
    label: 'Player',
    color: G.lime,
    bg: 'rgba(125,193,66,0.12)',
    actions: ['View Profile', 'Match History', 'Rankings', 'Schedule Session', 'Assign Coach', 'Track Progress'],
  },
  coach: {
    icon: '🏆',
    label: 'Coach',
    color: G.blue,
    bg: 'rgba(74,176,208,0.12)',
    actions: ['View Schedule', 'Manage Students', 'Add Training Plan', 'Performance Reports', 'Certifications', 'Availability'],
  },
  referee: {
    icon: '⚖️',
    label: 'Referee',
    color: G.yellow,
    bg: 'rgba(240,192,64,0.12)',
    actions: ['Assign to Match', 'Certification Level', 'Match History', 'Availability', 'ITF Badge', 'Reports'],
  },
  admin: {
    icon: '⚙️',
    label: 'Admin',
    color: G.orange,
    bg: 'rgba(224,128,48,0.12)',
    actions: ['Manage Access', 'Audit Log', 'Permissions', 'Reports'],
  },
};

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'player' | 'coach' | 'referee' | 'admin' | 'member' | 'inactive';
  tier?: string;
  paymentStatus?: string;
  status?: 'active' | 'inactive' | 'pending';
  joinDate?: string;
  visits?: number;
  ranking?: number;
  coach?: string;
  photo?: string | null;
  nationality?: string;
  age?: number;
  player?: { userId?: string; user?: { id?: string; email?: string } };
  matchesOfficiated?: number;
  students?: number;
  certification?: string;
  certLevel?: string;
};

type Role = 'player' | 'coach' | 'referee' | 'admin' | 'all';

function Avatar({ member, size = 44 }: { member: Member; size?: number }) {
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.player;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${G.mid}, ${G.bright})`,
        border: `2px solid ${cfg.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: G.text,
        fontFamily: "'Raleway', sans-serif",
        overflow: 'hidden',
      }}>
        {member.photo
          ? <img src={member.photo} alt={member.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : `${member.firstName[0]}${member.lastName[0]}`}
      </div>
      <div style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 16, height: 16, borderRadius: '50%',
        background: G.dark, border: `1px solid ${G.cardBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9,
      }}>
        {cfg.icon}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.player;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      fontFamily: "'Raleway', sans-serif",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status?: string }) {
  const valid = status || 'unknown';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: valid === 'active' ? G.lime : G.muted }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: valid === 'active' ? G.lime : G.muted, display: 'inline-block', boxShadow: valid === 'active' ? `0 0 6px ${G.lime}` : 'none' }} />
      {valid}
    </span>
  );
}

function TierBadge({ tier }: { tier?: string }) {
  const colors: Record<string, string> = { Elite: G.yellow, Premium: G.accent, Basic: G.muted };
  const value = tier || 'Not Set';
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: colors[value] || G.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {value === 'Elite' ? '★ ' : value === 'Premium' ? '◆ ' : '• '}{value}
    </span>
  );
}

function MemberCard({ member, onClick }: { member: Member; onClick: () => void }) {
  const renderRoleDetail = () => {
    if (member.role === 'player') return (
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <span style={{ fontSize: 9, color: G.muted }}>Rank <strong style={{ color: G.lime }}>#{(member as any).ranking}</strong></span>
        <span style={{ fontSize: 9, color: G.muted }}>Coach: <strong style={{ color: G.textSoft }}>{(member as any).coach}</strong></span>
      </div>
    );
    if (member.role === 'coach') return (
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <span style={{ fontSize: 9, color: G.muted }}><strong style={{ color: G.blue }}>{(member as any).students}</strong> students</span>
        <span style={{ fontSize: 9, color: G.muted }}>{(member as any).certification}</span>
      </div>
    );
    if (member.role === 'referee') return (
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <span style={{ fontSize: 9, color: G.muted }}><strong style={{ color: G.yellow }}>{(member as any).matchesOfficiated}</strong> matches</span>
        <span style={{ fontSize: 9, color: G.muted }}>{(member as any).certLevel}</span>
      </div>
    );
    return null;
  };

  return (
    <div className="member-card-grid" style={{
      background: G.card, borderRadius: 10, padding: '12px 14px',
      border: `1px solid ${G.cardBorder}`,
      alignItems: 'center', gap: 12,
      transition: 'border-color 0.2s, background 0.2s',
      cursor: 'pointer',
    }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = G.cardHover; (e.currentTarget as HTMLElement).style.borderColor = G.mid; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = G.card; (e.currentTarget as HTMLElement).style.borderColor = G.cardBorder; }}
    >
      <Avatar member={member} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: G.text, fontFamily: "'Raleway', sans-serif" }}>
            {member.firstName} {member.lastName}
          </span>
          <RoleBadge role={member.role} />
          <TierBadge tier={member.tier} />
          <StatusDot status={member.status} />
        </div>
        <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{member.email}</div>
        {renderRoleDetail()}
      </div>

      <div className="member-card-meta" style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: G.muted }}>Age {member.age} · {member.nationality}</div>
        <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{member.visits ?? 0} visits</div>
        <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>Since {member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Unknown'}</div>
      </div>
    </div>
  );
}

export default function OrganizationMembersSection({
  organizationId,
  members: propMembers,
  membersLoading,
}: {
  organizationId?: string;
  members?: any[];
  membersLoading?: boolean;
}) {
  const incomingMembers = (propMembers && propMembers.length > 0) ? propMembers : [];
  const loading = membersLoading ?? false;

  const [memberData, setMemberData] = useState<Member[]>(incomingMembers);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // Track which specific action is loading
  const [notify, setNotify] = useState<string | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Member | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    const isSameById = memberData.length === incomingMembers.length && incomingMembers.every((m, idx) => m.id === memberData[idx]?.id);
    if (isSameById) return;

    // Adopt incoming members only when the incoming set has changed.
    // Avoid repeated overwrites due to parenting recreating the array on each render.
    setMemberData(incomingMembers);
  }, [incomingMembers, memberData]);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notify) {
      const timer = setTimeout(() => setNotify(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notify]);

  // Helper function to get button text based on loading state
  const getButtonText = (action: string, defaultText: string) => {
    if (loadingAction === action) {
      switch (action) {
        case 'activate': return 'Activating...';
        case 'deactivate': return 'Deactivating...';
        case 'suspend': return 'Suspending...';
        case 'dismiss': return 'Dismissing...';
        case 'delete': return 'Deleting...';
        case 'approve': return 'Approving...';
        case 'reject': return 'Rejecting...';
        case 'message': return 'Sending...';
        default: return `${defaultText}...`;
      }
    }
    return defaultText;
  };

  const updateMemberStatus = async (
    member: Member,
    action: 'activate' | 'deactivate' | 'suspend' | 'dismiss' | 'delete' | 'approve' | 'reject',
    extra?: { until?: string; reason?: string }
  ) => {
    if (!organizationId || !member?.id) {
      setNotify('❌ Organization or member data missing');
      return;
    }

    let token = getAccessToken();
    if (!token) {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = getAccessToken();
      }
    }
    
    if (!token) {
      setNotify('❌ Authentication required. Please log in again.');
      return;
    }

    setActionLoading(true);
    setLoadingAction(action); // Set specific loading action
    setNotify(null); // Clear previous notifications

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (action === 'delete') {
        const del = await fetch(`/api/organization/${organizationId}/members/${member.id}`, {
          method: 'DELETE',
          headers,
        });

        if (!del.ok) {
          if (del.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (del.status === 403) {
            throw new Error('You do not have permission to delete this member.');
          } else if (del.status === 404) {
            throw new Error('Member not found.');
          } else {
            const payload = await del.json().catch((parseError) => {
              console.error('Failed to parse DELETE response JSON:', parseError);
              console.error('DELETE response status:', del.status);
              return { error: `Invalid response format (${del.status})` };
            });
            throw new Error(payload?.error || `Failed to delete member (${del.status})`);
          }
        }

        setMemberData(prev => prev.filter(m => m.id !== member.id));
        if (selectedMember?.id === member.id) setSelectedMember(null);
        setNotify(`✅ ${member.firstName} ${member.lastName} has been deleted successfully`);
        return;
      }

      const res = await fetch(`/api/organization/${organizationId}/members/${member.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action, ...extra }),
      });

      const payload = await res.json().catch((parseError) => {
        console.error('Failed to parse response JSON:', parseError);
        console.error('Response status:', res.status);
        console.error('Response headers:', Object.fromEntries(res.headers.entries()));
        return { error: `Invalid response format (${res.status})` };
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (res.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (res.status === 404) {
          throw new Error('Member not found.');
        } else {
          throw new Error(payload?.error || `Failed to ${action} member (${res.status})`);
        }
      }

      const updatedMember = payload.member;
      if (action === 'dismiss' || action === 'deactivate') {
        setMemberData(prev => prev.filter(m => m.id !== member.id));
        if (selectedMember?.id === member.id) setSelectedMember(null);
        setNotify(`✅ ${member.firstName} ${member.lastName} has been ${action}d successfully`);
      } else {
        setMemberData(prev => prev.map(m => (m.id === member.id ? { ...m, ...updatedMember } : m)));
        if (selectedMember?.id === member.id) setSelectedMember({ ...selectedMember, ...updatedMember as any });
        let actionLabel = 'updated';
        if (action === 'suspend') actionLabel = 'suspended';
        else if (action === 'activate' || action === 'approve') actionLabel = 'activated';
        else if (action === 'reject') actionLabel = 'rejected';
        setNotify(`✅ ${member.firstName} ${member.lastName} has been ${actionLabel} successfully`);
      }
    } catch (error: any) {
      console.error('Member action error:', error);
      setNotify(`❌ ${error?.message || `${action} failed`}`);
    } finally {
      setActionLoading(false);
      setLoadingAction(null); // Clear specific loading action
    }
  };

  const beginApprovalAction = (member: Member, action: 'approve' | 'reject') => {
    setApprovalTarget(member);
    setApprovalAction(action);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const confirmApprovalAction = async () => {
    if (!approvalTarget || !approvalAction) {
      setNotify('❌ Please select a member and action');
      return;
    }

    if (approvalAction === 'reject' && !approvalReason.trim()) {
      setNotify('❌ Please enter a reason for rejection');
      return;
    }

    await updateMemberStatus(approvalTarget, approvalAction, { reason: approvalReason.trim() || undefined });
    setShowApprovalModal(false);
    setApprovalTarget(null);
    setApprovalAction(null);
    setApprovalReason('');
  };

  const sendMessageToMember = async (member: Member) => {
    if (!member) {
      setNotify('❌ No member selected');
      return;
    }

    let token = getAccessToken();
    if (!token) {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = getAccessToken();
      }
    }
    
    if (!token) {
      setNotify('❌ Authentication required. Please log in again.');
      return;
    }

    const targetUserId = (member as any)?.player?.userId || (member as any)?.player?.user?.id;
    const targetEmail = member.email || (member as any)?.player?.user?.email;

    if (!targetUserId && !targetEmail) {
      setNotify('❌ Cannot find contact for selected member');
      return;
    }

    setActionLoading(true);
    setLoadingAction('message'); // Set loading for message action
    setNotify(null);

    try {
      const payload: any = {};
      if (targetUserId) payload.targetUserId = targetUserId;
      else payload.targetUserEmail = targetEmail;

      const res = await fetch('/api/chat/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (res.status === 403) {
          throw new Error('You do not have permission to send messages.');
        } else {
          const payload = await res.json().catch((parseError) => {
            console.error('Failed to parse message response JSON:', parseError);
            console.error('Message response status:', res.status);
            return { error: `Invalid response format (${res.status})` };
          });
          throw new Error(payload?.error || `Failed to start chat (${res.status})`);
        }
      }

      const data = await res.json();
      setNotify(`✅ DM room created. Redirecting to chat...`);
      window.location.href = `/chat?room=${data.id}`;
    } catch (error: any) {
      console.error('Send message error:', error);
      setNotify(`❌ ${error?.message || 'Failed to send message'}`);
    } finally {
      setActionLoading(false);
      setLoadingAction(null); // Clear specific loading action
    }
  };

  const inviteMember = async () => {
    if (!organizationId) {
      setNotify('❌ Organization not found');
      return;
    }

    // Validate form
    if (!inviteForm.fullName.trim()) {
      setNotify('❌ Full name is required');
      return;
    }

    if (!inviteForm.email.trim()) {
      setNotify('❌ Email address is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      setNotify('❌ Please enter a valid email address');
      return;
    }

    let token = getAccessToken();
    if (!token) {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = getAccessToken();
      }
    }
    
    if (!token) {
      setNotify('❌ Authentication required. Please log in again.');
      return;
    }

    setActionLoading(true);
    setLoadingAction('invite'); // Set loading for invite action
    setNotify(null);

    try {
      const res = await fetch(`/api/organization/${organizationId}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: inviteForm.fullName.trim(),
          email: inviteForm.email.trim().toLowerCase(),
          role: inviteForm.role,
          tier: inviteForm.tier,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (res.status === 403) {
          throw new Error('You do not have permission to invite members.');
        } else if (res.status === 409) {
          throw new Error('This email is already a member of the organization.');
        } else {
          const payload = await res.json().catch((parseError) => {
            console.error('Failed to parse invite response JSON:', parseError);
            console.error('Invite response status:', res.status);
            return { error: `Invalid response format (${res.status})` };
          });
          throw new Error(payload?.error || `Failed to send invitation (${res.status})`);
        }
      }

      const data = await res.json();
      setNotify(`✅ Invitation sent successfully to ${inviteForm.email}`);
      
      // Reset form and close modal
      setInviteForm({
        fullName: '',
        email: '',
        role: 'player',
        tier: 'Basic',
      });
      setShowInviteModal(false);

    } catch (error: any) {
      console.error('Invite member error:', error);
      setNotify(`❌ ${error?.message || 'Failed to send invitation'}`);
    } finally {
      setActionLoading(false);
      setLoadingAction(null); // Clear specific loading action
    }
  };


  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role>('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState('name');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'player' as 'player' | 'coach' | 'referee',
    tier: 'Basic',
  });

  const filtered = memberData.filter((m: Member) => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !search ||
      m.firstName?.toLowerCase().includes(search) ||
      m.lastName?.toLowerCase().includes(search) ||
      m.email?.toLowerCase().includes(search);
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    const matchTier = tierFilter === 'all' || m.tier?.toLowerCase() === tierFilter;
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchRole && matchTier && matchStatus;
  });

  const sorted = [...filtered].sort((a: Member, b: Member) => {
    if (sortBy === 'name') return a.firstName.localeCompare(b.firstName);
    if (sortBy === 'visits') return (b.visits || 0) - (a.visits || 0);
    if (sortBy === 'joined') {
      const aTime = a.joinDate ? new Date(a.joinDate).getTime() : 0;
      const bTime = b.joinDate ? new Date(b.joinDate).getTime() : 0;
      return bTime - aTime;
    }
    return 0;
  });

  const roleCounts = memberData.reduce((acc: Record<string, number>, m: Member) => {
    const r = m.role || 'member';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    total: memberData.length,
    active: memberData.filter((m: Member) => m.status === 'active').length,
    players: roleCounts.player || roleCounts.member || 0,
    coaches: roleCounts.coach || 0,
    referees: roleCounts.referee || 0,
    admins: roleCounts.admin || roleCounts.manager || 0,
    elite: memberData.filter((m: Member) => m.tier?.toLowerCase() === 'elite').length,
    totalVisits: memberData.reduce((s: number, m: Member) => s + (m.visits || 0), 0),
  };

  const pendingMembers = memberData.filter((m: Member) => m.status === 'pending');

  const statCards = [
    { label: 'Total Members', value: stats.total, color: G.lime, icon: '👥' },
    { label: 'Active', value: stats.active, color: G.bright, icon: '✅' },
    { label: 'Pending Approval', value: pendingMembers.length, color: G.yellow, icon: '⏳' },
    { label: '🎾 Players', value: stats.players, color: G.lime, icon: null },
    { label: '🏆 Coaches', value: stats.coaches, color: G.blue, icon: null },
    { label: '⚖️ Referees', value: stats.referees, color: G.yellow, icon: null },
    { label: '🛡 Admins', value: stats.admins, color: G.accent, icon: null },
    { label: '★ Elite Tier', value: stats.elite, color: G.yellow, icon: null },
    { label: 'Total Visits', value: stats.totalVisits, color: G.orange, icon: '📅' },
  ];

  const inputStyle = {
    flex: 1, background: 'transparent', border: 'none',
    color: G.text, fontSize: 11, outline: 'none',
    fontFamily: "'Raleway', sans-serif",
  };

  const btnStyle = (active: boolean, color = G.lime) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${active ? color : G.cardBorder}`,
    background: active ? color + '22' : 'transparent',
    color: active ? color : G.muted,
    transition: 'all 0.15s',
    fontFamily: "'Raleway', sans-serif",
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Raleway', sans-serif" }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap');
        .members-header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .members-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .members-stats-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .members-role-tabs { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .members-filter-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .members-detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        .member-card-grid { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; }
        .member-card-meta { text-align: right; }

        @media (max-width: 980px) {
          .members-stats-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
        }
        @media (max-width: 840px) {
          .members-detail-grid { grid-template-columns: 1fr; }
          .member-card-grid { grid-template-columns: 44px minmax(0, 1fr); }
          .member-card-meta { grid-column: 1 / -1; text-align: left; }
        }
        @media (max-width: 640px) {
          .members-header-row, .members-role-tabs, .members-filter-row { justify-content: space-between; }
          .members-header-actions { width: 100%; justify-content: flex-start; }
          .members-stats-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
          .members-filter-row > * { min-width: 0; flex: 1 1 100%; }
          .members-header-row > div:first-child { min-width: 0; }
        }
      `}</style>

      {/* Court line decoration */}
      <div style={{ position: 'relative', marginBottom: 4 }}>
        <div className="members-header-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.text, letterSpacing: '-0.02em' }}>
              <span style={{ color: G.lime }}>Members</span> · Organisation
            </div>
            <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>Manage players, coaches & referees</div>
          </div>
          <div className="members-header-actions" style={{ gap: 8 }}>
            <button onClick={() => setShowInviteModal(true)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: G.lime, color: G.dark, border: 'none', cursor: 'pointer',
              letterSpacing: '0.02em',
            }}>
              + Invite Member
            </button>
            <button style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: 'transparent', color: G.textSoft,
              border: `1px solid ${G.cardBorder}`, cursor: 'pointer',
            }}>
              ↓ Export
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(to right, ${G.lime}44, transparent)`, marginTop: 12 }} />
      </div>

      {/* Stats Strip */}
      <div className="members-stats-grid" style={{ gap: 8 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: G.card, border: `1px solid ${G.cardBorder}`,
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: card.color }}>{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Role Quick-filter tabs */}
      <div className="members-role-tabs" style={{ alignItems: 'center' }}>
        {(['all', 'player', 'coach', 'referee'] as Role[]).map(role => {
          const cfg = role === 'all' ? null : ROLE_CONFIG[role];
          const count = role === 'all' ? memberData.length : memberData.filter((m: Member) => m.role === role).length;
          const isActive = roleFilter === role;
          return (
            <button key={role} onClick={() => setRoleFilter(role)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
              border: `1px solid ${isActive ? (cfg?.color || G.lime) : G.cardBorder}`,
              background: isActive ? (cfg?.color || G.lime) + '22' : 'transparent',
              color: isActive ? (cfg?.color || G.lime) : G.muted,
              transition: 'all 0.15s',
            }}>
              {cfg ? cfg.icon : '◎'} {role === 'all' ? 'All' : cfg!.label}s
              <span style={{ fontSize: 9, opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 3, background: G.card, borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
          {(['list', 'grid'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: view === v ? G.mid : 'transparent',
              color: view === v ? G.lime : G.muted,
            }}>
              {v === 'list' ? '☰ List' : '⊞ Grid'}
            </button>
          ))}
        </div>
      </div>

      {pendingMembers.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>Pending Membership Approvals</div>
              <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>Review requests before they become active members.</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: '#2b2d1f', color: G.lime, fontSize: 11, fontWeight: 700 }}>
              ⏳ {pendingMembers.length} Pending
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pendingMembers.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{member.firstName} {member.lastName}</div>
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{member.email} · {member.role}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => beginApprovalAction(member, 'approve')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: G.lime, color: G.dark, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Approve
                  </button>
                  <button onClick={() => beginApprovalAction(member, 'reject')} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${G.red}`, background: 'transparent', color: G.red, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notify && (
        <div style={{ background: '#153015', border: `1px solid ${G.lime}`, color: G.lime, borderRadius: 8, padding: '8px 10px', fontSize: 11, marginBottom: 4 }}>
          {notify}
        </div>
      )}

      {/* Filters Row */}
      <div className="members-filter-row" style={{
        background: G.card, border: `1px solid ${G.cardBorder}`,
        borderRadius: 10, padding: '10px 14px',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', background: G.dark,
          borderRadius: 7, border: `1px solid ${G.cardBorder}`, flex: 1, minWidth: 180,
        }}>
          <span style={{ fontSize: 13, opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: G.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>

        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: '7px 10px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif" }}>
          <option value="all">All Tiers</option>
          <option value="elite">★ Elite</option>
          <option value="premium">◆ Premium</option>
          <option value="basic">• Basic</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif" }}>
          <option value="all">All Status</option>
          <option value="active">✅ Active</option>
          <option value="pending">⏳ Pending</option>
          <option value="inactive">⏸ Inactive</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 10px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif" }}>
          <option value="name">Sort: Name</option>
          <option value="visits">Sort: Visits</option>
          <option value="joined">Sort: Newest</option>
        </select>

        <div style={{ fontSize: 10, color: G.muted, marginLeft: 'auto' }}>
          Showing <strong style={{ color: G.textSoft }}>{sorted.length}</strong> of {memberData.length}
        </div>
      </div>

      {/* Member List or Detail View */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: G.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
          <div>Loading members…</div>
        </div>
      ) : selectedMember ? (
        /* Member Detail View */
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setSelectedMember(null)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'transparent', color: G.textSoft,
              border: `1px solid ${G.cardBorder}`, cursor: 'pointer',
            }}>
              ← Back to Members
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: G.text }}>{selectedMember.firstName} {selectedMember.lastName}</div>
              <div style={{ fontSize: 12, color: G.muted }}>{selectedMember.email}</div>
            </div>
          </div>

          <div className="members-detail-grid" style={{ gap: 20 }}>
            <div>
              <div style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>Profile Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><strong style={{ color: G.lime }}>Role:</strong> <RoleBadge role={selectedMember.role} /></div>
                  <div><strong style={{ color: G.lime }}>Status:</strong> <StatusDot status={selectedMember.status} /></div>
                  <div><strong style={{ color: G.lime }}>Tier:</strong> <TierBadge tier={selectedMember.tier} /></div>
                  <div><strong style={{ color: G.lime }}>Age:</strong> {selectedMember.age || 'Unknown'}</div>
                  <div><strong style={{ color: G.lime }}>Nationality:</strong> {selectedMember.nationality || 'Unknown'}</div>
                  <div><strong style={{ color: G.lime }}>Total Visits:</strong> {selectedMember.visits || 0}</div>
                  <div><strong style={{ color: G.lime }}>Joined:</strong> {(() => {
                    const dt = selectedMember?.joinDate;
                    return dt ? new Date(dt).toLocaleDateString() : 'Unknown';
                  })()}</div>
                  {selectedMember.role === 'player' && <div><strong style={{ color: G.lime }}>Ranking:</strong> #{(selectedMember as any).ranking || 'Unranked'}</div>}
                  {selectedMember.role === 'coach' && <div><strong style={{ color: G.lime }}>Students:</strong> {(selectedMember as any).students || 0}</div>}
                  {selectedMember.role === 'referee' && <div><strong style={{ color: G.lime }}>Matches Officiated:</strong> {(selectedMember as any).matchesOfficiated || 0}</div>}
                </div>
              </div>

              <div style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => sendMessageToMember(selectedMember as Member)} disabled={actionLoading} style={{
                  padding: '12px 16px', borderRadius: 8, border: 'none', background: G.lime, color: G.dark, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1
                }}>
                  {getButtonText('message', '✉ Send Message')}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {selectedMember.status !== 'active' || selectedMember.role === 'inactive' ? (
                    <button disabled={actionLoading} onClick={() => updateMemberStatus(selectedMember as Member, 'activate')} style={{ padding: '10px', borderRadius: 8, border: `1px solid ${G.lime}`, background: G.mid, color: G.lime, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                      {getButtonText('activate', '▶ Activate')}
                    </button>
                  ) : (
                    <button disabled={actionLoading} onClick={() => updateMemberStatus(selectedMember as Member, 'deactivate')} style={{ padding: '10px', borderRadius: 8, border: `1px solid ${G.yellow}`, background: '#232f2a', color: G.yellow, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                      {getButtonText('deactivate', '⏸ Deactivate')}
                    </button>
                  )}
                  <button disabled={actionLoading} onClick={() => updateMemberStatus(selectedMember as Member, 'suspend', { until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Temporarily suspended by admin' })} style={{ padding: '10px', borderRadius: 8, border: `1px solid ${G.orange}`, background: '#2b1f12', color: G.orange, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                    {getButtonText('suspend', '🛑 Suspend (7d)')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button disabled={actionLoading} onClick={() => updateMemberStatus(selectedMember as Member, 'dismiss')} style={{ padding: '10px', borderRadius: 8, border: `1px solid ${G.red}`, background: '#2d1212', color: G.red, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                    {getButtonText('dismiss', '🚫 Dismiss')}
                  </button>
                  <button disabled={actionLoading} onClick={() => updateMemberStatus(selectedMember as Member, 'delete')} style={{ padding: '10px', borderRadius: 8, border: `1px solid ${G.red}`, background: '#220d0f', color: G.red, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                    {getButtonText('delete', '❌ Delete')}
                  </button>
                </div>
              </div>
            </div>
            </div>

            <div style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, height: 'fit-content' }}>
              <Avatar member={selectedMember} size={80} />
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.text }}>{selectedMember.firstName} {selectedMember.lastName}</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{selectedMember.email}</div>
                <div style={{ marginTop: 8 }}>
                  <RoleBadge role={selectedMember.role} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: G.muted, background: G.card, borderRadius: 10, border: `1px dashed ${G.cardBorder}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 13 }}>No members match your filters</div>
          <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setTierFilter('all'); setStatusFilter('all'); }} style={{ marginTop: 12, padding: '6px 16px', background: G.mid, border: 'none', borderRadius: 6, color: G.lime, fontSize: 11, cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(m => (
            <MemberCard key={m.id} member={m as Member} onClick={() => setSelectedMember(m)} />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowInviteModal(false)}>
          <div style={{ background: G.sidebar, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 4 }}>Invite New Member</div>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 20 }}>Send an invitation to join the organisation</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</div>
                <input 
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g. Amara Osei" 
                  style={{ width: '100%', padding: '8px 12px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif", boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</div>
                <input 
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com" 
                  type="email" 
                  style={{ width: '100%', padding: '8px 12px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif", boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['player', 'coach', 'referee'] as const).map(role => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                      <button 
                        key={role} 
                        onClick={() => setInviteForm(prev => ({ ...prev, role }))}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                          border: `1px solid ${inviteForm.role === role ? cfg.color : G.cardBorder}`, 
                          background: inviteForm.role === role ? cfg.bg : 'transparent', 
                          color: inviteForm.role === role ? cfg.color : G.muted, 
                          cursor: 'pointer',
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Membership Tier</div>
                <select 
                  value={inviteForm.tier}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, tier: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 7, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif" }}
                >
                  <option>Basic</option>
                  <option>Premium</option>
                  <option>Elite</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: 'transparent', color: G.muted, cursor: 'pointer', fontSize: 12, fontFamily: "'Raleway', sans-serif" }}>
                  Cancel
                </button>
                <button 
                  onClick={inviteMember} 
                  disabled={actionLoading}
                  style={{ 
                    flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: G.lime, color: G.dark, cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800, fontFamily: "'Raleway', sans-serif",
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {getButtonText('invite', 'Send Invitation')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && approvalTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowApprovalModal(false); setApprovalTarget(null); setApprovalAction(null); setApprovalReason(''); }}>
          <div style={{ background: G.sidebar, border: `1px solid ${G.cardBorder}`, borderRadius: 16, padding: 24, width: 420, maxWidth: '92vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 6 }}>
              {approvalAction === 'approve' ? 'Approve membership' : 'Reject membership'}
            </div>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 18 }}>
              {approvalAction === 'approve'
                ? `Confirm approval for ${approvalTarget.firstName} ${approvalTarget.lastName}. Add an optional note for the record.`
                : `Provide a reason for rejecting ${approvalTarget.firstName}'s membership request.`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Reason</label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  placeholder={approvalAction === 'approve' ? 'Optional approval note' : 'Required rejection reason'}
                  style={{ width: '100%', minHeight: 100, padding: '10px 12px', background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 10, color: G.text, fontSize: 11, fontFamily: "'Raleway', sans-serif", resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => { setShowApprovalModal(false); setApprovalTarget(null); setApprovalAction(null); setApprovalReason(''); }} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: 'transparent', color: G.muted, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  Cancel
                </button>
                <button onClick={confirmApprovalAction} disabled={actionLoading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: approvalAction === 'approve' ? G.lime : G.red, color: G.dark, cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                  {getButtonText(approvalAction || 'approve', approvalAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}