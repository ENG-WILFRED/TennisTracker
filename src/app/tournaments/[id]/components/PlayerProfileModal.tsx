import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface PlayerProfileModalProps {
  player: any;
  onClose: () => void;
  tournamentId?: string;
  onApply?: (playerId: string) => void;
}

export function PlayerProfileModal({ player, onClose, tournamentId, onApply }: PlayerProfileModalProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'registered'>('none');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = player?.userId || player?.user?.id || player?.member?.player?.user?.id;
        if (!userId) throw new Error('User ID not found');

        const response = await authenticatedFetch(`/api/user/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();
        setProfileData(data);

        // Fetch registration status if tournament ID is provided
        if (tournamentId && userId) {
          try {
            const regResponse = await authenticatedFetch(`/api/tournaments/${tournamentId}/user-registration/${userId}`);
            if (regResponse.ok) {
              const regData = await regResponse.json();
              if (regData.status === 'pending_approval') {
                setPaymentStatus('pending');
              } else if (regData.status === 'approved') {
                setPaymentStatus('approved');
              } else if (regData.status === 'registered') {
                setPaymentStatus('registered');
              } else if (regData.status === 'rejected') {
                setPaymentStatus('rejected');
              }
            }
          } catch (regError) {
            console.log('User not yet registered for tournament');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (player) {
      fetchProfile();
    }
  }, [player, tournamentId]);

  if (!player) return null;

  const user = profileData || player.user || player.member?.player?.user;
  const stats = player.stats || {};

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a160a',
          border: '1px solid rgba(125,193,66,0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#a3d45e', margin: 0 }}>
            Player Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#5a7242',
            }}
          >
            ✕
          </button>
        </div>

        {/* Player Avatar & Basic Info */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: user?.photo ? `url(${user.photo})` : 'linear-gradient(135deg, #3b6d11, #639922)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid #8dc843',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#f0fae8',
              fontWeight: 'bold',
            }}
          >
            {!user?.photo && getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f0fae8', marginBottom: '4px' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '14px', color: '#5a7242', marginBottom: '8px' }}>
              @{user?.username}
            </div>
            {user?.bio && (
              <div style={{ fontSize: '12px', color: '#4a6335', maxWidth: '300px' }}>
                {user.bio}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7aaa6a' }}>
            ⏳ Loading full profile...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ff6b7a' }}>
            ❌ {error}
          </div>
        ) : (
          <>
            {/* Organization & Ranking Section */}
            {profileData?.organization && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(168,216,74,0.1), rgba(125,193,66,0.08))',
                  border: '1px solid rgba(125,193,66,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#8dc843', marginBottom: '12px', margin: '0 0 12px 0' }}>
                  🏢 Organization
                </h3>
                <div style={{ fontSize: '14px', color: '#a8d84e', fontWeight: 600, marginBottom: '12px' }}>
                  {profileData.organization.name}
                </div>

                {profileData.ranking && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(125,193,66,0.2)',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#5a7242', marginBottom: '4px', fontWeight: 600 }}>
                        🏆 Rank
                      </div>
                      <div style={{ fontSize: '16px', color: '#a3d45e', fontWeight: 700 }}>
                        #{profileData.ranking.currentRank}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#5a7242', marginBottom: '4px', fontWeight: 600 }}>
                        ⭐ Rating Points
                      </div>
                      <div style={{ fontSize: '16px', color: '#a3d45e', fontWeight: 700 }}>
                        {profileData.ranking.ratingPoints}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#5a7242', marginBottom: '4px', fontWeight: 600 }}>
                        📊 Win Rate
                      </div>
                      <div style={{ fontSize: '16px', color: '#a3d45e', fontWeight: 700 }}>
                        {(profileData.ranking.winRate * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#5a7242', marginBottom: '4px', fontWeight: 600 }}>
                        🎾 Record
                      </div>
                      <div style={{ fontSize: '16px', color: '#a3d45e', fontWeight: 700 }}>
                        {profileData.ranking.matchesWon}W-{profileData.ranking.matchesLost}L
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Player Stats (from tournament/event) */}
        <div
          style={{
            background: 'rgba(99,153,34,0.08)',
            border: '1px solid rgba(99,153,34,0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#8dc843', marginBottom: '12px', margin: 0 }}>
            Player Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>Games Played</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#a3d45e' }}>
                {stats.gamesPlayed || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>Win Rate</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#a3d45e' }}>
                {stats.winRate ? `${stats.winRate}%` : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>Current Rank</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#a3d45e' }}>
                #{stats.rank || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>Rating</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#a3d45e' }}>
                {stats.rating || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        {(profileData?.email || profileData?.phone || profileData?.dateOfBirth || profileData?.gender || profileData?.nationality) && (
          <div
            style={{
              background: 'rgba(99,153,34,0.08)',
              border: '1px solid rgba(99,153,34,0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#8dc843', marginBottom: '12px', margin: '0 0 12px 0' }}>
              📋 Personal Information
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {profileData?.email && (
                <div>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>📧 Email</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8', wordBreak: 'break-all' }}>{profileData.email}</div>
                </div>
              )}

              {profileData?.phone && (
                <div>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>📱 Phone</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8' }}>{profileData.phone}</div>
                </div>
              )}

              {profileData?.gender && (
                <div>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>⚥ Gender</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8' }}>{profileData.gender}</div>
                </div>
              )}

              {profileData?.dateOfBirth && (
                <div>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>📅 Date of Birth</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8' }}>
                    {formatDate(profileData.dateOfBirth)} ({calculateAge(profileData.dateOfBirth)} years old)
                  </div>
                </div>
              )}

              {profileData?.nationality && (
                <div>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>🌍 Nationality</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8' }}>{profileData.nationality}</div>
                </div>
              )}

              {profileData?.createdAt && (
                <div style={{ borderTop: '1px solid rgba(99,153,34,0.2)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#5a7242', marginBottom: '4px' }}>📝 Member Since</div>
                  <div style={{ fontSize: '14px', color: '#c8e0a8' }}>{formatDate(profileData.createdAt)}</div>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(99,153,34,0.15)',
            border: '1px solid rgba(99,153,34,0.3)',
            borderRadius: '8px',
            color: '#a3d45e',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(99,153,34,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(99,153,34,0.15)';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
