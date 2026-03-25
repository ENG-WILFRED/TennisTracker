import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tournament } from './types';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { submitTournamentInquiry } from '@/actions/tournaments';

export function ContactModal({ t, user, onClose }: { t: Tournament; user: any; onClose: () => void }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('General Enquiry');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const inquiryRoomName = `Tournament Inquiry: ${t.name}`;

  const loadMessages = async (rid: string) => {
    setMessagesLoading(true);
    try {
      const response = await authenticatedFetch(`/api/chat/rooms/${rid}/messages?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const findExistingRoom = async () => {
    if (!user?.id) return;
    try {
      const response = await authenticatedFetch('/api/chat/rooms');
      if (!response.ok) return;
      const rooms = await response.json();
      const existing = rooms.find((room: any) => room.name === inquiryRoomName);
      if (existing) {
        setRoomId(existing.id);
        await loadMessages(existing.id);
      }
    } catch (err) {
      console.error('Error finding existing inquiry room', err);
    }
  };

  useEffect(() => {
    findExistingRoom();
  }, [t.id, user?.id]);

  const handleSend = async () => {
    if (!body.trim()) {
      setError('Please enter a message.');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to contact organizer.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await submitTournamentInquiry(t.id, `${subject}: ${body}`, user.id);
      if (result?.success) {
        setInfo('Sent to organizer. Message thread updated.');
        setBody('');
        if (result?.roomId) {
          setRoomId(result.roomId);
          await loadMessages(result.roomId);
        }
      } else {
        setError(result?.message || 'Unable to send inquiry');
      }
    } catch (err: any) {
      setError(err?.message || 'Error sending inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim()) {
      setError('Updated message cannot be empty.');
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/chat/messages/${messageId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unable to edit message' }));
        throw new Error(errorData.error || 'Unable to edit message');
      }
      setEditingMessageId(null);
      setEditText('');
      if (roomId) await loadMessages(roomId);
      setInfo('Message updated.');
    } catch (err: any) {
      setError(err?.message || 'Error updating message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
    setError(null);
  };

  const handleResend = (text: string) => {
    setBody(text);
    setInfo('Message copied to compose box. Edit and resend.');
  };

  return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[580px] max-h-[85vh] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[rgba(99,153,34,0.16)]">
          <div className="text-3xl mb-2">✉️ Organizer messages</div>
          <h3 className="text-lg font-semibold text-[#e8f8d8] mb-1">{t.organizationName || t.organization?.name}</h3>
          <p className="text-sm text-[#5a7242]">{t.organization?.email || t.organizationEmail || ''} {t.organization?.phone ? `· ${t.organization?.phone}` : ''}</p>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 240px)' }}>
          <div className="text-xs text-[#7fa169]">Tournament thread: {inquiryRoomName}</div>

          {info && <div className="text-xs text-[#a3d45e] bg-[#12270f] p-2 rounded">{info}</div>}
          {error && <div className="text-xs text-[#fca5a5] bg-[#412827] p-2 rounded">{error}</div>}

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#b8df9c] font-semibold">Status</label>
            <span className="rounded px-2 py-1 text-[11px] bg-[#1e2f1b] text-[#93ce78]">{t.applicationStatus}</span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#d2e6b3] mb-2">Conversation</h4>
            {messagesLoading ? (
              <div className="text-sm text-[#96a683]">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-[#96a683]">No messages yet. Send the first one.</div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg: any) => {
                  const mine = msg.playerId === user?.id;
                  return (
                    <div key={msg.id} className={`rounded-md p-2 ${mine ? 'bg-[#213223] text-[#d6f2be]' : 'bg-[#151f19] text-[#c5d3b6]'}`}>
                      <div className="flex justify-between items-center mb-1 text-xs text-[#879c73]">
                        <span>{mine ? 'You' : msg.playerName}</span>
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full bg-[#122415] border border-[#3a5a28] rounded p-2 text-xs"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button className="btn btn-xs btn-primary" onClick={() => handleSaveEdit(msg.id)}>Save</button>
                            <button className="btn btn-xs btn-ghost" onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm leading-relaxed">{msg.content}</div>
                          <div className="mt-1 flex gap-2 text-xs">
                            {mine && (
                              <>
                                <button className="text-[#8cc566] hover:text-[#b6e38d]" onClick={() => { setEditingMessageId(msg.id); setEditText(msg.content); }}>Edit</button>
                                <button className="text-[#b3b76b] hover:text-[#d5db91]" onClick={() => handleResend(msg.content)}>Resend</button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[rgba(99,153,34,0.15)]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Subject</label>
              <select
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)]"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                {['General Enquiry', 'Registration', 'Rules & Format', 'Prize & Payments', 'Schedule & Venues', 'Wildcard Entry', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Your message</label>
              <textarea
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] min-h-[84px] resize-none"
                value={body}
                onChange={e => setBody(e.target.value.slice(0, 1000))}
                placeholder="Write your message here…"
                rows={3}
              />
              <div className="text-xs text-[#334a22] text-right mt-1">{body.length}/1000</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-md btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !body.trim()}
                onClick={handleSend}
              >
                {loading ? '⏳ Sending…' : '📤 Send Message'}
              </button>
              <button className="btn btn-md btn-ghost" onClick={() => onClose()}>Close</button>
            </div>

            {roomId && (
              <button
                className="btn btn-sm btn-outline w-full"
                onClick={() => {
                  onClose();
                  router.push(`/chat?room=${roomId}`);
                }}
              >
                Open full conversation in chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}