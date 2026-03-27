import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#ef5350',
};

interface PaymentReminder {
  id: string;
  eventId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
  event: {
    name: string;
  };
}

export const PaymentRemindersWidget: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchReminders();
    }
  }, [user?.id]);

  const fetchReminders = async () => {
    if (!user?.id) return;

    try {
      const response = await authenticatedFetch(`/api/player/payment-reminders?playerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (reminderId: string) => {
    try {
      const response = await authenticatedFetch(`/api/player/payment-reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setReminders(reminders.map(r => r.id === reminderId ? { ...r, isRead: true } : r));
      }
    } catch (error) {
      console.error('Failed to mark reminder as read:', error);
    }
  };

  const unreadCount = reminders.filter(r => !r.isRead).length;

  if (loading) {
    return (
      <div style={{
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: G.muted,
      }}>
        Loading reminders...
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div style={{
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: G.muted,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>💚 All Set!</div>
        <div style={{ fontSize: 10, marginTop: 4 }}>No pending payment reminders</div>
      </div>
    );
  }

  return (
    <div style={{
      background: G.card,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: 12,
        borderBottom: `1px solid ${G.cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: G.accent,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          💰 Payment Reminders
          {unreadCount > 0 && (
            <span style={{
              background: G.red,
              color: 'white',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Reminders List */}
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {reminders.map((reminder, idx) => (
          <div
            key={reminder.id}
            style={{
              borderBottom: idx < reminders.length - 1 ? `1px solid ${G.cardBorder}` : 'none',
              padding: 12,
              background: reminder.isRead ? G.sidebar : `rgba(160, 214, 165, 0.08)`,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onClick={() => setExpandedId(expandedId === reminder.id ? null : reminder.id)}
            onMouseEnter={(e) => {
              if (!reminder.isRead && !expandedId) {
                e.currentTarget.style.background = `rgba(160, 214, 165, 0.12)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!reminder.isRead && !expandedId) {
                e.currentTarget.style.background = `rgba(160, 214, 165, 0.08)`;
              }
            }}
          >
            {/* Reminder Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: reminder.isRead ? 400 : 700,
                  color: G.text,
                  marginBottom: 4,
                }}>
                  {reminder.event.name}
                </div>
                <div style={{
                  fontSize: 10,
                  color: G.muted,
                }}>
                  {reminder.message ? reminder.message.substring(0, 60) + '...' : 'Payment required'}
                </div>
                <div style={{
                  fontSize: 9,
                  color: G.muted,
                  marginTop: 4,
                }}>
                  {new Date(reminder.sentAt).toLocaleDateString()}
                </div>
              </div>
              {!reminder.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(reminder.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: G.lime,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>

            {/* Expanded View */}
            {expandedId === reminder.id && (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${G.cardBorder}`,
                fontSize: 11,
                color: G.text,
                lineHeight: 1.5,
              }}>
                {reminder.message || 'Contact the organizer for payment details.'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: 10,
        borderTop: `1px solid ${G.cardBorder}`,
        fontSize: 10,
        color: G.muted,
        textAlign: 'center',
      }}>
        💬 Check your DM for more details
      </div>
    </div>
  );
};

export default PaymentRemindersWidget;
