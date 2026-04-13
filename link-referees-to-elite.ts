import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Update John Harris to be part of Elite Sports Academy
 * and add additional referees to the organization
 */
async function linkRefereesToOrganization() {
  try {
    console.log('🏌️ Linking referees to Elite Sports Academy...\n');

    // Get Elite Sports Academy
    const eliteOrg = await prisma.organization.findUnique({
      where: { name: 'Elite Sports Academy' },
      select: { id: true, name: true },
    });

    if (!eliteOrg) {
      console.error('❌ Elite Sports Academy organization not found!');
      process.exit(1);
    }

    console.log(`Found organization: ${eliteOrg.name} (ID: ${eliteOrg.id})\n`);

    // 1. Update John Harris to Elite Sports Academy
    console.log('1️⃣  Updating John Harris to Elite Sports Academy...');
    const johnUser = await prisma.user.findUnique({
      where: { email: 'john.referee@example.com' },
      include: { referee: true },
    });

    if (johnUser) {
      // Update his player record to add him to the org (if he has one, or create one)
      const johnPlayer = await prisma.player.upsert({
        where: { userId: johnUser.id },
        update: { organizationId: eliteOrg.id },
        create: {
          userId: johnUser.id,
          organizationId: eliteOrg.id,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
        },
      });

      // Add him as a ClubMember of Elite Sports Academy
      const existingMember = await prisma.clubMember.findFirst({
        where: {
          organizationId: eliteOrg.id,
          playerId: johnUser.id,
        },
      });

      if (!existingMember) {
        await prisma.clubMember.create({
          data: {
            organizationId: eliteOrg.id,
            playerId: johnUser.id,
            role: 'referee',
            paymentStatus: 'active',
          },
        });
        console.log(`  ✓ John Harris (john.referee@example.com) added to Elite Sports Academy`);
      } else {
        console.log(`  ℹ️  John Harris already a member of Elite Sports Academy`);
      }
    } else {
      console.log('  ❌ John Harris not found');
    }

    // 2. Add more referees to Elite Sports Academy
    console.log('\n2️⃣  Adding more referees to Elite Sports Academy...');

    const newReferees = [
      {
        username: 'referee_carlos',
        email: 'carlos.referee@example.com',
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        phone: '+34-555-6001',
        gender: 'Male',
        dateOfBirth: new Date('1985-05-12'),
        nationality: 'Spain',
        bio: 'Professional tennis umpire with ATP certification',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
        experience: '14 years',
      },
      {
        username: 'referee_priya',
        email: 'priya.referee@example.com',
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+91-555-7001',
        gender: 'Female',
        dateOfBirth: new Date('1992-09-28'),
        nationality: 'India',
        bio: 'Certified tennis referee specializing in women\'s competitions',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
        experience: '11 years',
      },
      {
        username: 'referee_ahmed',
        email: 'ahmed.referee@example.com',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        phone: '+20-555-8001',
        gender: 'Male',
        dateOfBirth: new Date('1988-12-03'),
        nationality: 'Egypt',
        bio: 'International tennis referee with ITF Level 3 certification',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
        experience: '13 years',
      },
    ];

    const hashedPassword = await bcrypt.hash('tennis123', 10);

    for (const refData of newReferees) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: refData.email },
        });

        let user;
        if (existingUser) {
          console.log(`  ℹ️  ${refData.firstName} ${refData.lastName} already exists`);
          user = existingUser;
        } else {
          user = await prisma.user.create({
            data: {
              username: refData.username,
              email: refData.email,
              phone: refData.phone,
              passwordHash: hashedPassword,
              firstName: refData.firstName,
              lastName: refData.lastName,
              gender: refData.gender,
              dateOfBirth: refData.dateOfBirth,
              nationality: refData.nationality,
              bio: refData.bio,
              photo: refData.photo,
              referee: {
                create: {
                  matchesRefereed: 0,
                  ballCrewMatches: 0,
                  experience: refData.experience,
                  certifications: [
                    JSON.stringify({ name: 'ITF Level 2', issued: '2020-01-15', expires: '2027-01-15', status: 'Active' }),
                  ],
                },
              },
            },
            include: { referee: true },
          });

          console.log(`  ✓ Created referee: ${refData.firstName} ${refData.lastName} (${refData.email})`);
        }

        // Create player record for the referee (if not exists)
        const playerRecord = await prisma.player.upsert({
          where: { userId: user.id },
          update: { organizationId: eliteOrg.id },
          create: {
            userId: user.id,
            organizationId: eliteOrg.id,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
          },
        });

        // Add them as a ClubMember
        const existingMember = await prisma.clubMember.findFirst({
          where: {
            organizationId: eliteOrg.id,
            playerId: user.id,
          },
        });

        if (!existingMember) {
          await prisma.clubMember.create({
            data: {
              organizationId: eliteOrg.id,
              playerId: user.id,
              role: 'referee',
              paymentStatus: 'active',
            },
          });
          console.log(`    → Added to Elite Sports Academy as referee member`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${refData.firstName}:`, error instanceof Error ? error.message : error);
      }
    }

    // 3. Get summary of Elite Sports Academy referees
    console.log('\n3️⃣  Elite Sports Academy Referees Summary:');
    const clubMembers = await prisma.clubMember.findMany({
      where: {
        organizationId: eliteOrg.id,
        role: 'referee',
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`\nTotal referee members in Elite Sports Academy: ${clubMembers.length}\n`);
    for (const member of clubMembers) {
      const name = `${member.player.user.firstName} ${member.player.user.lastName}`;
      const email = member.player.user.email;
      console.log(`  • ${name} (${email}) - Joined: ${new Date(member.joinDate).toLocaleDateString()}`);
    }

    console.log(`\n✅ All referees have been linked to Elite Sports Academy!`);
  } catch (error) {
    console.error('Error linking referees to organization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
linkRefereesToOrganization();
