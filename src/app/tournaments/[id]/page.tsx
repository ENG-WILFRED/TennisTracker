'use client';

import { useEffect, useState, useRef, use, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTournamentDetails, getTournamentLeaderboard, applyForTournament, submitTournamentInquiry, getTournamentComments, addTournamentComment } from '@/actions/tournaments';
import { createCommunityPost } from '@/actions/community';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import React from 'react';

import { TournamentDetailView } from './components';

/* ─────────────────────────────────────────
   INLINE STYLES
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   MAIN PAGE - TOURNAMENT DETAIL
───────────────────────────────────────── */
export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'apply' | 'checkout' | 'contact' | 'repost' | 'success' | 'amenity-booking' | 'profile' | 'cancel' | 'appeal' | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successType, setSuccessType] = useState<'registration' | 'booking'>('registration');
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'details' | 'leaderboard' | 'matches' | 'comments' | 'announcements' | 'management'>('overview');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState<any[]>([]);
  const [rejectedRegistrations, setRejectedRegistrations] = useState<any[]>([]);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showRejectionReason, setShowRejectionReason] = useState(false);

  // Unwrap params Promise (Next.js 15)
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;

  const fetchTournamentData = async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    try {
      const [tournamentData, leaderboardData] = await Promise.all([
        getTournamentDetails(tournamentId),
        getTournamentLeaderboard(tournamentId)
      ]);

      if (tournamentData) {
        setTournament(tournamentData);
        
        // Filter registrations by status
        const pending = tournamentData.registrations?.filter((r: any) => r.status === 'pending') || [];
        const approved = tournamentData.registrations?.filter((r: any) => r.status === 'approved') || [];
        const rejected = tournamentData.registrations?.filter((r: any) => r.status === 'rejected') || [];
        setPendingRegistrations(pending);
        setApprovedRegistrations(approved);
        setRejectedRegistrations(rejected);
        
        // Check if user is an organizer/admin of this tournament's organization
        if (user?.id && tournamentData.organization?.id) {
          try {
            const orgResponse = await authenticatedFetch(`/api/user/organizations`);
            if (orgResponse.ok) {
              const userOrgs = await orgResponse.json();
              
              const isOrgAdmin = userOrgs.some((org: any) => 
                org.organizationId === tournamentData.organization.id && 
                (org.role === 'admin' || org.role === 'owner')
              );
              setIsOrganizer(isOrgAdmin);
            }
          } catch (error) {
            console.error('Error checking organization permissions:', error);
          }
        }
      }

      if (leaderboardData) {
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrationStatus = async () => {
    if (!user?.id || !tournamentId) return;

    try {
      const response = await authenticatedFetch('/api/user/tournament-applications');
      if (!response.ok) return;

      const applications = await response.json();
      
      // Find the registration for this specific tournament
      const registration = applications.find((app: any) => app.eventId === tournamentId);
      
      if (registration) {
        setUserRegistration(registration);
        // User is considered paid if their registration status is 'registered'
        setIsPaid(registration.status === 'registered');
      } else {
        setUserRegistration(null);
        setIsPaid(false);
      }
    } catch (error) {
      console.error('Error fetching user registration status:', error);
    }
  };

  useEffect(() => {
    fetchTournamentData();
    if (user?.id) {
      fetchUserRegistrationStatus();
    }
  }, [tournamentId, user?.id]);

  useEffect(() => {
    if (activeTab === 'comments' && tournamentId) {
      fetchComments();
    }
    if (activeTab === 'announcements' && tournamentId) {
      fetchAnnouncements();
    }
  }, [activeTab, tournamentId]);

  const fetchComments = async () => {
    if (!tournamentId) return;
    setCommentsLoading(true);
    try {
      const commentsData = await getTournamentComments(tournamentId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    if (!tournamentId) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const response = await authenticatedFetch(`/api/tournaments/${tournamentId}/announcements`);
      if (!response.ok) {
        throw new Error('Failed to load announcements');
      }
      const data = await response.json();
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching tournament announcements:', error);
      setAnnouncementsError('Failed to load announcements.');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return;
    try {
      await addTournamentComment(tournamentId, newComment.trim(), user.id);
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReplyToComment = async (parentCommentId: string) => {
    if (!replyText.trim() || !user?.id) return;
    try {
      await addTournamentComment(tournamentId, replyText.trim(), user.id, parentCommentId);
      setReplyText('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const handleReactToComment = async (commentId: string, reactionType: string = 'like') => {
    if (!user?.id || !tournamentId) return;
    try {
      const response = await authenticatedFetch(`/api/tournaments/${tournamentId}/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error reacting to comment:', error.error);
        return;
      }

      // Refresh comments to get updated reaction counts
      await fetchComments();
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  const handleDMUser = async (targetUserEmail: string) => {
    try {
      // Create DM using email
      const dmResponse = await authenticatedFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail }),
      });

      if (!dmResponse.ok) throw new Error('Failed to create DM');

      const dmData = await dmResponse.json();
      router.push(`/chat?room=${dmData.id}`);
    } catch (error) {
      console.error('Error creating DM:', error);
      alert('Failed to start DM conversation');
    }
  };

  const handleAmenityBooking = async (amenity: any) => {
    setSelectedAmenity(amenity);
    setModal('amenity-booking');
  };

  const confirmAmenityBooking = async (bookingData: any) => {
    if (!selectedAmenity) {
      alert('No amenity selected.');
      return;
    }

    setBookingLoading(true);
    try {
      const price = selectedAmenity.price || 0;
      const method = bookingData.paymentMethod || 'mobile';
      const payloadBase = {
        userId: user?.id,
        eventId: tournamentId,
        bookingType: 'amenity_booking',
        amount: price,
        accountReference: `AMENITY-${selectedAmenity.id}-${Date.now()}`,
        transactionDesc: `Booking ${selectedAmenity.name}`,
      };

      if (price > 0) {
        if (!user?.id) {
          alert('You must be logged in to pay for amenity bookings.');
          return;
        }

        let paymentResult;

        if (method === 'mobile') {
          const response = await authenticatedFetch('/api/payments/mpesa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payloadBase,
              mobileNumber: bookingData.mobileNumber || '',
              bookingType: 'amenity_booking',
            }),
          });
          paymentResult = await response.json();

          if (!response.ok || !paymentResult.success) {
            alert(paymentResult.error || 'Failed to initialize M-Pesa payment');
            return;
          }

          alert('M-Pesa STK push sent. Please confirm payment on your phone.');
          return;
        }

        if (method === 'paypal') {
          const response = await authenticatedFetch('/api/payments/paypal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payloadBase,
              currency: 'USD',
              metadata: {
                amenityId: selectedAmenity.id,
                paymentMethod: 'paypal',
              },
            }),
          });
          paymentResult = await response.json();

          if (!response.ok || !paymentResult.success) {
            alert(paymentResult.error || 'Failed to start PayPal payment');
            return;
          }

          if (paymentResult.links && Array.isArray(paymentResult.links)) {
            const approveLink = paymentResult.links.find((link: any) => link.rel === 'approve');
            if (approveLink && approveLink.href) {
              // Save pending booking (booked once payment completes externally)
              await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amenityId: selectedAmenity.id,
                  eventId: tournamentId,
                  userId: user?.id,
                  status: 'pending',
                  paymentProvider: 'paypal',
                  checkoutUrl: approveLink.href,
                  startTime: bookingData.startTime,
                  endTime: bookingData.endTime,
                  guestName: bookingData.guestName || null,
                  notes: bookingData.notes || null,
                }),
              });

              alert('PayPal payment initiated, please finish checkout.');
              return;
            }
          }
        }

        if (method === 'stripe' || method === 'card') {
          const response = await authenticatedFetch('/api/payments/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payloadBase,
              currency: 'USD',
              metadata: {
                amenityId: selectedAmenity.id,
                paymentMethod: 'stripe',
              },
            }),
          });
          paymentResult = await response.json();

          if (!response.ok || !paymentResult.success) {
            alert(paymentResult.error || 'Failed to start Stripe payment');
            return;
          }

          if (paymentResult.checkoutUrl) {
            // Save pending booking prior to redirect
            await fetch('/api/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amenityId: selectedAmenity.id,
                eventId: tournamentId,
                userId: user?.id,
                status: 'pending',
                paymentProvider: 'stripe',
                checkoutUrl: paymentResult.checkoutUrl,
                startTime: bookingData.startTime,
                endTime: bookingData.endTime,
                guestName: bookingData.guestName || null,
                notes: bookingData.notes || null,
              }),
            });

            window.location.href = paymentResult.checkoutUrl;
            return;
          }

          alert('Stripe payment initiated, please finish checkout.');
          return;
        }
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amenityId: selectedAmenity.id,
          ...bookingData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessType('booking');
        setModal('success');
        setSelectedAmenity(null); // Clear selected amenity
        // Refresh tournament data to update booking counts
        await fetchTournamentData();
      } else {
        alert(result.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    if (!tournamentId) return;
    try {
      const response = await authenticatedFetch(
        `/api/tournaments/${tournamentId}/registrations/${registrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to approve: ${error.error}`);
        return;
      }

      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve application');
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    // The rejection reason is handled in the TournamentDetailView component
    // when the RejectionReasonModal is shown. This handler would be called
    // if we need additional logic after rejection.
    await fetchTournamentData();
  };

  const handleUpdateTournamentStatus = async (status: string) => {
    if (!tournamentId) return;
    try {
      const response = await authenticatedFetch(
        `/api/tournaments/${tournamentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to update status: ${error.error}`);
        return;
      }

      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error updating tournament status:', error);
      alert('Failed to update tournament status');
    }
  };

  if (loading) {
    return (
      <div className="font-epilogue min-h-screen bg-[#050d08] text-[#dde8d4]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🎾</div>
            <div className="text-[#a3d45e] text-xl">Loading tournament details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="font-epilogue min-h-screen bg-[#050d08] text-[#dde8d4]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-[#f0fae8] text-2xl mb-2">Tournament Not Found</h2>
            <p className="text-[#5a7242] mb-8">The tournament you're looking for doesn't exist or has been removed.</p>
            <button className="btn btn-md btn-primary" onClick={() => router.push('/tournaments')}>← Back to Tournaments</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TournamentDetailView
      tournament={tournament}
      user={user}
      leaderboard={leaderboard}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      comments={comments}
      commentsLoading={commentsLoading}
      newComment={newComment}
      setNewComment={setNewComment}
      replyingTo={replyingTo}
      setReplyingTo={setReplyingTo}
      replyText={replyText}
      setReplyText={setReplyText}
      onAddComment={handleAddComment}
      announcements={announcements}
      announcementsLoading={announcementsLoading}
      announcementsError={announcementsError}
      refreshAnnouncements={fetchAnnouncements}
      onReplyToComment={handleReplyToComment}
      onReactToComment={handleReactToComment}
      onDMUser={handleDMUser}
      onAmenityBooking={handleAmenityBooking}
      selectedAmenity={selectedAmenity}
      onCloseModal={() => setModal(null)}
      onOpenModal={setModal}
      onConfirmAmenityBooking={confirmAmenityBooking}
      bookingLoading={bookingLoading}
      fetchTournamentData={fetchTournamentData}
      onNavigateDashboard={() => router.push(`/dashboard/${user?.role}/${user?.id}`)}
      onNavigateTournaments={() => router.push('/tournaments')}
      onNavigateHome={() => router.push('/')}
      modal={modal}
      onSuccessModal={async () => { 
        setSuccessType('registration'); 
        // Fetch registration status FIRST before showing success modal to ensure button updates
        await fetchUserRegistrationStatus();
        await fetchTournamentData();
        // Show success modal after status is fetched
        setModal('success'); 
      }}
      successType={successType}
      isOrganizer={isOrganizer}
      pendingRegistrations={pendingRegistrations}
      approvedRegistrations={approvedRegistrations}
      rejectedRegistrations={rejectedRegistrations}
      onApproveRegistration={handleApproveRegistration}
      onRejectRegistration={handleRejectRegistration}
      onUpdateTournamentStatus={handleUpdateTournamentStatus}
      managementLoading={false}
      userRegistration={userRegistration}
      isPaid={isPaid}
      fetchUserRegistrationStatus={fetchUserRegistrationStatus}
      showRejectionReason={showRejectionReason}
      setShowRejectionReason={setShowRejectionReason}
    />
  );
}
