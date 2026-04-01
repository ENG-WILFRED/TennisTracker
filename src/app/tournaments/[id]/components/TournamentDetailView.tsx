import React, { useState } from 'react';
import { TournamentApplicationForm } from '@/components/tournament/TournamentApplicationForm';
import { CancelApplicationModal } from '@/components/tournament/CancelApplicationModal';
import { PlayerProfileModal } from './PlayerProfileModal';
import { RejectionReasonModal } from './RejectionReasonModal';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import {
  CheckoutModal,
  ContactModal,
  RepostModal,
  SuccessModal,
  ProfileModal,
  AmenityBookingModal,
  AppealModal
} from './';

type ModalType = 'apply' | 'checkout' | 'contact' | 'repost' | 'success' | 'amenity-booking' | 'profile' | 'cancel' | 'appeal' | null;

type TournamentDetailViewProps = {
  tournament: any;
  user: any;
  leaderboard: any[];
  activeTab: 'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management';
  setActiveTab: (tab: 'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management') => void;
  comments: any[];
  announcements: any[];
  announcementsLoading: boolean;
  announcementsError: string | null;
  refreshAnnouncements: () => Promise<void>;
  pendingRegistrations?: any[];
  approvedRegistrations?: any[];
  rejectedRegistrations?: any[];
  onApproveRegistration?: (registrationId: string) => void;
  onRejectRegistration?: (registrationId: string) => void;
  onUpdateTournamentStatus?: (status: string) => void;
  managementLoading?: boolean;
  commentsLoading: boolean;
  newComment: string;
  setNewComment: (value: string) => void;
  replyingTo: string | null;
  setReplyingTo: (value: string | null) => void;
  replyText: string;
  setReplyText: (value: string) => void;
  onAddComment: () => Promise<void>;
  onReplyToComment: (parentCommentId: string) => Promise<void>;
  onReactToComment: (commentId: string, reactionType?: string) => Promise<void>;
  onDMUser: (targetUserEmail: string) => Promise<void>;
  onAmenityBooking: (amenity: any) => void;
  onCloseModal: () => void;
  onOpenModal: (type: ModalType) => void;
  selectedAmenity: any;
  successType: 'registration' | 'booking';
  onConfirmAmenityBooking: (bookingData: any) => Promise<any>;
  bookingLoading: boolean;
  fetchTournamentData: () => Promise<void>;
  onNavigateDashboard: () => void;
  onNavigateTournaments: () => void;
  onNavigateHome: () => void;
  modal: ModalType;
  onSuccessModal: () => Promise<void>;
  isOrganizer?: boolean;
  userRegistration?: any;
  isPaid?: boolean;
  fetchUserRegistrationStatus?: () => Promise<void>;
  showRejectionReason?: boolean;
  setShowRejectionReason?: (show: boolean) => void;
};

export function TournamentDetailView({
  tournament,
  user,
  leaderboard,
  activeTab,
  setActiveTab,
  comments,
  commentsLoading,
  newComment,
  setNewComment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onAddComment,
  onReplyToComment,
  onReactToComment,
  onDMUser,
  onAmenityBooking,
  selectedAmenity,
  onCloseModal,
  onOpenModal,
  onConfirmAmenityBooking,
  bookingLoading,
  fetchTournamentData,
  announcements,
  announcementsLoading,
  announcementsError,
  refreshAnnouncements,
  onNavigateDashboard,
  onNavigateTournaments,
  onNavigateHome,
  modal,
  onSuccessModal,
  successType,
  isOrganizer = false,
  pendingRegistrations = [],
  approvedRegistrations = [],
  rejectedRegistrations = [],
  onApproveRegistration,
  onRejectRegistration,
  onUpdateTournamentStatus,
  managementLoading = false,
  userRegistration = null,
  isPaid = false,
  fetchUserRegistrationStatus,
  showRejectionReason = false,
  setShowRejectionReason,
}: TournamentDetailViewProps) {
  // New states for modals
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<string | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [appealFilter, setAppealFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  const fetchUserAppeals = async () => {
    if (!tournament?.id) return;
    setAppealsLoading(true);
    setAppealsError(null);
    try {
      const res = await authenticatedFetch(`/api/tournaments/${tournament.id}/appeals`, { method: 'GET' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load appeals');
      }
      const data = await res.json();
      setAppeals(data);
    } catch (err) {
      console.error('Error fetching appeals:', err);
      setAppealsError(err instanceof Error ? err.message : 'Failed to load appeals');
    } finally {
      setAppealsLoading(false);
    }
  };

  React.useEffect(() => {
    if (tournament?.id) {
      fetchUserAppeals();
    }
  }, [tournament?.id]);

  // Calculate confirmed participants (approved + registered, excluding pending)
  const confirmedParticipants = tournament.registrations?.filter((reg: any) => 
    ['approved', 'registered'].includes(reg.status)
  )?.length || 0;

  // Handle rejection with reason
  const handleRejectWithReason = async (rejectionReason: string) => {
    if (!rejectingRegistrationId) return;

    setRejectionLoading(true);
    try {
      const response = await authenticatedFetch(
        `/api/tournaments/${tournament.id}/registrations/${rejectingRegistrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', rejectionReason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to reject: ${error.error}`);
        return;
      }

      // Close modal and refresh data
      setRejectingRegistrationId(null);
      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject application');
    } finally {
      setRejectionLoading(false);
    }
  };

  // Handle undo rejection (revert rejected back to pending)
  const handleUndoRejection = async (registrationId: string) => {
    if (!window.confirm('Restore this application to pending review? The player will be notified.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/tournaments/${tournament.id}/registrations/${registrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'undo' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to restore: ${error.error}`);
        return;
      }

      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error restoring registration:', error);
      alert('Failed to restore application');
    }
  };

  // Determine button state based on user's registration
  const getButtonState = () => {
    if (!userRegistration) {
      return { label: `Apply Now - $${tournament.entryFee || 0}`, status: 'apply', className: 'bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 hover:-translate-y-0.5', disabled: false };
    }
    if (userRegistration.status === 'pending') {
      return { label: '⏳ Pending Review - Application Submitted', status: 'pending', className: 'bg-[#4a3f1a] text-[#f0c94a] hover:bg-[#5a4f2a]', disabled: true };
    }
    if (userRegistration.status === 'approved') {
      return { label: `Proceed to Payment - $${tournament.entryFee || 0}`, status: 'payment', className: 'bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 hover:-translate-y-0.5', disabled: false };
    }
    if (userRegistration.status === 'registered') {
      return { label: '✓ Applied & Registered', status: 'registered', className: 'bg-[#1a3a0a] text-[#8dc843] hover:bg-[#2a4a1a]', disabled: true };
    }
    if (userRegistration.status === 'rejected') {
      return { label: '❌ Application Rejected - Click to View', status: 'rejected', className: 'bg-[rgba(220,76,100,0.15)] text-[#ff6b7a] hover:bg-[rgba(220,76,100,0.25)] border border-[rgba(220,76,100,0.3)]', disabled: false };
    }
    return { label: `Apply Now - $${tournament.entryFee || 0}`, status: 'apply', className: 'bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 hover:-translate-y-0.5', disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <div className="font-epilogue min-h-screen bg-[#050d08] text-[#dde8d4]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between p-3 px-8 bg-[rgba(5,13,8,0.9)] backdrop-blur-xl border-b border-[rgba(99,153,34,0.12)]">
        <div className="font-clash text-xl font-bold text-[#a3d45e] flex items-center gap-2 cursor-pointer" onClick={onNavigateDashboard}>
          <div className="w-2 h-2 bg-[#639922] rounded-full" />
          Vico Tennis
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#27500a] border-[1.5px] border-[#3b6d11] flex items-center justify-center text-[#a3d45e] text-xs font-semibold cursor-pointer" onClick={() => onOpenModal('profile')}>
            {user?.firstName?.[0] || 'U'}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative p-14 px-8 overflow-hidden border-b border-[rgba(99,153,34,0.1)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(63,120,17,0.22)_0%,transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(16,80,30,0.18)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,153,34,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,153,34,0.05)_1px,transparent_1px)] bg-[length:48px_48px]" />
        <div className="relative z-10  mx-auto flex items-center justify-between gap-8 flex-wrap">
          <div className="">
            <div className="inline-flex items-center gap-1 bg-[rgba(99,153,34,0.12)] border border-[rgba(99,153,34,0.25)] text-[#8dc843] text-base font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-3">
              <div className="w-1 h-1 bg-[#639922] rounded-full animate-pulse" />
              {tournament.status === 'open' ? 'Open for Registration' : tournament.status === 'upcoming' ? 'Coming Soon' : tournament.status?.toUpperCase() || 'ACTIVE'}
            </div>
            <h1 className="font-clash text-[clamp(2rem,4vw,3rem)] font-bold text-[#f0fae8] leading-[1.1] tracking-[-0.02em] mb-3">
              {tournament.name.split(' ').slice(0, -1).join(' ')} <span className="text-[#8dc843]">{tournament.name.split(' ').slice(-1)[0]}</span>
            </h1>
            <p className="text-lg text-[#5a7242] leading-[1.65] mb-5">{tournament.description}</p>
            <div className="flex gap-3 flex-wrap">
              <button 
                className={`inline-flex items-center gap-1 font-epilogue font-semibold cursor-pointer border-none transition-all duration-150 text-lg px-6 py-3 rounded-lg ${buttonState.className} ${buttonState.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={buttonState.disabled}
                onClick={() => {
                  if (buttonState.status === 'apply') {
                    onOpenModal('apply');
                  } else if (buttonState.status === 'payment') {
                    // Open payment modal
                    onOpenModal('checkout');
                  } else if (buttonState.status === 'pending') {
                    // Show application status/details
                    alert('Your application is under review. You will receive an email when the organizer makes a decision.');
                  } else if (buttonState.status === 'registered') {
                    // Show registered details
                    alert('You are registered for this tournament!');
                  } else if (buttonState.status === 'rejected') {
                    // Show rejection reason modal
                    if (setShowRejectionReason) {
                      setShowRejectionReason(true);
                    }
                  }
                }}
              >
                {buttonState.label}
              </button>
              {userRegistration?.status === 'registered' && (
                <button className="inline-flex items-center gap-1 font-epilogue font-semibold cursor-pointer border-none transition-all duration-150 text-lg px-6 py-3 rounded-lg bg-[rgba(220,76,100,0.15)] border border-[rgba(220,76,100,0.3)] text-[#ff6b7a] hover:border-[rgba(220,76,100,0.5)] hover:bg-[rgba(220,76,100,0.25)]" onClick={() => onOpenModal('cancel')}>
                  ❌ Cancel Application
                </button>
              )}
              <button className="inline-flex items-center gap-1 font-epilogue font-semibold cursor-pointer border-none transition-all duration-150 text-lg px-6 py-3 rounded-lg bg-transparent border border-[rgba(99,153,34,0.12)] text-[#4a6335] hover:border-[rgba(99,153,34,0.3)] hover:text-[#5a7242]" onClick={() => onOpenModal('contact')}>
                💬 Contact Organizer
              </button>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.15)] rounded-[14px] p-4 px-5.5 min-w-[100px] text-center">
              <div className="font-clash text-4xl font-bold text-[#8dc843]">{confirmedParticipants}/{tournament.maxParticipants || 64}</div>
              <div className="text-base text-[#4a6335] mt-0.5">Players</div>
            </div>
            <div className="bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.15)] rounded-[14px] p-4 px-5.5 min-w-[100px] text-center">
              <div className="font-clash text-4xl font-bold text-[#8dc843]">${tournament.prizePool?.toLocaleString() || '0'}</div>
              <div className="text-base text-[#4a6335] mt-0.5">Prize Pool</div>
            </div>
            <div className="bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.15)] rounded-[14px] p-4 px-5.5 min-w-[100px] text-center">
              <div className="font-clash text-4xl font-bold text-[#8dc843]">{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div className="text-base text-[#4a6335] mt-0.5">Start Date</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full mx-auto p-8 pb-20 grid grid-cols-1 gap-6 items-start">
        {/* Content Column */}
        <div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-5 text-center">
              <div className="text-[#c0d8ff] text-sm mb-1">Status</div>
              <div className="text-4xl font-bold text-[#8dc843]">{tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1) || 'Active'}</div>
            </div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-5 text-center">
              <div className="text-[#c0d8ff] text-sm mb-1">Format</div>
              <div className="text-4xl font-bold text-[#93c5fd]">{tournament.bracket?.bracketType || 'Single Elimination'}</div>
            </div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-5 text-center">
              <div className="text-[#c0d8ff] text-sm mb-1">Participants</div>
              <div className="text-4xl font-bold text-[#f2d55b]">{confirmedParticipants}</div>
            </div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-5 text-center">
              <div className="text-[#c0d8ff] text-sm mb-1">Entry Fee</div>
              <div className="text-4xl font-bold text-[#ffb86e]">${tournament.entryFee || 0}</div>
            </div>
          </div>

          <div className="flex gap-2 mb-8 border-b border-[rgba(99,153,34,0.08)] pb-4">
            {(() => {
              type TabName = 'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management';
              const baseTabs: TabName[] = ['overview', 'rules', 'details', 'leaderboard', 'matches', 'comments', 'announcements'];
              const tabs: TabName[] = isOrganizer ? [...baseTabs, 'management'] : baseTabs;
              return tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg border-none ${activeTab === tab ? 'bg-[rgba(99,153,34,0.18)] text-[#a3d45e]' : 'bg-transparent text-[#5a7242]'} text-xl font-semibold cursor-pointer transition-all duration-150`}
                >
                  {tab === 'overview' && '📋 Overview'}
                  {tab === 'rules' && '📋 Rules'}
                  {tab === 'details' && '🏨 Facilities'}
                  {tab === 'leaderboard' && '🏆 Leaderboard'}
                  {tab === 'matches' && '🎾 Matches'}
                  {tab === 'comments' && '💬 Comments'}
                  {tab === 'announcements' && '📢 Announcements'}
                  {tab === 'management' && '⚙️ Management'}
                </button>
              ));
            })()}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">Tournament Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-[#4a6335] mb-1">Event Type</div><div className="text-base text-[#c8e0a8]">{tournament.eventType || 'Tournament'}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Format</div><div className="text-base text-[#c8e0a8]">{tournament.bracket?.bracketType || 'Single Elimination'}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Start Date</div><div className="text-base text-[#c8e0a8]">{new Date(tournament.startDate).toLocaleDateString()}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">End Date</div><div className="text-base text-[#c8e0a8]">{tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Total Matches</div><div className="text-base text-[#c8e0a8]">{tournament.matches?.length || 0}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Completed Matches</div><div className="text-base text-[#c8e0a8]">{tournament.matches?.filter((m: { status: string }) => m.status === 'completed').length || 0}</div></div>
                </div>
              </div>

              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">Registration Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-[#4a6335] mb-1">Max Participants</div><div className="text-base text-[#c8e0a8]">{tournament.maxParticipants || 64}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Current Participants</div><div className="text-base text-[#c8e0a8]">{tournament.registrations?.length || 0}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Entry Fee</div><div className="text-base text-[#c8e0a8]">${tournament.entryFee || 0}</div></div>
                  <div><div className="text-sm text-[#4a6335] mb-1">Prize Pool</div><div className="text-base text-[#c8e0a8]">${tournament.prizePool?.toLocaleString() || '0'}</div></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">🏛️ Tournament Rules</h3>
                {tournament.rules && (
                  <div className="mb-4">
                    <div className="text-base text-[#c8e0a8] leading-relaxed whitespace-pre-wrap">{tournament.rules}</div>
                  </div>
                )}
                {!tournament.rules && (
                  <div className="text-[#6a8c5a] italic">No specific rules have been set for this tournament.</div>
                )}
              </div>

              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">📋 General Tennis Rules</h3>
                <div className="text-base text-[#c8e0a8] leading-relaxed">
                  <p className="mb-3">Standard tennis rules apply unless otherwise specified:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Matches are best of 3 sets</li>
                    <li>First to 6 games wins a set (with tiebreak at 6-6)</li>
                    <li>Tiebreaks are first to 7 points (win by 2)</li>
                    <li>Players change ends after odd games</li>
                    <li>Let serves are replayed</li>
                    <li>Foot faults result in point penalties</li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">⚖️ Appeal a Rule</h3>
                <p className="text-[#c8e0a8] mb-4">
                  If you believe a rule is unfair or needs clarification, you can submit an appeal to the tournament organizers.
                </p>
                <button
                  onClick={() => onOpenModal('appeal')}
                  className="bg-[#7dc142] hover:bg-[#6ba83a] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Submit Appeal
                </button>
              </div>

              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">📄 Your Appeals</h3>

                {appealsLoading ? (
                  <div className="text-[#5a7242] text-center py-8">Loading your appeals...</div>
                ) : appealsError ? (
                  <div className="text-[#f59e0b] text-center py-8">{appealsError}</div>
                ) : appeals.length === 0 ? (
                  <div className="text-[#5a7242] text-center py-8">No appeals submitted yet.</div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <label className="text-sm text-[#4a6335]">Filter:</label>
                      <select
                        value={appealFilter}
                        onChange={(e) => setAppealFilter(e.target.value as 'all' | 'pending' | 'approved' | 'denied')}
                        className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded px-2 py-1 text-sm text-[#dde8d4]"
                      >
                        <option value="all">All Appeals</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {appeals.filter(appeal => appealFilter === 'all' || appeal.status === appealFilter).map((appeal) => (
                        <div key={appeal.id} className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-base font-semibold text-[#c8e0a8]">{appeal.ruleCategory || 'General Rule'}{appeal.ruleLabel ? ` • ${appeal.ruleLabel}` : ''}</div>
                            <div className="text-sm font-semibold text-[#8dc843]">{appeal.status?.toUpperCase()}</div>
                          </div>
                          <p className="text-[#dde8d4] leading-relaxed mb-2">{appeal.appealText}</p>
                          {appeal.responseText && (
                            <div className="text-sm text-[#a8d84e]">Organizer response: {appeal.responseText}</div>
                          )}
                          <div className="text-xs text-[#5a7242] mt-2">Submitted: {new Date(appeal.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">🏨 Facilities & Amenities</h3>
                {tournament.eatingAreas && (
                  <div className="mb-4">
                    <div className="text-sm text-[#4a6335] mb-2 font-semibold">🍽️ Eating Areas</div>
                    <div className="text-base text-[#c8e0a8] leading-relaxed">{tournament.eatingAreas}</div>
                  </div>
                )}
                {tournament.sleepingAreas && (
                  <div className="mb-4">
                    <div className="text-sm text-[#4a6335] mb-2 font-semibold">🛏️ Sleeping Areas</div>
                    <div className="text-base text-[#c8e0a8] leading-relaxed">{tournament.sleepingAreas}</div>
                  </div>
                )}
                {tournament.courtInfo && (
                  <div>
                    <div className="text-sm text-[#4a6335] mb-2 font-semibold">🎾 Court Information</div>
                    <div className="text-base text-[#c8e0a8] leading-relaxed">{tournament.courtInfo}</div>
                  </div>
                )}
              </div>

              <div className="col-span-2 bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">🍽️ Food & Facility Quick View</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-[#4a6335] mb-1">Food Options</div>
                    <div className="text-base text-[#c8e0a8] leading-relaxed">{tournament.eatingAreas || 'On-site concessions, snacks, grill stalls, energy bars'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#4a6335] mb-1">Facility Options</div>
                    <div className="text-base text-[#c8e0a8] leading-relaxed">{tournament.sleepingAreas || 'Restrooms, showers, changing rooms, lounge'}</div>
                  </div>
                </div>
                <a
                  href={tournament.organization?.website || 'https://example.com/amenity-provider'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base font-semibold text-[#8dc843] hover:text-[#a3d45e]"
                >
                  🔗 View full food & facility services
                </a>
              </div>

              {tournament.amenities && tournament.amenities.length > 0 && (
                <div className="col-span-2 bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
                  <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">📅 Available Amenities</h3>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                    {tournament.amenities.map((amenity: any) => (
                      <div key={amenity.id} className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-base font-semibold text-[#c8e0a8]">{amenity.name}</div>
                          <div className="text-sm text-[#8dc843] font-semibold">${amenity.price || 'Free'}</div>
                        </div>
                        {amenity.description && (
                          <div className="text-sm text-[#5a7242] mb-3">{amenity.description}</div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-[#4a6335]">
                            Booked: {amenity.bookingsCount || 0}{amenity.capacity ? `/${amenity.capacity}` : ''}
                          </div>
                          <button
                            className={`px-3 py-1.5 rounded text-sm border border-[rgba(99,153,34,0.3)] ${amenity.capacity && amenity.bookingsCount >= amenity.capacity ? 'bg-transparent text-[#4a6335] cursor-not-allowed opacity-50' : 'bg-[rgba(99,153,34,0.1)] text-[#8dc843] cursor-pointer hover:bg-[rgba(99,153,34,0.2)]'}`}
                            onClick={() => (amenity.capacity && amenity.bookingsCount >= amenity.capacity ? undefined : onAmenityBooking(amenity))}
                            disabled={amenity.capacity && amenity.bookingsCount >= amenity.capacity}
                          >
                            {amenity.capacity && amenity.bookingsCount >= amenity.capacity ? 'Full' : 'Book Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">Tournament Leaderboard</h3>
              <div className="flex flex-col gap-2">
                {leaderboard.length > 0 ? leaderboard.map((p, index) => {
                  const rank = index + 1;
                  const isMe = user && p.email === user.email;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-[rgba(99,153,34,0.06)]">
                      <div className={`w-6 text-sm font-semibold text-center ${rank <= 3 ? 'text-[#f59e0b]' : isMe ? 'text-[#8dc843]' : 'text-[#4a6335]'}`}>{rank}</div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${rank === 1 ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]' : rank === 2 ? 'bg-[rgba(99,153,34,0.2)] text-[#8dc843]' : rank === 3 ? 'bg-[rgba(99,153,34,0.15)] text-[#8dc843]' : isMe ? 'bg-[rgba(99,153,34,0.25)] text-[#a3d45e]' : 'bg-[rgba(99,153,34,0.07)] text-[#5a7242]'} ${isMe ? 'border-2 border-[#639922]' : ''}`}>{p.name.split(' ').map((n: any[]) => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={`flex-1 text-base ${isMe ? 'text-[#a3d45e] font-semibold' : 'text-[#c8e0a8] font-normal'}`}>{p.name}{isMe ? ' (you)' : ''}</div>
                      <div className={`text-sm font-semibold ${isMe ? 'text-[#a3d45e]' : 'text-[#639922]'}`}>{p.wins}-{p.losses}</div>
                    </div>
                  );
                }) : (
                  <div className="text-[#5a7242] text-center py-8">
                    Leaderboard will be available once matches begin.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">Match Schedule</h3>
              <div className="text-[#5a7242] text-center py-8">
                Match schedule will be available closer to the tournament start date.
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-4">Comments & Discussion</h3>

              {user && (
                <div className="mb-6">
                  <div className="flex gap-3">
                    <textarea
                      className="flex-1 bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-3 text-base text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] resize-none"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                      placeholder="Share your thoughts about this tournament..."
                      rows={3}
                    />
                    <button
                      className="btn btn-md btn-primary self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onAddComment}
                      disabled={!newComment.trim()}
                    >
                      💬 Post
                    </button>
                  </div>
                  <div className="text-sm text-[#334a22] text-right mt-1">{newComment.length}/500</div>
                </div>
              )}

              {commentsLoading ? (
                <div className="text-[#5a7242] text-center py-8">Loading comments...</div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#27500a] border border-[#3b6d11] flex items-center justify-center text-[#a3d45e] text-sm font-semibold">
                            {comment.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-[#c8e0a8]">{comment.authorName}</div>
                            <div className="text-sm text-[#4a6335]">{new Date(comment.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {user && user.email !== comment.authorEmail && (
                            <>
                              <button
                                className="text-sm text-[#8dc843] hover:text-[#a3d45e] border border-[rgba(99,153,34,0.3)] rounded px-2 py-1 hover:bg-[rgba(99,153,34,0.1)]"
                                onClick={() => onDMUser(comment.authorEmail)}
                              >
                                💬 DM
                              </button>
                              <button
                                className="text-sm text-[#639922] hover:text-[#8dc843] border border-[rgba(99,153,34,0.3)] rounded px-2 py-1 hover:bg-[rgba(99,153,34,0.1)]"
                                onClick={() => setReplyingTo(comment.id)}
                              >
                                ↩ Reply
                              </button>
                              <button
                                className="text-sm text-[#f59e0b] hover:text-[#fbbf24] border border-[rgba(245,158,11,0.3)] rounded px-2 py-1 hover:bg-[rgba(245,158,11,0.1)]"
                                onClick={() => onReactToComment(comment.id, 'like')}
                              >
                                👍 Like
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-base text-[#c8e0a8] leading-relaxed mb-3">{comment.content}</div>
 
                      {comment.reactionCounts && Object.keys(comment.reactionCounts).length > 0 && (
                        <div className="flex gap-2 text-sm mb-3">
                          {Object.entries(comment.reactionCounts).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex items-center gap-1 bg-[rgba(99,153,34,0.1)] px-2 py-1 rounded text-[#8dc843]">
                              <span>{type === 'like' ? '👍' : '❤️'}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingTo === comment.id && (
                        <div className="mb-3 p-3 bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg">
                          <div className="flex gap-2">
                            <textarea
                              className="flex-1 bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded p-2 text-base text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] resize-none"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
                              placeholder={`Reply to ${comment.authorName}...`}
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => onReplyToComment(comment.id)}
                                disabled={!replyText.trim()}
                              >
                                Reply
                              </button>
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-[#334a22] text-right mt-1">{replyText.length}/300</div>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 space-y-2 border-l-2 border-[rgba(99,153,34,0.2)] pl-4">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="bg-[rgba(99,153,34,0.03)] rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-[#1a2e0a] border border-[#2a4a0a] flex items-center justify-center text-[#639922] text-xs font-semibold">
                                  {reply.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div className="text-sm font-semibold text-[#8dc843]">{reply.authorName}</div>
                                <div className="text-sm text-[#4a6335]">{new Date(reply.createdAt).toLocaleDateString()}</div>
                                <div className="flex gap-1 ml-auto">
                                  {user && user.email !== reply.authorEmail && (
                                    <>
                                      <button
                                        className="text-sm text-[#639922] hover:text-[#8dc843]"
                                        onClick={() => onDMUser(reply.authorEmail)}
                                      >
                                        DM
                                      </button>
                                      <button
                                        className="text-sm text-[#639922] hover:text-[#8dc843]"
                                        onClick={() => setReplyingTo(reply.id)}
                                      >
                                        Reply
                                      </button>
                                      <button
                                        className="text-sm text-[#f59e0b] hover:text-[#fbbf24]"
                                        onClick={() => onReactToComment(reply.id, 'like')}
                                      >
                                        👍
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-[#9dbf92] leading-relaxed">{reply.content}</div>

                              {replyingTo === reply.id && (
                                <div className="mt-2 p-2 bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded">
                                  <div className="flex gap-2">
                                    <textarea
                                      className="flex-1 bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded p-1 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] resize-none"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
                                      placeholder={`Reply to ${reply.authorName}...`}
                                      rows={2}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <button
                                        className="btn btn-xs btn-primary text-sm px-2 py-1"
                                        onClick={() => onReplyToComment(reply.id)}
                                        disabled={!replyText.trim()}
                                      >
                                        Reply
                                      </button>
                                      <button
                                        className="btn btn-xs btn-ghost text-sm px-2 py-1"
                                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#5a7242] text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-[#e8f8d8]">📢 Tournament Announcements</h3>
                <button
                  onClick={refreshAnnouncements}
                  className="text-sm text-[#8dc843] hover:text-[#a3d45e] border border-[rgba(99,153,34,0.3)] rounded px-3 py-1 hover:bg-[rgba(99,153,34,0.1)]"
                >
                  Refresh
                </button>
              </div>

              {announcementsLoading ? (
                <div className="text-[#5a7242] text-center py-8">Loading announcements...</div>
              ) : announcementsError ? (
                <div className="text-[#f59e0b] text-center py-8">{announcementsError}</div>
              ) : announcements.length === 0 ? (
                <div className="text-[#5a7242] text-center py-8">No announcements yet.</div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-[#c8e0a8]">{announcement.title}</h4>
                        <span className="text-xs text-[#5a7242]">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#dde8d4] leading-relaxed mb-2">{announcement.message}</p>
                      <div className="text-xs text-[#8dc843]">Type: {announcement.announcementType || 'general'}{announcement.event?.name ? ` • ${announcement.event.name}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'management' && isOrganizer && (
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <h3 className="text-2xl font-semibold text-[#e8f8d8] mb-6">Tournament Management</h3>

              {/* Status Management */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[#a3d45e] mb-4">Tournament Status</h4>
                <div className="flex gap-3 flex-wrap">
                  {['draft', 'open', 'closed', 'ongoing', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateTournamentStatus?.(status)}
                      disabled={managementLoading || tournament.status === status}
                      className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                        tournament.status === status
                          ? 'bg-[#8dc843] text-[#0f1f0f] border-[#8dc843]'
                          : 'bg-transparent text-[#5a7242] border-[#4a6335] hover:bg-[#1a2e0a] hover:border-[#639922]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registrations Management */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Registrations */}
                <div>
                  <h4 className="text-xl font-semibold text-[#a3d45e] mb-4">Pending Registrations ({pendingRegistrations.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingRegistrations.length === 0 ? (
                      <div className="text-[#5a7242] text-center py-4">
                        No pending registrations
                      </div>
                    ) : (
                      pendingRegistrations.map((registration: any) => (
                        <div key={registration.id} className="bg-[#0f1f0f] border border-[#2d5a35] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="text-[#c8e0a8] font-semibold">
                                {registration.player?.user?.firstName} {registration.player?.user?.lastName}
                              </div>
                              <div className="text-[#5a7242] text-sm">
                                {new Date(registration.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedPlayer(registration.member?.player)}
                                className="px-3 py-1 bg-[#639922] text-[#f0fae8] rounded font-semibold hover:bg-[#7ab82e] text-xs"
                              >
                                👤 Profile
                              </button>
                              <button
                                onClick={() => onApproveRegistration?.(registration.id)}
                                disabled={managementLoading}
                                className="px-3 py-1 bg-[#8dc843] text-[#0f1f0f] rounded font-semibold hover:bg-[#a3d45e] disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => setRejectingRegistrationId(registration.id)}
                                disabled={managementLoading}
                                className="px-3 py-1 bg-[#e05050] text-white rounded font-semibold hover:bg-[#e07070] disabled:opacity-50"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Approved Registrations */}
                <div>
                  <h4 className="text-xl font-semibold text-[#a3d45e] mb-4">Approved Registrations ({approvedRegistrations.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {approvedRegistrations.length === 0 ? (
                      <div className="text-[#5a7242] text-center py-4">
                        No approved registrations yet
                      </div>
                    ) : (
                      approvedRegistrations.map((registration: any) => (
                        <div key={registration.id} className="bg-[#0f1f0f] border border-[#2d5a35] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-[#c8e0a8] font-semibold">
                                {registration.player?.user?.firstName} {registration.player?.user?.lastName}
                              </div>
                              <div className="text-[#5a7242] text-sm">
                                Approved {new Date(registration.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedPlayer(registration.member?.player)}
                                className="px-3 py-1 bg-[#639922] text-[#f0fae8] rounded font-semibold hover:bg-[#7ab82e] text-xs"
                              >
                                👤 Profile
                              </button>
                              <div className="text-[#8dc843] font-semibold text-sm px-3 py-1">✓ Approved</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Rejected Registrations */}
                <div>
                  <h4 className="text-xl font-semibold text-[#e05050] mb-4">Rejected Registrations ({rejectedRegistrations.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {rejectedRegistrations.length === 0 ? (
                      <div className="text-[#5a7242] text-center py-4">
                        No rejected registrations
                      </div>
                    ) : (
                      rejectedRegistrations.map((registration: any) => (
                        <div key={registration.id} className="bg-[#1f0f0f] border border-[#5a2d2d] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-[#e8a4a4] font-semibold">
                                {registration.player?.user?.firstName} {registration.player?.user?.lastName}
                              </div>
                              <div className="text-[#8a5a5a] text-sm">
                                Rejected {new Date(registration.updatedAt).toLocaleDateString()}
                              </div>
                              {registration.rejectionReason && (
                                <div className="text-[#8a5a5a] text-xs mt-1 italic">
                                  Reason: {registration.rejectionReason}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 flex-col">
                              <button
                                onClick={() => setSelectedPlayer(registration.member?.player)}
                                className="px-3 py-1 bg-[#639922] text-[#f0fae8] rounded font-semibold hover:bg-[#7ab82e] text-xs"
                              >
                                👤 Profile
                              </button>
                              <button
                                onClick={() => handleUndoRejection(registration.id)}
                                disabled={managementLoading}
                                className="px-3 py-1 bg-[#f59e0b] text-white rounded font-semibold hover:bg-[#fbbf24] disabled:opacity-50 text-xs"
                              >
                                ↺ Undo
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <div className="font-clash text-2xl font-semibold text-[#a3d45e] mb-4">Registration Info</div>
              <div className="text-lg text-[#c8e0a8] mb-2">Max participants: {tournament.maxParticipants || 64}</div>
              <div className="text-lg text-[#c8e0a8] mb-2">Current registered: {tournament.registrations?.length || 0}</div>
              <div className="text-lg text-[#c8e0a8] mb-2">Entry fee: ${tournament.entryFee || 0}</div>
              <div className="text-lg text-[#c8e0a8]">Prize pool: ${tournament.prizePool?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <div className="font-clash text-2xl font-semibold text-[#a3d45e] mb-4">Organizer Info</div>
              <div className="text-lg text-[#d8e7c2] mb-3"><strong>{tournament.organization?.name || 'N/A'}</strong></div>
              {tournament.organization?.description && <p className="text-lg text-[#9dbf92] mb-2">{tournament.organization.description}</p>}
              <p className="text-lg text-[#9dbf92] mb-2">{tournament.organization?.city || 'City unknown'}, {tournament.organization?.country || 'Country unknown'}</p>
              {tournament.organization?.email && <p className="text-lg text-[#9dbf92] mb-2">Email: {tournament.organization.email}</p>}
              {tournament.organization?.phone && <p className="text-lg text-[#9dbf92]">Phone: {tournament.organization.phone}</p>}
              <button className="btn btn-md btn-ghost btn-wide mt-4" onClick={() => onOpenModal('contact')}>📧 Contact Organizer</button>
            </div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6">
              <div className="font-clash text-2xl font-semibold text-[#a3d45e] mb-4">Quick Actions</div>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  className={`rounded-lg px-4 py-3 text-xl font-semibold transition ${buttonState.className} ${buttonState.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={buttonState.disabled}
                  onClick={() => {
                    if (buttonState.status === 'apply') {
                      onOpenModal('apply');
                    } else if (buttonState.status === 'payment') {
                      onOpenModal('checkout');
                    } else if (buttonState.status === 'pending') {
                      alert('Your application is under review. You will receive an email when the organizer makes a decision.');
                    } else if (buttonState.status === 'registered') {
                      alert('You are registered for this tournament!');
                    } else if (buttonState.status === 'rejected') {
                      if (setShowRejectionReason) {
                        setShowRejectionReason(true);
                      }
                    }
                  }}
                >
                  {buttonState.label}
                </button>
                <button className="rounded-lg px-4 py-3 text-xl font-semibold border border-[#639922] bg-[#0d1b0d] text-[#a3d45e] hover:bg-[#192f18] transition" onClick={() => onOpenModal('contact')}>📧 Contact Organizer</button>
                <button className="rounded-lg px-4 py-3 text-xl font-semibold border border-[#639922] bg-[#0d1b0d] text-[#a3d45e] hover:bg-[#192f18] transition" onClick={() => onOpenModal('repost')}>🔗 Share Tournament</button>
                <button className="rounded-lg px-4 py-3 text-xl font-semibold border border-[#639922] bg-[#0d1b0d] text-[#a3d45e] hover:bg-[#192f18] transition" onClick={onNavigateTournaments}>← Back to Tournaments</button>
                <button className="rounded-lg px-4 py-3 text-xl font-semibold border border-[#639922] bg-[#0d1b0d] text-[#a3d45e] hover:bg-[#192f18] transition" onClick={onNavigateHome}>🏠 Home</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal === 'apply' && user?.id && (
        <TournamentApplicationForm
          tournament={tournament}
          userId={user.id}
          onSuccess={onSuccessModal}
          onCancel={onCloseModal}
        />
      )}
      {modal === 'checkout' && (
        <CheckoutModal t={tournament} user={user} onClose={onCloseModal} onSuccess={onSuccessModal} />
      )}
      {modal === 'contact' && (
        <ContactModal t={tournament} user={user} onClose={onCloseModal} />
      )}
      {modal === 'repost' && (
        <RepostModal t={tournament} user={user} onClose={onCloseModal} />
      )}
      {modal === 'success' && (
        <SuccessModal onClose={onCloseModal} type={successType} />
      )}
      {modal === 'amenity-booking' && selectedAmenity && (
        <AmenityBookingModal
          amenity={selectedAmenity}
          onClose={onCloseModal}
          onConfirm={onConfirmAmenityBooking}
          loading={bookingLoading}
        />
      )}
      {modal === 'profile' && (
        <ProfileModal t={tournament} user={user} leaderboard={leaderboard} onClose={onCloseModal} />
      )}
      {modal === 'cancel' && userRegistration && (
        <CancelApplicationModal
          tournament={tournament}
          registration={userRegistration}
          isPaid={isPaid}
          onSuccess={async () => {
            onCloseModal();
            if (fetchUserRegistrationStatus) {
              await fetchUserRegistrationStatus();
            }
          }}
          onClose={onCloseModal}
        />
      )}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
      {rejectingRegistrationId && (
        <RejectionReasonModal
          playerName={
            pendingRegistrations.find((r: any) => r.id === rejectingRegistrationId)?.player?.user?.firstName || 'Player'
          }
          onConfirm={handleRejectWithReason}
          onCancel={() => setRejectingRegistrationId(null)}
          loading={rejectionLoading}
        />
      )}
      {showRejectionReason && userRegistration?.status === 'rejected' && (
        <div 
          className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" 
          onClick={() => {
            if (setShowRejectionReason) {
              setShowRejectionReason(false);
            }
          }}
        >
          <div 
            className="bg-[#0a1510] border border-[rgba(220,76,100,0.3)] rounded-[18px] w-full max-w-[500px] overflow-hidden animate-[modalIn_0.2s_ease]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-[rgba(220,76,100,0.2)] px-8 py-6 bg-[rgba(220,76,100,0.05)]">
              <div className="text-3xl mb-2">❌</div>
              <h2 className="text-2xl font-bold text-[#ff6b7a] mb-1">Application Rejected</h2>
              <p className="text-sm text-[#ff8a93]">Your application was not accepted this time</p>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Tournament Info */}
              <div>
                <div className="text-sm text-[#4a6335] font-semibold mb-2">Tournament</div>
                <div className="text-lg text-[#c8e0a8]">{tournament.name}</div>
              </div>

              {/* Rejection Reason */}
              {userRegistration?.rejectionReason && (
                <div className="bg-[rgba(220,76,100,0.08)] border border-[rgba(220,76,100,0.2)] rounded-lg p-4">
                  <div className="text-sm text-[#ff6b7a] font-semibold mb-2">Rejection Reason</div>
                  <p className="text-base text-[#c8e0a8] leading-relaxed">
                    {userRegistration.rejectionReason}
                  </p>
                </div>
              )}

              {!userRegistration?.rejectionReason && (
                <div className="bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.2)] rounded-lg p-4">
                  <p className="text-base text-[#8fa878]">
                    No specific rejection reason was provided. Please contact the organizer for more details.
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
                <div className="text-sm text-[#4a6335] font-semibold mb-2">Next Steps</div>
                <ul className="text-sm text-[#8fa878] space-y-1">
                  <li>• Review the feedback provided above</li>
                  <li>• Contact the organizer if you need clarification</li>
                  <li>• Address the concerns and reapply</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-8 py-4 border-t border-[rgba(220,76,100,0.2)] bg-[rgba(220,76,100,0.02)]">
              <button 
                className="flex-1 px-4 py-2.5 rounded-lg border border-[rgba(99,153,34,0.3)] bg-transparent text-[#8dc843] hover:bg-[rgba(99,153,34,0.1)] font-semibold transition-colors"
                onClick={() => {
                  if (setShowRejectionReason) {
                    setShowRejectionReason(false);
                  }
                }}
              >
                Close
              </button>
              <button 
                className="flex-1 px-4 py-2.5 rounded-lg bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 font-semibold transition-all"
                onClick={() => {
                  if (setShowRejectionReason) {
                    setShowRejectionReason(false);
                  }
                  onOpenModal('apply');
                }}
              >
                🔄 Reapply
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === 'appeal' && (
        <AppealModal
          isOpen={true}
          onClose={onCloseModal}
          tournamentId={tournament.id}
          onAppealSubmitted={async () => {
            onCloseModal();
            await fetchUserAppeals();
          }}
        />
      )}
    </div>
  );
}
