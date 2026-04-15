'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { CommunityView } from '@/components/community/CommunityView';

interface MembershipTier {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
  courtHoursPerMonth: number | null;
  maxConcurrentBookings: number | null;
  discountPercentage: number | null;
  benefits?: string[] | string | null;
}

interface OrganizationPublicDetailProps {
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
    membershipTiers: MembershipTier[];
    courts: Array<{ id: string; name: string; courtNumber?: number | null; surface?: string | null; indoorOutdoor?: string | null; lights?: boolean | null; status?: string | null }>;
    events: Array<{ id: string; name: string; eventType?: string | null; startDate?: string | null; registrationCap?: number | null; entryFee?: number | null }>;
    announcements: Array<{ id: string; title: string; message: string; announcementType?: string | null; isActive?: boolean | null; createdAt?: string | null }>;
    finances: Array<{ id: string; month?: number | null; year?: number | null; membershipRevenue?: number | null; courtBookingRevenue?: number | null; totalRevenue?: number | null; netProfit?: number | null }>;
    ratings: Array<{ id: string; rating: number; category?: string | null; comment?: string | null; createdAt?: string | null }>;
    members: Array<{ id: string; role?: string | null; joinDate?: string | null; player?: { user?: { firstName?: string | null; lastName?: string | null; photo?: string | null } } }>;
    _count: { members: number; courts: number; events: number };
  };
}

export default function OrganizationPublicDetail({ organization }: OrganizationPublicDetailProps) {
  const { user, isLoggedIn } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'mpesa'>('stripe');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const coachCount = organization.members.filter((member) => member.role === 'coach').length;
  const refereeCount = organization.members.filter((member) => member.role === 'referee').length;
  const adminCount = organization.members.filter((member) => member.role === 'admin').length;
  const totalStaff = organization.members.filter((member) => ['coach', 'referee', 'admin', 'staff'].includes(member.role ?? '')).length;

  const latestFinance = organization.finances?.[0];

  const handlePurchaseMembership = async (tier: MembershipTier, paymentMethod: 'stripe' | 'paypal' | 'mpesa' = 'stripe') => {
    if (!user || !organization?.id) {
      setPaymentStatus('Please sign in to purchase membership.');
      return;
    }

    const amount = tier.monthlyPrice ?? 0;
    if (amount <= 0) {
      setPaymentStatus('Invalid membership tier selected.');
      return;
    }

    setLoadingPayment(true);
    setPaymentStatus(`Creating ${paymentMethod} checkout session...`);

    try {
      let endpoint = '/api/payments/stripe';
      let payload: any = {
        amount,
        currency: paymentMethod === 'mpesa' ? 'kes' : 'usd',
        userId: user.id,
        eventId: organization.id,
        bookingType: 'membership_purchase',
        metadata: {
          membershipTier: tier.name,
          organization: organization.name,
          organizationId: organization.id,
          membershipTierId: tier.id,
          paymentMethod,
        },
      };

      if (paymentMethod === 'paypal') {
        endpoint = '/api/payments/paypal';
      } else if (paymentMethod === 'mpesa') {
        endpoint = '/api/payments/mpesa';
        // M-Pesa requires different payload structure
        payload = {
          mobileNumber: mpesaPhoneNumber || '',
          amount,
          accountReference: `Membership-${tier.name}`,
          transactionDesc: `Membership purchase: ${tier.name} at ${organization.name}`,
          userId: user.id,
          eventId: organization.id,
          bookingType: 'membership_purchase',
        };
      }

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setPaymentStatus(result.error || `${paymentMethod} payment session creation failed.`);
      } else if (result.checkoutUrl) {
        setPaymentStatus(`Ready for ${paymentMethod} checkout — ${tier.name} tier.`);
        window.open(result.checkoutUrl, '_blank');
        setShowPaymentModal(false);
      } else {
        setPaymentStatus(`${paymentMethod} checkout URL not returned.`);
      }
    } catch (error: any) {
      setPaymentStatus(error?.message || `${paymentMethod} payment request failed.`);
    } finally {
      setLoadingPayment(false);
    }
  };

  const openPaymentModal = (tier: MembershipTier) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#071008', color: '#e8f5e0' }}>
      <div style={{ maxWidth: "auto", margin: '0 auto', display: 'grid', gap: 24 }}>
        <section style={{ display: 'grid', gap: 16, background: '#0f1f12', border: '1px solid #243e24', borderRadius: 20, padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#1e3f28', display: 'grid', placeItems: 'center', fontSize: 24 }}>
                🎾
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{organization.name}</h1>
                <p style={{ margin: 0, color: '#a8d84e' }}>{organization.city || 'City not set'} • {organization.country || 'Location not set'}</p>
              </div>
            </div>
            <p style={{ lineHeight: 1.7, color: '#c4d8b1' }}>{organization.description || 'A thriving tennis community with courts, members, staff, and events for every level.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {organization.website && (
                <a href={organization.website} target="_blank" rel="noreferrer" style={{ color: '#7dc142', textDecoration: 'underline' }}>
                  Website
                </a>
              )}
              {organization.email && <span>{organization.email}</span>}
              {organization.phone && <span>{organization.phone}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 16, background: '#132915' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Members</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{organization._count.members}</div>
              <div style={{ color: '#7aaa6a', fontSize: 12 }}>Active players & club members</div>
            </div>
            <div style={{ padding: 16, borderRadius: 16, background: '#132915' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Courts</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{organization._count.courts}</div>
              <div style={{ color: '#7aaa6a', fontSize: 12 }}>Available courts</div>
            </div>
            <div style={{ padding: 16, borderRadius: 16, background: '#132915' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Events</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{organization._count.events}</div>
              <div style={{ color: '#7aaa6a', fontSize: 12 }}>Upcoming tournaments & clinics</div>
            </div>
            <div style={{ padding: 16, borderRadius: 16, background: '#132915' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Staff</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalStaff}</div>
              <div style={{ color: '#7aaa6a', fontSize: 12 }}>Coaches, referees & admin</div>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.5fr 1fr' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Memberships</h2>
                  <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 13 }}>Choose a membership tier and checkout quickly.</p>
                </div>
                {latestFinance && (
                  <span style={{ padding: '7px 12px', borderRadius: 999, background: '#1f3f22', color: '#a8d84e', fontSize: 12 }}>
                    Latest net profit ${latestFinance.netProfit ?? 0}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                {organization.membershipTiers.length > 0 ? (
                  organization.membershipTiers.map((tier) => (
                    <div key={tier.id} style={{ borderRadius: 18, border: '1px solid #243e24', background: '#132915', padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{tier.name}</h3>
                          <p style={{ margin: '6px 0 0', color: '#7aaa6a', fontSize: 13 }}>{tier.description || 'Club membership access with tier benefits.'}</p>

                          {/* Additional membership details */}
                          <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                            {tier.courtHoursPerMonth && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#7dc142', fontSize: 12 }}>⏰</span>
                                <span style={{ color: '#c4d8b1', fontSize: 12 }}>{tier.courtHoursPerMonth} court hours per month</span>
                              </div>
                            )}
                            {tier.maxConcurrentBookings && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#7dc142', fontSize: 12 }}>📅</span>
                                <span style={{ color: '#c4d8b1', fontSize: 12 }}>Up to {tier.maxConcurrentBookings} concurrent bookings</span>
                              </div>
                            )}
                            {tier.discountPercentage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#7dc142', fontSize: 12 }}>💰</span>
                                <span style={{ color: '#c4d8b1', fontSize: 12 }}>{tier.discountPercentage}% discount on bookings</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#e8f5e0' }}>${tier.monthlyPrice ?? 0}</div>
                          <div style={{ fontSize: 12, color: '#7aaa6a' }}>per month</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {(() => {
                          // Safely convert benefits to array
                          let benefitsArray: string[] = [];
                          if (tier.benefits) {
                            if (Array.isArray(tier.benefits)) {
                              benefitsArray = tier.benefits;
                            } else if (typeof tier.benefits === 'string') {
                              // Try to parse as JSON, otherwise split by comma
                              try {
                                benefitsArray = JSON.parse(tier.benefits);
                              } catch {
                                benefitsArray = tier.benefits.split(',').map(b => b.trim()).filter(b => b);
                              }
                            }
                          }
                          return benefitsArray.map((benefit, index) => (
                            <span key={index} style={{ color: '#c4d8b1', fontSize: 12, background: '#0d200f', borderRadius: 12, padding: '6px 10px' }}>
                              {benefit}
                            </span>
                          ));
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(tier)}
                        disabled={loadingPayment}
                        style={{
                          marginTop: 16,
                          width: '100%',
                          border: 'none',
                          borderRadius: 12,
                          padding: '12px 14px',
                          background: '#7dc142',
                          color: '#0f1f0f',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {loadingPayment ? 'Processing...' : 'Choose Payment Method'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#7aaa6a', fontSize: 13 }}>No membership tiers are published yet.</div>
                )}
              </div>

              {paymentStatus && (
                <div style={{ marginTop: 14, color: '#a8d84e', fontSize: 13 }}>{paymentStatus}</div>
              )}
            </div>

            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Club details</h2>
                  <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 13 }}>See the courts, staff, events, and community activity.</p>
                </div>
                <div style={{ color: '#7aaa6a', fontSize: 12 }}>Updated recently</div>
              </div>

              <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#132915', padding: 16, borderRadius: 16 }}>
                    <div style={{ color: '#7aaa6a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Coaches</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{coachCount}</div>
                  </div>
                  <div style={{ background: '#132915', padding: 16, borderRadius: 16 }}>
                    <div style={{ color: '#7aaa6a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Referees</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{refereeCount}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#132915', padding: 16, borderRadius: 16 }}>
                    <div style={{ color: '#7aaa6a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Admin</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{adminCount}</div>
                  </div>
                  <div style={{ background: '#132915', padding: 16, borderRadius: 16 }}>
                    <div style={{ color: '#7aaa6a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Net worth</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>${latestFinance?.totalRevenue ?? '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 18 }}>
            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Courts & Facilities</h2>
                <span style={{ color: '#7dc142', fontSize: 12, fontWeight: 700 }}>
                  {organization.courts.length} Total Courts
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {organization.courts.length > 0 ? (
                  organization.courts.slice(0, 6).map((court) => (
                    <div key={court.id} style={{ padding: 16, borderRadius: 16, background: '#132915', border: '1px solid #243e24' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#e8f5e0' }}>
                            {court.name || `Court ${court.courtNumber || '•'}`}
                          </div>
                          <div style={{ color: '#7aaa6a', fontSize: 11, marginTop: 2 }}>
                            Court #{court.courtNumber || 'N/A'}
                          </div>
                        </div>
                        <span style={{
                          color: court.status === 'available' ? '#7dc142' : court.status === 'maintenance' ? '#f59e0b' : '#7aaa6a',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '4px 8px',
                          borderRadius: 8,
                          background: court.status === 'available' ? '#1f3f22' : court.status === 'maintenance' ? '#3f2f1f' : '#1f2f22'
                        }}>
                          {court.status || 'Available'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#7dc142', fontSize: 12 }}>🎾</span>
                          <span style={{ color: '#c4d8b1', fontSize: 12 }}>
                            {court.surface || 'Hard court'} surface
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#7dc142', fontSize: 12 }}>
                            {court.indoorOutdoor === 'indoor' ? '🏢' : '🌤️'}
                          </span>
                          <span style={{ color: '#c4d8b1', fontSize: 12 }}>
                            {court.indoorOutdoor || 'Outdoor'} facility
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#7dc142', fontSize: 12 }}>
                            {court.lights ? '💡' : '🌙'}
                          </span>
                          <span style={{ color: '#c4d8b1', fontSize: 12 }}>
                            {court.lights ? 'Night lighting available' : 'Daytime play only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
                    <p style={{ color: '#7aaa6a', fontSize: 13, marginBottom: 8 }}>No courts listed yet.</p>
                    <p style={{ color: '#c4d8b1', fontSize: 12 }}>Check back soon for court availability and booking options.</p>
                  </div>
                )}
              </div>

              {organization.courts.length > 6 && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ color: '#7dc142', fontSize: 12, fontWeight: 700 }}>
                    +{organization.courts.length - 6} more courts available
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Upcoming events</h2>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {organization.events.length > 0 ? (
                  organization.events.slice(0, 4).map((event) => (
                    <div key={event.id} style={{ padding: 14, borderRadius: 16, background: '#132915' }}>
                      <div style={{ fontWeight: 700 }}>{event.name}</div>
                      <div style={{ color: '#7aaa6a', fontSize: 12, marginTop: 4 }}>{event.eventType || 'Event'} • {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</div>
                      <div style={{ color: '#c4d8b1', fontSize: 12, marginTop: 6 }}>{event.registrationCap ? `${event.registrationCap} spots` : 'Open registration'}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#7aaa6a', fontSize: 13 }}>No upcoming events scheduled.</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 320px' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Announcements</h2>
              <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                {organization.announcements.length > 0 ? (
                  organization.announcements.slice(0, 4).map((announcement) => (
                    <div key={announcement.id} style={{ padding: 14, borderRadius: 16, background: '#132915' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontWeight: 700 }}>{announcement.title}</span>
                        <span style={{ color: announcement.isActive ? '#7dc142' : '#7aaa6a', fontSize: 11 }}>
                          {announcement.isActive ? 'Active' : 'Archived'}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0', color: '#c4d8b1', fontSize: 13 }}>{announcement.message}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#7aaa6a', fontSize: 13 }}>No announcements yet.</p>
                )}
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Member roles</h2>
              <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 14, borderRadius: 16, background: '#132915' }}>
                  <span>Coaches</span>
                  <strong>{coachCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 14, borderRadius: 16, background: '#132915' }}>
                  <span>Referees</span>
                  <strong>{refereeCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 14, borderRadius: 16, background: '#132915' }}>
                  <span>Admins</span>
                  <strong>{adminCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 14, borderRadius: 16, background: '#132915' }}>
                  <span>Other staff</span>
                  <strong>{totalStaff - coachCount - refereeCount - adminCount}</strong>
                </div>
              </div>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 18 }}>
            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Club community</h2>
              <p style={{ margin: '10px 0 0', color: '#7aaa6a', fontSize: 13 }}>Join the conversation and share posts about the organization.</p>
            </div>
            <div style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Top member highlights</h3>
                  <p style={{ margin: '6px 0 0', color: '#7aaa6a', fontSize: 12 }}>Recent members and role counts in the club.</p>
                </div>
                {organization.members.slice(0, 5).map((member, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: '#132915' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1e3f28', display: 'grid', placeItems: 'center', fontSize: 13 }}>
                      {member.player?.user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#e8f5e0', fontSize: 13, fontWeight: 700 }}>{member.player?.user?.firstName || 'Member'} {member.player?.user?.lastName || ''}</div>
                      <div style={{ color: '#7aaa6a', fontSize: 11 }}>{member.role || 'member'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Community posts</h2>
          <div style={{ marginTop: 18 }}>
            <CommunityView isEmbedded={true} organizationId={organization.id} />
          </div>
        </section>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && selectedTier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#0f1f12',
            border: '1px solid #243e24',
            borderRadius: 20,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e8f5e0' }}>
                Choose Payment Method
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7aaa6a',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            {/* Membership Summary */}
            <div style={{
              background: '#132915',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #243e24'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f5e0' }}>
                    {selectedTier.name}
                  </h4>
                  <p style={{ margin: '4px 0 0', color: '#7aaa6a', fontSize: 12 }}>
                    {selectedTier.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7dc142' }}>
                    ${selectedTier.monthlyPrice ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#7aaa6a' }}>per month</div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e8f5e0' }}>
                Select Payment Method
              </h4>

              <div style={{ display: 'grid', gap: 12 }}>
                {/* Stripe */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  border: `2px solid ${selectedPaymentMethod === 'stripe' ? '#7dc142' : '#243e24'}`,
                  borderRadius: 12,
                  background: selectedPaymentMethod === 'stripe' ? '#1f3f22' : '#132915',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={selectedPaymentMethod === 'stripe'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as 'stripe')}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2px solid #7dc142',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPaymentMethod === 'stripe' && (
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#7dc142'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#e8f5e0', fontSize: 14 }}>💳 Credit/Debit Card</div>
                    <div style={{ color: '#7aaa6a', fontSize: 12 }}>Powered by Stripe - Secure payment processing</div>
                  </div>
                  <div style={{ color: '#7dc142', fontSize: 12, fontWeight: 700 }}>USD</div>
                </label>

                {/* PayPal */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  border: `2px solid ${selectedPaymentMethod === 'paypal' ? '#7dc142' : '#243e24'}`,
                  borderRadius: 12,
                  background: selectedPaymentMethod === 'paypal' ? '#1f3f22' : '#132915',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPaymentMethod === 'paypal'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as 'paypal')}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2px solid #7dc142',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPaymentMethod === 'paypal' && (
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#7dc142'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#e8f5e0', fontSize: 14 }}>🅿️ PayPal</div>
                    <div style={{ color: '#7aaa6a', fontSize: 12 }}>Pay with your PayPal account</div>
                  </div>
                  <div style={{ color: '#7dc142', fontSize: 12, fontWeight: 700 }}>USD</div>
                </label>

                {/* M-Pesa */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  border: `2px solid ${selectedPaymentMethod === 'mpesa' ? '#7dc142' : '#243e24'}`,
                  borderRadius: 12,
                  background: selectedPaymentMethod === 'mpesa' ? '#1f3f22' : '#132915',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa"
                    checked={selectedPaymentMethod === 'mpesa'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as 'mpesa')}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2px solid #7dc142',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPaymentMethod === 'mpesa' && (
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#7dc142'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#e8f5e0', fontSize: 14 }}>📱 M-Pesa</div>
                    <div style={{ color: '#7aaa6a', fontSize: 12 }}>Mobile money payment (Kenya)</div>
                  </div>
                  <div style={{ color: '#7dc142', fontSize: 12, fontWeight: 700 }}>KES</div>
                </label>

                {/* M-Pesa Phone Number Input */}
                {selectedPaymentMethod === 'mpesa' && (
                  <div style={{
                    marginTop: 12,
                    padding: 16,
                    borderRadius: 12,
                    background: '#1f3f22',
                    border: '1px solid #7dc142'
                  }}>
                    <label style={{ display: 'block', color: '#e8f5e0', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="254XXXXXXXXX"
                      value={mpesaPhoneNumber}
                      onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: '1px solid #243e24',
                        background: '#132915',
                        color: '#e8f5e0',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                    <div style={{ color: '#7aaa6a', fontSize: 12, marginTop: 4 }}>
                      Enter your M-Pesa registered phone number (e.g., 254712345678)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  border: '1px solid #243e24',
                  borderRadius: 12,
                  padding: '12px 16px',
                  background: '#132915',
                  color: '#7aaa6a',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber.trim()) {
                    setPaymentStatus('Please enter your M-Pesa phone number.');
                    return;
                  }
                  handlePurchaseMembership(selectedTier, selectedPaymentMethod);
                }}
                disabled={loadingPayment}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 16px',
                  background: '#7dc142',
                  color: '#0f1f0f',
                  cursor: loadingPayment ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  opacity: loadingPayment ? 0.6 : 1
                }}
              >
                {loadingPayment ? 'Processing...' : `Pay with ${selectedPaymentMethod === 'stripe' ? 'Card' : selectedPaymentMethod === 'paypal' ? 'PayPal' : 'M-Pesa'}`}
              </button>
            </div>

            {paymentStatus && (
              <div style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: '#1f3f22',
                border: '1px solid #7dc142',
                color: '#a8d84e',
                fontSize: 12
              }}>
                {paymentStatus}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
