"use client";

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { playerId, isLoading } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !playerId) {
      router.push('/login');
    }
  }, [playerId, isLoading, router]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleRoomChange = (roomId: string | null) => {
    if (selectedRoomId && selectedRoomId !== roomId) {
      // Set previous room user to offline
      authenticatedFetch(`/api/chat/rooms/${selectedRoomId}/status`, {
        method: 'DELETE',
      }).catch(console.error);
    }

    if (roomId) {
      // Set new room user to online
      authenticatedFetch(`/api/chat/rooms/${roomId}/status`, {
        method: 'POST',
      }).catch(console.error);
    }

    setSelectedRoomId(roomId);
  };

  useEffect(() => {
    // Set user to offline when leaving the page
    return () => {
      if (selectedRoomId) {
        authenticatedFetch(`/api/chat/rooms/${selectedRoomId}/status`, {
          method: 'DELETE',
          keepalive: true,
        }).catch(console.error);
      }
    };
  }, [selectedRoomId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!playerId) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Chat Rooms List */}
      <div className="w-1/4 bg-white border-r border-gray-300 overflow-y-auto">
        <ChatRoomList selectedRoomId={selectedRoomId} onSelectRoom={handleRoomChange} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoomId ? (
          <ChatWindow roomId={selectedRoomId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a chat room to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
