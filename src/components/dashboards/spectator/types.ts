'use client';

export interface Match {
  id: string;
  date: string;
  scheduledTime?: string;
  playerA: { id: string; name: string } | null;
  playerB: { id: string; name: string } | null;
  status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  score: string;
  winner: { id: string; name: string } | null;
  court?: string;
  event?: string;
}

export interface Player {
  id: string;
  name: string;
  username: string;
  nationality: string;
  wins: number;
  matchesPlayed: number;
  level: string;
  img: string;
  bio?: string;
  ranking?: string;
}

export interface Organization {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  contact: string;
  description: string;
  logo?: string;
  membershipTiers?: Array<{
    id: string;
    name: string;
    description?: string;
    monthlyPrice: number;
    benefits?: string[];
    courtHoursPerMonth?: number;
    maxConcurrentBookings?: number;
    discountPercentage?: number;
  }>;
  members?: Array<{
    id: string;
    role: string;
    paymentStatus: string;
    player: {
      user: { firstName: string; lastName: string; email?: string; photo?: string };
    };
  }>;
  courts?: Array<{
    id: string;
    name: string;
    courtNumber?: string;
    surface?: string;
    indoorOutdoor?: string;
    lights?: boolean;
    status?: string;
  }>;
  events?: Array<{
    id: string;
    name: string;
    eventType?: string;
    startDate?: string;
    registrationCap?: number;
    entryFee?: number;
  }>;
  announcements?: any[];
  finances?: any[];
  ratings?: any[];
  _count: {
    members: number;
    courts: number;
    events: number;
  };
  players?: any[];
  staff?: any[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  photo?: string;
  role: string;
  organizationId?: string;
  lastMessage?: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface MembershipApplication {
  id: string;
  userId: string;
  organizationId: string;
  position: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export type MatchFilter = 'all' | 'ongoing' | 'upcoming' | 'past';

export type NavSection = {
  label: string;
  icon: string;
};

export const NAV_SECTIONS: NavSection[] = [
  { label: 'Home', icon: '🏠' },
  { label: 'Watch Match', icon: '🎥' },
  { label: 'Matches', icon: '📊' },
  { label: 'Players', icon: '👤' },
  { label: 'Organizations', icon: '🏢' },
  { label: 'Community', icon: '👥' },
  { label: 'Apply', icon: '📝' },
  { label: 'Membership', icon: '💳' },
  { label: 'Messages', icon: '💬' },
];

export const MEMBERSHIP_TIERS = [
  {
    name: 'Bronze',
    cost: 20,
    color: '#cd7f32',
    perks: ['Basic platform access', 'Event alerts & updates', 'Member newsletter'],
  },
  {
    name: 'Silver',
    cost: 45,
    color: '#aaaaaa',
    perks: ['All Bronze benefits', 'Priority court booking', 'Members-only clinics'],
  },
  {
    name: 'Gold',
    cost: 80,
    color: '#f0c040',
    perks: ['All Silver benefits', 'Exclusive VIP events', 'VIP lounge access'],
  },
];

export const POSITIONS = [
  { label: 'Player', value: 'player', description: 'Join a team or club roster.' },
  { label: 'Coach', value: 'coach', description: 'Training and clinic coaching role.' },
  { label: 'Referee', value: 'referee', description: 'Officiate matches and tournaments.' },
];
