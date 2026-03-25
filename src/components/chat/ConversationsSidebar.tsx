'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, MessageSquare, Filter, CheckCheck, Bell, BellOff, Star, Plus, Users } from 'lucide-react';
import { useChat } from '@/context/chat/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface Contact {
  id: string;
  fullName?: string;
  name?: string;
  photo?: string;
  profilePhoto?: string;
  isOnline?: boolean;
  role?: 'player' | 'coach' | 'staff' | 'group' | 'dm';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  starred?: boolean;
  participantCount?: number;
  onlineCount?: number;
  isDM?: boolean;
  dmParticipant?: any;
}

interface ConversationsSidebarProps {
  selectedContactId: string | null;
  onSelectContact: (contactId: string, contactName: string, contactPhoto?: string, contactType?: 'individual' | 'group' | 'dm') => void;
}

type FilterTab = 'all' | 'unread' | 'starred';

export default function ConversationsSidebar({
  selectedContactId,
  onSelectContact,
}: ConversationsSidebarProps) {
  const { playerId } = useAuth();
  const { contacts, loading, refreshContacts } = useChat();
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [starredContacts, setStarredContacts] = useState<Set<string>>(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Add starred status to contacts
  const contactsWithStarred = useMemo(() => {
    return contacts.map(c => ({
      ...c,
      starred: starredContacts.has(c.id),
    }));
  }, [contacts, starredContacts]);

  // Load contacts on mount
  useEffect(() => {
    refreshContacts();
  }, [refreshContacts]);

  // Calculate online count and total unread
  const onlineCount = useMemo(() => contactsWithStarred.filter(c => c.isOnline).length, [contactsWithStarred]);
  const totalUnread = useMemo(() => contactsWithStarred.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0), [contactsWithStarred]);

  useEffect(() => {
    applyFilters(contactsWithStarred, searchQuery, activeFilter);
  }, [contactsWithStarred, searchQuery, activeFilter]);

  const applyFilters = (all: Contact[], query: string, filter: FilterTab) => {
    let result = all;
    if (query.trim()) {
      result = result.filter(c =>
        (c.name || c.fullName || '').toLowerCase().includes(query.toLowerCase())
      );
    }
    if (filter === 'unread') result = result.filter(c => (c.unreadCount ?? 0) > 0);
    if (filter === 'starred') result = result.filter(c => c.starred);
    setFilteredContacts(result);
  };

  const handleSearch = (query: string) => setSearchQuery(query);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setCreatingGroup(true);
    try {
      // Create the group
      const createResponse = await authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: `Group chat with ${selectedUsers.length + 1} members`,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await createResponse.json();

      // Add selected users to the group
      for (const userId of selectedUsers) {
        try {
          await authenticatedFetch(`/api/chat/rooms/${newGroup.id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: userId }),
          });
        } catch (error) {
          console.error(`Failed to add user ${userId} to group:`, error);
        }
      }

      // Reset form and close modal
      setGroupName('');
      setSelectedUsers([]);
      setShowCreateGroup(false);

      // Refresh contacts to show the new group
      refreshContacts();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'starred', label: 'Starred' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#13151f',
      fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
    }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0', borderBottom: '1px solid #1e2235' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#e8eaf6', letterSpacing: '-0.03em' }}>
              Messages
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#22c55e' }}>
              {onlineCount} online now
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setShowCreateGroup(true)}
              style={{
                position: 'relative', background: 'none', border: 'none',
                padding: '8px', borderRadius: '10px', cursor: 'pointer',
                color: '#8b8fa8', display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Create Group"
            >
              <Plus size={18} />
            </button>
            <button style={{
              position: 'relative', background: 'none', border: 'none',
              padding: '8px', borderRadius: '10px', cursor: 'pointer',
              color: '#8b8fa8'
            }}>
              <Bell size={18} />
              {totalUnread > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#6c63ff', border: '2px solid #13151f'
                }} />
              )}
            </button>
            <button style={{
              background: 'none', border: 'none', padding: '8px',
              borderRadius: '10px', cursor: 'pointer', color: '#8b8fa8'
            }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#1a1d2e', borderRadius: '12px',
          border: `1px solid ${searchFocused ? '#6c63ff' : '#2a2d3e'}`,
          padding: '8px 12px', marginBottom: '14px',
          transition: 'border-color 0.2s'
        }}>
          <Search size={15} color="#8b8fa8" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e8eaf6', fontSize: '13px',
              fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', padding: 0, display: 'flex' }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>✕</span>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '0' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                color: activeFilter === tab.key ? '#6c63ff' : '#8b8fa8',
                borderBottom: `2px solid ${activeFilter === tab.key ? '#6c63ff' : 'transparent'}`,
                transition: 'all 0.15s', whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
              {tab.key === 'unread' && totalUnread > 0 && (
                <span style={{
                  marginLeft: '6px', background: '#6c63ff',
                  color: '#fff', fontSize: '10px', fontWeight: 700,
                  padding: '1px 5px', borderRadius: '99px'
                }}>{totalUnread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading.contacts ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8b8fa8', fontSize: '13px' }}>
            Loading conversations…
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{
            padding: '40px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
          }}>
            <MessageSquare size={32} color="#2a2d3e" />
            <p style={{ color: '#8b8fa8', fontSize: '13px', margin: 0 }}>
              {searchQuery ? 'No contacts found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;
            const name = contact.name || contact.fullName || 'Unknown';
            const photo = contact.photo || contact.profilePhoto;

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact.id, name, photo, contact.role === 'group' ? 'group' : contact.role === 'dm' ? 'dm' : 'individual')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', cursor: 'pointer',
                  background: isSelected ? '#1e2040' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? '#6c63ff' : 'transparent'}`,
                  transition: 'all 0.15s', position: 'relative'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1a1d2e'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: contact.role === 'group' ? '16px' : '50%',
                    background: contact.role === 'group' 
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                      : 'linear-gradient(135deg, #6c63ff, #e040fb)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', fontWeight: 700,
                    color: '#fff', border: isSelected ? '2px solid #6c63ff' : '2px solid transparent'
                  }}>
                    {photo ? (
                      <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : contact.role === 'group' ? (
                      <Users size={20} />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '11px', height: '11px', borderRadius: '50%',
                    background: contact.isOnline ? '#22c55e' : '#374151',
                    border: '2px solid #13151f'
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{
                      fontSize: '14px', fontWeight: (contact.unreadCount ?? 0) > 0 ? 700 : 500,
                      color: '#e8eaf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8b8fa8', flexShrink: 0 }}>
                      {contact.role === 'group' ? 
                        `${contact.participantCount || 0} members` : 
                        formatTimeAgo(contact.lastMessageTime)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                    <p style={{
                      margin: 0, fontSize: '12px',
                      color: (contact.unreadCount ?? 0) > 0 ? '#c5c9e0' : '#8b8fa8',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {contact.role === 'group' ? 
                        `${contact.onlineCount || 0} online` : 
                        (contact.lastMessage ?? (contact.role === 'coach' ? '🏆 Coach' : '⚽ Player'))}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {(contact.unreadCount ?? 0) > 0 && (
                        <span style={{
                          background: '#6c63ff', color: '#fff',
                          fontSize: '10px', fontWeight: 700,
                          padding: '1px 6px', borderRadius: '99px',
                          minWidth: '18px', textAlign: 'center'
                        }}>{contact.unreadCount}</span>
                      )}
                      <button
                        onClick={(e) => toggleStar(contact.id, e)}
                        style={{
                          background: 'none', border: 'none', padding: '2px',
                          cursor: 'pointer', display: 'flex', opacity: contact.starred ? 1 : 0,
                          transition: 'opacity 0.15s'
                        }}
                      >
                        <Star size={12} color={contact.starred ? '#f59e0b' : '#8b8fa8'} fill={contact.starred ? '#f59e0b' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom quick stats */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #1e2235',
        display: 'flex', gap: '12px'
      }}>
        {[
          { label: 'Total', value: contacts.length, color: '#8b8fa8' },
          { label: 'Online', value: onlineCount, color: '#22c55e' },
          { label: 'Unread', value: totalUnread, color: '#6c63ff' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 99px; }
        div[style*="cursor: pointer"]:hover > div > button { opacity: 1 !important; }
      `}</style>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#13151f', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '400px', maxHeight: '80vh', overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#e8eaf6', fontSize: '18px', fontWeight: 700 }}>Create Chat Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                style={{ background: 'none', border: 'none', color: '#8b8fa8', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#e8eaf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  border: '1px solid #2a2d3e', background: '#1a1d2e',
                  color: '#e8eaf6', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#e8eaf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Add Members ({selectedUsers.length} selected)
              </label>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {contacts.map((contact) => {
                  const isSelected = selectedUsers.includes(contact.id);
                  const name = contact.name || contact.fullName || 'Unknown';
                  const photo = contact.photo || contact.profilePhoto;

                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleUserSelection(contact.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '8px 12px', cursor: 'pointer', borderRadius: '8px',
                        background: isSelected ? '#1e2040' : 'transparent',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6c63ff, #e040fb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0
                      }}>
                        {photo
                          ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: '#e8eaf6', fontSize: '14px', flex: 1 }}>{name}</span>
                      {isSelected && (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: '#6c63ff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0
                        }}>
                          <CheckCheck size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateGroup(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  border: '1px solid #2a2d3e', background: 'transparent',
                  color: '#8b8fa8', cursor: 'pointer', fontSize: '14px', fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0 || creatingGroup}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  border: 'none', background: creatingGroup ? '#4a5568' : '#6c63ff',
                  color: '#fff', cursor: creatingGroup ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 600
                }}
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}