import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function updateFinanceOfficerToStaff() {
  console.log('=== UPDATING FINANCE_OFFICER ROLES TO STAFF ===');

  try {
    // Update Membership records with finance_officer role to staff
    const membershipUpdate = await prisma.membership.updateMany({
      where: {
        role: 'finance_officer'
      },
      data: {
        role: 'staff'
      }
    });

    console.log(`Updated ${membershipUpdate.count} membership records from 'finance_officer' to 'staff'`);

    // Update MembershipInvitation records with finance_officer role to staff
    const invitationUpdate = await prisma.membershipInvitation.updateMany({
      where: {
        role: 'finance_officer'
      },
      data: {
        role: 'staff'
      }
    });

    console.log(`Updated ${invitationUpdate.count} membership invitation records from 'finance_officer' to 'staff'`);

    // Update ClubMember records with officer role to staff (since officer maps to staff)
    const clubMemberUpdate = await prisma.clubMember.updateMany({
      where: {
        role: 'officer'
      },
      data: {
        role: 'staff'
      }
    });

    console.log(`Updated ${clubMemberUpdate.count} club member records from 'officer' to 'staff'`);

    console.log('✅ Role updates completed successfully');

  } catch (error) {
    console.error('❌ Error updating roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFinanceOfficerToStaff();