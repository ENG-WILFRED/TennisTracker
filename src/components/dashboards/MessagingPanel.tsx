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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const Tag = ({ children, red }: { children: React.ReactNode; red?: boolean }) => (
  <span style={{
    fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px',
    background: red ? 'rgba(217,79,79,.1)' : 'rgba(121,191,62,.12)',
    border: `1px solid ${red ? 'rgba(217,79,79,.3)' : 'rgba(121,191,62,.28)'}`,
    color: red ? G.red : G.lime,
    display: 'inline-block',
  }}>
    {children}
  </span>
);

export default function MessagingPanel({ userId, userType }: { userId: string; userType: 'coach' | 'player' }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Map<string, boolean>>(new Map());
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomRef = useRef<ChatRoom | null>(null);
  const { isConnected, subscribe } = useChatWebSocket(userId);
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());
  const { toasts, show: showToast, remove: removeToast } = useToast();

  // Keep ref in sync with state
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Track online status when component mounts and unmounts
  useEffect(() => {
    // Mark as online
    fetch('/api/messaging/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: userId,
        isOnline: true,
      }),
    }).catch(error => {
      const msg = error instanceof Error ? error.message : 'Failed to update online status';
      console.warn('⚠️', msg);
    });

    // Cleanup: mark as offline after a delay
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        fetch('/api/messaging/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: userId,
            isOnline: false,
          }),
        }).catch(error => {
          const msg = error instanceof Error ? error.message : 'Failed to update offline status';
          console.warn('⚠️', msg);
        });
      }, 5000);
    };
  }, [userId]);

  // Load contact list and create initial chat rooms
  useEffect(() => {
    const loadContactsAndRooms = async () => {
      try {
        let endpoint = '';
        let apiData: any[] = [];

        if (userType === 'coach') {
          endpoint = `/api/coaches/players?coachId=${userId}`;
        } else if (userType === 'player') {
          endpoint = `/api/players/coaches?playerId=${userId}`;
        }

        if (endpoint) {
          const res = await fetch(endpoint);
          if (res.ok) {
            apiData = await res.json();
          }
        }

        console.log(`📨 MessagingPanel (${userType}):`, apiData.length, 'contacts');

        // Transform contacts into chat rooms
        const rooms: ChatRoom[] = apiData.map((rel: any) => {
          let firstName, lastName, personId;

          if (userType === 'coach') {
            firstName = rel.player?.user?.firstName || 'Unknown';
            lastName = rel.player?.user?.lastName || '';
            personId = rel.playerId;
          } else {
            firstName = rel.coach?.user?.firstName || 'Unknown';
            lastName = rel.coach?.user?.lastName || '';
            personId = rel.coachId;
          }

          const personInitial = firstName.charAt(0).toUpperCase();

          return {
            id: personId,
            roomId: '', // Will be set when opening the room
            name: `${firstName} ${lastName}`,
            personName: `${firstName} ${lastName}`,
            personInitial,
            online: false,
            unread: 0,
            lastMessage: 'No messages yet',
            lastMessageTime: 'Never',
            messages: [],
          };
        });

        setChatRooms(rooms);

        // Fetch online status for each contact - with better error handling
        const statuses = new Map<string, boolean>();
        for (const contact of apiData) {
          const personId = userType === 'coach' ? contact.playerId : contact.coachId;
          try {
            const statusRes = await fetch(`/api/messaging/status?playerId=${personId}`, {
              signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              console.log(`📊 Status for ${personId}: ${statusData.isOnline ? '🟢 online' : '⚫ offline'}`);
              statuses.set(personId, statusData.isOnline);
            } else {
              console.warn(`⚠️ Failed to fetch status for ${personId}: ${statusRes.status}`);
              statuses.set(personId, false);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fetch status for ${personId}:`, error instanceof Error ? error.message : error);
            statuses.set(personId, false);
          }
        }
        console.log(`📊 Loaded online status for ${statuses.size} contacts`);
        setUserStatuses(statuses);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to load conversations';
        console.error('Error loading contacts:', msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadContactsAndRooms();
    }
  }, [userId, userType]);

  // Load message history when a room is selected
  const openChatRoom = useCallback(
    async (room: ChatRoom) => {
      try {
        // Create or get chat room
        const roomRes = await fetch(
          `/api/messaging/rooms?player1Id=${userId}&player2Id=${room.id}&userType=${userType}`
        );

        if (roomRes.ok) {
          const roomData = await roomRes.json();
          
          // Deduplicate messages by ID
          const seenIds = new Set<string>();
          const uniqueMessages = roomData.messages.filter((msg: any) => {
            if (seenIds.has(msg.id)) {
              console.warn('⚠️ Duplicate message ID:', msg.id);
              return false;
            }
            seenIds.add(msg.id);
            return true;
          });
          
          // Update the room with deduplicated messages and room ID
          const updatedRoom: ChatRoom = {
            ...room,
            roomId: roomData.roomId,
            messages: uniqueMessages,
            unread: 0,
          };

          // Update online status from participants
          const participant = roomData.participants.find((p: any) => p.playerId === room.id);
          if (participant) {
            updatedRoom.online = participant.isOnline;
            // Also update the userStatuses map with fresh data from the room
            setUserStatuses(prev => {
              const updated = new Map(prev);
              updated.set(room.id, participant.isOnline);
              console.log(`📊 Updated ${room.id} status from room: ${participant.isOnline ? '🟢 online' : '⚫ offline'}`);
              return updated;
            });
          } else {
            const isOnline = roomData.participants.some(
              (p: any) => p.playerId === room.id && p.isOnline
            );
            updatedRoom.online = isOnline;
          }

          setActiveRoom(updatedRoom);
          
          // Update chatRooms to reflect the opened room
          setChatRooms(prev =>
            prev.map(r =>
              r.id === room.id
                ? { ...updatedRoom, messages: uniqueMessages }
                : r
            )
          );

          console.log(`✅ Opened chat room ${roomData.roomId} with ${uniqueMessages.length} messages (${roomData.messages.length - uniqueMessages.length} duplicates removed)`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to open chat';
        console.error('Error opening chat room:', msg);
        showToast(msg, 'error');
        setActiveRoom(room);
      }
    },
    [userId, userType]
  );

  // Subscribe to new messages via WebSocket
  useEffect(() => {
    const unsubscribeMessages = subscribe('new-message', (message: any) => {
      const room = activeRoomRef.current;
      
      // Unwrap data field if it exists (from WebSocket server format)
      const msgData = message.data || message;
      
      if (!msgData || !msgData.roomId) {
        console.warn('💬 Invalid message format from WebSocket:', message);
        return;
      }

      console.log('💬 New message via WebSocket for room:', msgData.roomId, 'Active room:', room?.roomId);
      
      // Check if message is for the current active room
      if (room && msgData.roomId === room.roomId) {
        const newMsg: Message = {
          id: msgData.message.id,
          content: msgData.message.content,
          createdAt: msgData.message.createdAt,
          senderId: msgData.message.senderId,
          senderName: msgData.message.senderName,
          read: msgData.message.read,
        };

        console.log('✅ Adding message to active room:', newMsg.senderName, newMsg.content.substring(0, 50));

        // Deduplicate - don't add if message already exists
        setActiveRoom(prev => {
          if (!prev) return null;
          const messageExists = prev.messages.some(m => m.id === newMsg.id);
          if (messageExists) {
            console.log('⚠️ Message already exists, skipping duplicate');
            return prev;
          }
          return { ...prev, messages: [...prev.messages, newMsg] };
        });
        
        // Also update the room in the list
        setChatRooms(prev =>
          prev.map(r => {
            if (r.roomId !== msgData.roomId) return r;
            // Check if message already exists in this room
            const messageExists = r.messages.some(m => m.id === newMsg.id);
            if (messageExists) return r;
            return {
              ...r,
              messages: [...r.messages, newMsg],
              lastMessage: newMsg.content,
              lastMessageTime: 'Just now',
            };
          })
        );

        // Scroll to bottom of messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      } else if (room?.roomId) {
        console.log('💭 Message for different room, updating list only');
        // Message for a different room - update list
        const msgToAdd = {
          id: msgData.message.id,
          content: msgData.message.content,
          createdAt: msgData.message.createdAt,
          senderId: msgData.message.senderId,
          senderName: msgData.message.senderName,
          read: msgData.message.read,
        };
        
        setChatRooms(prev =>
          prev.map(r => {
            if (r.roomId !== msgData.roomId || r.id === room.id) return r;
            // Check if message already exists
            const messageExists = r.messages.some(m => m.id === msgToAdd.id);
            if (messageExists) return r;
            return {
              ...r,
              messages: [...r.messages, msgToAdd],
              lastMessage: msgToAdd.content,
              lastMessageTime: 'Just now',
              unread: r.unread + 1,
            };
          })
        );
      }
    });

    const unsubscribeStatus = subscribe('user-status', (event: any) => {
      // Unwrap data field if it exists (from WebSocket server format)
      const statusData = event.data || event;
      
      if (!statusData || !statusData.userId) {
        console.warn('📡 Invalid status update from WebSocket');
        return;
      }

      console.log('📡 User status update via WebSocket:', statusData.userId, statusData.isOnline ? '🟢 online' : '⚫ offline');
      
      // Update user online status in the map
      setUserStatuses(prev => {
        const updated = new Map(prev);
        updated.set(statusData.userId, statusData.isOnline);
        const onlineCount = Array.from(updated.entries()).filter(([_, online]) => online).length;
        console.log(`📊 Online count now: ${onlineCount}/${updated.size} users online`);
        return updated;
      });

      // Update active room if it's the other participant
      const room = activeRoomRef.current;
      if (room && room.id === statusData.userId) {
        console.log('🎯 Updating active room online status');
        setActiveRoom(prev => prev ? { ...prev, online: statusData.isOnline } : null);
      }

      // Update chat rooms list
      setChatRooms(prev =>
        prev.map(r =>
          r.id === statusData.userId ? { ...r, online: statusData.isOnline } : r
        )
      );
    });

    unsubscribesRef.current.set('messages', unsubscribeMessages);
    unsubscribesRef.current.set('status', unsubscribeStatus);

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribesRef.current.clear();
    };
  }, [subscribe]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeRoom || !activeRoom.roomId) return;

    setSending(true);
    const content = messageInput.trim();

    try {
      // Send message to API
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderId: userId,
          roomId: activeRoom.roomId,
        }),
      });

      if (res.ok) {
        const sentMessage = await res.json();
        console.log(`✅ Message sent to ${activeRoom.personName}`);

        // Add message to active room
        const newMsg: Message = {
          id: sentMessage.id,
          content: sentMessage.content,
          createdAt: sentMessage.createdAt,
          senderId: sentMessage.senderId,
          senderName: 'You',
          read: sentMessage.read,
        };

        setActiveRoom(prev =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
        );

        setChatRooms(prev =>
          prev.map(r =>
            r.id === activeRoom.id
              ? {
                  ...r,
                  messages: [...r.messages, newMsg],
                  lastMessage: newMsg.content,
                  lastMessageTime: 'Just now',
                }
              : r
          )
        );

        setMessageInput('');
        showToast('Message sent', 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error || `Failed to send message (${res.status})`;
        console.error('Failed to send message:', errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error sending message';
      console.error('Error sending message:', msg);
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredRooms = chatRooms.filter(r =>
    r.personName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chatRooms.reduce((a, r) => a + r.unread, 0);
  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;

  if (loading)
    return <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted }}>Loading messages...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>💬 Messages</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>
            {userType === 'coach' ? 'Chat with your players' : 'Chat with your coaches'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {totalUnread > 0 && <Tag red>{totalUnread} unread</Tag>}
          <Tag>
            🟢 {Array.from(userStatuses.values()).filter(Boolean).length}/{chatRooms.length} online
          </Tag>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 11, minHeight: 500 }}>
        {/* Left: Conversations List */}
        <div style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 10px', borderBottom: `1px solid ${G.border}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: G.muted }}>
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={userType === 'coach' ? 'Search players...' : 'Search coaches...'}
                style={{
                  width: '100%',
                  padding: '7px 9px 7px 28px',
                  borderRadius: 7,
                  background: G.dark,
                  border: `1px solid ${G.border}`,
                  color: G.text,
                  fontSize: 11,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Room List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRooms.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: G.muted, fontSize: 11 }}>
                No {userType === 'coach' ? 'players' : 'coaches'} found
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 13px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${G.border}`,
                      background: isActive ? G.card2 : 'transparent',
                      borderLeft: isActive ? `2px solid ${G.lime}` : '2px solid transparent',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = G.card2;
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: G.mid,
                          border: `1.5px solid ${G.border2}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 800,
                          color: G.lime,
                        }}
                      >
                        {room.personInitial}
                      </div>
                      {isOnline && (
                        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, background: '#4cd964', borderRadius: '50%', border: `1.5px solid ${G.card}` }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: G.text }}>{room.personName}</span>
                        <span style={{ fontSize: 9, color: G.muted }}>{room.lastMessageTime}</span>
                      </div>
                      <div style={{ fontSize: 10, color: G.muted2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.lastMessage}
                      </div>
                    </div>
                    {room.unread > 0 && (
                      <div
                        style={{
                          background: G.lime,
                          color: '#0a180a',
                          fontSize: 8,
                          fontWeight: 800,
                          borderRadius: 9,
                          padding: '2px 6px',
                          flexShrink: 0,
                        }}
                      >
                        {room.unread}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Chat View */}
        {activeRoom ? (
          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, paddingBottom: 11, borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: G.mid,
                    border: `1.5px solid ${G.border2}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    color: G.lime,
                  }}
                >
                  {activeRoom.personInitial}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{activeRoom.personName}</div>
                  <div style={{ fontSize: 9, color: G.muted }}>
                    {userStatuses.get(activeRoom.id) ? '🟢 Online' : '⚫ Offline'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveRoom(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: G.lime,
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: 11,
                padding: 11,
                background: G.dark,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {activeRoom.messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: G.muted, fontSize: 11 }}>No messages yet. Start the conversation!</div>
              ) : (
                // Extra safety: deduplicate by ID before rendering
                activeRoom.messages
                  .reduce((acc: Message[], msg) => {
                    if (!acc.some(m => m.id === msg.id)) {
                      acc.push(msg);
                    }
                    return acc;
                  }, [])
                  .map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 9, color: G.muted2, fontWeight: 700 }}>{msg.senderName}</div>
                      <div style={{ fontSize: 11, color: G.text2, lineHeight: 1.4, background: G.card2, padding: '8px 10px', borderRadius: 6 }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 8, color: G.muted }}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: G.dark,
                  border: `1px solid ${G.border}`,
                  color: G.text,
                  borderRadius: 7,
                  fontSize: 11,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !messageInput.trim() || !activeRoom?.roomId}
                style={{
                  background: sending || !messageInput.trim() ? G.muted : G.lime,
                  color: '#0a180a',
                  border: 'none',
                  borderRadius: 7,
                  padding: '10px 16px',
                  fontWeight: 800,
                  cursor: sending || !messageInput.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 11,
                  opacity: sending || !messageInput.trim() ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted }}>
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
