"use client";

import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { Send, MoreVertical } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  playerId: string;
  playerName: string;
  photo?: string;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
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
}

export default function ChatWindow({ roomId, contactName = 'Conversation', contactPhoto }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchRoomData();
    startPolling();
    // open websocket connection for real-time updates
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${location.host}/api/chat/ws?roomId=${roomId}`;
    try {
      const ws = new WebSocket(wsUrl as string as string);
      wsRef.current = ws;
      ws.addEventListener('message', (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'message') {
            setMessages((prev) => [...prev, msg.data]);
          }
        } catch (e) {}
      });
    } catch (e) {
      console.warn('WebSocket failed, falling back to polling');
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomData = async () => {
    try {
      const [messagesRes, participantsRes, userRes] = await Promise.all([
        authenticatedFetch(`/api/chat/rooms/${roomId}/messages`),
        authenticatedFetch(`/api/chat/rooms/${roomId}/participants`),
        authenticatedFetch('/api/chat/me'),
      ]);

      if (messagesRes.ok) {
        const msgs = (await messagesRes.json()) as any;
        setMessages(msgs);
      }

      if (participantsRes.ok) {
        const parts = (await participantsRes.json()) as any;
        setParticipants(parts);
      }

      if (userRes.ok) {
        const user = (await userRes.json()) as any;
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll for new messages and participants every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const [messagesRes, participantsRes] = await Promise.all([
          authenticatedFetch(`/api/chat/rooms/${roomId}/messages`),
          authenticatedFetch(`/api/chat/rooms/${roomId}/participants`),
        ]);

        if (messagesRes.ok) {
          const msgs = (await messagesRes.json()) as any;
          setMessages(msgs);
        }

        if (participantsRes.ok) {
          const parts = (await participantsRes.json()) as any;
          setParticipants(parts);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const content = messageText;
    setMessageText('');

    try {
      const response = await authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        // Fetch updated messages
        const messagesRes = await authenticatedFetch(`/api/chat/rooms/${roomId}/messages`);
        if (messagesRes.ok) {
          const msgs = (await messagesRes.json()) as any;
          setMessages(msgs);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex h-full flex-col lg:flex-row bg-white">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Contact Info */}
        <div className="bg-white border-b border-gray-200 p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {contactPhoto && (
              <img
                src={contactPhoto}
                alt={contactName}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 bg-gray-200"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                {contactName}
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                {participants.filter((p) => p.isOnline).length} online
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 md:p-4 space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <p className="text-sm">Send a message to begin chatting</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.playerId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.playerId !== currentUserId && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                    {message.photo ? (
                      <img
                        src={message.photo}
                        alt={message.playerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                        {message.playerName.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg text-sm ${
                    message.playerId === currentUserId
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                  }`}
                >
                  {message.playerId !== currentUserId && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.playerName}
                    </p>
                  )}
                  <p className="break-words">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="ml-1">
                      {message.readAt ? (
                        <span className="text-blue-300">✔✔</span>
                      ) : message.deliveredAt ? (
                        <span className="text-gray-300">✔✔</span>
                      ) : (
                        <span className="text-gray-300">✔</span>
                      )}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-3 md:p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Participants Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-72 bg-gray-50 border-l border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Participants</h3>
          <p className="text-xs text-gray-600 mt-2">
            {participants.filter((p) => p.isOnline).length} of {participants.length} online
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {participants.map((participant) => (
            <div key={participant.id} className="p-3 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                {participant.playerPhoto ? (
                  <img
                    src={participant.playerPhoto}
                    alt={participant.playerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                    {participant.playerName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {participant.playerName}
                </p>
                <p className="text-xs text-gray-500">
                  {participant.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
