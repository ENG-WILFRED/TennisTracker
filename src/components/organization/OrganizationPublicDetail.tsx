'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useToast } from '@/components/ui/ToastContext';

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
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'mpesa'>('stripe');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
      <div style={{ maxWidth: "auto", width: '100%', margin: '0 auto', display: 'grid', gap: 24 }}>
        {/* Back Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (user) {
                router.push(`/dashboard/spectator/${user.id}`);
                addToast('Returning to spectator dashboard', 'info');
              } else {
                addToast('Please sign in to access dashboard', 'warning');
              }
            }}
            style={{
              background: '#1e3f28',
              border: '1px solid #243e24',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#7dc142',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Back to Spectator Dashboard
          </button>
        </div>

        {/* Organization Header */}
        <section style={{ display: 'grid', gap: 24, padding: 28, borderRadius: 24, background: '#0f1f12', border: '1px solid #243e24' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 18, minWidth: 0, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#1e3f28', display: 'grid', placeItems: 'center', fontSize: 28 }}>
                🎾
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, lineHeight: 1.05 }}>{organization.name}</h1>
                <p style={{ margin: '10px 0 0', color: '#7aaa6a', fontSize: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span>{organization.city || 'City not set'}</span>
                  <span>{organization.country || 'Location not set'}</span>
                </p>
              </div>
            </div>
            <div style={{ minWidth: 0, flex: '0 1 320px', display: 'grid', gap: 10, textAlign: 'right' }}>
              <div style={{ color: '#7aaa6a', fontSize: 14, lineHeight: 1.7 }}>{organization.description || 'A thriving tennis community with courts, members, staff, and events for every level.'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: '#c4d8b1', fontSize: 13 }}>
            {organization.website && (
              <a href={organization.website} target="_blank" rel="noreferrer" style={{ color: '#7dc142', textDecoration: 'underline' }}>
                Website
              </a>
            )}
            {organization.email && <span>{organization.email}</span>}
            {organization.phone && <span>{organization.phone}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 22, background: '#132915', border: '1px solid #243e24' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Members</div>
              <div style={{ marginTop: 12, fontSize: 32, fontWeight: 800 }}>{organization._count.members}</div>
              <div style={{ marginTop: 8, color: '#7aaa6a', fontSize: 13 }}>Active players & club members</div>
            </div>
            <div style={{ padding: 20, borderRadius: 22, background: '#132915', border: '1px solid #243e24' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Courts</div>
              <div style={{ marginTop: 12, fontSize: 32, fontWeight: 800 }}>{organization._count.courts}</div>
              <div style={{ marginTop: 8, color: '#7aaa6a', fontSize: 13 }}>Available courts</div>
            </div>
            <div style={{ padding: 20, borderRadius: 22, background: '#132915', border: '1px solid #243e24' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Events</div>
              <div style={{ marginTop: 12, fontSize: 32, fontWeight: 800 }}>{organization._count.events}</div>
              <div style={{ marginTop: 8, color: '#7aaa6a', fontSize: 13 }}>Upcoming tournaments & clinics</div>
            </div>
            <div style={{ padding: 20, borderRadius: 22, background: '#132915', border: '1px solid #243e24' }}>
              <div style={{ color: '#7dc142', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Staff</div>
              <div style={{ marginTop: 12, fontSize: 32, fontWeight: 800 }}>{totalStaff}</div>
              <div style={{ marginTop: 8, color: '#7aaa6a', fontSize: 13 }}>Coaches, referees & admin</div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div style={{ borderBottom: '1px solid #243e24', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'courts', label: 'Courts & Facilities', icon: '🎾' },
              { id: 'events', label: 'Events & Announcements', icon: '📅' },
              { id: 'staff', label: 'Staff & Members', icon: '👥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#1e3f28' : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? '#7dc142' : '#243e24'}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: activeTab === tab.id ? '#7dc142' : '#c4d8b1',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={{ padding: 24, borderRadius: 24, background: '#0f1f12', border: '1px solid #243e24' }}>
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Memberships</h2>
                  <p style={{ margin: '10px 0 0', color: '#7aaa6a', fontSize: 14 }}>Explore membership options and benefits for the club.</p>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  {organization.membershipTiers.length > 0 ? (
                    organization.membershipTiers.map((tier) => (
                      <div key={tier.id} style={{ display: 'grid', gap: 16, padding: 20, borderRadius: 24, background: '#132915', border: '1px solid #243e24' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{tier.name}</h3>
                            <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 13 }}>{tier.description || 'Club membership access with tier benefits.'}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#7dc142' }}>${tier.monthlyPrice ?? 0}</div>
                            <div style={{ marginTop: 4, color: '#7aaa6a', fontSize: 13 }}>per month</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          {tier.courtHoursPerMonth && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4d8b1' }}>
                              <span>⏰</span>
                              <span>{tier.courtHoursPerMonth} court hours per month</span>
                            </div>
                          )}
                          {tier.maxConcurrentBookings && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4d8b1' }}>
                              <span>📅</span>
                              <span>Up to {tier.maxConcurrentBookings} concurrent bookings</span>
                            </div>
                          )}
                          {tier.discountPercentage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4d8b1' }}>
                              <span>💰</span>
                              <span>{tier.discountPercentage}% discount on bookings</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {(() => {
                            let benefitsArray: string[] = [];
                            if (tier.benefits) {
                              if (Array.isArray(tier.benefits)) {
                                benefitsArray = tier.benefits;
                              } else if (typeof tier.benefits === 'string') {
                                try {
                                  benefitsArray = JSON.parse(tier.benefits);
                                } catch {
                                  benefitsArray = tier.benefits.split(',').map(b => b.trim()).filter(b => b);
                                }
                              }
                            }
                            return benefitsArray.map((benefit, index) => (
                              <span key={index} style={{ color: '#c4d8b1', fontSize: 12, background: '#0d200f', borderRadius: 999, padding: '6px 12px' }}>
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
                            width: '100%',
                            border: 'none',
                            borderRadius: 12,
                            padding: '14px 18px',
                            background: '#7dc142',
                            color: '#0f1f0f',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          {loadingPayment ? 'Processing...' : 'Choose Payment Method'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 20, borderRadius: 20, background: '#132915', color: '#7aaa6a' }}>No membership tiers are published yet.</div>
                  )}
                </div>

                {paymentStatus && (
                  <div style={{ color: '#a8d84e', fontSize: 13 }}>{paymentStatus}</div>
                )}
              </div>

              <div style={{ padding: 24, borderRadius: 24, background: '#132915', border: '1px solid #243e24' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Club details</h2>
                <p style={{ margin: '10px 0 20px', color: '#7aaa6a', fontSize: 14 }}>Quick club performance metrics and staffing summary.</p>
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div style={{ padding: 18, borderRadius: 20, background: '#0f1f12' }}>
                    <div style={{ color: '#7dc142', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Coaches</div>
                    <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{coachCount}</div>
                  </div>
                  <div style={{ padding: 18, borderRadius: 20, background: '#0f1f12' }}>
                    <div style={{ color: '#7dc142', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Referees</div>
                    <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{refereeCount}</div>
                  </div>
                  <div style={{ padding: 18, borderRadius: 20, background: '#0f1f12' }}>
                    <div style={{ color: '#7dc142', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Admins</div>
                    <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{adminCount}</div>
                  </div>
                  <div style={{ padding: 18, borderRadius: 20, background: '#0f1f12' }}>
                    <div style={{ color: '#7dc142', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Net worth</div>
                    <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>${latestFinance?.totalRevenue ?? '—'}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Courts Tab */}
        {activeTab === 'courts' && (
          <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Courts & Facilities</h2>
                <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 14 }}>Explore all available courts and their features.</p>
              </div>
              <span style={{ color: '#7dc142', fontSize: 14, fontWeight: 700 }}>
                {organization.courts.length} Total Courts
              </span>
            </div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {organization.courts.length > 0 ? (
                organization.courts.map((court) => (
                  <div key={court.id} style={{ padding: 20, borderRadius: 16, background: '#132915', border: '1px solid #243e24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#e8f5e0' }}>
                          {court.name || `Court ${court.courtNumber || '•'}`}
                        </div>
                        <div style={{ color: '#7aaa6a', fontSize: 12, marginTop: 2 }}>
                          Court #{court.courtNumber || 'N/A'}
                        </div>
                      </div>
                      <span style={{
                        color: court.status === 'available' ? '#7dc142' : court.status === 'maintenance' ? '#f59e0b' : '#7aaa6a',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: court.status === 'available' ? '#1f3f22' : court.status === 'maintenance' ? '#3f2f1f' : '#1f2f22'
                      }}>
                        {court.status || 'Available'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#7dc142', fontSize: 14 }}>🎾</span>
                        <span style={{ color: '#c4d8b1', fontSize: 14 }}>
                          {court.surface || 'Hard court'} surface
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#7dc142', fontSize: 14 }}>
                          {court.indoorOutdoor === 'indoor' ? '🏢' : '🌤️'}
                        </span>
                        <span style={{ color: '#c4d8b1', fontSize: 14 }}>
                          {court.indoorOutdoor || 'Outdoor'} facility
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#7dc142', fontSize: 14 }}>
                          {court.lights ? '💡' : '🌙'}
                        </span>
                        <span style={{ color: '#c4d8b1', fontSize: 14 }}>
                          {court.lights ? 'Night lighting available' : 'Daytime play only'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎾</div>
                  <p style={{ color: '#7aaa6a', fontSize: 16, marginBottom: 8 }}>No courts listed yet.</p>
                  <p style={{ color: '#c4d8b1', fontSize: 14 }}>Check back soon for court availability and booking options.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Events & Announcements Tab */}
        {activeTab === 'events' && (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Events Section */}
            <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Upcoming Events</h2>
                  <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 14 }}>Tournaments, clinics, and special events.</p>
                </div>
                <span style={{ color: '#7dc142', fontSize: 14, fontWeight: 700 }}>
                  {organization.events.length} Events
                </span>
              </div>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {organization.events.length > 0 ? (
                  organization.events.map((event) => (
                    <div key={event.id} style={{ padding: 20, borderRadius: 16, background: '#132915' }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: '#e8f5e0' }}>{event.name}</div>
                      <div style={{ color: '#7aaa6a', fontSize: 14, marginTop: 8 }}>{event.eventType || 'Event'}</div>
                      <div style={{ color: '#c4d8b1', fontSize: 14, marginTop: 4 }}>
                        {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date TBD'}
                      </div>
                      <div style={{ color: '#7dc142', fontSize: 14, marginTop: 8, fontWeight: 600 }}>
                        {event.registrationCap ? `${event.registrationCap} spots available` : 'Open registration'}
                      </div>
                      {event.entryFee && (
                        <div style={{ color: '#a8d84e', fontSize: 14, marginTop: 4 }}>
                          Entry fee: ${event.entryFee}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                    <p style={{ color: '#7aaa6a', fontSize: 16, marginBottom: 8 }}>No upcoming events scheduled.</p>
                    <p style={{ color: '#c4d8b1', fontSize: 14 }}>Check back soon for tournaments and clinics.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Announcements Section */}
            <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Announcements</h2>
                  <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 14 }}>Latest news and updates from the club.</p>
                </div>
                <span style={{ color: '#7dc142', fontSize: 14, fontWeight: 700 }}>
                  {organization.announcements.length} Announcements
                </span>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                {organization.announcements.length > 0 ? (
                  organization.announcements.map((announcement) => (
                    <div key={announcement.id} style={{ padding: 20, borderRadius: 16, background: '#132915' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e8f5e0' }}>{announcement.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{
                            color: announcement.isActive ? '#7dc142' : '#7aaa6a',
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '4px 8px',
                            borderRadius: 8,
                            background: announcement.isActive ? '#1f3f22' : '#1f2f22'
                          }}>
                            {announcement.isActive ? 'Active' : 'Archived'}
                          </span>
                          <span style={{ color: '#7aaa6a', fontSize: 12 }}>
                            {announcement.announcementType || 'General'}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 12px', color: '#c4d8b1', fontSize: 14, lineHeight: 1.6 }}>{announcement.message}</p>
                      <div style={{ color: '#7aaa6a', fontSize: 12 }}>
                        Posted {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>📢</div>
                    <p style={{ color: '#7aaa6a', fontSize: 16, marginBottom: 8 }}>No announcements yet.</p>
                    <p style={{ color: '#c4d8b1', fontSize: 14 }}>Stay tuned for updates from the club.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Staff & Members Tab */}
        {activeTab === 'staff' && (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Member Roles Summary */}
            <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Member Roles</h2>
                <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 14 }}>Overview of staff and member distribution.</p>
              </div>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 20, borderRadius: 16, background: '#132915' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#e8f5e0' }}>Coaches</span>
                  <strong style={{ fontSize: 24, color: '#7dc142' }}>{coachCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 20, borderRadius: 16, background: '#132915' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#e8f5e0' }}>Referees</span>
                  <strong style={{ fontSize: 24, color: '#7dc142' }}>{refereeCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 20, borderRadius: 16, background: '#132915' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#e8f5e0' }}>Admins</span>
                  <strong style={{ fontSize: 24, color: '#7dc142' }}>{adminCount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 20, borderRadius: 16, background: '#132915' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#e8f5e0' }}>Other staff</span>
                  <strong style={{ fontSize: 24, color: '#7dc142' }}>{totalStaff - coachCount - refereeCount - adminCount}</strong>
                </div>
              </div>
            </section>

            {/* Top Member Highlights */}
            <section style={{ padding: 20, borderRadius: 20, border: '1px solid #243e24', background: '#0f1f12' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Top Member Highlights</h2>
                <p style={{ margin: '8px 0 0', color: '#7aaa6a', fontSize: 14 }}>Recent members and their roles in the club.</p>
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {organization.members.slice(0, 10).map((member, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#132915' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1e3f28', display: 'grid', placeItems: 'center', fontSize: 16 }}>
                      {member.player?.user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: '#e8f5e0', fontSize: 16, fontWeight: 700 }}>
                        {member.player?.user?.firstName || 'Member'} {member.player?.user?.lastName || ''}
                      </div>
                      <div style={{ color: '#7aaa6a', fontSize: 14, marginTop: 2 }}>{member.role || 'member'}</div>
                      <div style={{ color: '#c4d8b1', fontSize: 12, marginTop: 2 }}>
                        Joined {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

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
    </div>
  );
}
