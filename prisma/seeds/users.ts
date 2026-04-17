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
    ballCrewMatches?: number;
    experience?: string;
    certifications?: string[];
    organizationId?: string;
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
      bio: 'Professional referee with ITF certification. Expert in singles and doubles matches.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      role: 'referee',
      organizationId: organizations[0].id, // Central Tennis Club
      refereeData: {
        matchesRefereed: 127,
        ballCrewMatches: 45,
        experience: '18 years',
        organizationId: organizations[0].id,
        certifications: [
          JSON.stringify({ name: 'ITF Level 2', issued: '2020-05-15', expires: '2027-05-15', status: 'Active' }),
          JSON.stringify({ name: 'ATP Certified', issued: '2021-01-20', expires: '2028-01-20', status: 'Active' }),
          JSON.stringify({ name: 'WTA Certified', issued: '2019-11-10', expires: '2026-11-10', status: 'Expiring Soon' }),
        ],
      },
    },
    {
      username: 'referee_sarah',
      email: 'sarah.referee@example.com',
      firstName: 'Sarah',
      lastName: 'Kipchoge',
      phone: '+254702234567',
      gender: 'Female',
      dateOfBirth: new Date('1990-07-22'),
      nationality: 'Kenya',
      bio: 'Certified tennis referee specializing in women\'s tennis matches. Known for excellent sportsmanship.',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      role: 'referee',
      organizationId: organizations[0].id, // Central Tennis Club
      refereeData: {
        matchesRefereed: 89,
        ballCrewMatches: 32,
        experience: '12 years',
        organizationId: organizations[0].id,
        certifications: [
          JSON.stringify({ name: 'ITF Level 2', issued: '2019-08-20', expires: '2026-08-20', status: 'Active' }),
          JSON.stringify({ name: 'ATP Certified', issued: '2022-03-15', expires: '2029-03-15', status: 'Active' }),
        ],
      },
    },
    {
      username: 'referee_michael',
      email: 'michael.referee@example.com',
      firstName: 'Michael',
      lastName: 'Kimani',
      phone: '+254703234567',
      gender: 'Male',
      dateOfBirth: new Date('1988-11-05'),
      nationality: 'Kenya',
      bio: 'Experienced line umpire and match referee. Certified for international tournaments.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      role: 'referee',
      organizationId: organizations[1].id, // Elite Sports Academy
      refereeData: {
        matchesRefereed: 156,
        ballCrewMatches: 67,
        experience: '16 years',
        organizationId: organizations[1].id,
        certifications: [
          JSON.stringify({ name: 'ITF Level 3', issued: '2018-06-10', expires: '2028-06-10', status: 'Active' }),
          JSON.stringify({ name: 'ATP Certified', issued: '2020-09-01', expires: '2027-09-01', status: 'Active' }),
          JSON.stringify({ name: 'WTA Certified', issued: '2021-02-14', expires: '2028-02-14', status: 'Active' }),
          JSON.stringify({ name: 'Davis Cup Certified', issued: '2022-05-20', expires: '2029-05-20', status: 'Active' }),
        ],
      },
    },
    {
      username: 'referee_elizabeth',
      email: 'elizabeth.referee@example.com',
      firstName: 'Elizabeth',
      lastName: 'Mutua',
      phone: '+254704234567',
      gender: 'Female',
      dateOfBirth: new Date('1992-02-28'),
      nationality: 'Kenya',
      bio: 'Professional tennis umpire with focus on doubles matches and mixed tournaments.',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'referee',
      organizationId: organizations[1].id, // Elite Sports Academy
      refereeData: {
        matchesRefereed: 76,
        ballCrewMatches: 28,
        experience: '10 years',
        organizationId: organizations[1].id,
        certifications: [
          JSON.stringify({ name: 'ITF Level 2', issued: '2020-11-12', expires: '2027-11-12', status: 'Active' }),
          JSON.stringify({ name: 'WTA Certified', issued: '2021-07-08', expires: '2028-07-08', status: 'Active' }),
        ],
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
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          nationality: userData.nationality,
          bio: userData.bio,
          photo: userData.photo,
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
        },
        include: {
          player: true,
          staff: true,
          referee: true,
          spectator: true,
        },
      });

      // Sync role-specific relation data for existing users.
      if (userData.role !== 'spectator') {
        await prisma.spectator.deleteMany({ where: { userId: user.id } });
      }
      if (userData.role !== 'referee') {
        await prisma.referee.deleteMany({ where: { userId: user.id } });
      }

      if (userData.role === 'player' || userData.role === 'admin' || userData.role === 'finance_officer') {
        await prisma.player.upsert({
          where: { userId: user.id },
          update: {
            organizationId: userData.organizationId,
            matchesPlayed: userData.playerStats?.matchesPlayed ?? 0,
            matchesWon: userData.playerStats?.matchesWon ?? 0,
            matchesLost: userData.playerStats?.matchesLost ?? 0,
          },
          create: {
            userId: user.id,
            organizationId: userData.organizationId,
            matchesPlayed: userData.playerStats?.matchesPlayed || 0,
            matchesWon: userData.playerStats?.matchesWon || 0,
            matchesLost: userData.playerStats?.matchesLost || 0,
          },
        });
      }

      if (userData.role === 'coach') {
        await prisma.staff.upsert({
          where: { userId: user.id },
          update: {
            role: 'Head Coach',
            contact: userData.email,
            yearsOfExperience: userData.staffData?.yearsOfExperience || 0,
            expertise: userData.staffData?.expertise,
            coachingLevel: userData.staffData?.coachingLevel,
            organizationId: userData.organizationId,
          },
          create: {
            userId: user.id,
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
        });
      }

      if (userData.role === 'referee') {
        await prisma.referee.upsert({
          where: { userId: user.id },
          update: {
            matchesRefereed: userData.refereeData?.matchesRefereed || 0,
            ballCrewMatches: userData.refereeData?.ballCrewMatches || 0,
            experience: userData.refereeData?.experience,
            certifications: userData.refereeData?.certifications || [],
          },
          create: {
            userId: user.id,
            matchesRefereed: userData.refereeData?.matchesRefereed || 0,
            ballCrewMatches: userData.refereeData?.ballCrewMatches || 0,
            experience: userData.refereeData?.experience,
            certifications: userData.refereeData?.certifications || [],
          },
        });
      }

      if (userData.role === 'spectator') {
        await prisma.spectator.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });
      }

      createdUsers.push(user);
      console.log(`  ✓ ${userData.role.toUpperCase()}: ${user.email}`);
    } catch (error) {
      console.error(`  ✗ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('');
  return createdUsers;
}
