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
  benefits?: string[];
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

  const coachCount = organization.members.filter((member) => member.role === 'coach').length;
  const refereeCount = organization.members.filter((member) => member.role === 'referee').length;
  const adminCount = organization.members.filter((member) => member.role === 'admin').length;
  const totalStaff = organization.members.filter((member) => ['coach', 'referee', 'admin', 'staff'].includes(member.role ?? '')).length;

  const latestFinance = organization.finances?.[0];

  const handlePurchaseMembership = async (tier: MembershipTier) => {
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
    setPaymentStatus('Creating checkout session...');

    try {
      const response = await authenticatedFetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          userId: user.id,
          eventId: organization.id,
          bookingType: 'membership_purchase',
          metadata: {
            membershipTier: tier.name,
            organization: organization.name,
            organizationId: organization.id,
            membershipTierId: tier.id,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setPaymentStatus(result.error || 'Payment session creation failed.');
      } else if (result.checkoutUrl) {
        setPaymentStatus(`Ready for checkout — ${tier.name} tier.`);
        window.open(result.checkoutUrl, '_blank');
      } else {
        setPaymentStatus('Checkout URL not returned.');
      }
    } catch (error: any) {
      setPaymentStatus(error?.message || 'Payment request failed.');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#071008', color: '#e8f5e0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 24 }}>
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
                        <div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{tier.name}</h3>
                          <p style={{ margin: '6px 0 0', color: '#7aaa6a', fontSize: 13 }}>{tier.description || 'Club membership access with tier benefits.'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#e8f5e0' }}>${tier.monthlyPrice ?? 0}</div>
                          <div style={{ fontSize: 12, color: '#7aaa6a' }}>per month</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {(tier.benefits || []).map((benefit, index) => (
                          <span key={index} style={{ color: '#c4d8b1', fontSize: 12, background: '#0d200f', borderRadius: 12, padding: '6px 10px' }}>
                            {benefit}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePurchaseMembership(tier)}
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
                        {loadingPayment ? 'Processing...' : 'Purchase membership'}
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
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Courts</h2>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {organization.courts.length > 0 ? (
                  organization.courts.slice(0, 4).map((court) => (
                    <div key={court.id} style={{ padding: 14, borderRadius: 16, background: '#132915' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontWeight: 700 }}>{court.name || `Court ${court.courtNumber || '•'}`}</span>
                        <span style={{ color: '#7aaa6a', fontSize: 12 }}>{court.status || 'Available'}</span>
                      </div>
                      <div style={{ color: '#c4d8b1', fontSize: 12, marginTop: 6 }}>
                        {court.surface || 'Hard court'} • {court.indoorOutdoor || 'Outdoor'} • {court.lights ? 'Lights' : 'No lights'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#7aaa6a', fontSize: 13 }}>No courts listed yet.</p>
                )}
              </div>
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
    </div>
  );
}
