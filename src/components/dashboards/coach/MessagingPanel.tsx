'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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
  name: string;
  playerName: string;
  playerInitial: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; yellow?: boolean; red?: boolean }> = ({ children, yellow, red }) => {
  const color = yellow ? G.yellow : red ? G.red : G.lime;
  const bg = yellow ? 'rgba(239,192,64,.1)' : red ? 'rgba(217,79,79,.1)' : 'rgba(121,191,62,.12)';
  const border = yellow ? 'rgba(239,192,64,.3)' : red ? 'rgba(217,79,79,.3)' : 'rgba(121,191,62,.28)';
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: bg, border: `1px solid ${border}`, color, display: 'inline-block' }}>{children}</span>;
};

const mockRooms: ChatRoom[] = [
  {
    id: '1', name: 'Alex Rivera', playerName: 'Alex Rivera', playerInitial: 'A', online: true, unread: 2,
    lastMessage: "Can we reschedule Thursday's session?", lastMessageTime: '10:32 AM',
    messages: [
      { id: 'm1', content: "Hi Coach! Ready for tomorrow's session 🎾", createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), senderId: 'p1', senderName: 'Alex', read: true },
      { id: 'm2', content: "Absolutely! We'll focus on your backhand slice. Come warmed up.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), senderId: 'coach', senderName: 'Coach', read: true },
      { id: 'm3', content: "Can we reschedule Thursday's session?", createdAt: new Date(Date.now() - 600000).toISOString(), senderId: 'p1', senderName: 'Alex', read: false },
    ],
  },
  {
    id: '2', name: 'Jamie Chen', playerName: 'Jamie Chen', playerInitial: 'J', online: true, unread: 0,
    lastMessage: 'Thanks for the session notes!', lastMessageTime: 'Yesterday',
    messages: [
      { id: 'm4', content: "Great session today! My serve feels much better", createdAt: new Date(Date.now() - 86400000).toISOString(), senderId: 'p2', senderName: 'Jamie', read: true },
      { id: 'm5', content: "Thanks for the session notes!", createdAt: new Date(Date.now() - 82800000).toISOString(), senderId: 'p2', senderName: 'Jamie', read: true },
    ],
  },
  {
    id: '3', name: 'Sam Patel', playerName: 'Sam Patel', playerInitial: 'S', online: false, unread: 1,
    lastMessage: "What drills should I practice at home?", lastMessageTime: 'Tue',
    messages: [
      { id: 'm6', content: "What drills should I practice at home?", createdAt: new Date(Date.now() - 172800000).toISOString(), senderId: 'p3', senderName: 'Sam', read: false },
    ],
  },
  {
    id: '4', name: 'Morgan Lee', playerName: 'Morgan Lee', playerInitial: 'M', online: false, unread: 0,
    lastMessage: 'See you Saturday!', lastMessageTime: 'Mon',
    messages: [
      { id: 'm7', content: 'See you Saturday!', createdAt: new Date(Date.now() - 259200000).toISOString(), senderId: 'p4', senderName: 'Morgan', read: true },
    ],
  },
];

const quickReplies = [
  "Great job today! 🎾",
  "Session confirmed ✅",
  "Practice the drills we covered",
  "See you on court!",
  "I'll send updated notes soon",
];

export default function MessagingPanel({ coachId }: { coachId: string }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        // First try to fetch existing chat rooms
        const roomsRes = await fetch(`/api/coaches/messaging/rooms?coachId=${coachId}`);
        let rooms: ChatRoom[] = [];
        
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          rooms = Array.isArray(roomsData) ? roomsData : [];
        }
        
        // Then fetch players to ensure we have chat rooms for all of them
        const playersRes = await fetch(`/api/coaches/players?coachId=${coachId}`);
        if (playersRes.ok) {
          const playersData = await playersRes.json();
          const players = Array.isArray(playersData) ? playersData : [];
          
          console.log('📨 Messaging: Fetched players:', players);
          
          // Transform players into chat rooms (if not already in rooms)
          const playerIds = new Set(rooms.map(r => r.id));
          const newRooms = players.map((rel: any) => {
            const playerId = rel.playerId || rel.id;
            const firstName = rel.player?.user?.firstName || rel.user?.firstName || 'Unknown';
            const lastName = rel.player?.user?.lastName || rel.user?.lastName || '';
            const playerInitial = firstName.charAt(0).toUpperCase();
            
            return {
              id: playerId,
              name: `${firstName} ${lastName}`,
              playerName: `${firstName} ${lastName}`,
              playerInitial,
              online: false,
              unread: 0,
              lastMessage: 'No messages yet',
              lastMessageTime: 'Never',
              messages: [],
            };
          });
          
          // Merge with existing rooms, prioritizing existing ones
          const mergedRooms = [...rooms, ...newRooms.filter(nr => !playerIds.has(nr.id))];
          
          console.log('📨 Messaging: Creating chat rooms for', mergedRooms.length, 'players');
          setChatRooms(mergedRooms);
        } else {
          setChatRooms(rooms.length > 0 ? rooms : []);
        }
      } catch (error) {
        console.error('Error fetching chat rooms/players:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChatRooms();
  }, [coachId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !activeRoom) return;
    
    const newMsg: Message = {
      id: `m${Date.now()}`,
      content: messageInput.trim(),
      createdAt: new Date().toISOString(),
      senderId: coachId,
      senderName: 'Coach',
      read: true,
    };
    
    console.log('💬 Sending DM to player:', activeRoom.playerName);
    console.log('   Message:', messageInput.trim());
    console.log('   Player ID:', activeRoom.id);
    
    // Update local state
    setChatRooms(prev => prev.map(r => r.id === activeRoom.id
      ? { ...r, messages: [...r.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: 'Just now' }
      : r
    ));
    setActiveRoom(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
    setMessageInput('');
    
    // TODO: Persist message to API endpoint
    // Example: POST /api/coaches/messaging/send
  };

  const openRoom = (room: ChatRoom) => {
    setChatRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread: 0 } : r));
    setActiveRoom({ ...room, unread: 0 });
  };

  const filteredRooms = chatRooms.filter(r =>
    r.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalUnread = chatRooms.reduce((a, r) => a + r.unread, 0);

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;

  if (loading) return <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted, fontSize: 12 }}>Loading messages...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>💬 Messaging</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Communicate with your players</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {totalUnread > 0 && <Tag red>{totalUnread} unread</Tag>}
          <Tag>{chatRooms.filter(r => r.online).length} online</Tag>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 11, minHeight: 500 }}>

        {/* Left: Conversations List */}
        <div style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Search */}
          <div style={{ padding: '12px 12px 10px', borderBottom: `1px solid ${G.border}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: G.muted }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                style={{
                  width: '100%', padding: '7px 9px 7px 28px', borderRadius: 7,
                  background: G.dark, border: `1px solid ${G.border}`, color: G.text,
                  fontSize: 11, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Room List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRooms.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: G.muted, fontSize: 11 }}>No conversations found</div>
            ) : (
              filteredRooms.map(room => {
                const isActive = activeRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => openRoom(room)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
                      cursor: 'pointer', borderBottom: `1px solid ${G.border}`,
                      background: isActive ? G.card2 : 'transparent',
                      borderLeft: isActive ? `2px solid ${G.lime}` : '2px solid transparent',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = G.card2; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: G.mid, border: `1.5px solid ${G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G.lime }}>
                        {room.playerInitial}
                      </div>
                      {room.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, background: '#4cd964', borderRadius: '50%', border: `1.5px solid ${G.card}` }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: G.text }}>{room.playerName}</span>
                        <span style={{ fontSize: 9, color: G.muted }}>{room.lastMessageTime}</span>
                      </div>
                      <div style={{ fontSize: 10, color: G.muted2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.lastMessage}</div>
                    </div>
                    {room.unread > 0 && (
                      <div style={{ background: G.lime, color: '#0a180a', fontSize: 8, fontWeight: 800, borderRadius: 9, padding: '2px 6px', flexShrink: 0 }}>
                        {room.unread}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Broadcast button */}
          <div style={{ padding: 10, borderTop: `1px solid ${G.border}` }}>
            <button style={{ width: '100%', background: 'rgba(121,191,62,.1)', color: G.lime, border: `1px solid rgba(121,191,62,.3)`, borderRadius: 8, padding: '8px 0', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
              📢 Broadcast to All Players
            </button>
          </div>
        </div>

        {/* Right: Chat Window */}
        {activeRoom ? (
          <div style={{ ...card, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Chat Header */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.card2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: G.mid, border: `1.5px solid ${G.lime}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G.lime }}>
                    {activeRoom.playerInitial}
                  </div>
                  {activeRoom.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 7, height: 7, background: '#4cd964', borderRadius: '50%', border: `1.5px solid ${G.card2}` }} />}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: G.text }}>{activeRoom.playerName}</div>
                  <div style={{ fontSize: 9.5, color: activeRoom.online ? '#4cd964' : G.muted }}>{activeRoom.online ? '● Online' : '○ Offline'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['📋 View Profile', '📅 Schedule'].map((btn, i) => (
                  <button key={i} style={{ background: G.card, border: `1px solid ${G.border}`, color: G.text2, borderRadius: 6, padding: '5px 10px', fontSize: 9.5, cursor: 'pointer', fontWeight: 600 }}>
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeRoom.messages.map((msg) => {
                const isCoach = msg.senderId === coachId || msg.senderName === 'Coach';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isCoach ? 'flex-end' : 'flex-start', gap: 7, alignItems: 'flex-end' }}>
                    {!isCoach && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: G.mid, border: `1px solid ${G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: G.lime, flexShrink: 0 }}>
                        {activeRoom.playerInitial}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      <div style={{
                        padding: '9px 12px', borderRadius: isCoach ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                        background: isCoach ? G.lime : G.card2,
                        color: isCoach ? '#0a180a' : G.text,
                        fontSize: 11.5, lineHeight: 1.55,
                        border: `1px solid ${isCoach ? G.lime : G.border}`,
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 8.5, color: G.muted, marginTop: 3, textAlign: isCoach ? 'right' : 'left' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isCoach && <span> · {msg.read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div style={{ padding: '8px 14px 0', display: 'flex', gap: 5, overflowX: 'auto' }}>
              {quickReplies.map((qr, i) => (
                <button key={i} onClick={() => setMessageInput(qr)} style={{
                  background: 'rgba(121,191,62,.08)', border: `1px solid rgba(121,191,62,.25)`,
                  color: G.lime2, borderRadius: 12, padding: '4px 10px', fontSize: 9.5, cursor: 'pointer',
                  whiteSpace: 'nowrap', fontWeight: 600,
                }}>
                  {qr}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${G.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Write a message..."
                style={{
                  flex: 1, padding: '9px 13px', borderRadius: 9,
                  background: G.dark, border: `1px solid ${G.border}`,
                  color: G.text, fontSize: 11.5, outline: 'none',
                }}
              />
              <button onClick={sendMessage} style={{
                background: G.lime, color: '#0a180a', border: 'none',
                borderRadius: 9, padding: '9px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}>
                ➤
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: G.muted }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: G.text2 }}>Select a conversation</div>
            <div style={{ fontSize: 11, color: G.muted, textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
              Choose a player from the left to view and send messages
            </div>
            <Link href="/chat" style={{ color: G.lime, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              Open full chat →
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}