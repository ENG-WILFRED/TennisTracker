"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  primaryColor?: string;
  rating?: number;
  ratingCount?: number;
  verifiedBadge?: boolean;
  activityScore?: number;
  playerDevScore?: number;
  tournamentEngScore?: number;
  _count?: {
    members?: number;
    courts?: number;
    events?: number;
  };
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'courts' | 'members' | 'events' | 'rankings' | 'finance' | 'announcements'>('dashboard');

  useEffect(() => {
    fetchOrganization();
  }, [orgId]);

  async function fetchOrganization() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}`, { requireAuth: false });
      if (res.ok) {
        const data = (await res.json()) as any;
        setOrg(data);
      } else {
        console.error('Failed to fetch organization');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading club details...</p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Club not found</h1>
          <Link href="/organization/list" className="text-blue-600 hover:underline">
            ← Back to clubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Link href="/organization/list" className="text-blue-100 hover:text-white mb-4 inline-flex items-center">
            ← Back to clubs
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-bold">{org.name}</h1>
                {org.verifiedBadge && (
                  <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <p className="text-blue-100 text-lg">{org.description}</p>
            </div>
            {org.rating && (
              <div className="text-center bg-white/10 px-6 py-4 rounded-lg backdrop-blur-sm">
                <div className="text-3xl font-bold">⭐ {org.rating.toFixed(1)}</div>
                <div className="text-sm text-blue-100">({org.ratingCount} ratings)</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'courts', label: '🎾 Courts', icon: '🎾' },
              { id: 'members', label: '👥 Members', icon: '👥' },
              { id: 'events', label: '📅 Events', icon: '📅' },
              { id: 'rankings', label: '🏆 Rankings', icon: '🏆' },
              { id: 'finance', label: '💰 Finance', icon: '💰' },
              { id: 'announcements', label: '📢 Announcements', icon: '📢' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-4 font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <DashboardTab org={org} />}
        {activeTab === 'courts' && <CourtsTab orgId={org.id} />}
        {activeTab === 'members' && <MembersTab orgId={org.id} />}
        {activeTab === 'events' && <EventsTab orgId={org.id} />}
        {activeTab === 'rankings' && <RankingsTab orgId={org.id} />}
        {activeTab === 'finance' && <FinanceTab orgId={org.id} />}
        {activeTab === 'announcements' && <AnnouncementsTab orgId={org.id} />}
      </div>
    </div>
  );
}

function DashboardTab({ org }: { org: Organization }) {
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, [org.id]);

  async function fetchRecentActivities() {
    try {
      setActivityLoading(true);
      const res = await authenticatedFetch(`/api/organization/${org.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setRecentActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivityLoading(false);
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'court_booking': return '🎾';
      case 'tournament_registration': return '🏆';
      case 'ranking_challenge': return '⚔️';
      case 'payment_made': return '💳';
      case 'member_joined': return '👥';
      case 'event_attended': return '📅';
      case 'achievement_earned': return '⭐';
      default: return '📝';
    }
  };

  const formatActivityMessage = (activity: any) => {
    const playerName = `${activity.player.firstName} ${activity.player.lastName}`;

    switch (activity.action) {
      case 'court_booking':
        return `${playerName} booked court ${activity.details.courtNumber} for ${new Date(activity.details.startTime).toLocaleDateString()} at ${new Date(activity.details.startTime).toLocaleTimeString()}`;
      case 'tournament_registration':
        return `${playerName} registered for ${activity.details.tournamentName}`;
      case 'tournament_waitlisted':
        return `${playerName} joined waitlist for ${activity.details.tournamentName} (position ${activity.details.waitlistPosition})`;
      case 'ranking_challenge':
        return `${playerName} challenged ${activity.details.opponentName} for ranking`;
      case 'payment_made':
        return `${playerName} made a payment of $${activity.details.amount}`;
      case 'member_joined':
        return `${playerName} joined the club`;
      case 'event_attended':
        return `${playerName} attended ${activity.details.eventName}`;
      case 'achievement_earned':
        return `${playerName} earned the ${activity.details.achievementName} badge`;
      default:
        return `${playerName} performed action: ${activity.action}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{org._count?.members || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Courts Available</p>
              <p className="text-3xl font-bold text-gray-900">{org._count?.courts || 0}</p>
            </div>
            <div className="text-4xl">🎾</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Events This Month</p>
              <p className="text-3xl font-bold text-gray-900">{org._count?.events || 0}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Club Rating</p>
              <p className="text-3xl font-bold text-yellow-600">{org.rating?.toFixed(1) || 'N/A'}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Activity Feed and Reputation Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          {activityLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📝</div>
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear as members interact with the club</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="text-2xl">{getActivityIcon(activity.action)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{formatActivityMessage(activity)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reputation Scores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Club Reputation Scores</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Activity Score</h3>
                <span className="text-lg font-bold text-blue-600">{org.activityScore || 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${org.activityScore || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Based on member engagement and activity</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Player Development</h3>
                <span className="text-lg font-bold text-green-600">{org.playerDevScore || 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${org.playerDevScore || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Based on tournament participation and rankings</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Tournament Engagement</h3>
                <span className="text-lg font-bold text-purple-600">{org.tournamentEngScore || 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${org.tournamentEngScore || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Based on event organization and participation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Club Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Club Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {org.address && (
            <div>
              <p className="text-gray-500 text-sm font-medium">Address</p>
              <p className="text-gray-900">{org.address}</p>
            </div>
          )}
          {org.city && (
            <div>
              <p className="text-gray-500 text-sm font-medium">Location</p>
              <p className="text-gray-900">{org.city}, {org.country}</p>
            </div>
          )}
          {org.phone && (
            <div>
              <p className="text-gray-500 text-sm font-medium">Phone</p>
              <p className="text-gray-900">{org.phone}</p>
            </div>
          )}
          {org.email && (
            <div>
              <p className="text-gray-500 text-sm font-medium">Email</p>
              <p className="text-gray-900">{org.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourtsTab({ orgId }: { orgId: string }) {
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCourts();
    fetchBookings();
  }, [orgId, selectedDate]);

  async function fetchCourts() {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts`);
      if (res.ok) {
        const data = await res.json();
        setCourts(data);
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  }

  async function fetchBookings() {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/bookings?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const getCourtBookings = (courtId: string) => {
    return bookings.filter(b => b.courtId === courtId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'occupied': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Court Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Court Management</h2>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              + Add Court
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div key={court.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{court.name}</h3>
                  <p className="text-sm text-gray-600">Court #{court.courtNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(court.status)}`}>
                  {court.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Surface:</span>
                  <span className="font-medium">{court.surface}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{court.indoorOutdoor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lights:</span>
                  <span className="font-medium">{court.lights ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2">
                  Today's Bookings: {getCourtBookings(court.id).length}
                </div>
                <div className="space-y-1">
                  {getCourtBookings(court.id).slice(0, 3).map((booking: any) => (
                    <div key={booking.id} className="text-xs bg-blue-50 px-2 py-1 rounded flex justify-between">
                      <span>{booking.startTime.split('T')[1].substring(0, 5)} - {booking.endTime.split('T')[1].substring(0, 5)}</span>
                      <span className="text-blue-600 font-medium">
                        {booking.member?.player?.user?.firstName || booking.playerName}
                      </span>
                    </div>
                  ))}
                  {getCourtBookings(court.id).length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{getCourtBookings(court.id).length - 3} more...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200">
                  Schedule
                </button>
                <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>

        {courts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎾</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Courts Yet</h3>
            <p className="text-gray-600 mb-4">Add your first court to start managing bookings</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
              Add First Court
            </button>
          </div>
        )}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings scheduled for today
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {booking.court?.courtNumber || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {booking.member?.player?.user?.firstName} {booking.member?.player?.user?.lastName || booking.playerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Court {booking.court?.name} • {booking.startTime.split('T')[1].substring(0, 5)} - {booking.endTime.split('T')[1].substring(0, 5)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">${booking.price || 0}</div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  async function fetchMembers() {
    console.log('MembersTab.fetchMembers called', { orgId });
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/members`);
      console.log('MembersTab.fetchMembers response status', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('MembersTab.fetchMembers data length', data.length);
        setMembers(data);
      } else {
        console.error('MembersTab.fetchMembers API call failed', await res.text());
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.player.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.player.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.player.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'all' || member.membershipTier?.name.toLowerCase() === tierFilter.toLowerCase();

    return matchesSearch && matchesTier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierColor = (tierName?: string) => {
    switch (tierName?.toLowerCase()) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'elite': return 'text-blue-600 bg-blue-100';
      case 'basic': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{members.length}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {members.filter(m => m.paymentStatus === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {members.filter(m => m.membershipTier?.name === 'Premium').length}
          </div>
          <div className="text-sm text-gray-600">Premium Members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {members.reduce((sum, m) => sum + m.attendanceCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Visits</div>
        </div>
      </div>

      {/* Member Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            + Invite Member
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium</option>
            <option value="elite">Elite</option>
            <option value="basic">Basic</option>
          </select>
        </div>

        {/* Member List */}
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <img
                  src={member.player.user.photo || '/default-avatar.png'}
                  alt={`${member.player.user.firstName} ${member.player.user.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {member.player.user.firstName} {member.player.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{member.player.user.email}</div>
                  <div className="text-xs text-gray-500">
                    Joined {new Date(member.joinDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTierColor(member.membershipTier?.name)}`}>
                    {member.membershipTier?.name || 'No Tier'}
                  </div>
                  <div className={`block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.paymentStatus)}`}>
                    {member.paymentStatus}
                  </div>
                </div>

                <div className="text-right text-sm text-gray-600">
                  <div>{member.attendanceCount} visits</div>
                  <div className="text-xs">
                    Last: {member.lastAttendance ? new Date(member.lastAttendance).toLocaleDateString() : 'Never'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                    View
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
            <p className="text-gray-600">
              {searchTerm || tierFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start by inviting members to join your club'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventsTab({ orgId }: { orgId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    fetchEvents();
  }, [orgId]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate || event.startDate);

    switch (filter) {
      case 'upcoming':
        return startDate > now;
      case 'ongoing':
        return startDate <= now && endDate >= now;
      case 'completed':
        return endDate < now;
      default:
        return true;
    }
  });

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate || event.startDate);

    if (startDate > now) return { status: 'upcoming', color: 'text-blue-600 bg-blue-100' };
    if (startDate <= now && endDate >= now) return { status: 'ongoing', color: 'text-green-600 bg-green-100' };
    return { status: 'completed', color: 'text-gray-600 bg-gray-100' };
  };

  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tournament': return '🏆';
      case 'clinic': return '🎾';
      case 'social': return '🎉';
      case 'training': return '💪';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {events.filter(e => new Date(e.startDate) > new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => {
              const now = new Date();
              const start = new Date(e.startDate);
              const end = new Date(e.endDate || e.startDate);
              return start <= now && end >= now;
            }).length}
          </div>
          <div className="text-sm text-gray-600">Ongoing</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {events.reduce((sum, e) => sum + (e.registrations?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Registrations</div>
        </div>
      </div>

      {/* Event Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Events & Tournaments</h2>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              + Create Event
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const { status, color } = getEventStatus(event);
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getEventTypeIcon(event.eventType)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="font-medium">
                      {new Date(event.startDate).toLocaleDateString()}
                      {event.endDate && event.endDate !== event.startDate && (
                        <> - {new Date(event.endDate).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Capacity</div>
                    <div className="font-medium">{event.registrationCap}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Registered</div>
                    <div className="font-medium">{event.registrations?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Entry Fee</div>
                    <div className="font-medium">${event.entryFee || 0}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No Events Yet' : `No ${filter} Events`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? 'Create your first event to engage with members'
                : `No events match the ${filter} filter`
              }
            </p>
            {filter === 'all' && (
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
                Create First Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RankingsTab({ orgId }: { orgId: string }) {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const weekNumber = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
    return weekNumber;
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRankings();
  }, [orgId, selectedWeek, selectedYear]);

  async function fetchRankings() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/rankings?week=${selectedWeek}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change > 0) return { change, direction: 'up', color: 'text-green-600' };
    if (change < 0) return { change: Math.abs(change), direction: 'down', color: 'text-red-600' };
    return { change: 0, direction: 'same', color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ranking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{rankings.length}</div>
          <div className="text-sm text-gray-600">Active Players</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {rankings.reduce((sum, r) => sum + r.matchesWon, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Wins</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {rankings.length > 0 ? (rankings.reduce((sum, r) => sum + r.winRate, 0) / rankings.length).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Avg Win Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {rankings.reduce((sum, r) => sum + r.ratingPoints, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Rating Points</div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Player Rankings</h2>
          <div className="flex gap-3">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Player</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Rating</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">W/L</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Win Rate</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Change</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((ranking, index) => {
                const rankChange = getRankChange(ranking.currentRank, ranking.previousRank);
                return (
                  <tr key={ranking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <span className="text-lg font-bold mr-2">{getRankIcon(ranking.currentRank)}</span>
                        <span className="font-semibold text-gray-900">{ranking.currentRank}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={ranking.member.player.user.photo || '/default-avatar.png'}
                          alt={`${ranking.member.player.user.firstName} ${ranking.member.player.user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {ranking.member.player.user.firstName} {ranking.member.player.user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ranking.matchesWon + ranking.matchesLost} matches played
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-gray-900">{ranking.ratingPoints}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-green-600 font-semibold">{ranking.matchesWon}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-semibold">{ranking.matchesLost}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-semibold ${ranking.winRate >= 60 ? 'text-green-600' : ranking.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {ranking.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {rankChange && rankChange.change !== 0 ? (
                        <div className={`flex items-center justify-center ${rankChange.color}`}>
                          {rankChange.direction === 'up' && <span>↑</span>}
                          {rankChange.direction === 'down' && <span>↓</span>}
                          <span className="ml-1 font-semibold">{rankChange.change}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-600 mb-4">
              Rankings will appear once players start competing in matches
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
              Schedule First Match
            </button>
          </div>
        )}
      </div>

      {/* Recent Challenges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Ranking Challenges</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">⚔️</div>
          <p>Challenge system coming soon</p>
          <p className="text-sm">Players will be able to challenge higher-ranked opponents</p>
        </div>
      </div>
    </div>
  );
}

function FinanceTab({ orgId }: { orgId: string }) {
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchFinances();
  }, [orgId, selectedMonth, selectedYear]);

  async function fetchFinances() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/finance?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
      }
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentFinance = finances[0] || {
    membershipRevenue: 0,
    courtBookingRevenue: 0,
    coachCommissions: 0,
    eventRevenue: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  };

  const revenueBreakdown = [
    { label: 'Membership Fees', amount: currentFinance.membershipRevenue, color: 'bg-blue-500' },
    { label: 'Court Bookings', amount: currentFinance.courtBookingRevenue, color: 'bg-green-500' },
    { label: 'Event Revenue', amount: currentFinance.eventRevenue, color: 'bg-purple-500' },
  ];

  const expenseBreakdown = [
    { label: 'Coach Commissions', amount: currentFinance.coachCommissions, color: 'bg-red-500' },
    { label: 'Other Expenses', amount: currentFinance.totalExpenses - currentFinance.coachCommissions, color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">${currentFinance.totalRevenue.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">${currentFinance.totalExpenses.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Expenses</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className={`text-2xl font-bold ${currentFinance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${currentFinance.netProfit.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Net Profit</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {((currentFinance.netProfit / currentFinance.totalRevenue) * 100 || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Profit Margin</div>
        </div>
      </div>

      {/* Financial Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Export PDF
            </button>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="space-y-3">
              {expenseBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {finances.slice(0, 3).map((finance, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(finance.year, finance.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Revenue:</span>
                    <span className="font-medium text-green-600">${finance.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expenses:</span>
                    <span className="font-medium text-red-600">${finance.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
                    <span>Net:</span>
                    <span className={finance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${finance.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">💰</div>
          <p>Transaction history coming soon</p>
          <p className="text-sm">Track all financial transactions and payments</p>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsTab({ orgId }: { orgId: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    announcementType: 'general',
    targetRoles: ['member'],
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [orgId]);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/announcements`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAnnouncement() {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement),
      });

      if (res.ok) {
        setNewAnnouncement({ title: '', message: '', announcementType: 'general', targetRoles: ['member'] });
        setShowCreateForm(false);
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  }

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'tournament': return '🏆';
      case 'maintenance': return '🔧';
      case 'event': return '📅';
      case 'important': return '⚠️';
      default: return '📢';
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'tournament': return 'border-l-blue-500 bg-blue-50';
      case 'maintenance': return 'border-l-yellow-500 bg-yellow-50';
      case 'event': return 'border-l-green-500 bg-green-50';
      case 'important': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Announcement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
          <div className="text-sm text-gray-600">Total Announcements</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {announcements.filter(a => a.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {announcements.filter(a => a.announcementType === 'tournament').length}
          </div>
          <div className="text-sm text-gray-600">Tournament Updates</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {announcements.reduce((sum, a) => sum + (a.readBy?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Reads</div>
        </div>
      </div>

      {/* Announcement Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Announcements & Communications</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : '+ Create Announcement'}
          </button>
        </div>

        {/* Create Announcement Form */}
        {showCreateForm && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newAnnouncement.announcementType}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, announcementType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="tournament">Tournament</option>
                    <option value="event">Event</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="important">Important</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles</label>
                  <select
                    multiple
                    value={newAnnouncement.targetRoles}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNewAnnouncement({...newAnnouncement, targetRoles: values});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Members</option>
                    <option value="coach">Coaches</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createAnnouncement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Announcement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className={`border-l-4 rounded-r-lg p-6 ${getAnnouncementColor(announcement.announcementType)}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getAnnouncementIcon(announcement.announcementType)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <div className="text-sm text-gray-600">
                      {new Date(announcement.createdAt).toLocaleDateString()} •
                      {announcement.isActive ? ' Active' : ' Inactive'} •
                      {announcement.readBy?.length || 0} reads
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{announcement.message}</p>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Type: {announcement.announcementType}</span>
                <span>Target: {announcement.targetRoles.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

        {announcements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first announcement to communicate with members
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Create First Announcement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
