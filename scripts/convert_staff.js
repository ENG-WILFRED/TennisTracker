import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function convertStaffToMemberships() {
  console.log('=== CONVERTING STAFF TO MEMBERSHIPS ===');
  
  try {
    // Get all staff
    const staff = await prisma.staff.findMany({
      include: {
        user: {
          include: {
            player: {
              include: {
                clubMembers: true
              }
            }
          }
        }
      }
    });
    
    for (const staffMember of staff) {
      const user = staffMember.user;
      const player = user.player;
      
      if (!player) continue;
      
      // Remove any ClubMember records for this staff member
      for (const clubMember of player.clubMembers) {
        console.log('Removing ClubMember record for staff:', user.username, '(' + staffMember.role + ')');
        await prisma.clubMember.delete({
          where: { id: clubMember.id }
        });
      }
      
      // Create Membership record for organizational role
      const role = staffMember.role.toLowerCase().includes('coach') ? 'coach' : 
                   staffMember.role.toLowerCase().includes('manager') ? 'admin' : 'staff';
      
      // Check if membership already exists for this org
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          orgId: staffMember.organizationId
        }
      });
      
      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            orgId: staffMember.organizationId,
            role: role,
            status: 'accepted',
            joinedAt: new Date(),
            approvedAt: new Date()
          }
        });
        console.log('Created ' + role + ' membership for:', user.username);
      } else if (existingMembership.role !== role) {
        // Update the role if it's different
        await prisma.membership.update({
          where: { id: existingMembership.id },
          data: { role: role }
        });
        console.log('Updated membership role to ' + role + ' for:', user.username);
      } else {
        console.log('Membership already exists for:', user.username, '(' + role + ')');
      }
    }
    
    console.log('Staff conversion complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

convertStaffToMemberships();
