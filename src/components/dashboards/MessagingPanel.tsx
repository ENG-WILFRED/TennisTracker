'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useToast, ToastContainer } from '@/components/ui/Toast';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  read: boolean;
}

interface ChatRoom {
  id: string;
  roomId?: string;
  name: string;
  personName: string;
  personInitial: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

const Tag = ({ children, red }: { children: React.ReactNode; red?: boolean }) => (
  <span style={{
    fontSize: 9, fontWeight: 700, borderRadius: 5, padding: '3px 8px',
    background: red ? 'rgba(217,79,79,.1)' : 'rgba(121,191,62,.12)',
    border: `1px solid ${red ? 'rgba(217,79,79,.3)' : 'rgba(121,191,62,.28)'}`,
    color: red ? G.red : G.lime,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }}>
    {children}
  </span>
);

export default function MessagingPanel({ userId, userType }: { userId: string; userType: 'coach' | 'player' | 'referee' | 'admin' }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]); // Selected roles for filtering
  const [sending, setSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Map<string, boolean>>(new Map());
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomRef = useRef<ChatRoom | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isConnected, subscribe } = useChatWebSocket(userId);
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());
  const { toasts, show: showToast, remove: removeToast } = useToast();

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const updateMobile = () => {
      setIsMobile(mediaQuery.matches);
      if (!mediaQuery.matches) setIsSidebarOpen(true);
    };
    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (activeRoom) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile, activeRoom]);

  useEffect(() => {
    fetch('/api/messaging/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: userId, isOnline: true }),
    }).catch(error => {
      console.warn('⚠️', error instanceof Error ? error.message : 'Failed to update online status');
    });

    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        fetch('/api/messaging/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: userId, isOnline: false }),
        }).catch(console.warn);
      }, 5000);
    };
  }, [userId]);

  useEffect(() => {
    const loadContactsAndRooms = async () => {
      try {
        // Build roles query parameter
        const rolesQuery = roleFilter.length > 0 ? roleFilter.join(',') : '';

        // Use the new unified contacts endpoint
        const endpoint = `/api/messaging/contacts?userId=${userId}&userType=${userType}${
          rolesQuery ? `&roles=${rolesQuery}` : ''
        }`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);

        const apiData = await res.json();

        // Map API data to ChatRoom format
        const rooms: ChatRoom[] = apiData.map((contact: any) => ({
          id: contact.id,
          roomId: '',
          name: `${contact.firstName} ${contact.lastName}`,
          personName: `${contact.firstName} ${contact.lastName}`,
          personInitial: contact.firstName.charAt(0).toUpperCase(),
          online: false,
          unread: contact.unreadCount || 0,
          lastMessage: contact.lastMessageContent || 'No messages yet',
          lastMessageTime: contact.lastMessageTime
            ? new Date(contact.lastMessageTime).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : 'Never',
          messages: [],
        }));

        setChatRooms(rooms);

        // Initialize online statuses from contacts response (no additional fetches!)
        const statuses = new Map<string, boolean>();
        apiData.forEach((contact: any) => {
          statuses.set(contact.id, contact.isOnline ?? false);
        });
        setUserStatuses(statuses);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load conversations', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadContactsAndRooms();
  }, [userId, userType, roleFilter]);

  const openChatRoom = useCallback(async (room: ChatRoom) => {
    try {
      const roomRes = await fetch(
        `/api/messaging/rooms?player1Id=${userId}&player2Id=${room.id}&userType=${userType}`
      );

      if (roomRes.ok) {
        const roomData = await roomRes.json();
        const seenIds = new Set<string>();
        const uniqueMessages = roomData.messages.filter((msg: any) => {
          if (seenIds.has(msg.id)) return false;
          seenIds.add(msg.id);
          return true;
        });

        const updatedRoom: ChatRoom = { ...room, roomId: roomData.roomId, messages: uniqueMessages, unread: 0 };

        const participant = roomData.participants.find((p: any) => p.playerId === room.id);
        if (participant) {
          updatedRoom.online = participant.isOnline;
          setUserStatuses(prev => { const u = new Map(prev); u.set(room.id, participant.isOnline); return u; });
        } else {
          updatedRoom.online = roomData.participants.some((p: any) => p.playerId === room.id && p.isOnline);
        }

        setActiveRoom(updatedRoom);
        setChatRooms(prev => prev.map(r => r.id === room.id ? { ...updatedRoom, messages: uniqueMessages } : r));
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to open chat', 'error');
      setActiveRoom(room);
    }
  }, [userId, userType]);

  useEffect(() => {
    const unsubscribeMessages = subscribe('new-message', (message: any) => {
      const room = activeRoomRef.current;
      const msgData = message.data || message;
      if (!msgData || !msgData.roomId) return;

      if (room && msgData.roomId === room.roomId) {
        const newMsg: Message = {
          id: msgData.message.id,
          content: msgData.message.content,
          createdAt: msgData.message.createdAt,
          senderId: msgData.message.senderId,
          senderName: msgData.message.senderName,
          read: msgData.message.read,
        };
        setActiveRoom(prev => {
          if (!prev) return null;
          if (prev.messages.some(m => m.id === newMsg.id)) return prev;
          return { ...prev, messages: [...prev.messages, newMsg] };
        });
        setChatRooms(prev => prev.map(r => {
          if (r.roomId !== msgData.roomId) return r;
          if (r.messages.some(m => m.id === newMsg.id)) return r;
          return { ...r, messages: [...r.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: 'Just now' };
        }));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
      } else if (room?.roomId) {
        const msgToAdd = {
          id: msgData.message.id, content: msgData.message.content, createdAt: msgData.message.createdAt,
          senderId: msgData.message.senderId, senderName: msgData.message.senderName, read: msgData.message.read,
        };
        setChatRooms(prev => prev.map(r => {
          if (r.roomId !== msgData.roomId || r.id === room.id) return r;
          if (r.messages.some(m => m.id === msgToAdd.id)) return r;
          return { ...r, messages: [...r.messages, msgToAdd], lastMessage: msgToAdd.content, lastMessageTime: 'Just now', unread: r.unread + 1 };
        }));
      }
    });

    const unsubscribeStatus = subscribe('user-status', (event: any) => {
      const statusData = event.data || event;
      if (!statusData || !statusData.userId) return;
      setUserStatuses(prev => { const u = new Map(prev); u.set(statusData.userId, statusData.isOnline); return u; });
      const room = activeRoomRef.current;
      if (room && room.id === statusData.userId) setActiveRoom(prev => prev ? { ...prev, online: statusData.isOnline } : null);
      setChatRooms(prev => prev.map(r => r.id === statusData.userId ? { ...r, online: statusData.isOnline } : r));
    });

    unsubscribesRef.current.set('messages', unsubscribeMessages);
    unsubscribesRef.current.set('status', unsubscribeStatus);
    return () => { unsubscribeMessages(); unsubscribeStatus(); unsubscribesRef.current.clear(); };
  }, [subscribe]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeRoom || !activeRoom.roomId) return;
    setSending(true);
    const content = messageInput.trim();
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderId: userId, roomId: activeRoom.roomId }),
      });

      if (res.ok) {
        const sentMessage = await res.json();
        const newMsg: Message = {
          id: sentMessage.id, content: sentMessage.content, createdAt: sentMessage.createdAt,
          senderId: sentMessage.senderId, senderName: 'You', read: sentMessage.read,
        };
        setActiveRoom(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
        setChatRooms(prev => prev.map(r =>
          r.id === activeRoom.id
            ? { ...r, messages: [...r.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: 'Just now' }
            : r
        ));
        setMessageInput('');
        if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData?.error || `Failed to send message (${res.status})`, 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // Helper function to get date-only for comparison (ignores time)
  const getDateOnly = (date: Date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const filteredRooms = chatRooms.filter(r =>
    r.personName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chatRooms.reduce((a, r) => a + r.unread, 0);
  const onlineCount = Array.from(userStatuses.values()).filter(Boolean).length;
  const shouldShowSidebar = !isMobile || isSidebarOpen || !activeRoom;
  const shouldShowChatArea = Boolean(activeRoom && (!isMobile || !isSidebarOpen));
  const activeChat = shouldShowChatArea ? activeRoom : null;

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (msgDate.getTime() === today.getTime()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (now.getTime() - date.getTime() < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getDeliveryTicks = (msg: Message) => {
    if (msg.read) return <span style={{ color: G.blue, fontWeight: 800, fontSize: 9 }}>✓✓</span>;
    return <span style={{ color: G.muted, fontWeight: 800, fontSize: 9 }}>✓</span>;
  };

  const cardBase: React.CSSProperties = {
    background: G.card,
    border: `1px solid ${G.border}`,
    borderRadius: 16,
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={{ ...cardBase, padding: 40, textAlign: 'center', color: G.muted, fontSize: 12 }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100vh', borderRadius: 16, overflow: 'hidden', border: `1px solid ${G.border}` }}>

      {/* Top Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', background: G.sidebar, borderBottom: `1px solid ${G.border}`,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: G.text, letterSpacing: -0.2 }}>💬 Messages</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>
            {userType === 'coach' ? 'Chat with your players' : userType === 'admin' ? 'Send messages to staff and members' : 'Chat with your coaches'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              style={{
                padding: '8px 12px', borderRadius: 10, border: `1px solid ${G.border}`,
                background: G.dark, color: G.text, cursor: 'pointer', fontSize: 11,
              }}
            >
              {isSidebarOpen ? 'Hide chats' : 'Show chats'}
            </button>
          )}
          {totalUnread > 0 && <Tag red>{totalUnread} unread</Tag>}
          <Tag>🟢 {onlineCount}/{chatRooms.length} online</Tag>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: shouldShowSidebar && shouldShowChatArea ? '280px 1fr' : '1fr',
        flex: 1,
        minHeight: 0,
      }}>

        {/* Sidebar */}
        {shouldShowSidebar && (
          <div style={{
            background: G.sidebar,
            borderRight: shouldShowSidebar && shouldShowChatArea ? `1px solid ${G.border}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>

        {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${G.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: G.muted2, marginBottom: 10, opacity: 0.7 }}>
              Conversations
            </div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: G.muted, pointerEvents: 'none' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={userType === 'coach' ? 'Search players...' : userType === 'admin' ? 'Search staff...' : 'Search coaches...'}
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  background: G.dark, border: `1px solid ${G.border}`,
                  borderRadius: 8, color: G.text, fontSize: 12, outline: 'none',
                  boxSizing: 'border-box', transition: 'border .15s',
                }}
                onFocus={e => (e.target.style.borderColor = G.border2)}
                onBlur={e => (e.target.style.borderColor = G.border)}
              />
            </div>

            {/* Role Filter */}
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: G.muted2, marginBottom: 6, opacity: 0.7 }}>
              Filter by role
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['coach', 'player', 'referee', 'admin'].map((role) => {
                const isSelected = roleFilter.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setRoleFilter(prev =>
                        prev.includes(role)
                          ? prev.filter(r => r !== role)
                          : [...prev, role]
                      );
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      border: `1px solid ${isSelected ? G.lime : G.border}`,
                      background: isSelected ? 'rgba(121,191,62,.12)' : 'transparent',
                      color: isSelected ? G.lime : G.muted2,
                      cursor: 'pointer',
                      transition: 'all .12s',
                      textTransform: 'capitalize',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = G.border2;
                        (e.currentTarget as HTMLButtonElement).style.color = G.text2;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = G.border;
                        (e.currentTarget as HTMLButtonElement).style.color = G.muted2;
                      }
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            scrollbarColor: `${G.lime} ${G.card}`,
            scrollbarWidth: 'thin',
          }}>
            {filteredRooms.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: G.muted, fontSize: 11 }}>
                No {userType === 'coach' ? 'players' : userType === 'admin' ? 'staff' : 'coaches'} found
              </div>
            ) : (
              filteredRooms.map(room => {
                const isActive = activeRoom?.id === room.id;
                const isOnline = userStatuses.get(room.id) || false;
                return (
                  <div
                    key={room.id}
                    onClick={() => openChatRoom(room)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: '11px 16px', cursor: 'pointer',
                      borderBottom: `1px solid rgba(36,62,36,.4)`,
                      background: isActive ? G.card2 : 'transparent',
                      borderLeft: `2px solid ${isActive ? G.lime : 'transparent'}`,
                      transition: 'all .12s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = G.card; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: G.mid, border: `1.5px solid ${isActive ? G.lime : G.border2}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: G.lime,
                      }}>
                        {room.personInitial}
                      </div>
                      {isOnline && (
                        <div style={{
                          position: 'absolute', bottom: 1, right: 1,
                          width: 9, height: 9, background: '#4cd964',
                          borderRadius: '50%', border: `2px solid ${G.sidebar}`,
                        }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {room.personName}
                        </span>
                        <span style={{ fontSize: 9, color: G.muted, flexShrink: 0, marginLeft: 4 }}>{room.lastMessageTime}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: G.muted2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.lastMessage}
                      </div>
                    </div>

                    {room.unread > 0 && (
                      <div style={{
                        background: G.lime, color: '#0a180a',
                        fontSize: 8, fontWeight: 800, borderRadius: 9,
                        padding: '2px 6px', flexShrink: 0,
                      }}>
                        {room.unread}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${G.border}`,
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: G.bright, border: `1.5px solid ${G.lime}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: G.lime2,
            }}>
              {userType === 'coach' ? 'C' : userType === 'admin' ? 'A' : 'P'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.text }}>
                {userType === 'coach' ? 'Coach' : userType === 'admin' ? 'Admin' : 'Player'}
              </div>
              <div style={{ fontSize: 9, color: G.muted2 }}>
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: 'rgba(76,217,100,.12)', border: '1px solid rgba(76,217,100,.3)', color: '#4cd964',
            }}>
              ● Active
            </span>
          </div>
        </div>
        )}

        {/* Chat Area */}
        {activeRoom && shouldShowChatArea ? (
          <div style={{ background: G.dark, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

            {/* Chat Header */}
            <div style={{
              padding: '14px 18px', borderBottom: `1px solid ${G.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: G.sidebar, flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: G.mid, border: `1.5px solid ${G.lime}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: G.lime,
                  }}>
                    {activeChat?.personInitial}
                  </div>
                  {activeChat && userStatuses.get(activeChat.id) && (
                    <div style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 8, height: 8, background: '#4cd964',
                      borderRadius: '50%', border: `2px solid ${G.sidebar}`,
                    }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: G.text }}>{activeChat?.personName}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: activeChat && userStatuses.get(activeChat.id) ? '#4cd964' : G.muted }}>
                    {activeChat && userStatuses.get(activeChat.id) ? '● Online' : '○ Offline'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Action icon buttons */}
                {['📞', '📋'].map(icon => (
                  <button key={icon} style={{
                    background: 'none', border: `1px solid ${G.border}`, borderRadius: 7,
                    padding: '6px 9px', color: G.muted2, cursor: 'pointer', fontSize: 13,
                    transition: 'all .12s',
                  }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = G.lime; b.style.color = G.lime; b.style.background = 'rgba(121,191,62,.08)'; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = G.border; b.style.color = G.muted2; b.style.background = 'none'; }}
                  >
                    {icon}
                  </button>
                ))}
                {isMobile && (
                  <button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    style={{
                      background: G.dark, border: `1px solid ${G.border}`, borderRadius: 7,
                      padding: '8px 11px', color: G.text, cursor: 'pointer', fontSize: 12,
                      transition: 'all .12s',
                    }}
                  >
                    {isSidebarOpen ? 'Hide list' : 'Room list'}
                  </button>
                )}
                <button
                  onClick={() => setActiveRoom(null)}
                  style={{
                    background: 'none', border: 'none', color: G.muted, cursor: 'pointer',
                    fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 6,
                    transition: 'color .12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = G.red; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = G.muted; }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px 18px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              minHeight: 0,
              scrollbarColor: `${G.lime} ${G.card}`,
              scrollbarWidth: 'thin',
            }}>
              {activeChat?.messages && activeChat.messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: G.muted }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: G.card2, border: `1px solid ${G.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>👋</div>
                  <div style={{ fontSize: 12, color: G.muted2, textAlign: 'center' }}>
                    Start the conversation with {activeChat?.personName}
                  </div>
                </div>
              ) : (
                activeChat!.messages
                  .reduce((acc: Message[], msg) => {
                    if (!acc.some(m => m.id === msg.id)) acc.push(msg);
                    return acc;
                  }, [])
                  .map((msg, idx, arr) => {
                    const isMe = msg.senderId === userId;
                    const msgDate = new Date(msg.createdAt);
                    const prevMsg = idx > 0 ? arr[idx - 1] : null;
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                    // Show separator only when the DATE changes (day/month/year), not just time
                    const showDateSeparator = !prevDate || getDateOnly(prevDate).getTime() !== getDateOnly(msgDate).getTime();

                    return (
                      <div key={msg.id}>
                        {showDateSeparator && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
                            <div style={{ flex: 1, height: 1, background: G.border }} />
                            <div style={{ fontSize: 9, color: G.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {formatMessageTime(msgDate)}
                            </div>
                            <div style={{ flex: 1, height: 1, background: G.border }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', marginBottom: 4 }}>
                          {!isMe && (
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: G.mid, border: `1px solid ${G.border2}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800, color: G.lime, flexShrink: 0, marginRight: 8,
                            }}>
                              {activeChat?.personInitial}
                            </div>
                          )}
                          <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ fontSize: 9, color: G.muted2, marginBottom: 3, fontWeight: 600 }}>
                              {isMe ? 'You' : activeChat?.personName}
                            </div>
                            <div style={{
                              padding: '9px 13px',
                              borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                              background: isMe ? G.lime : G.card2,
                              color: isMe ? '#0a180a' : G.text,
                              fontSize: 11.5, lineHeight: 1.55,
                              border: `1px solid ${isMe ? 'rgba(121,191,62,.4)' : G.border}`,
                              wordBreak: 'break-word',
                              fontWeight: isMe ? 500 : 400,
                            }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: 8.5, color: G.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span>{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && getDeliveryTicks(msg)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${G.border}`, background: G.sidebar, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={e => { setMessageInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activeChat?.personName ?? ''}...`}
                  rows={1}
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: G.dark, border: `1px solid ${G.border}`,
                    borderRadius: 10, color: G.text, fontSize: 12, outline: 'none',
                    resize: 'none', lineHeight: 1.4, fontFamily: 'inherit',
                    boxSizing: 'border-box', transition: 'border .15s', overflow: 'hidden',
                  }}
                  onFocus={e => (e.target.style.borderColor = G.border2)}
                  onBlur={e => (e.target.style.borderColor = G.border)}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !messageInput.trim() || !activeRoom?.roomId}
                  style={{
                    padding: '10px 16px',
                    background: sending || !messageInput.trim() ? G.muted : G.lime,
                    color: '#0a180a', border: 'none', borderRadius: 10,
                    fontWeight: 800, fontSize: 12, cursor: sending || !messageInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: sending || !messageInput.trim() ? 0.5 : 1,
                    flexShrink: 0, transition: 'all .12s',
                  }}
                >
                  {sending ? 'Sending...' : 'Send ↑'}
                </button>
              </div>
            </div>
          </div>
        ) : activeRoom ? null : (
          <div style={{
            background: G.dark,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, color: G.muted,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: G.card2, border: `1px solid ${G.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>💬</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, color: G.muted2, marginBottom: 4 }}>Select a conversation</div>
              <div style={{ fontSize: 10.5, color: G.muted }}>Choose a {userType === 'coach' ? 'player' : userType === 'admin' ? 'staff member' : 'coach'} to start messaging</div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}