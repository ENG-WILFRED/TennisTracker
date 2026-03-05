'use client';

import { useEffect, useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface Contact {
  id: string;
  fullName?: string;
  name?: string;
  photo?: string;
  profilePhoto?: string;
  isOnline?: boolean;
  role?: 'player' | 'coach' | 'staff';
  lastMessage?: string;
  lastMessageTime?: string;
}

interface ConversationsSidebarProps {
  selectedContactId: string | null;
  onSelectContact: (contactId: string, contactName: string) => void;
}

export default function ConversationsSidebar({
  selectedContactId,
  onSelectContact,
}: ConversationsSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchContacts = async () => {
    try {
      const [playersRes, coachesRes] = await Promise.all([
        authenticatedFetch('/api/players'),
        authenticatedFetch('/api/coaches'),
      ]);

      const players = playersRes.ok ? ((await playersRes.json()) as any) : [];
      const coaches = coachesRes.ok ? ((await coachesRes.json()) as any) : [];

      const allContacts: Contact[] = [
        ...players.map((p: any) => ({
          id: p.id,
          fullName: p.fullName || p.name,
          name: p.fullName || p.name,
          photo: p.profilePhoto || p.photo,
          profilePhoto: p.profilePhoto || p.photo,
          role: 'player',
          isOnline: p.isOnline ?? false,
        })),
        ...coaches.map((c: any) => ({
          id: c.id,
          fullName: c.fullName || c.name,
          name: c.fullName || c.name,
          photo: c.profilePhoto || c.photo,
          profilePhoto: c.profilePhoto || c.photo,
          role: 'coach',
          isOnline: c.isOnline ?? false,
        })),
      ];

      setContacts(allContacts);
      setFilteredContacts(allContacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        (contact.name || contact.fullName || '')
          .toLowerCase()
          .includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No contacts found' : 'No contacts available'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.id, contact.name || contact.fullName || 'Unknown')}
              className={`p-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                selectedContactId === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={contact.photo || contact.profilePhoto || 'https://via.placeholder.com/48'}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                  />
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 truncate text-sm">
                      {contact.name || contact.fullName}
                    </h3>
                    {contact.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimeAgo(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  {/* Last message or role */}
                  {contact.lastMessage ? (
                    <p className="text-xs text-gray-600 truncate">
                      {contact.lastMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {contact.role === 'coach' ? 'Coach' : 'Player'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
