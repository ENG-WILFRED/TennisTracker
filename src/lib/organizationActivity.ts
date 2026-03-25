import prisma from '@/lib/prisma';

export interface ActivityData {
  organizationId: string;
  playerId: string;
  action: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export class OrganizationActivityTracker {
  static async trackActivity(data: ActivityData) {
    try {
      // Create activity record
      const activity = await prisma.organizationActivity.create({
        data: {
          organizationId: data.organizationId,
          playerId: data.playerId,
          action: data.action,
          details: data.details,
          metadata: data.metadata || {},
        },
      });

      // Update organization activity score
      await this.updateActivityScore(data.organizationId);

      return activity;
    } catch (error) {
      console.error('Failed to track organization activity:', error);
      throw error;
    }
  }

  static async updateActivityScore(organizationId: string) {
    try {
      // Calculate activity score based on recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivities = await prisma.organizationActivity.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Simple scoring: 1 point per activity, max 100
      const newScore = Math.min(recentActivities, 100);

      await prisma.organization.update({
        where: { id: organizationId },
        data: { activityScore: newScore },
      });
    } catch (error) {
      console.error('Failed to update activity score:', error);
    }
  }

  static async getRecentActivities(organizationId: string, limit = 20) {
    try {
      const activities = await prisma.organizationActivity.findMany({
        where: { organizationId },
        include: {
          player: {
            include: {
              user: {
                select: { firstName: true, lastName: true, photo: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        player: {
          name: `${activity.player.user.firstName} ${activity.player.user.lastName}`,
          photo: activity.player.user.photo,
        },
        createdAt: activity.createdAt,
      }));
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }

  // Predefined activity types
  static readonly ACTIONS = {
    COURT_BOOKING: 'court_booking',
    TOURNAMENT_REGISTRATION: 'tournament_registration',
    RANKING_CHALLENGE: 'ranking_challenge',
    PAYMENT_MADE: 'payment_made',
    MEMBER_JOINED: 'member_joined',
    EVENT_ATTENDED: 'event_attended',
    ACHIEVEMENT_EARNED: 'achievement_earned',
  } as const;
}