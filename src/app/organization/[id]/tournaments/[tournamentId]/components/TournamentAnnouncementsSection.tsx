"use client";

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface TournamentAnnouncementsSectionProps {
  tournament: any;
}

export function TournamentAnnouncementsSection({ tournament }: TournamentAnnouncementsSectionProps) {
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, [tournament?.id]);

  async function fetchAnnouncements() {
    if (!tournament?.id) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/tournaments/${tournament.id}/announcements`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      setError('Title and message are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await authenticatedFetch(`/api/tournaments/${tournament.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          announcementType: 'general',
          isPublished: true,
        }),
      });

      if (res.ok) {
        setNewAnnouncement({ title: '', message: '' });
        await fetchAnnouncements();
      } else {
        setError('Failed to publish announcement');
      }
    } catch (err) {
      console.error('Error publishing announcement:', err);
      setError('Failed to publish announcement');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(announcementId: string) {
    try {
      const res = await authenticatedFetch(
        `/api/tournaments/${tournament.id}/announcements/${announcementId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
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

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          background: 'rgba(224, 80, 80, 0.15)',
          border: '1px solid rgba(224, 80, 80, 0.3)',
          borderRadius: '8px',
          color: '#e05050',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Compose */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>📣 New Announcement</h3>

        <div style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
            Title
            <input
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title..."
              disabled={isSubmitting}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(125,193,66,0.28)',
                background: 'rgba(10,20,10,0.7)',
                color: '#e8f5e0',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box' as const,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
            Message
            <textarea
              value={newAnnouncement.message}
              onChange={e => setNewAnnouncement(p => ({ ...p, message: e.target.value }))}
              rows={4}
              placeholder="Write your announcement..."
              disabled={isSubmitting}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(125,193,66,0.28)',
                background: 'rgba(10,20,10,0.7)',
                color: '#e8f5e0',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box' as const,
                resize: 'vertical' as const,
                fontFamily: 'inherit',
              }}
            />
          </label>

          <button
            onClick={handlePublish}
            disabled={isSubmitting || !newAnnouncement.title || !newAnnouncement.message}
            style={{
              padding: '10px 24px',
              background: isSubmitting || !newAnnouncement.title || !newAnnouncement.message
                ? 'rgba(125, 193, 66, 0.4)'
                : 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting || !newAnnouncement.title || !newAnnouncement.message ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '.04em',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'opacity .2s, transform .1s',
            }}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>📋 Published ({announcements.length})</h3>

        {loading ? (
          <div style={{ color: '#7a9c6a', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ color: '#7a9c6a', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            No announcements yet
          </div>
        ) : (
          <div>
            {announcements.map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'rgba(12,24,12,0.6)',
                  border: '1px solid rgba(125,193,66,0.12)',
                  marginBottom: '10px',
                }}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: '5px',
                  background: a.announcementType === 'schedule' ? '#f0c040' : a.announcementType === 'results' ? '#40d090' : '#7dc142',
                  boxShadow: a.announcementType === 'schedule' ? '0 0 8px rgba(240,192,64,.5)' : a.announcementType === 'results' ? '0 0 8px rgba(64,208,144,.5)' : '0 0 8px rgba(125,193,66,.5)',
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14, marginBottom: 4 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#7a9c6a', lineHeight: 1.5 }}>
                    {a.message}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 6 }}>
                    {formatTime(a.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(a.id)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '5px 12px',
                    background: 'rgba(224,80,80,0.15)',
                    color: '#e05050',
                    border: '1px solid rgba(224,80,80,0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background .2s',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
