"use client";

import React, { useState } from 'react';
import { PlayerProfileModal } from '@/app/tournaments/[id]/components/PlayerProfileModal';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

// Helper function to extract player name from registration
function getPlayerName(reg: any): string {
  const user = reg.member?.player?.user;
  if (!user) return 'Unknown Player';
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user.name || 'Unknown Player';
}

// Helper function to extract player email from registration
function getPlayerEmail(reg: any): string {
  return reg.member?.player?.user?.email || '';
}

// Helper function to get first letter of name for avatar
function getNameInitial(reg: any): string {
  const firstName = reg.member?.player?.user?.firstName;
  if (firstName) return firstName[0].toUpperCase();
  const name = getPlayerName(reg);
  return (name || 'U')[0].toUpperCase();
}

// Helper function to extract player user ID
function getPlayerUserId(reg: any): string | null {
  return reg.member?.player?.user?.id || reg.member?.player?.userId || null;
}

interface TournamentRegistrationsSectionProps {
  tournament: any;
  pendingRegistrations: any[];
  approvedRegistrations: any[];
  rejectedRegistrations?: any[];
  onRegistrationAction: (registrationId: string, action: 'approve' | 'reject') => void;
  managementLoading: boolean;
  onRefresh?: () => void;
}

export function TournamentRegistrationsSection({
  tournament,
  pendingRegistrations,
  approvedRegistrations,
  rejectedRegistrations = [],
  onRegistrationAction,
  managementLoading,
  onRefresh,
}: TournamentRegistrationsSectionProps) {
  const fillRate = tournament?.registrationCap
    ? Math.round((approvedRegistrations.length / tournament.registrationCap) * 100)
    : 0;

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  // Notification/Contact modals
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);
  const [selectedPlayerForReminder, setSelectedPlayerForReminder] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPlayerForContact, setSelectedPlayerForContact] = useState<any>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  const handleViewProfile = (registration: any) => {
    setSelectedRegistration(registration);
    setShowProfileModal(true);
  };

  const handleSendPaymentReminder = async () => {
    if (!selectedPlayerForReminder || !reminderMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setReminderLoading(true);
    try {
      const userId = getPlayerUserId(selectedPlayerForReminder);
      const playerName = getPlayerName(selectedPlayerForReminder);

      if (!userId) {
        alert('Could not find player ID');
        setReminderLoading(false);
        return;
      }

      // Validate registration data
      if (!selectedPlayerForReminder.id || !selectedPlayerForReminder.memberId) {
        console.error('Invalid registration data:', {
          registrationId: selectedPlayerForReminder.id,
          memberId: selectedPlayerForReminder.memberId,
        });
        alert('Invalid registration data. Please try again.');
        setReminderLoading(false);
        return;
      }

      // Step 1: Create DM room with authenticated fetch (handles 401 with token refresh + retry)
      const dmResponse = await authenticatedFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      if (!dmResponse.ok) {
        const errorData = await dmResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create DM');
      }

      const dmData = await dmResponse.json();
      const roomId = dmData.id;

      // Step 2: Send message with payment reminder
      const defaultMessage = `Hi ${playerName},\n\nThe tournament "${tournament.name}" is coming up soon! Please complete your payment to secure your spot.\n\n${reminderMessage}`;

      const msgResponse = await authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: defaultMessage,
        }),
      });

      if (!msgResponse.ok) throw new Error('Failed to send message');

      // Step 3: Save payment reminder to database (for dashboard display)
      const reminderPayload = {
        eventId: tournament.id,
        registrationId: selectedPlayerForReminder.id,
        memberId: selectedPlayerForReminder.memberId,
        message: reminderMessage,
        reminderType: 'payment',
      };

      console.log('Sending payment reminder payload:', reminderPayload);

      const reminderResponse = await authenticatedFetch('/api/tournaments/payment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderPayload),
      });

      if (!reminderResponse.ok) {
        const errorData = await reminderResponse.json().catch(() => ({}));
        console.error('Failed to save reminder to database:', {
          status: reminderResponse.status,
          error: errorData,
          payload: reminderPayload,
        });
        // Don't fail the entire operation if database save fails
      } else {
        const reminderData = await reminderResponse.json();
        console.log('Payment reminder saved successfully:', reminderData.reminder?.id);
      }

      alert('Payment reminder sent successfully! Player can see this in their chat and dashboard.');
      setShowPaymentReminder(false);
      setReminderMessage('');
      setSelectedPlayerForReminder(null);
    } catch (error: any) {
      console.error('Error sending payment reminder:', error);
      alert(`Failed to send payment reminder: ${error.message}`);
    } finally {
      setReminderLoading(false);
    }
  };

  const handleContactPlayer = async () => {
    if (!selectedPlayerForContact || !contactMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setContactLoading(true);
    try {
      const userId = getPlayerUserId(selectedPlayerForContact);
      const playerName = getPlayerName(selectedPlayerForContact);

      if (!userId) {
        alert('Could not find player ID');
        setContactLoading(false);
        return;
      }

      // Create DM room with authenticated fetch
      const dmResponse = await authenticatedFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      if (!dmResponse.ok) {
        const errorData = await dmResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create DM');
      }

      const dmData = await dmResponse.json();
      const roomId = dmData.id;

      // Send message with authenticated fetch
      const msgResponse = await authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contactMessage,
        }),
      });

      if (!msgResponse.ok) throw new Error('Failed to send message');

      alert('Message sent successfully!');
      setShowContactModal(false);
      setContactMessage('');
      setSelectedPlayerForContact(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#a8d84e',
        marginBottom: 24,
      }}>
        Player Registrations
      </h2>

      {/* Pending */}
      {pendingRegistrations.length > 0 && (
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(240,192,64,0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#f0c040',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⏰ Pending Approvals
            <span style={{
              marginLeft: 8,
              background: '#f0c040',
              color: '#0a160a',
              borderRadius: 99,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 800,
            }}>
              {pendingRegistrations.length}
            </span>
          </div>

          <div>
            {pendingRegistrations.map((reg: any) => (
              <div
                key={reg.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(12,24,12,0.6)',
                  border: '1px solid rgba(240,192,64,0.2)',
                  marginBottom: '8px',
                  transition: 'border-color .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4a7a1a,#7dc142)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    color: '#0a160a',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {getNameInitial(reg)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14 }}>
                      {getPlayerName(reg)}
                    </div>
                    <div style={{ fontSize: 11, color: '#6a9058', marginTop: 2 }}>
                      Applied {new Date(reg.createdAt).toLocaleDateString()}
                    </div>
                    {getPlayerEmail(reg) && (
                      <div style={{ fontSize: 11, color: '#4a6a3a' }}>{getPlayerEmail(reg)}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleViewProfile(reg)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(125,160,170,0.15)',
                      color: '#64b5d8',
                      border: '1px solid rgba(125,160,170,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background .2s',
                    }}
                    title="View full profile"
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={() => onRegistrationAction(reg.id, 'approve')}
                    disabled={managementLoading}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(125,193,66,0.15)',
                      color: '#7dc142',
                      border: '1px solid rgba(125,193,66,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background .2s',
                      opacity: managementLoading ? 0.5 : 1,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => onRegistrationAction(reg.id, 'reject')}
                    disabled={managementLoading}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(224,80,80,0.15)',
                      color: '#e05050',
                      border: '1px solid rgba(224,80,80,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background .2s',
                      opacity: managementLoading ? 0.5 : 1,
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ✅ Approved Players
          <span style={{ marginLeft: 8, color: '#6a9058', fontWeight: 400, fontSize: 14 }}>
            ({approvedRegistrations.length}/{tournament.registrationCap})
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6a9058',
            marginBottom: 6,
          }}>
            <span>Capacity fill</span>
            <span>{fillRate}%</span>
          </div>
          <div style={{
            height: 8,
            background: 'rgba(125,193,66,0.1)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              borderRadius: '99px',
              background: 'linear-gradient(90deg,#4a9a1a,#7dc142,#c8f07a)',
              width: `${fillRate}%`,
              transition: 'width .8s ease',
            }} />
          </div>
        </div>

        {approvedRegistrations.length === 0 ? (
          <p style={{ color: '#4a6a3a', fontSize: 13 }}>No approved players yet.</p>
        ) : (
          approvedRegistrations.map((reg: any) => (
            <div
              key={reg.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(12,24,12,0.6)',
                border: '1px solid rgba(125,193,66,0.12)',
                marginBottom: '8px',
                transition: 'border-color .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2a5a12,#4a8a22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: '#a8d84e',
                  fontSize: 15,
                  flexShrink: 0,
                }}>
                  {getNameInitial(reg)}
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: '#dff0d0', fontSize: 14 }}>
                    {getPlayerName(reg)}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 2 }}>
                    Approved {new Date(reg.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleViewProfile(reg)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(125,160,170,0.15)',
                    color: '#64b5d8',
                    border: '1px solid rgba(125,160,170,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                    whiteSpace: 'nowrap',
                  }}
                  title="View full profile"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => {
                    setSelectedPlayerForReminder(reg);
                    setShowPaymentReminder(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(240,192,64,0.15)',
                    color: '#f0c040',
                    border: '1px solid rgba(240,192,64,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                    whiteSpace: 'nowrap',
                  }}
                  title="Send payment reminder"
                >
                  💬 Payment Reminder
                </button>
                <button
                  onClick={() => {
                    setSelectedPlayerForContact(reg);
                    setShowContactModal(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(125,193,66,0.15)',
                    color: '#7dc142',
                    border: '1px solid rgba(125,193,66,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                    whiteSpace: 'nowrap',
                  }}
                  title="Send message to player"
                >
                  📞 Contact
                </button>
                <span style={{ color: '#7dc142', fontSize: 18, whiteSpace: 'nowrap' }}>✓</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejected */}
      {rejectedRegistrations.length > 0 && (
        <div style={{
          background: 'rgba(220,76,100,0.08)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(220,76,100,0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#ff6b7a',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ❌ Rejected Applications
            <span style={{
              marginLeft: 8,
              background: 'rgba(220,76,100,0.3)',
              color: '#ff6b7a',
              borderRadius: 99,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 800,
            }}>
              {rejectedRegistrations.length}
            </span>
          </div>

          {rejectedRegistrations.map((reg: any) => (
            <div
              key={reg.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(12,24,12,0.6)',
                border: '1px solid rgba(220,76,100,0.2)',
                marginBottom: '8px',
                transition: 'border-color .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(220,76,100,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: '#ff6b7a',
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {(reg.member?.player?.user?.firstName || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14 }}>
                    {reg.member?.player?.user?.firstName} {reg.member?.player?.user?.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: '#6a9058', marginTop: 2 }}>
                    Rejected {new Date(reg.updatedAt).toLocaleDateString()}
                  </div>
                  {reg.rejectionReason && (
                    <div style={{ fontSize: 11, color: '#ff8a93', marginTop: 3, fontStyle: 'italic' }}>
                      Reason: {reg.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleViewProfile(reg)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(125,160,170,0.15)',
                    color: '#64b5d8',
                    border: '1px solid rgba(125,160,170,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                  }}
                  title="View full profile"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => onRegistrationAction(reg.id, 'approve')}
                  disabled={managementLoading}
                  title="Reverse rejection and approve this application"
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(125,193,66,0.15)',
                    color: '#7dc142',
                    border: '1px solid rgba(125,193,66,0.3)',
                    borderRadius: '8px',
                    cursor: managementLoading ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                    opacity: managementLoading ? 0.5 : 1,
                  }}
                >
                  ↩ Approve Anyway
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Reminder Modal */}
      {showPaymentReminder && selectedPlayerForReminder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPaymentReminder(false)}
        >
          <div
            style={{
              background: '#0a160a',
              border: '1px solid rgba(125,193,66,0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f0c040', marginBottom: 16 }}>
              💰 Send Payment Reminder
            </h3>
            <div style={{ marginBottom: 16, fontSize: 14, color: '#dff0d0' }}>
              Player: <strong>{getPlayerName(selectedPlayerForReminder)}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7dc142', marginBottom: 8, fontWeight: 600 }}>
                Additional Message:
              </label>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter any additional notes about payment..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  background: 'rgba(12, 24, 12, 0.6)',
                  border: '1px solid rgba(125,193,66,0.2)',
                  borderRadius: '8px',
                  color: '#dff0d0',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentReminder(false)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(99,153,34,0.15)',
                  color: '#7dc142',
                  border: '1px solid rgba(99,153,34,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  transition: 'background .2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendPaymentReminder}
                disabled={reminderLoading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #3b6d11, #639922)',
                  color: '#f0fae8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: reminderLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  opacity: reminderLoading ? 0.6 : 1,
                }}
              >
                {reminderLoading ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Player Modal */}
      {showContactModal && selectedPlayerForContact && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            style={{
              background: '#0a160a',
              border: '1px solid rgba(125,193,66,0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7dc142', marginBottom: 16 }}>
              📞 Contact Player
            </h3>
            <div style={{ marginBottom: 16, fontSize: 14, color: '#dff0d0' }}>
              Player: <strong>{getPlayerName(selectedPlayerForContact)}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7dc142', marginBottom: 8, fontWeight: 600 }}>
                Message:
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '10px',
                  background: 'rgba(12, 24, 12, 0.6)',
                  border: '1px solid rgba(125,193,66,0.2)',
                  borderRadius: '8px',
                  color: '#dff0d0',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(99,153,34,0.15)',
                  color: '#7dc142',
                  border: '1px solid rgba(99,153,34,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  transition: 'background .2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleContactPlayer}
                disabled={contactLoading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #3b6d11, #639922)',
                  color: '#f0fae8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: contactLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  opacity: contactLoading ? 0.6 : 1,
                }}
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedRegistration && (
        <PlayerProfileModal
          player={selectedRegistration}
          tournamentId={tournament.id}
          onApply={(userId) => {
            // Player apply button clicked from modal - can trigger payment or registration flow
            console.log('Player applying from profile modal:', userId);
            // You can add additional logic here for the apply action
          }}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedRegistration(null);
          }}
        />
      )}
    </div>
  );
}
