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
        const data = await res.json();
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

      {/* Reputation Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Club Reputation Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Court Management</h2>
      <p className="text-gray-600">Court management and availability scheduling coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Track court availability, manage bookings, and schedule maintenance.</p>
    </div>
  );
}

function MembersTab({ orgId }: { orgId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Member Management</h2>
      <p className="text-gray-600">Member profiles, tier management, and status tracking coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Manage membership tiers, track member status, and attendance.</p>
    </div>
  );
}

function EventsTab({ orgId }: { orgId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Events & Tournaments</h2>
      <p className="text-gray-600">Event management, tournament brackets, and registration coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Create events, manage registrations, and auto-generate tournament brackets.</p>
    </div>
  );
}

function RankingsTab({ orgId }: { orgId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Player Rankings & Ladder</h2>
      <p className="text-gray-600">Weekly rankings, challenge system, and ladder updates coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Track player rankings, manage challenges, and view match history.</p>
    </div>
  );
}

function FinanceTab({ orgId }: { orgId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Reports</h2>
      <p className="text-gray-600">Revenue tracking, expense management, and financial reports coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Track membership revenue, court bookings, and generate financial reports.</p>
    </div>
  );
}

function AnnouncementsTab({ orgId }: { orgId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements & Communications</h2>
      <p className="text-gray-600">Club announcements, notifications, and messaging coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Send targeted announcements, manage reminders, and communicate with members.</p>
    </div>
  );
}
