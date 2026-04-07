import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample referee data to seed
const refereeData = [
  {
    user: {
      email: 'james.referee@example.com',
      firstName: 'James',
      lastName: 'Omondi',
      phone: '+254701234567',
      gender: 'Male',
      dateOfBirth: new Date('1985-03-15'),
      nationality: 'Kenyan',
      bio: 'Professional tennis referee with extensive international experience in ATP and WTA tournaments.',
      username: 'james.omondi',
    },
    referee: {
      matchesRefereed: 127,
      ballCrewMatches: 45,
      experience: '18 years',
      certifications: [
        JSON.stringify({ name: 'ITF Level 2', issued: '2020-05-15', expires: '2027-05-15', status: 'Active' }),
        JSON.stringify({ name: 'ATP Certified', issued: '2021-01-20', expires: '2028-01-20', status: 'Active' }),
        JSON.stringify({ name: 'WTA Certified', issued: '2019-11-10', expires: '2026-11-10', status: 'Expiring Soon' }),
      ],
    },
  },
  {
    user: {
      email: 'sarah.referee@example.com',
      firstName: 'Sarah',
      lastName: 'Kipchoge',
      phone: '+254702234567',
      gender: 'Female',
      dateOfBirth: new Date('1990-07-22'),
      nationality: 'Kenyan',
      bio: 'Certified tennis referee specializing in women\'s tennis matches. Known for excellent sportsmanship and fair play.',
      username: 'sarah.kipchoge',
    },
    referee: {
      matchesRefereed: 89,
      ballCrewMatches: 32,
      experience: '12 years',
      certifications: [
        JSON.stringify({ name: 'ITF Level 2', issued: '2019-08-20', expires: '2026-08-20', status: 'Active' }),
        JSON.stringify({ name: 'ATP Certified', issued: '2022-03-15', expires: '2029-03-15', status: 'Active' }),
      ],
    },
  },
  {
    user: {
      email: 'michael.referee@example.com',
      firstName: 'Michael',
      lastName: 'Kimani',
      phone: '+254703234567',
      gender: 'Male',
      dateOfBirth: new Date('1988-11-05'),
      nationality: 'Kenyan',
      bio: 'Experienced line umpire and match referrer. Certified for international tournaments.',
      username: 'michael.kimani',
    },
    referee: {
      matchesRefereed: 156,
      ballCrewMatches: 67,
      experience: '16 years',
      certifications: [
        JSON.stringify({ name: 'ITF Level 3', issued: '2018-06-10', expires: '2028-06-10', status: 'Active' }),
        JSON.stringify({ name: 'ATP Certified', issued: '2020-09-01', expires: '2027-09-01', status: 'Active' }),
        JSON.stringify({ name: 'WTA Certified', issued: '2021-02-14', expires: '2028-02-14', status: 'Active' }),
        JSON.stringify({ name: 'Davis Cup Certified', issued: '2022-05-20', expires: '2029-05-20', status: 'Active' }),
      ],
    },
  },
  {
    user: {
      email: 'elizabeth.referee@example.com',
      firstName: 'Elizabeth',
      lastName: 'Mutua',
      phone: '+254704234567',
      gender: 'Female',
      dateOfBirth: new Date('1992-02-28'),
      nationality: 'Kenyan',
      bio: 'Professional tennis umpire with focus on doubles matches and mixed tournaments.',
      username: 'elizabeth.mutua',
    },
    referee: {
      matchesRefereed: 76,
      ballCrewMatches: 28,
      experience: '10 years',
      certifications: [
        JSON.stringify({ name: 'ITF Level 2', issued: '2020-11-12', expires: '2027-11-12', status: 'Active' }),
        JSON.stringify({ name: 'WTA Certified', issued: '2021-07-08', expires: '2028-07-08', status: 'Active' }),
      ],
    },
  },
];

async function seedReferees() {
  console.log('🏌️ Seeding referee data...');

  for (const refData of refereeData) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: refData.user.email },
      });

      if (existingUser) {
        console.log(`✓ User ${refData.user.email} already exists`);
        
        // Update referee data if it exists
        const existingReferee = await prisma.referee.findUnique({
          where: { userId: existingUser.id },
        });

        if (!existingReferee) {
          await prisma.referee.create({
            data: {
              userId: existingUser.id,
              ...refData.referee,
            },
          });
          console.log(`✓ Created referee record for ${refData.user.email}`);
        }
        continue;
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          ...refData.user,
          password: 'hashed_password_referee', // This should be hashed in production
        },
      });

      // Create referee record
      await prisma.referee.create({
        data: {
          userId: newUser.id,
          ...refData.referee,
        },
      });

      console.log(`✓ Created referee: ${refData.user.email}`);
    } catch (error) {
      console.error(`✗ Error seeding referee ${refData.user.email}:`, error);
    }
  }

  console.log('✓ Referee seeding complete');
}

export default seedReferees;
