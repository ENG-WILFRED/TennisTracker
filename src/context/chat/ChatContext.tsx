"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  playerId: string;
  playerName: string;
  photo?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  replyToId?: string | null;
  replyTo?: ChatMessage | null;
  reactions?: MessageReaction[];
  isDeleted?: boolean;
}

interface MessageReaction {
  id: string;
  emoji: string;
  playerId: string;
  playerName: string;
}

interface ChatParticipant {
  id: string;
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  isOnline: boolean;
}

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

interface ChatCache {
  contacts: Contact[];
  messages: Record<string, ChatMessage[]>;
  participants: Record<string, ChatParticipant[]>;
  currentUser: { id: string; name: string; photo?: string } | null;
  lastFetch: {
    contacts: number;
    messages: Record<string, number>;
    participants: Record<string, number>;
  };
}

interface ChatContextType {
  // Cache data
  contacts: Contact[];
  messages: Record<string, ChatMessage[]>;
  participants: Record<string, ChatParticipant[]>;
  currentUser: { id: string; name: string; photo?: string } | null;

  // Loading states
  loading: {
    contacts: boolean;
    messages: Record<string, boolean>;
    participants: Record<string, boolean>;
  };

  // Actions
  refreshContacts: () => Promise<void>;
  refreshMessages: (roomId: string, loadMore?: boolean, before?: string) => Promise<{ hasMore: boolean; nextCursor: string | null }>;
  refreshParticipants: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string, replyToId?: string) => Promise<void>;
  createGroup: (name: string, participantIds: string[]) => Promise<string | null>;
  createDM: (targetUserId: string) => Promise<string | null>;
  markAsRead: (roomId: string) => Promise<void>;

  // Real-time updates
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const CACHE_DURATION = {
  contacts: 300000, // 5 minutes (WebSocket updates handle real-time changes)
  messages: 300000, // 5 minutes (WebSocket updates handle real-time changes)
  participants: 300000, // 5 minutes (WebSocket updates handle real-time changes)
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { playerId, user } = useAuth();
  const [cache, setCache] = useState<ChatCache>({
    contacts: [],
    messages: {},
    participants: {},
    currentUser: null,
    lastFetch: {
      contacts: 0,
      messages: {},
      participants: {},
    },
  });

  const [loading, setLoading] = useState({
    contacts: false,
    messages: {} as Record<string, boolean>,
    participants: {} as Record<string, boolean>,
  });

  const wsRefs = useRef<Record<string, WebSocket>>({});

  useEffect(() => {
    if (!user) return;

    setCache(prev => ({
      ...prev,
      currentUser: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        photo: user.photo || undefined,
      },
    }));
  }, [user]);

  const updateCache = useCallback((updates: Partial<ChatCache>) => {
    setCache(prev => ({
      ...prev,
      ...updates,
      lastFetch: {
        ...prev.lastFetch,
        ...updates.lastFetch,
      },
    }));
  }, []);

  const refreshContacts = useCallback(async () => {
    if (!playerId) {
      return; // Do not fetch chat data for unauthenticated users
    }

    const now = Date.now();
    if (now - cache.lastFetch.contacts < CACHE_DURATION.contacts) {
      return; // Use cached data
    }

    setLoading(prev => ({ ...prev, contacts: true }));

    try {
      // Only fetch chat rooms - don't fetch all players/coaches as it's inefficient
      const roomsRes = await authenticatedFetch('/api/chat/rooms');

      const rooms = roomsRes.ok ? await roomsRes.json() : [];

      const allContacts: Contact[] = [
        // Add chat rooms/groups - these are the actual contacts
        ...rooms.map((room: any) => ({
          id: room.id,
          fullName: room.name,
          name: room.name,
          photo: room.isDM && room.dmParticipant ? room.dmParticipant.photo : undefined,
          profilePhoto: room.isDM && room.dmParticipant ? room.dmParticipant.photo : undefined,
          role: room.isDM ? 'dm' as const : 'group' as const,
          isOnline: room.onlineCount > 0,
          lastMessage: room.lastMessage,
          lastMessageTime: undefined,
          unreadCount: 0,
          starred: false,
          participantCount: room.participantCount,
          onlineCount: room.onlineCount,
          isDM: room.isDM,
          dmParticipant: room.dmParticipant,
        })),
      ];

      updateCache({
        contacts: allContacts,
        lastFetch: { ...cache.lastFetch, contacts: now },
      });
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(prev => ({ ...prev, contacts: false }));
    }
  }, [cache.lastFetch.contacts, updateCache, playerId]);

  const refreshMessages = useCallback(async (roomId: string, loadMore?: boolean, before?: string): Promise<{ hasMore: boolean; nextCursor: string | null }> => {
    const now = Date.now();
    const lastFetch = cache.lastFetch.messages[roomId] || 0;

    // Always fetch if loading more or if cache is stale
    if (!loadMore && now - lastFetch < CACHE_DURATION.messages) {
      // Use cached data, return default pagination info
      return { hasMore: false, nextCursor: null };
    }

    setLoading(prev => ({
      ...prev,
      messages: { ...prev.messages, [roomId]: true }
    }));

    try {
      const params = new URLSearchParams();
      if (before) params.append('before', before);
      if (loadMore) params.append('page', '2'); // For pagination

      const url = `/api/chat/rooms/${roomId}/messages${params.toString() ? '?' + params.toString() : ''}`;
      const response = await authenticatedFetch(url);

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || data;

        let updatedMessages;
        if (loadMore && cache.messages[roomId]) {
          // Append older messages to the beginning
          updatedMessages = [...newMessages, ...cache.messages[roomId]];
        } else {
          // Replace messages
          updatedMessages = newMessages;
        }

        updateCache({
          messages: { ...cache.messages, [roomId]: updatedMessages },
          lastFetch: {
            ...cache.lastFetch,
            messages: { ...cache.lastFetch.messages, [roomId]: now }
          },
        });

        // Return pagination info for the caller
        return {
          hasMore: data.hasMore || false,
          nextCursor: data.nextCursor || null,
        };
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return { hasMore: false, nextCursor: null };
    } finally {
      setLoading(prev => ({
        ...prev,
        messages: { ...prev.messages, [roomId]: false }
      }));
    }
    return { hasMore: false, nextCursor: null };
  }, [cache.lastFetch.messages, cache.messages, updateCache]);

  const refreshParticipants = useCallback(async (roomId: string) => {
    const now = Date.now();
    const lastFetch = cache.lastFetch.participants[roomId] || 0;

    if (now - lastFetch < CACHE_DURATION.participants) {
      return; // Use cached data
    }

    setLoading(prev => ({
      ...prev,
      participants: { ...prev.participants, [roomId]: true }
    }));

    try {
      const response = await authenticatedFetch(`/api/chat/rooms/${roomId}/participants`);
      if (response.ok) {
        const participants = await response.json();
        updateCache({
          participants: { ...cache.participants, [roomId]: participants },
          lastFetch: {
            ...cache.lastFetch,
            participants: { ...cache.lastFetch.participants, [roomId]: now }
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(prev => ({
        ...prev,
        participants: { ...prev.participants, [roomId]: false }
      }));
    }
  }, [cache.lastFetch.participants, cache.participants, updateCache]);

  const sendMessage = useCallback(async (roomId: string, content: string, replyToId?: string) => {
    const now = new Date().toISOString();
    // Optimistically add message to cache
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      playerId: cache.currentUser?.id || '',
      playerName: cache.currentUser?.name || 'You',
      photo: cache.currentUser?.photo,
      createdAt: now,
      deliveredAt: now, // Message is delivered immediately to sender
      readAt: null,
      replyToId,
    };

    const currentMessages = cache.messages[roomId] || [];
    updateCache({
      messages: {
        ...cache.messages,
        [roomId]: [...currentMessages, optimisticMessage]
      },
    });

    try {
      const response = await authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, replyToId }),
      });

      if (response.ok) {
        const realMessage = await response.json();
        // Replace optimistic message with real message
        const messagesWithReal = currentMessages.map(msg =>
          msg.id === optimisticMessage.id ? realMessage : msg
        );
        updateCache({
          messages: {
            ...cache.messages,
            [roomId]: messagesWithReal
          },
        });
      } else {
        // Remove optimistic message on failure
        updateCache({
          messages: {
            ...cache.messages,
            [roomId]: currentMessages
          },
        });
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      updateCache({
        messages: {
          ...cache.messages,
          [roomId]: currentMessages
        },
      });
      throw error;
    }
  }, [cache.currentUser, cache.messages, updateCache, refreshMessages]);

  const createGroup = useCallback(async (name: string, participantIds: string[]): Promise<string | null> => {
    try {
      const createResponse = await authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: `Group chat with ${participantIds.length + 1} members`,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await createResponse.json();

      // Add selected users to the group
      for (const userId of participantIds) {
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

      // Refresh contacts to include the new group
      await refreshContacts();

      return newGroup.id;
    } catch (error) {
      console.error('Failed to create group:', error);
      return null;
    }
  }, [refreshContacts]);

  const createDM = useCallback(async (targetUserId: string): Promise<string | null> => {
    try {
      const response = await authenticatedFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (response.ok) {
        const dmRoom = await response.json();
        // Refresh contacts to include the new DM
        await refreshContacts();
        return dmRoom.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create DM:', error);
      return null;
    }
  }, [refreshContacts]);

  const markAsRead = useCallback(async (roomId: string) => {
    // This would typically call an API to mark messages as read
    // For now, we'll just update the cache
    console.log('Marking messages as read for room:', roomId);
  }, []);

  const subscribeToRoom = useCallback((roomId: string) => {
    // Set up WebSocket connection for real-time updates
    if (wsRefs.current[roomId]) {
      return; // Already subscribed
    }

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${location.host}/api/chat/ws?roomId=${roomId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRefs.current[roomId] = ws;

      ws.addEventListener('message', (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'message') {
            // Update cache with new message directly (no DB query needed)
            const currentMessages = cache.messages[roomId] || [];
            const newMessage = msg.data;
            updateCache({
              messages: {
                ...cache.messages,
                [roomId]: [...currentMessages, newMessage]
              },
            });
          } else if (msg.type === 'message_read') {
            // Update read receipts for messages
            const currentMessages = cache.messages[roomId] || [];
            const updatedMessages = currentMessages.map(m =>
              msg.data.messageIds.includes(m.id)
                ? { ...m, readAt: msg.data.readAt }
                : m
            );
            updateCache({
              messages: {
                ...cache.messages,
                [roomId]: updatedMessages
              },
            });
          } else if (msg.type === 'message_delivered') {
            // Update delivery status
            const currentMessages = cache.messages[roomId] || [];
            const updatedMessages = currentMessages.map(m =>
              m.id === msg.data.messageId
                ? { ...m, deliveredAt: msg.data.deliveredAt }
                : m
            );
            updateCache({
              messages: {
                ...cache.messages,
                [roomId]: updatedMessages
              },
            });
          } else if (msg.type === 'participant_online') {
            // Update participant online status
            const currentParticipants = cache.participants[roomId] || [];
            const updatedParticipants = currentParticipants.map(p =>
              p.playerId === msg.data.playerId
                ? { ...p, isOnline: true, lastSeen: msg.data.lastSeen }
                : p
            );
            updateCache({
              participants: {
                ...cache.participants,
                [roomId]: updatedParticipants
              },
            });
          } else if (msg.type === 'participant_offline') {
            // Update participant offline status
            const currentParticipants = cache.participants[roomId] || [];
            const updatedParticipants = currentParticipants.map(p =>
              p.playerId === msg.data.playerId
                ? { ...p, isOnline: false, lastSeen: msg.data.lastSeen }
                : p
            );
            updateCache({
              participants: {
                ...cache.participants,
                [roomId]: updatedParticipants
              },
            });
          }
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', e);
        }
      });

      ws.addEventListener('close', () => {
        delete wsRefs.current[roomId];
      });
    } catch (e) {
      console.warn('WebSocket failed for room:', roomId);
    }

    // No polling needed - WebSocket handles real-time updates
  }, [cache.messages, updateCache]);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    // Clean up WebSocket
    if (wsRefs.current[roomId]) {
      wsRefs.current[roomId].close();
      delete wsRefs.current[roomId];
    }
  }, []);

  // Load contacts once on auth initialization; WebSocket events keep real-time data fresh.
  useEffect(() => {
    if (!playerId || !user) {
      return;
    }

    // Defer the initial contact fetch to avoid blocking the main dashboard load
    // Schedule it after a delay to allow the main page to render first
    const timeoutId = setTimeout(() => {
      refreshContacts();
    }, 500); // 500ms delay gives the page time to render

    return () => clearTimeout(timeoutId);
  }, [playerId, user, refreshContacts]);

  const value: ChatContextType = {
    contacts: cache.contacts,
    messages: cache.messages,
    participants: cache.participants,
    currentUser: cache.currentUser,
    loading,
    refreshContacts,
    refreshMessages,
    refreshParticipants,
    sendMessage,
    createGroup,
    createDM,
    markAsRead,
    subscribeToRoom,
    unsubscribeFromRoom,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
