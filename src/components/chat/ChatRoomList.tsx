'use client';

import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  participantCount: number;
  onlineCount: number;
  lastMessage?: string;
}

interface ChatRoomListProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export default function ChatRoomList({ selectedRoomId, onSelectRoom }: ChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await authenticatedFetch('/api/chat/rooms');
      if (response.ok) {
        const data = await response.json();
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

    try {
      const response = await authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms([...rooms, newRoom]);
        setNewRoomName('');
        setShowCreateModal(false);
        onSelectRoom(newRoom.id);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chat Rooms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          <PlusCircle size={18} />
          New Room
        </button>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-500">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-gray-500">No rooms available. Create one!</div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer transition ${
                selectedRoomId === room.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{room.name}</h3>
                  {room.description && (
                    <p className="text-sm text-gray-600 truncate">{room.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>👥 {room.participantCount}</span>
                    <span className="text-green-600">🟢 {room.onlineCount} online</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Create New Chat Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
