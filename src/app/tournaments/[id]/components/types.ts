/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export type TournamentStatus = 'open' | 'upcoming' | 'completed' | 'cancelled';
export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'paid' | 'withdrawn';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  format: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  location: string;
  country?: string;
  prizePool?: number;
  entryFee?: number;
  maxParticipants: number;
  currentParticipants: number;
  status: TournamentStatus;
  organizationId: string;
  organizationName: string;
  organizationEmail?: string;
  organization?: {
    id: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    logo?: string;
  };
  applicationStatus: ApplicationStatus;
  paymentDue?: string;
  myResult?: { rank: number; total: number; wins: number; losses: number; winnings?: number };
  isFeatured?: boolean;
  rules?: string;
  instructions?: string;
  eatingAreas?: string;
  sleepingAreas?: string;
  courtInfo?: string;
  amenities?: any[];
}

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  initials: string;
  points: number;
  isMe?: boolean;
}

export interface Application {
  id: string;
  tournamentName: string;
  appliedDate: string;
  entryFee: number;
  status: ApplicationStatus;
}

export interface ScheduleEvent {
  date: string;
  label: string;
  past?: boolean;
  active?: boolean;
}

export type FilterKey = 'all' | 'open' | 'registered' | 'upcoming' | 'completed';