import { PrismaClient } from '../../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'tennis123';

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  nationality?: string;
  bio?: string;
  photo?: string;
  role: 'player' | 'coach' | 'admin' | 'finance_officer' | 'referee' | 'spectator';
  organizationId?: string;
  playerStats?: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
  };
  staffData?: {
    yearsOfExperience?: number;
    expertise?: string;
    coachingLevel?: string;
    certifications?: Array<{
      name: string;
      issuer?: string;
      issuedAt?: Date;
      expiresAt?: Date;
    }>;
  };
  refereeData?: {
    matchesRefereed?: number;
    experience?: string;
    certifications?: string[];
  };
}

export async function seedUsers(organizations: any[]) {
  console.log('👥 Seeding users...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const usersData: UserData[] = [
    // ==================== INDEPENDENT PLAYERS ====================
    {
      username: 'marcus_johnson',
      email: 'marcus.johnson@example.com',
      firstName: 'Marcus',
      lastName: 'Johnson',
      phone: '+1-555-1001',
      gender: 'Male',
      dateOfBirth: new Date('1995-03-15'),
      nationality: 'USA',
      bio: 'Professional tennis player, specializing in singles',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      role: 'player',
      playerStats: {
        matchesPlayed: 45,
        matchesWon: 32,
        matchesLost: 13,
      },
    },
    {
      username: 'anna_martinez',
      email: 'anna.martinez@example.com',
      firstName: 'Anna',
      lastName: 'Martinez',
      phone: '+1-555-1002',
      gender: 'Female',
      dateOfBirth: new Date('1998-07-22'),
      nationality: 'Spain',
      bio: 'Amateur player, love competitive matches',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      role: 'player',
      playerStats: {
        matchesPlayed: 28,
        matchesWon: 16,
        matchesLost: 12,
      },
    },
    {
      username: 'james_wilson',
      email: 'james.wilson@example.com',
      firstName: 'James',
      lastName: 'Wilson',
      phone: '+1-555-1003',
      gender: 'Male',
      dateOfBirth: new Date('1992-11-08'),
      nationality: 'UK',
      bio: 'Recreational player improving my game',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      role: 'player',
      playerStats: {
        matchesPlayed: 15,
        matchesWon: 7,
        matchesLost: 8,
      },
    },

    // ==================== PLAYERS BELONGING TO CENTRAL TENNIS CLUB ====================
    {
      username: 'sophia_chen',
      email: 'sophia.chen@example.com',
      firstName: 'Sophia',
      lastName: 'Chen',
      phone: '+1-555-1004',
      gender: 'Female',
      dateOfBirth: new Date('2000-05-12'),
      nationality: 'USA',
      bio: 'Junior player training at Central Tennis Club',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'player',
      organizationId: organizations[0].id, // Central Tennis Club
      playerStats: {
        matchesPlayed: 22,
        matchesWon: 14,
        matchesLost: 8,
      },
    },
    {
      username: 'david_kim',
      email: 'david.kim@example.com',
      firstName: 'David',
      lastName: 'Kim',
      phone: '+1-555-1005',
      gender: 'Male',
      dateOfBirth: new Date('1996-09-30'),
      nationality: 'USA',
      bio: 'Advanced player at Central Club',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      role: 'player',
      organizationId: organizations[0].id, // Central Tennis Club
      playerStats: {
        matchesPlayed: 38,
        matchesWon: 28,
        matchesLost: 10,
      },
    },

    // ==================== PLAYERS AT ELITE SPORTS ACADEMY ====================
    {
      username: 'lucas_santos',
      email: 'lucas.santos@example.com',
      firstName: 'Lucas',
      lastName: 'Santos',
      phone: '+1-555-1006',
      gender: 'Male',
      dateOfBirth: new Date('1999-02-14'),
      nationality: 'Brazil',
      bio: 'Elite player at Elite Sports Academy',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      role: 'player',
      organizationId: organizations[1].id, // Elite Sports Academy
      playerStats: {
        matchesPlayed: 52,
        matchesWon: 41,
        matchesLost: 11,
      },
    },

    // ==================== PLAYERS AT COMMUNITY COURTS ====================
    {
      username: 'emma_turner',
      email: 'emma.turner@example.com',
      firstName: 'Emma',
      lastName: 'Turner',
      phone: '+1-555-1007',
      gender: 'Female',
      dateOfBirth: new Date('2001-06-18'),
      nationality: 'USA',
      bio: 'Community player developing skills',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'player',
      organizationId: organizations[2].id, // Community Tennis Courts
      playerStats: {
        matchesPlayed: 12,
        matchesWon: 6,
        matchesLost: 6,
      },
    },

    // ==================== COACHES ====================
    {
      username: 'coach_robert',
      email: 'robert.coach@example.com',
      firstName: 'Robert',
      lastName: 'Alexander',
      phone: '+1-555-2001',
      gender: 'Male',
      dateOfBirth: new Date('1975-01-20'),
      nationality: 'USA',
      bio: 'Head coach at Central Tennis Club. 20 years experience.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      role: 'coach',
      organizationId: organizations[0].id, // Central Tennis Club
      staffData: {
        yearsOfExperience: 20,
        expertise: 'Tennis coaching - singles and doubles',
        coachingLevel: 'Professional',
        certifications: [
          {
            name: 'ITF Level 3',
            issuer: 'International Tennis Federation',
            issuedAt: new Date('2015-06-15'),
            expiresAt: new Date('2027-06-15'),
          },
          {
            name: 'ATP Certified Coach',
            issuer: 'Association of Tennis Professionals',
            issuedAt: new Date('2018-03-10'),
          },
        ],
      },
    },
    {
      username: 'coach_elena',
      email: 'elena.coach@example.com',
      firstName: 'Elena',
      lastName: 'Petrov',
      phone: '+1-555-2002',
      gender: 'Female',
      dateOfBirth: new Date('1985-04-10'),
      nationality: 'Russia',
      bio: 'Elite coach at Elite Sports Academy. Former professional player.',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'coach',
      organizationId: organizations[1].id, // Elite Sports Academy
      staffData: {
        yearsOfExperience: 15,
        expertise: 'High-performance training',
        coachingLevel: 'Professional',
        certifications: [
          {
            name: 'WTA Certified Coach',
            issuer: 'Women\'s Tennis Association',
            issuedAt: new Date('2016-08-20'),
          },
        ],
      },
    },

    // ==================== REFEREE ====================
    {
      username: 'referee_john',
      email: 'john.referee@example.com',
      firstName: 'John',
      lastName: 'Harris',
      phone: '+1-555-4001',
      gender: 'Male',
      dateOfBirth: new Date('1978-10-28'),
      nationality: 'USA',
      bio: 'Professional referee with ITF certification',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      role: 'referee',
      refereeData: {
        matchesRefereed: 87,
        experience: '15 years',
        certifications: ['ITF', 'ATP', 'WTA'],
      },
    },

    // ==================== SPECTATOR ====================
    {
      username: 'spectator_alice',
      email: 'alice.spectator@example.com',
      firstName: 'Alice',
      lastName: 'Brown',
      phone: '+1-555-5001',
      gender: 'Female',
      dateOfBirth: new Date('1990-07-16'),
      nationality: 'USA',
      bio: 'Tennis enthusiast and events spectator',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'spectator',
    },
  ];

  const createdUsers = [];

  for (const userData of usersData) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          phone: userData.phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        create: {
          username: userData.username,
          email: userData.email,
          phone: userData.phone,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          nationality: userData.nationality,
          bio: userData.bio,
          photo: userData.photo,
          player:
            userData.role === 'player'
              ? {
                  create: {
                    matchesPlayed: userData.playerStats?.matchesPlayed || 0,
                    matchesWon: userData.playerStats?.matchesWon || 0,
                    matchesLost: userData.playerStats?.matchesLost || 0,
                    organizationId: userData.organizationId,
                  },
                }
              : userData.role === 'admin' || userData.role === 'finance_officer'
                ? {
                    create: {
                      matchesPlayed: 0,
                      matchesWon: 0,
                      matchesLost: 0,
                      organizationId: userData.organizationId,
                    },
                  }
                : undefined,
          staff:
            userData.role === 'coach'
              ? {
                  create: {
                    role: 'Head Coach',
                    contact: userData.email,
                    yearsOfExperience: userData.staffData?.yearsOfExperience || 0,
                    expertise: userData.staffData?.expertise,
                    coachingLevel: userData.staffData?.coachingLevel,
                    organizationId: userData.organizationId,
                    certifications: {
                      createMany: {
                        data: userData.staffData?.certifications || [],
                      },
                    },
                  },
                }
              : undefined,
          referee:
            userData.role === 'referee'
              ? {
                  create: {
                    matchesRefereed: userData.refereeData?.matchesRefereed || 0,
                    experience: userData.refereeData?.experience,
                    certifications: userData.refereeData?.certifications || [],
                  },
                }
              : undefined,
          spectator: userData.role === 'spectator' ? { create: {} } : undefined,
        },
        include: {
          player: true,
          staff: true,
          referee: true,
          spectator: true,
        },
      });

      createdUsers.push(user);
      console.log(`  ✓ ${userData.role.toUpperCase()}: ${user.email}`);
    } catch (error) {
      console.error(`  ✗ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('');
  return createdUsers;
}
