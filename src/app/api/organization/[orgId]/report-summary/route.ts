import prisma from '@/lib/prisma';
import { OrganizationActivityTracker } from '@/lib/organizationActivity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const [
      totalMembers,
      activeStaffCount,
      totalStaffCount,
      totalTasks,
      completedTaskCount,
      eventCount,
      tournamentCount,
      recentBookings,
      recentFinances,
      newMemberships,
      recentActivities,
      totalRevenue
    ] = await Promise.all([
      prisma.clubMember.count({ where: { organizationId: orgId } }),
      prisma.staff.count({ where: { organizationId: orgId, isDeleted: false, isActive: true } }),
      prisma.staff.count({ where: { organizationId: orgId, isDeleted: false } }),
      prisma.task.count({ where: { organizationId: orgId } }),
      prisma.task.count({ where: { organizationId: orgId, status: 'COMPLETED' } }),
      prisma.clubEvent.count({ where: { organizationId: orgId } }),
      prisma.clubEvent.count({ where: { organizationId: orgId, eventType: 'tournament' } }),
      prisma.courtBooking.findMany({
        where: { organizationId: orgId },
        include: {
          court: true,
          member: {
            include: {
              player: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { startTime: 'desc' },
        take: 6,
      }),
      prisma.clubFinance.findMany({
        where: { organizationId: orgId },
        include: { transactionRecords: true },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
        take: 6,
      }),
      prisma.clubMember.findMany({
        where: { organizationId: orgId },
        include: {
          player: {
            include: {
              user: true,
            },
          },
          membershipTier: true,
        },
        orderBy: { joinDate: 'desc' },
        take: 6,
      }),
      OrganizationActivityTracker.getRecentActivities(orgId, 8),
      prisma.clubFinance.findMany({
        where: { organizationId: orgId },
        include: { transactionRecords: true },
      }).then((finances) =>
        finances.reduce((sum, finance) => {
          const amount = finance.transactionRecords?.reduce(
            (innerSum, record) => innerSum + Number(record.amount || 0),
            0
          );
          return sum + (amount ?? 0);
        }, 0)
      ),
    ]);

    const summary = {
      counts: {
        totalMembers,
        activeStaffCount,
        totalStaffCount,
        totalTasks,
        completedTaskCount,
        pendingTaskCount: Math.max(0, totalTasks - completedTaskCount),
        eventCount,
        tournamentCount,
        recentBookings: recentBookings.length,
        recentFinances: recentFinances.length,
        newMemberships: newMemberships.length,
      },
      totals: {
        recentRevenue: totalRevenue,
      },
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        courtName: booking.court?.name || `Court ${booking.court?.courtNumber ?? ''}`,
        memberName: `${booking.member?.player?.user?.firstName || 'Unknown'} ${booking.member?.player?.user?.lastName || ''}`.trim(),
        startTime: booking.startTime?.toISOString(),
        endTime: booking.endTime?.toISOString(),
      })),
      recentFinances: recentFinances.map((finance) => ({
        id: finance.id,
        month: finance.month,
        year: finance.year,
        totalAmount: finance.transactionRecords?.reduce(
          (sum, record) => sum + Number(record.amount || 0),
          0
        ),
        transactionCount: finance.transactionRecords?.length || 0,
      })),
      newMemberships: newMemberships.map((member) => ({
        id: member.id,
        name: `${member.player?.user?.firstName || ''} ${member.player?.user?.lastName || ''}`.trim(),
        tier: member.membershipTier?.name || 'Standard',
        joinDate: member.joinDate?.toISOString(),
      })),
      recentActivities,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization report summary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
