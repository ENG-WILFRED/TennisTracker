"use client";

import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { Send, MoreVertical, Phone, Video, Search, Smile, Paperclip, Info, ChevronDown } from 'lucide-react';
import { useChat } from '@/context/chat/ChatContext';
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

interface ChatWindowProps {
  roomId: string;
  contactName?: string;
  contactPhoto?: string;
  isMobile?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function ChatWindow({ roomId, contactName = 'Conversation', contactPhoto, isMobile = false, onToggleSidebar, sidebarOpen = true }: ChatWindowProps) {
  const { playerId } = useAuth();
  const { messages, participants, loading, sendMessage, refreshMessages, refreshParticipants, subscribeToRoom, unsubscribeFromRoom } = useChat();
  const [messageText, setMessageText] = useState('');
  const [showParticipants, setShowParticipants] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current room data from context
  const currentMessages = messages[roomId] || [];
  const currentParticipants = participants[roomId] || [];
  const isLoadingMessages = loading.messages[roomId] || false;

  useEffect(() => {
    // Load room data when roomId changes, only if not cached
    if (!messages[roomId] || messages[roomId].length === 0) {
      refreshMessages(roomId).then((paginationInfo) => {
        setHasMoreMessages(paginationInfo.hasMore);
        setNextCursor(paginationInfo.nextCursor);
      });
    } else {
      // If we have cached messages, check if we need to load more
      setHasMoreMessages(messages[roomId].length >= 50);
    }
    if (!participants[roomId] || participants[roomId].length === 0) {
      refreshParticipants(roomId);
    }

    // Subscribe to real-time updates for this room
    subscribeToRoom(roomId);

    return () => {
      // Unsubscribe when component unmounts or room changes
      unsubscribeFromRoom(roomId);
    };
  }, [roomId, messages, participants, refreshMessages, refreshParticipants, subscribeToRoom, unsubscribeFromRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const content = messageText;
    setMessageText('');
    const replyToId = replyToMessage?.id;
    setReplyToMessage(null);

    try {
      await sendMessage(roomId, content, replyToId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(content); // Restore the message text on failure
      if (replyToId) setReplyToMessage(replyToMessage); // Restore reply state
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        refreshMessages(roomId);
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${messageId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (response.ok) {
        setEditingMessage(null);
        setEditContent('');
        refreshMessages(roomId);
      } else {
        const error = await response.json();
        console.error('Failed to edit message:', error.error);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (response.ok) {
        // Reactions are handled via WebSocket, no need to refresh
      } else {
        console.error('Failed to toggle reaction');
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMore) return;

    setLoadingMore(true);
    try {
      const paginationInfo = await refreshMessages(roomId, true, nextCursor || undefined);
      if (paginationInfo) {
        setHasMoreMessages(paginationInfo.hasMore);
        setNextCursor(paginationInfo.nextCursor);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  };

  const onlineCount = currentParticipants.filter((p) => p.isOnline).length;
  const messageGroups = groupMessagesByDate(currentMessages);

  if (isLoadingMessages) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0f1117' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid #1e2030', borderTopColor: '#6c63ff',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: '#8b8fa8', fontFamily: 'var(--font-body)', fontSize: '14px' }}>Loading messages…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', height: '100%', background: '#0f1117',
      fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
    }}>
      {/* ── Main chat column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          background: '#13151f', borderBottom: '1px solid #1e2235',
          padding: '12px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px'
        }}>
          {/* Mobile back button */}
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b8fa8',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: sidebarOpen ? 'rotate(90deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {contactPhoto ? (
                <img src={contactPhoto} alt={contactName} style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  objectFit: 'cover', border: '2px solid #6c63ff'
                }} />
              ) : (
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c63ff, #e040fb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: '#fff'
                }}>
                  {contactName.charAt(0)}
                </div>
              )}
              {onlineCount > 0 && (
                <span style={{
                  position: 'absolute', bottom: '2px', right: '2px',
                  width: '11px', height: '11px', borderRadius: '50%',
                  background: '#22c55e', border: '2px solid #13151f'
                }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e8eaf6', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {contactName}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: onlineCount > 0 ? '#22c55e' : '#8b8fa8' }}>
                {onlineCount > 0 ? `${onlineCount} online` : `${currentParticipants.length} members`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {[
              { Icon: Phone, label: 'Call' },
              { Icon: Video, label: 'Video' },
              { Icon: Search, label: 'Search' },
              { Icon: Info, label: 'Info', onClick: () => setShowParticipants(!showParticipants) },
            ].map(({ Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                title={label}
                style={{
                  background: showParticipants && label === 'Info' ? '#6c63ff22' : 'transparent',
                  border: 'none', borderRadius: '10px', padding: '8px',
                  cursor: 'pointer', color: label === 'Info' && showParticipants ? '#6c63ff' : '#8b8fa8',
                  transition: 'all 0.15s', display: 'flex'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
                onMouseLeave={e => (e.currentTarget.style.background = label === 'Info' && showParticipants ? '#6c63ff22' : 'transparent')}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          background: '#0f1117', display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          {currentMessages.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px', color: '#8b8fa8'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6c63ff22, #e040fb22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Send size={28} color="#6c63ff" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#c5c9e0', margin: 0 }}>No messages yet</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Be the first to say hello 👋</p>
            </div>
          ) : (
            messageGroups.map(({ date, messages: dayMsgs }) => (
              <div key={date}>
                {/* Date separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#1e2235' }} />
                  <span style={{
                    fontSize: '11px', color: '#8b8fa8', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: '#13151f', padding: '2px 10px', borderRadius: '99px',
                    border: '1px solid #1e2235'
                  }}>{date}</span>
                  <div style={{ flex: 1, height: '1px', background: '#1e2235' }} />
                </div>

                {dayMsgs.map((message, i) => {
                  const isMe = message.playerId === playerId;
                  const prevMsg = dayMsgs[i - 1];
                  const isSameAuthor = prevMsg && prevMsg.playerId === message.playerId;

                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex', gap: '10px',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        marginTop: isSameAuthor ? '2px' : '12px',
                        alignItems: 'flex-end'
                      }}
                    >
                      {/* Avatar for others */}
                      {!isMe && (
                        <div style={{ width: '32px', flexShrink: 0 }}>
                          {!isSameAuthor && (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6c63ff, #e040fb)',
                              overflow: 'hidden', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: 700, color: '#fff'
                            }}>
                              {message.photo
                                ? <img src={message.photo} alt={message.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : message.playerName.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {!isMe && !isSameAuthor && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b8fa8', marginLeft: '4px' }}>
                            {message.playerName}
                          </span>
                        )}
                        <div style={{
                          padding: '10px 14px',
                          background: isMe
                            ? 'linear-gradient(135deg, #6c63ff, #8b80ff)'
                            : '#1a1d2e',
                          color: isMe ? '#fff' : '#c5c9e0',
                          borderRadius: isMe
                            ? (isSameAuthor ? '18px 18px 4px 18px' : '18px 18px 4px 18px')
                            : (isSameAuthor ? '18px 18px 18px 4px' : '18px 18px 18px 4px'),
                          fontSize: '14px', lineHeight: '1.5',
                          boxShadow: isMe ? '0 2px 12px #6c63ff40' : '0 1px 4px #00000030',
                          wordBreak: 'break-word',
                          position: 'relative'
                        }}>
                          {/* Reply indicator */}
                          {message.replyTo && (
                            <div style={{
                              padding: '6px 10px',
                              background: isMe ? 'rgba(255,255,255,0.1)' : '#2a2d3e',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              borderLeft: `3px solid ${isMe ? '#fff' : '#6c63ff'}`,
                              fontSize: '12px',
                              color: isMe ? '#e8eaf6' : '#8b8fa8'
                            }}>
                              <div style={{ fontWeight: 600, color: isMe ? '#fff' : '#c5c9e0' }}>
                                Replying to {message.replyTo.playerName}
                              </div>
                              <div style={{ marginTop: '2px', opacity: 0.8 }}>
                                {message.replyTo.content.length > 50 
                                  ? `${message.replyTo.content.substring(0, 50)}...` 
                                  : message.replyTo.content}
                              </div>
                            </div>
                          )}

                          {/* Message content or edit input */}
                          {editingMessage === message.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditMessage(message.id, editContent);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }
                                }}
                                style={{
                                  background: isMe ? 'rgba(255,255,255,0.1)' : '#2a2d3e',
                                  border: '1px solid #6c63ff',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  color: isMe ? '#fff' : '#c5c9e0',
                                  fontSize: '14px',
                                  outline: 'none'
                                }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8b8fa8',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    padding: '2px 8px'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleEditMessage(message.id, editContent)}
                                  style={{
                                    background: '#6c63ff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    padding: '2px 8px'
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            message.content
                          )}
                          
                          {/* Options button */}
                          <button
                            onClick={() => setShowMessageOptions(showMessageOptions === message.id ? null : message.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'none',
                              border: 'none',
                              color: isMe ? '#e8eaf6' : '#8b8fa8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              opacity: 0.7,
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                          >
                            <MoreVertical size={14} />
                          </button>
                          
                          {/* Options menu */}
                          {showMessageOptions === message.id && (
                            <div style={{
                              position: 'absolute',
                              top: '30px',
                              right: '8px',
                              background: '#13151f',
                              border: '1px solid #1e2235',
                              borderRadius: '8px',
                              padding: '4px',
                              zIndex: 10,
                              minWidth: '100px'
                            }}>
                              <button
                                onClick={() => {
                                  handleReply(message);
                                  setShowMessageOptions(null);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  background: 'none',
                                  border: 'none',
                                  color: '#c5c9e0',
                                  padding: '8px 12px',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                Reply
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditContent(message.content);
                                    setShowMessageOptions(null);
                                  }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    color: '#c5c9e0',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  Edit
                                </button>
                              )}
                              <div style={{ borderTop: '1px solid #1e2235', margin: '4px 0' }} />
                              {/* Quick reactions */}
                              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    handleReaction(message.id, emoji);
                                    setShowMessageOptions(null);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#c5c9e0',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div style={{ borderTop: '1px solid #1e2235', margin: '4px 0' }} />
                              {isMe && (
                                <button
                                  onClick={() => {
                                    handleDeleteMessage(message.id);
                                    setShowMessageOptions(null);
                                  }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff6b6b',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#1e2235')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '4px',
                            padding: '0 4px'
                          }}>
                            {Object.entries(
                              message.reactions.reduce((acc, reaction) => {
                                if (!acc[reaction.emoji]) {
                                  acc[reaction.emoji] = { count: 0, users: [] };
                                }
                                acc[reaction.emoji].count++;
                                acc[reaction.emoji].users.push(reaction.playerName);
                                return acc;
                              }, {} as Record<string, { count: number; users: string[] }>)
                            ).map(([emoji, data]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                title={`${data.users.join(', ')} reacted with ${emoji}`}
                                style={{
                                  background: '#1a1d2e',
                                  border: '1px solid #2a2d3e',
                                  borderRadius: '12px',
                                  padding: '2px 6px',
                                  fontSize: '12px',
                                  color: '#c5c9e0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#2a2d3e')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#1a1d2e')}
                              >
                                <span>{emoji}</span>
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>{data.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 4px' }}>
                          <span style={{ fontSize: '10px', color: '#8b8fa8' }}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.updatedAt && message.updatedAt !== message.createdAt && (
                              <span style={{ marginLeft: '4px', fontStyle: 'italic' }}>(edited)</span>
                            )}
                          </span>
                          {isMe && (
                            <span style={{ fontSize: '10px', color: message.readAt ? '#6c63ff' : '#8b8fa8' }}>
                              {message.readAt ? '✔✔' : 
                               message.deliveredAt ? 
                                 (currentParticipants.filter(p => p.playerId !== playerId && p.isOnline).length > 0 ? '✔✔' : '✔') : 
                                 '✔'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Load More Button */}
          {hasMoreMessages && !isLoadingMessages && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <button
                onClick={loadMoreMessages}
                disabled={loadingMore}
                style={{
                  background: '#6c63ff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: loadingMore ? 0.6 : 1
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More Messages'}
              </button>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div style={{
                padding: '10px 16px', background: '#1a1d2e', borderRadius: '18px',
                display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#8b8fa8',
                    animation: `typingBounce 1s ${delay}s ease-in-out infinite`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} style={{
          background: '#13151f', borderTop: '1px solid #1e2235',
          padding: '16px 20px'
        }}>
          {/* Reply indicator */}
          {replyToMessage && (
            <div style={{
              padding: '10px 14px',
              background: '#1a1d2e',
              borderRadius: '12px',
              marginBottom: '12px',
              borderLeft: '3px solid #6c63ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6c63ff', marginBottom: '4px' }}>
                  Replying to {replyToMessage.playerName}
                </div>
                <div style={{ fontSize: '13px', color: '#8b8fa8' }}>
                  {replyToMessage.content.length > 100 
                    ? `${replyToMessage.content.substring(0, 100)}...` 
                    : replyToMessage.content}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b8fa8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  marginLeft: '8px'
                }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#1a1d2e', borderRadius: '16px',
            border: '1px solid #2a2d3e', padding: '6px 6px 6px 16px',
            transition: 'border-color 0.2s'
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = '#6c63ff')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = '#2a2d3e')}
          >
            <button type="button" style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#8b8fa8', display: 'flex', flexShrink: 0 }}>
              <Paperclip size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={replyToMessage ? `Reply to ${replyToMessage.playerName}...` : "Type a message…"}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#e8eaf6', fontSize: '14px',
                fontFamily: 'var(--font-body, "DM Sans", sans-serif)'
              }}
            />
            <button type="button" style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#8b8fa8', display: 'flex', flexShrink: 0 }}>
              <Smile size={18} />
            </button>
            <button
              type="submit"
              disabled={!messageText.trim()}
              style={{
                background: messageText.trim()
                  ? 'linear-gradient(135deg, #6c63ff, #8b80ff)'
                  : '#2a2d3e',
                border: 'none', borderRadius: '12px',
                width: '40px', height: '40px', cursor: messageText.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
                boxShadow: messageText.trim() ? '0 2px 12px #6c63ff50' : 'none'
              }}
            >
              <Send size={16} color={messageText.trim() ? '#fff' : '#8b8fa8'} />
            </button>
          </div>
        </form>
      </div>

      {/* ── Participants sidebar ── */}
      {showParticipants && (
        <div style={{
          width: isMobile ? '100%' : '260px', 
          background: '#13151f',
          borderLeft: '1px solid #1e2235',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0,
          position: isMobile ? 'absolute' : 'relative',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 10
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2235' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Members · {currentParticipants.length}
            </h3>
          </div>

          {onlineCount > 0 && (
            <div>
              <p style={{ margin: '12px 20px 8px', fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Online — {onlineCount}
              </p>
              {currentParticipants.filter(p => p.isOnline).map(p => <ParticipantRow key={p.id} participant={p} />)}
            </div>
          )}

          {currentParticipants.filter(p => !p.isOnline).length > 0 && (
            <div>
              <p style={{ margin: '12px 20px 8px', fontSize: '11px', fontWeight: 600, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Offline — {currentParticipants.filter(p => !p.isOnline).length}
              </p>
              {currentParticipants.filter(p => !p.isOnline).map(p => <ParticipantRow key={p.id} participant={p} />)}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 99px; }
      `}</style>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: ChatParticipant }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 20px', cursor: 'pointer',
      transition: 'background 0.15s'
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1a1d2e')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #e040fb)',
          overflow: 'hidden', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff',
          opacity: participant.isOnline ? 1 : 0.4
        }}>
          {participant.playerPhoto
            ? <img src={participant.playerPhoto} alt={participant.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : participant.playerName.charAt(0)}
        </div>
        <span style={{
          position: 'absolute', bottom: '1px', right: '1px',
          width: '9px', height: '9px', borderRadius: '50%',
          background: participant.isOnline ? '#22c55e' : '#4b5563',
          border: '2px solid #13151f'
        }} />
      </div>
      <span style={{
        fontSize: '13px', fontWeight: 500,
        color: participant.isOnline ? '#c5c9e0' : '#8b8fa8',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {participant.playerName}
      </span>
    </div>
  );
}