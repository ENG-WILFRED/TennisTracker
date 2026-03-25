"use client";

import React, { useState } from 'react';

interface TournamentAnnouncementsSectionProps {
  tournament: any;
}

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Schedule Update', body: 'Quarter-final matches on Court A have been moved 30 minutes earlier. Please check the updated schedule.', time: '2h ago', type: 'warning' },
  { id: 'a2', title: 'Welcome Players!', body: 'We are thrilled to welcome all participants to the tournament. Registration check-in opens at 8 AM on July 10th.', time: '1d ago', type: 'info' },
  { id: 'a3', title: 'Prize Pool Increased', body: 'Thanks to our new sponsors, the total prize pool has been raised to $15,000. Good luck to all competitors!', time: '3d ago', type: 'success' },
];

export function TournamentAnnouncementsSection({ tournament }: TournamentAnnouncementsSectionProps) {
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '' });
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);

  return (
    <div>
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
              value={newAnnouncement.body}
              onChange={e => setNewAnnouncement(p => ({ ...p, body: e.target.value }))}
              rows={4}
              placeholder="Write your announcement..."
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
            onClick={() => {
              if (!newAnnouncement.title || !newAnnouncement.body) return;
              setAnnouncements(prev => [{
                id: Date.now().toString(),
                title: newAnnouncement.title,
                body: newAnnouncement.body,
                time: 'just now',
                type: 'info',
              }, ...prev]);
              setNewAnnouncement({ title: '', body: '' });
            }}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '.04em',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'opacity .2s, transform .1s',
            }}
          >
            Publish Announcement
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
        }}>📋 Published</h3>

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
                background: a.type === 'info' ? '#7dc142' : a.type === 'warning' ? '#f0c040' : '#40d090',
                boxShadow: a.type === 'info' ? '0 0 8px rgba(125,193,66,.5)' : a.type === 'warning' ? '0 0 8px rgba(240,192,64,.5)' : '0 0 8px rgba(64,208,144,.5)',
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14, marginBottom: 4 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 13, color: '#7a9c6a', lineHeight: 1.5 }}>
                  {a.body}
                </div>
                <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 6 }}>
                  {a.time}
                </div>
              </div>

              <button
                onClick={() => setAnnouncements(p => p.filter(x => x.id !== a.id))}
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
      </div>
    </div>
  );
}
