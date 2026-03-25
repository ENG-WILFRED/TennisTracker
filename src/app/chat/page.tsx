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
  const [selectedContactType, setSelectedContactType] = useState<'individual' | 'group' | 'dm'>('individual');
  const [selectedContactUserId, setSelectedContactUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !playerId) {
      router.push('/login');
    }
  }, [playerId, isLoading, router]);

  const handleSelectContact = async (contactId: string, contactName: string, contactPhoto?: string, contactType?: 'individual' | 'group' | 'dm') => {
    const type = contactType || 'individual';
    setSelectedContactType(type);
    
    if (type === 'group' || type === 'dm') {
      // For groups and DMs, use the room directly
      setSelectedContactId(contactId);
      setSelectedContactName(contactName);
      setSelectedContactPhoto(contactPhoto);
      setSelectedContactUserId(null);
      // Set online status for groups/DMs
      authenticatedFetch(`/api/chat/rooms/${contactId}/status`, {
        method: 'POST',
      }).catch(console.error);
    } else {
      // For individual contacts, we need to find or create a DM room
      // For now, just set the contact info but don't create a room yet
      setSelectedContactId(null); // No room selected yet
      setSelectedContactName(contactName);
      setSelectedContactPhoto(contactPhoto);
      setSelectedContactUserId(contactId); // Store the user ID for DM creation
      // TODO: Implement DM room creation/finding logic
    }
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
        ) : selectedContactName && selectedContactUserId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation with {selectedContactName}</h3>
              <p className="text-gray-600 mb-6">Send a message to begin chatting with this person.</p>
              <button 
                onClick={async () => {
                  try {
                    const response = await authenticatedFetch('/api/chat/dm', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        targetUserId: selectedContactUserId,
                      }),
                    });

                    if (response.ok) {
                      const dmRoom = await response.json();
                      // Update the selected contact to use the room
                      setSelectedContactId(dmRoom.id);
                      setSelectedContactType('group');
                      setSelectedContactName(selectedContactName);
                      setSelectedContactPhoto(selectedContactPhoto);
                    } else {
                      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                      console.error('Failed to create DM room:', errorData.error);
                      // You could show this error to the user
                      alert(`Failed to create DM room: ${errorData.error}`);
                    }
                  } catch (error) {
                    console.error('Error creating DM room:', error);
                  }
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Conversation
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">No conversation selected</p>
              <p className="text-sm text-gray-400">Choose a contact or create a group to start chatting</p>
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
