import { PrismaClient } from '../../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'tennis123';

const MINIMAL_ORGANIZATION_SLUGS = [
  'central-tennis-club',
  'elite-sports-academy',
  'community-tennis-courts',
  'lakeside-tennis-centre',
  'summit-sports-arena',
];

interface MinimalUserData {
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
  role: 'player' | 'coach' | 'referee' | 'staff';
  organizationId?: string;
}

export async function seedMinimalOrganizations() {
  console.log('🏢 Seeding minimal organizations...');

  const organizationData = [
    {
      name: 'Central Tennis Club',
      slug: 'central-tennis-club',
      description: 'Local club with great courts and community programs.',
      address: '123 Main Street',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000001',
      email: 'hello@centraltennis.co.ke',
      primaryColor: '#1d4ed8',
    },
    {
      name: 'Elite Sports Academy',
      slug: 'elite-sports-academy',
      description: 'High-performance academy focused on competitive development.',
      address: '45 Academy Road',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000002',
      email: 'info@eliteacademy.co.ke',
      primaryColor: '#047857',
    },
    {
      name: 'Community Tennis Courts',
      slug: 'community-tennis-courts',
      description: 'Accessible community courts for all ages and levels.',
      address: '88 Park Lane',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000003',
      email: 'contact@communitycourts.co.ke',
      primaryColor: '#dc2626',
    },
    {
      name: 'Lakeside Tennis Centre',
      slug: 'lakeside-tennis-centre',
      description: 'Relaxed lakeside venue for social tennis and training.',
      address: '12 Lakeview Drive',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000004',
      email: 'bookings@lakesidetennis.co.ke',
      primaryColor: '#0f766e',
    },
    {
      name: 'Summit Sports Arena',
      slug: 'summit-sports-arena',
      description: 'Professional sports hub with dedicated tennis facilities.',
      address: '9 Summit Boulevard',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000005',
      email: 'office@summitsports.co.ke',
      primaryColor: '#7c3aed',
    },
  ];

  const organizations = [];
  for (const orgData of organizationData) {
    const organization = await prisma.organization.upsert({
      where: { name: orgData.name },
      update: orgData,
      create: orgData,
    });
    organizations.push(organization);
    console.log(`  ✓ ${organization.name}`);
  }

  return organizations;
}

export async function seedMinimalUsers(organizations: Array<{ id: string; name?: string }>) {
  console.log('👥 Seeding minimal users...');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const usersData: MinimalUserData[] = [];

  if (organizations.length === 0) {
    console.log('⚠️  No organizations passed to seedMinimalUsers. Requerying minimal organizations from the database.');
    organizations = await prisma.organization.findMany({
      where: { slug: { in: MINIMAL_ORGANIZATION_SLUGS } },
      orderBy: { slug: 'asc' },
    });
  }

  if (organizations.length > MINIMAL_ORGANIZATION_SLUGS.length) {
    organizations = organizations.slice(0, MINIMAL_ORGANIZATION_SLUGS.length);
  }

  if (organizations.length === 0) {
    console.log('⚠️  No organizations found to assign users to. Skipping user seed.');
    return [];
  }

  const playerNames = [
    ['Marcus', 'Johnson'],
    ['Anna', 'Martinez'],
    ['James', 'Wilson'],
    ['Sophia', 'Chen'],
    ['David', 'Kim'],
    ['Lucas', 'Santos'],
    ['Emma', 'Turner'],
    ['Amina', 'Ali'],
    ['Grace', 'Mwangi'],
    ['Noah', 'Omondi'],
    ['Mia', 'Njoroge'],
    ['Ethan', 'Kariuki'],
    ['Lina', 'Otieno'],
    ['Owen', 'Mwenda'],
    ['Leah', 'Kamau'],
    ['Aaron', 'Kiprono'],
    ['Nadia', 'Wanjiru'],
    ['Joel', 'Karani'],
    ['Faith', 'Kamau'],
    ['Samuel', 'Odhiambo'],
  ];

  const coaches = [
    ['Robert', 'Alexander'],
    ['Elena', 'Petrov'],
    ['Asha', 'Nairobi'],
    ['Mateo', 'Gonzalez'],
    ['Li', 'Huang'],
  ];

  const referees = [
    ['John', 'Harris'],
    ['Sarah', 'Kipchoge'],
    ['Michael', 'Kimani'],
    ['Elizabeth', 'Mutua'],
    ['Noah', 'Mwangi'],
  ];

  const staffTitles = [
    'Head Coach',
    'Assistant Coach',
    'Fitness Trainer',
    'Court Manager',
    'Event Coordinator',
  ];

  let playerIndex = 0;
  for (let orgIndex = 0; orgIndex < organizations.length; orgIndex += 1) {
    const org = organizations[orgIndex];
    if (!org) continue;
    const orgName = org.name || 'the organization';
    for (let j = 0; j < 4; j += 1) {
      const [firstName, lastName] = playerNames[playerIndex];
      usersData.push({
        username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        firstName,
        lastName,
        gender: j % 2 === 0 ? 'Male' : 'Female',
        dateOfBirth: new Date(1990 + (playerIndex % 15), playerIndex % 12, (playerIndex % 28) + 1),
        nationality: 'Kenya',
        bio: `Player ${firstName} ${lastName} training at ${orgName}.`,
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
        role: 'player',
        organizationId: org.id,
      });
      playerIndex += 1;
    }
  }

  for (let i = 0; i < coaches.length; i += 1) {
    const org = organizations[i];
    if (!org) continue;
    const [firstName, lastName] = coaches[i];
    usersData.push({
      username: `coach_${firstName.toLowerCase()}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      dateOfBirth: new Date(1985 + i, (i + 1) % 12, 1 + i),
      nationality: 'Kenya',
      bio: `Coach ${firstName} ${lastName} at ${org.name}.`,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      role: 'coach',
      organizationId: org.id,
    });
  }

  for (let i = 0; i < referees.length; i += 1) {
    const [firstName, lastName] = referees[i];
    usersData.push({
      username: `referee_${firstName.toLowerCase()}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      dateOfBirth: new Date(1982 + i, (i + 2) % 12, 10 + i),
      nationality: 'Kenya',
      bio: `Referee ${firstName} ${lastName}, certified and match-ready.`,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      role: 'referee',
    });
  }

  for (let orgIndex = 0; orgIndex < organizations.length; orgIndex += 1) {
    const org = organizations[orgIndex];
    if (!org) continue;
    for (let titleIndex = 0; titleIndex < staffTitles.length; titleIndex += 1) {
      const firstName = `Staff${orgIndex + 1}${titleIndex + 1}`;
      const lastName = `Member`;
      usersData.push({
        username: `${firstName.toLowerCase()}`,
        email: `${firstName.toLowerCase()}@example.com`,
        firstName,
        lastName,
        gender: titleIndex % 2 === 0 ? 'Male' : 'Female',
        dateOfBirth: new Date(1980 + orgIndex, titleIndex % 12, 15 + titleIndex),
        nationality: 'Kenya',
        bio: `${staffTitles[titleIndex]} for ${org.name}.`,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
        role: 'staff',
        organizationId: org.id,
      });
    }
  }

  const createdUsers = [];

  for (const userData of usersData) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          phone: userData.phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          nationality: userData.nationality,
          bio: userData.bio,
          photo: userData.photo,
        },
      });

      createdUsers.push(updatedUser);
      continue;
    }

    const passwordHash = await bcrypt.hash(`${userData.email}-${DEMO_PASSWORD}`, 10);

    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        passwordHash,
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
                  organizationId: userData.organizationId,
                },
              }
            : undefined,
        staff:
          userData.role === 'coach' || userData.role === 'staff'
            ? {
                create: {
                  role: userData.role === 'coach' ? 'Coach' : 'Staff Member',
                  organizationId: userData.organizationId,
                  contact: userData.email,
                  yearsOfExperience: 5,
                  coachingLevel: userData.role === 'coach' ? 'Professional' : 'Intermediate',
                },
              }
            : undefined,
        referee:
          userData.role === 'referee'
            ? {
                create: {
                  matchesRefereed: 0,
                  ballCrewMatches: 0,
                  experience: 'Certified referee',
                },
              }
            : undefined,
      },
    });

    createdUsers.push(user);
    console.log(`  ✓ ${userData.role.toUpperCase()}: ${userData.email}`);
  }

  return createdUsers;
}
