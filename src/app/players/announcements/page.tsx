"use client";

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import Link from 'next/link';

export default function PlayerAnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/players/announcements');
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

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'schedule': return '📅';
      case 'results': return '🏆';
      case 'important': return '⚠️';
      default: return '📢';
    }
  };

  const filteredAnnouncements = announcements;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tournament Announcements</h1>
        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({announcements.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">Loading announcements...</div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
          <p className="text-gray-600">
            Register for a tournament to see announcements from organizers
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex gap-4">
                <div className="text-3xl">{getAnnouncementIcon(announcement.announcementType)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatTime(announcement.createdAt)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 leading-relaxed">{announcement.message}</p>

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/dashboard/tournaments/${announcement.event.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {announcement.event.name} →
                    </Link>
                    <span className="text-xs text-gray-500">
                      {announcement.announcementType === 'schedule' && '📅 Schedule Update'}
                      {announcement.announcementType === 'results' && '🏆 Results'}
                      {announcement.announcementType === 'important' && '⚠️ Important'}
                      {!['schedule', 'results', 'important'].includes(
                        announcement.announcementType
                      ) && 'General'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
