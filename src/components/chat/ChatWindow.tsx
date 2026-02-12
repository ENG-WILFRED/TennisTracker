"use client";

import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  playerId: string;
  playerName: string;
  photo?: string;
  createdAt: string;
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
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRoomData();
    startPolling();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
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
        const msgs = await messagesRes.json();
        setMessages(msgs);
      }

      if (participantsRes.ok) {
        const parts = await participantsRes.json();
        setParticipants(parts);
      }

      if (userRes.ok) {
        const user = await userRes.json();
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
          const msgs = await messagesRes.json();
          setMessages(msgs);
        }

        if (participantsRes.ok) {
          const parts = await participantsRes.json();
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
          const msgs = await messagesRes.json();
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
    <div className="flex h-full">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Room Info */}
        <div className="bg-white border-b border-gray-300 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Chat Room</h2>
            <div className="text-sm text-gray-600">
              {participants.filter((p) => p.isOnline).length} online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.playerId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.playerId !== currentUserId && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
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
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.playerId === currentUserId
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.playerId !== currentUserId && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.playerName}
                    </p>
                  )}
                  <p>{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-300 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Participants Sidebar */}
      <div className="w-64 bg-gray-50 border-l border-gray-300 overflow-y-auto">
        <div className="p-4 border-b border-gray-300">
          <h3 className="font-bold text-gray-800">Participants</h3>
          <p className="text-xs text-gray-600 mt-1">
            {participants.filter((p) => p.isOnline).length}/{participants.length} online
          </p>
        </div>
        <div className="divide-y">
          {participants.map((participant) => (
            <div key={participant.id} className="p-3 flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
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
