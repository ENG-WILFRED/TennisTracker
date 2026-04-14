import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrganizationPublicDetail from '@/components/organization/OrganizationPublicDetail';

export default async function OrganizationPage({ params }: { params: { id: string } }) {
  const orgId = params.id;

  const baseQuery = {
    where: { id: orgId },
    include: {
      membershipTiers: {
        select: {
          id: true,
          name: true,
          description: true,
          monthlyPrice: true,
          courtHoursPerMonth: true,
          maxConcurrentBookings: true,
          discountPercentage: true,
          benefitsJson: true,
        },
      },
      members: {
        select: {
          id: true,
          role: true,
          joinDate: true,
          player: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  photo: true,
                },
              },
            },
          },
        },
        take: 20,
        orderBy: { joinDate: 'desc' as const },
      },
      courts: {
        select: {
          id: true,
          name: true,
          courtNumber: true,
          surface: true,
          indoorOutdoor: true,
          lights: true,
          status: true,
        },
      },
      events: {
        select: {
          id: true,
          name: true,
          eventType: true,
          startDate: true,
          registrationCap: true,
          entryFee: true,
        },
        take: 6,
        orderBy: { startDate: 'asc' as const },
      },
      announcements: {
        select: {
          id: true,
          title: true,
          message: true,
          announcementType: true,
          isActive: true,
          createdAt: true,
        },
        take: 6,
        orderBy: { createdAt: 'desc' as const },
      },
      finances: {
        select: {
          id: true,
          month: true,
          year: true,
          membershipRevenue: true,
          courtBookingRevenue: true,
          totalRevenue: true,
          netProfit: true,
        },
        take: 12,
        orderBy: [{ year: 'desc' as const }, { month: 'desc' as const }],
      },
      ratings: {
        select: {
          id: true,
          rating: true,
          category: true,
          comment: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' as const },
      },
      _count: {
        select: {
          members: true,
          courts: true,
          events: true,
        },
      },
    },
  };

  let organization = await prisma.organization.findUnique(baseQuery);
  if (!organization) {
    organization = await prisma.organization.findUnique({
      where: { slug: orgId },
      include: baseQuery.include,
    });
  }

  if (!organization) {
    notFound();
  }

  const formattedOrganization = {
    ...organization,
    membershipTiers: organization.membershipTiers.map((tier: any) => ({
      ...tier,
      benefits: tier.benefitsJson ? JSON.parse(tier.benefitsJson) : [],
    })),
    events: organization.events.map((event: any) => ({
      ...event,
      startDate: event.startDate?.toISOString() || null,
    })),
    announcements: organization.announcements.map((announcement: any) => ({
      ...announcement,
      createdAt: announcement.createdAt?.toISOString() || null,
    })),
    members: organization.members.map((member: any) => ({
      ...member,
      joinDate: member.joinDate?.toISOString() || null,
    })),
    finances: organization.finances.map((finance: any) => ({
      ...finance,
    })),
    ratings: organization.ratings.map((rating: any) => ({
      ...rating,
      createdAt: rating.createdAt?.toISOString() || null,
    })),
  };

  return <OrganizationPublicDetail organization={formattedOrganization} />;
}
