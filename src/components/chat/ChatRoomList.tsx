'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Hash, Lock, Globe, Users, Search, Trash2, Settings } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  participantCount: number;
  onlineCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isPrivate?: boolean;
  unreadCount?: number;
  type?: 'team' | 'group' | 'channel';
}

interface ChatRoomListProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export default function ChatRoomList({ selectedRoomId, onSelectRoom }: ChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      let response = await authenticatedFetch('/api/chat/rooms');
      if (!response.ok && response.status === 404) {
        response = await authenticatedFetch('/api/chat/chats');
      }
      if (response.ok) {
        const data = (await response.json()) as any;
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const response = await authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName, description: newRoomDesc, isPrivate: newRoomPrivate }),
      });
      if (response.ok) {
        const newRoom = (await response.json()) as any;
        setRooms(prev => [...prev, newRoom]);
        setNewRoomName('');
        setNewRoomDesc('');
        setNewRoomPrivate(false);
        setShowCreateModal(false);
        onSelectRoom(newRoom.id);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOnline = rooms.reduce((s, r) => s + (r.onlineCount || 0), 0);
  const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.isPrivate) return <Lock size={14} />;
    if (room.type === 'team') return <Users size={14} />;
    return <Hash size={14} />;
  };

  const getRoomColor = (name: string) => {
    const colors = [
      ['#6c63ff', '#8b80ff'],
      ['#e040fb', '#f06292'],
      ['#00bcd4', '#4dd0e1'],
      ['#ff6b6b', '#ff8e8e'],
      ['#ffd93d', '#ffa726'],
      ['#22c55e', '#4ade80'],
    ];
    const i = name.charCodeAt(0) % colors.length;
    return colors[i];
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0f1117',
      fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
    }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0', borderBottom: '1px solid #1e2235' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#e8eaf6', letterSpacing: '-0.03em' }}>
              Channels
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8b8fa8' }}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {totalOnline} online
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #6c63ff, #8b80ff)',
              border: 'none', borderRadius: '12px', padding: '8px 14px',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s',
              boxShadow: '0 2px 12px #6c63ff50'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <PlusCircle size={15} />
            New
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#1a1d2e', borderRadius: '12px',
          border: `1px solid ${searchFocused ? '#6c63ff' : '#2a2d3e'}`,
          padding: '8px 12px', marginBottom: '16px',
          transition: 'border-color 0.2s'
        }}>
          <Search size={15} color="#8b8fa8" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Find a channel…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e8eaf6', fontSize: '13px',
              fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
            }}
          />
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: 'Rooms', value: rooms.length, color: '#8b8fa8' },
            { label: 'Online', value: totalOnline, color: '#22c55e' },
            { label: 'Unread', value: totalUnread, color: '#6c63ff' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: '#1a1d2e', borderRadius: '10px',
              padding: '8px', textAlign: 'center', border: '1px solid #2a2d3e'
            }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8b8fa8', fontSize: '13px' }}>
            Loading channels…
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{
            padding: '40px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
          }}>
            <Hash size={32} color="#2a2d3e" />
            <p style={{ color: '#8b8fa8', fontSize: '13px', margin: 0 }}>
              {searchQuery ? 'No channels found' : 'No channels yet — create one!'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            const [c1, c2] = getRoomColor(room.name);

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px', cursor: 'pointer',
                  background: isSelected ? '#1e2040' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? '#6c63ff' : 'transparent'}`,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1a1d2e'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Room icon */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#fff', fontSize: '18px', fontWeight: 800,
                  boxShadow: isSelected ? `0 4px 16px ${c1}60` : 'none'
                }}>
                  {room.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                      <span style={{ color: '#8b8fa8' }}>{getRoomIcon(room)}</span>
                      <span style={{
                        fontSize: '14px', fontWeight: (room.unreadCount ?? 0) > 0 ? 700 : 600,
                        color: '#e8eaf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {room.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#8b8fa8', flexShrink: 0 }}>
                      {formatTime(room.lastMessageTime)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <p style={{
                      margin: 0, fontSize: '12px',
                      color: (room.unreadCount ?? 0) > 0 ? '#c5c9e0' : '#8b8fa8',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, minWidth: 0
                    }}>
                      {room.lastMessage ?? room.description ?? 'No messages yet'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                        {room.onlineCount > 0 ? `● ${room.onlineCount}` : ''}
                      </span>
                      {(room.unreadCount ?? 0) > 0 && (
                        <span style={{
                          background: '#6c63ff', color: '#fff',
                          fontSize: '10px', fontWeight: 700,
                          padding: '1px 6px', borderRadius: '99px',
                          minWidth: '18px', textAlign: 'center'
                        }}>{room.unreadCount}</span>
                      )}
                    </div>
                  </div>

                  {/* Member bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Users size={10} color="#8b8fa8" />
                    <span style={{ fontSize: '11px', color: '#8b8fa8' }}>
                      {room.participantCount} member{room.participantCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#13151f', borderRadius: '20px', padding: '28px',
            width: '400px', maxWidth: '90vw',
            border: '1px solid #2a2d3e',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#e8eaf6', letterSpacing: '-0.02em' }}>
              Create Channel
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#8b8fa8' }}>
              Channels are where your team communicates
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Channel Name
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#1a1d2e', borderRadius: '12px', border: '1px solid #2a2d3e',
              padding: '10px 14px', marginBottom: '16px'
            }}>
              <Hash size={16} color="#8b8fa8" />
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. team-announcements"
                autoFocus
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#e8eaf6', fontSize: '14px',
                  fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
                }}
              />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Description (optional)
            </label>
            <textarea
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
              placeholder="What is this channel about?"
              rows={3}
              style={{
                width: '100%', background: '#1a1d2e', border: '1px solid #2a2d3e',
                borderRadius: '12px', padding: '10px 14px', color: '#e8eaf6',
                fontSize: '14px', fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
                outline: 'none', resize: 'none', boxSizing: 'border-box',
                marginBottom: '16px'
              }}
            />

            {/* Privacy toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#1a1d2e', borderRadius: '12px', border: '1px solid #2a2d3e',
              padding: '12px 14px', marginBottom: '24px', cursor: 'pointer'
            }} onClick={() => setNewRoomPrivate(!newRoomPrivate)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {newRoomPrivate ? <Lock size={16} color="#6c63ff" /> : <Globe size={16} color="#8b8fa8" />}
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e8eaf6' }}>
                    {newRoomPrivate ? 'Private Channel' : 'Public Channel'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#8b8fa8' }}>
                    {newRoomPrivate ? 'Only invited members can join' : 'Anyone in the team can join'}
                  </p>
                </div>
              </div>
              <div style={{
                width: '40px', height: '22px', borderRadius: '99px',
                background: newRoomPrivate ? '#6c63ff' : '#2a2d3e',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: newRoomPrivate ? '21px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowCreateModal(false); setNewRoomName(''); setNewRoomDesc(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'transparent', border: '1px solid #2a2d3e',
                  color: '#8b8fa8', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1d2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || creating}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: newRoomName.trim()
                    ? 'linear-gradient(135deg, #6c63ff, #8b80ff)'
                    : '#2a2d3e',
                  border: 'none', color: '#fff',
                  fontSize: '14px', fontWeight: 700,
                  cursor: newRoomName.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  boxShadow: newRoomName.trim() ? '0 4px 16px #6c63ff50' : 'none',
                  opacity: creating ? 0.7 : 1
                }}
              >
                {creating ? 'Creating…' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 99px; }
        textarea::placeholder, input::placeholder { color: #4b5163; }
      `}</style>
    </div>
  );
}