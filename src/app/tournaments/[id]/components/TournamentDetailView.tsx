import React, { useEffect, useState } from 'react';
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
  onApplyForTournament?: (applicationData: any) => Promise<void>;
  onSubmitInquiry?: (inquiryData: any) => Promise<void>;
  onCreateCommunityPost?: (postData: any) => Promise<void>;
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
  onApplyForTournament,
  onSubmitInquiry,
  onCreateCommunityPost,
}: TournamentDetailViewProps) {
  // New states for modals
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<string | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [appealFilter, setAppealFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  // Mobile tab dropdown state
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="tournament-detail-view">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;600;700;800&family=Epilogue:wght@300;400;500&display=swap');
        
        .tournament-detail-view {
          width: 100%;
          color: #e8f5e0;
          font-family: 'Epilogue', sans-serif;
        }
        
        .tournament-detail-view h1, .tournament-detail-view h2, .tournament-detail-view h3 {
          font-family: 'Clash Display', sans-serif;
        }
        
        .tournament-hero {
          background: linear-gradient(135deg, #0f2710, #0f1f0f, #0d1f0d);
          border: 1px solid #2d5a35;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        
        .tournament-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(125,193,66,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .tournament-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(125,193,66,0.15);
          border: 1px solid rgba(125,193,66,0.3);
          color: #7dc142;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .tournament-title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(120deg,#7dc142 0%,#c8f07a 60%,#e8f5e0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          margin: 12px 0;
        }
        
        .tournament-description {
          font-size: 16px;
          color: #7aaa6a;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        .tournament-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 14px;
          color: #9dc880;
          margin-bottom: 20px;
        }
        
        .tournament-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }
        
        .stat-card {
          background: #1a3020;
          border: 1px solid #2d5a35;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #a8d84e;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #7aaa6a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #7dc142, #3d7a32);
          color: #0f1f0f;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(125,193,66,0.3);
        }
        
        .btn-secondary {
          background: transparent;
          color: #7dc142;
          border: 1px solid #2d5a35;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-secondary:hover {
          background: rgba(125,193,66,0.1);
          border-color: #7dc142;
        }
        
        .tab-navigation {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #2d5a35;
          margin-bottom: 24px;
          overflow-x: auto;
        }
        
        .tab-button {
          background: transparent;
          border: none;
          color: #7aaa6a;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .tab-button.active {
          color: #7dc142;
          border-bottom-color: #7dc142;
        }
        
        .tab-button:hover {
          color: #a8d84e;
        }
        
        .mobile-tab-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .mobile-tab-button {
          display: flex;
          width: 100%;
          items-center: center;
          justify-content: space-between;
          gap: 12px;
          background: #1a3020;
          border: 1px solid #2d5a35;
          border-radius: 12px;
          padding: 12px 16px;
          color: #e8f5e0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mobile-tab-button:hover {
          border-color: #7dc142;
        }
        
        .mobile-tab-dropdown {
          margin-top: 8px;
          background: #1a3020;
          border: 1px solid #2d5a35;
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .mobile-tab-option {
          width: 100%;
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 10px 12px;
          color: #e8f5e0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mobile-tab-option.active {
          background: rgba(125, 193, 66, 0.15);
          border-color: #7dc142;
          color: #7dc142;
        }
        
        .mobile-tab-option:hover {
          background: rgba(125, 193, 66, 0.1);
          color: #a8d84e;
        }
        
        .content-card {
          background: #1a3020;
          border: 1px solid #2d5a35;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .info-item {
          background: #152515;
          border-radius: 8px;
          padding: 12px;
        }
        
        .info-label {
          font-size: 12px;
          color: #7aaa6a;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 16px;
          color: #e8f5e0;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .tournament-hero {
            padding: 16px;
          }
          
          .tournament-title {
            font-size: 24px;
          }
          
          .tournament-meta {
            flex-direction: column;
            gap: 8px;
          }
          
          .tournament-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn-primary, .btn-secondary {
            width: 100%;
            text-align: center;
          }
          
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-navigation {
            gap: 0;
          }
          
          .tab-button {
            padding: 10px 12px;
            font-size: 13px;
          }
        }
      `}</style>

      {/* Hero Section */}
      <div className="tournament-hero">
        <div className="tournament-status-badge">
          <div className="w-1.5 h-1.5 bg-[#7dc142] rounded-full animate-pulse"></div>
          {tournament.status === 'open' ? 'Open for Registration' : tournament.status === 'upcoming' ? 'Coming Soon' : tournament.status?.toUpperCase() || 'ACTIVE'}
        </div>
        
        <h1 className="tournament-title">{tournament.name}</h1>
        
        <p className="tournament-description">{tournament.description}</p>
        
        <div className="tournament-meta">
          <span>📅 {new Date(tournament.startDate).toLocaleDateString()} — {new Date(tournament.endDate).toLocaleDateString()}</span>
          <span>📍 {tournament.location || 'TBD'}</span>
          <span>🏆 ${tournament.prizePool?.toLocaleString()} Prize Pool</span>
          <span>💳 ${tournament.entryFee} Entry</span>
        </div>
        
        <div className="tournament-stats">
          <div className="stat-card">
            <div className="stat-value">{confirmedParticipants}/{tournament.maxParticipants || 64}</div>
            <div className="stat-label">Players</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${tournament.prizePool?.toLocaleString() || '0'}</div>
            <div className="stat-label">Prize Pool</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div className="stat-label">Start Date</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1) || 'Active'}</div>
            <div className="stat-label">Status</div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className={`btn-primary ${buttonState.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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
          
          {userRegistration?.status === 'registered' && (
            <button className="btn-secondary" onClick={() => onOpenModal('cancel')}>
              ❌ Cancel Application
            </button>
          )}
          
          <button className="btn-secondary" onClick={() => onOpenModal('contact')}>
            💬 Contact Organizer
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px' }}>
        {/* Mobile Tab Selector */}
        <div className="mobile-tab-selector" style={{ display: isMobile ? 'flex' : 'none' }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#7aaa6a', margin: '0 0 8px 0', fontFamily: "'Epilogue', sans-serif" }}>
            Tap here to switch between tournament sections.
          </p>
          <button
            onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="mobile-tab-button"
          >
            <span>
              {(() => {
                const tabLabels = {
                  overview: '📋 Overview',
                  rules: '📋 Rules',
                  details: '🏨 Facilities',
                  leaderboard: '🏆 Leaderboard',
                  matches: '🎾 Matches',
                  comments: '💬 Comments',
                  announcements: '📢 Announcements',
                  management: '⚙️ Management'
                };
                return tabLabels[activeTab] || '📋 Overview';
              })()}
            </span>
            <span style={{ transform: mobileTabOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
          </button>

          {mobileTabOpen && (
            <div className="mobile-tab-dropdown">
              {(() => {
                type TabName = 'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management';
                const baseTabs: TabName[] = ['overview', 'rules', 'details', 'leaderboard', 'matches', 'comments', 'announcements'];
                const tabs: TabName[] = isOrganizer ? [...baseTabs, 'management'] : baseTabs;
                return tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileTabOpen(false);
                    }}
                    className={`mobile-tab-option ${activeTab === tab ? 'active' : ''}`}
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
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="tab-navigation" style={{ display: isMobile ? 'none' : 'flex' }}>
          {(() => {
            type TabName = 'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management';
            const baseTabs: TabName[] = ['overview', 'rules', 'details', 'leaderboard', 'matches', 'comments', 'announcements'];
            const tabs: TabName[] = isOrganizer ? [...baseTabs, 'management'] : baseTabs;
            return tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
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
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="content-grid">
          <div className="content-card">
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Tournament Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Event Type</div>
                <div className="info-value">{tournament.eventType || 'Tournament'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Format</div>
                <div className="info-value">{tournament.bracket?.bracketType || 'Single Elimination'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Start Date</div>
                <div className="info-value">{new Date(tournament.startDate).toLocaleDateString()}</div>
              </div>
              <div className="info-item">
                <div className="info-label">End Date</div>
                <div className="info-value">{tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Total Matches</div>
                <div className="info-value">{tournament.matches?.length || 0}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Completed Matches</div>
                <div className="info-value">{tournament.matches?.filter((m: { status: string }) => m.status === 'completed').length || 0}</div>
              </div>
            </div>
          </div>

          <div className="content-card">
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Registration Info</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Max Participants</div>
                <div className="info-value">{tournament.maxParticipants || 64}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Current Participants</div>
                <div className="info-value">{tournament.registrations?.length || 0}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Entry Fee</div>
                <div className="info-value">${tournament.entryFee || 0}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Prize Pool</div>
                <div className="info-value">${tournament.prizePool?.toLocaleString() || '0'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Tournament Rules</h3>
          <div style={{ color: '#7aaa6a', lineHeight: 1.6 }}>
            {tournament.rules ? (
              <div dangerouslySetInnerHTML={{ __html: tournament.rules.replace(/\n/g, '<br>') }} />
            ) : (
              <p>No specific rules have been set for this tournament. Standard tennis rules apply.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Facilities & Amenities</h3>
          {tournament.amenities?.length > 0 ? (
            <div className="info-grid">
              {tournament.amenities.map((amenity: any, index: number) => (
                <div key={index} className="info-item">
                  <div className="info-label">{amenity.name}</div>
                  <div className="info-value">${amenity.price || 0}</div>
                  {amenity.description && (
                    <div style={{ fontSize: 12, color: '#7aaa6a', marginTop: 4 }}>{amenity.description}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#7aaa6a' }}>No amenities information available.</p>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Leaderboard</h3>
          {leaderboard.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d5a35' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#7aaa6a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#7aaa6a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Player</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#7aaa6a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #1a3020' }}>
                      <td style={{ padding: '12px', color: '#e8f5e0' }}>#{index + 1}</td>
                      <td style={{ padding: '12px', color: '#e8f5e0' }}>{entry.playerName || 'Unknown'}</td>
                      <td style={{ padding: '12px', color: '#a8d84e', fontWeight: 600 }}>{entry.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#7aaa6a' }}>No leaderboard data available.</p>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Matches</h3>
          {tournament.matches?.length > 0 ? (
            <div className="info-grid">
              {tournament.matches.map((match: any, index: number) => (
                <div key={index} className="info-item">
                  <div className="info-label">Match {index + 1}</div>
                  <div className="info-value">{match.player1 || 'TBD'} vs {match.player2 || 'TBD'}</div>
                  <div style={{ fontSize: 12, color: '#7aaa6a', marginTop: 4 }}>{match.status || 'Scheduled'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#7aaa6a' }}>No matches scheduled yet.</p>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Comments ({comments.length})</h3>
          
          {/* Add Comment Form */}
          {user?.id && (
            <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #2d5a35' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this tournament..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  background: '#152515',
                  border: '1px solid #2d5a35',
                  borderRadius: '8px',
                  color: '#e8f5e0',
                  fontFamily: "'Epilogue', sans-serif",
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
              />
              <button
                onClick={onAddComment}
                disabled={!newComment.trim() || commentsLoading}
                style={{
                  background: '#7dc142',
                  color: '#0f1f0f',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: !newComment.trim() ? 'not-allowed' : 'pointer',
                  opacity: !newComment.trim() ? 0.5 : 1,
                }}
              >
                {commentsLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <p style={{ color: '#7aaa6a', textAlign: 'center', padding: '20px' }}>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: '#7aaa6a', textAlign: 'center', padding: '20px' }}>No comments yet. Be the first to comment!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map((comment: any) => (
                <div key={comment.id} style={{ background: '#152515', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ color: '#a8d84e', fontWeight: 600, margin: '0 0 4px 0' }}>{comment.authorName || 'Anonymous'}</p>
                      <p style={{ color: '#7aaa6a', fontSize: '12px', margin: '0' }}>
                        {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#e8f5e0', margin: '8px 0', lineHeight: '1.5' }}>{comment.content}</p>
                  
                  {/* Reactions */}
                  {comment.reactions && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2d5a35' }}>
                      <button
                        onClick={() => onReactToComment(comment.id, 'like')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#7aaa6a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px 8px',
                        }}
                      >
                        👍 {comment.reactions.likes || 0}
                      </button>
                      <button
                        onClick={() => onReactToComment(comment.id, 'love')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#7aaa6a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px 8px',
                        }}
                      >
                        ❤️ {comment.reactions.loves || 0}
                      </button>
                    </div>
                  )}
                  
                  {/* Reply Button */}
                  {user?.id && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#7dc142',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {replyingTo === comment.id ? '✕ Cancel' : 'Reply'}
                    </button>
                  )}
                  
                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2d5a35' }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '12px',
                          background: '#0f1f0f',
                          border: '1px solid #2d5a35',
                          borderRadius: '8px',
                          color: '#e8f5e0',
                          fontFamily: "'Epilogue', sans-serif",
                          fontSize: '13px',
                          marginBottom: '8px',
                        }}
                      />
                      <button
                        onClick={() => onReplyToComment(comment.id)}
                        disabled={!replyText.trim() || commentsLoading}
                        style={{
                          background: '#7dc142',
                          color: '#0f1f0f',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: !replyText.trim() ? 'not-allowed' : 'pointer',
                          opacity: !replyText.trim() ? 0.5 : 1,
                          fontSize: '13px',
                        }}
                      >
                        {commentsLoading ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', margin: 0 }}>Announcements ({announcements.length})</h3>
            {isOrganizer && (
              <button
                onClick={() => onOpenModal('repost')}
                style={{
                  background: '#7dc142',
                  color: '#0f1f0f',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                + New Announcement
              </button>
            )}
          </div>

          {announcementsLoading ? (
            <p style={{ color: '#7aaa6a', textAlign: 'center', padding: '20px' }}>Loading announcements...</p>
          ) : announcementsError ? (
            <p style={{ color: '#ff6b7a', textAlign: 'center', padding: '20px' }}>{announcementsError}</p>
          ) : announcements.length === 0 ? (
            <p style={{ color: '#7aaa6a', textAlign: 'center', padding: '20px' }}>No announcements yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {announcements.map((announcement: any) => (
                <div key={announcement.id} style={{ background: '#152515', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #7dc142' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ color: '#a8d84e', fontWeight: 600, margin: '0 0 4px 0', fontSize: '16px' }}>{announcement.title}</p>
                      <p style={{ color: '#7aaa6a', fontSize: '12px', margin: '0' }}>
                        {new Date(announcement.createdAt).toLocaleDateString()} at {new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {announcement.isPinned && <span style={{ background: '#7dc142', color: '#0f1f0f', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>📌 PINNED</span>}
                  </div>
                  <p style={{ color: '#e8f5e0', margin: '12px 0', lineHeight: '1.6' }}>{announcement.content}</p>
                  
                  {announcement.imageUrl && (
                    <img
                      src={announcement.imageUrl}
                      alt="Announcement"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginTop: '12px',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'management' && isOrganizer && (
        <div className="content-card">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8f5e0', marginBottom: 16 }}>Tournament Management</h3>
          {/* Management content would go here */}
          <p style={{ color: '#7aaa6a' }}>Management features for organizers.</p>
        </div>
      )}

      {/* Modals */}
      {modal === 'apply' && <TournamentApplicationForm tournament={tournament} userId={user?.id} onSuccess={onSuccessModal} onCancel={() => onCloseModal()} />}
      {modal === 'checkout' && <CheckoutModal t={tournament} user={user} onClose={() => onCloseModal()} onSuccess={onSuccessModal} />}
      {modal === 'contact' && <ContactModal t={tournament} user={user} onClose={() => onCloseModal()} />}
      {modal === 'repost' && <RepostModal t={tournament} user={user} onClose={() => onCloseModal()} />}
      {modal === 'success' && <SuccessModal type={successType} onClose={() => onCloseModal()} />}
      {modal === 'amenity-booking' && <AmenityBookingModal amenity={selectedAmenity} onClose={() => onCloseModal()} onConfirm={onConfirmAmenityBooking} loading={bookingLoading} />}
      {modal === 'profile' && <ProfileModal t={tournament} user={user} leaderboard={leaderboard} onClose={() => onCloseModal()} />}
      {modal === 'cancel' && <CancelApplicationModal tournament={tournament} registration={userRegistration} onClose={() => onCloseModal()} onSuccess={onSuccessModal} isPaid={isPaid} />}
      {modal === 'appeal' && <AppealModal isOpen={true} tournamentId={tournament.id} onClose={() => onCloseModal()} onAppealSubmitted={() => {}} />}

      {/* Rejection Reason Display */}
      {showRejectionReason && userRegistration?.status === 'rejected' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRejectionReason?.(false)}>
          <div className="bg-[#1a3020] border border-[#2d5a35] rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#e8f5e0] mb-4">Application Rejected</h3>
            <p className="text-[#7aaa6a] mb-4">
              Reason: {userRegistration.rejectionReason || 'No reason provided'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRejectionReason?.(false)}
                className="flex-1 bg-[#2d5a35] text-[#7dc142] py-2 px-4 rounded hover:bg-[#3d7a32] transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowRejectionReason?.(false);
                  onOpenModal('apply');
                }}
                className="flex-1 bg-[#7dc142] text-[#0f1f0f] py-2 px-4 rounded hover:bg-[#6ba83a] transition-colors font-semibold"
              >
                Reapply
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfileModal 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
    </div>
  );
}

