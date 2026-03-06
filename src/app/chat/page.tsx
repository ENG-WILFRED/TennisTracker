"use client";

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConversationsSidebar from '@/components/chat/ConversationsSidebar';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { playerId, isLoading } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null);
  const [selectedContactPhoto, setSelectedContactPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && !playerId) {
      router.push('/login');
    }
  }, [playerId, isLoading, router]);

  const handleSelectContact = (contactId: string, contactName: string, contactPhoto?: string) => {
    setSelectedContactId(contactId);
    setSelectedContactName(contactName);
    setSelectedContactPhoto(contactPhoto);
    // Set online status
    authenticatedFetch(`/api/chat/rooms/${contactId}/status`, {
      method: 'POST',
    }).catch(console.error);
  };

  useEffect(() => {
    // Set user to offline when leaving the page
    return () => {
      if (selectedContactId) {
        authenticatedFetch(`/api/chat/rooms/${selectedContactId}/status`, {
          method: 'DELETE',
          keepalive: true,
        }).catch(console.error);
      }
    };
  }, [selectedContactId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!playerId) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Messages/Conversations List */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 overflow-y-auto">
        <ConversationsSidebar 
          selectedContactId={selectedContactId} 
          onSelectContact={handleSelectContact} 
        />
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedContactId ? (
          <ChatWindow 
            roomId={selectedContactId} 
            contactName={selectedContactName || 'Conversation'}
            contactPhoto={selectedContactPhoto}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">No conversation selected</p>
              <p className="text-sm text-gray-400">Choose a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Chat View */}
      <div className="flex md:hidden flex-1 flex-col">
        {selectedContactId ? (
          <ChatWindow 
            roomId={selectedContactId} 
            contactName={selectedContactName || 'Conversation'}
            contactPhoto={selectedContactPhoto}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Select a contact</p>
              <p className="text-sm text-gray-400">Tap a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
