"use client";

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import Link from 'next/link';

export function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/players/announcements');
      if (res.ok) {
        const data = await res.json();
        // Show only the 3 most recent
        setAnnouncements(data.slice(0, 3));
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📢 Recent Announcements</h2>
        <Link
          href="/players/announcements"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No announcements yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Register for a tournament to see announcements
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
            >
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">
                  {getAnnouncementIcon(announcement.announcementType)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {announcement.title}
                    </h3>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {formatTime(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {announcement.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/dashboard/tournaments/${announcement.event.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {announcement.event.name}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/players/announcements"
        className="block mt-6 pt-4 border-t text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        View All Announcements
      </Link>
    </div>
  );
}
