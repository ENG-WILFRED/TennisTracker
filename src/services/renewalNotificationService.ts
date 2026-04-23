import prisma from '@/lib/prisma';
import { addDays, isBefore, isAfter } from 'date-fns';

export interface ExpiryNotification {
  memberId: string;
  memberName: string;
  email: string;
  organizationName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  notificationType: 'warning' | 'urgent' | 'expired';
}

export class RenewalNotificationService {
  // Send notifications for memberships expiring soon
  async sendExpiryNotifications(): Promise<ExpiryNotification[]> {
    const notifications: ExpiryNotification[] = [];

    // Get memberships that will expire in the next 30 days
    const thirtyDaysFromNow = addDays(new Date(), 30);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: 'accepted',
        approvedAt: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }) as any[];

    for (const membership of expiringMemberships) {
      if (!membership.approvedAt) continue;

      // Calculate expiry date (1 year from approval)
      const expiryDate = new Date(membership.approvedAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      // Skip if already expired more than 30 days ago
      if (isBefore(expiryDate, addDays(new Date(), -30))) continue;

      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let notificationType: 'warning' | 'urgent' | 'expired';
      if (isAfter(new Date(), expiryDate)) {
        notificationType = 'expired';
      } else if (daysUntilExpiry <= 7) {
        notificationType = 'urgent';
      } else if (daysUntilExpiry <= 30) {
        notificationType = 'warning';
      } else {
        continue; // Not ready for notification yet
      }

      const notification: ExpiryNotification = {
        memberId: membership.userId,
        memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
        email: membership.user.email,
        organizationName: membership.organization.name,
        expiryDate,
        daysUntilExpiry,
        notificationType
      };

      notifications.push(notification);

      // Send notification (email, push, etc.)
      await this.sendNotification(notification);
    }

    return notifications;
  }

  private async sendNotification(notification: ExpiryNotification): Promise<void> {
    const { memberName, organizationName, expiryDate, daysUntilExpiry, notificationType } = notification;

    let subject: string;
    let message: string;

    switch (notificationType) {
      case 'expired':
        subject = `Your ${organizationName} Membership Has Expired`;
        message = `Dear ${memberName},\n\nYour membership with ${organizationName} expired on ${expiryDate.toLocaleDateString()}. Please renew your membership to continue enjoying our services.`;
        break;
      case 'urgent':
        subject = `Urgent: Your ${organizationName} Membership Expires Soon`;
        message = `Dear ${memberName},\n\nYour membership with ${organizationName} will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} on ${expiryDate.toLocaleDateString()}. Please renew soon to avoid service interruption.`;
        break;
      case 'warning':
        subject = `Reminder: Your ${organizationName} Membership Expires Soon`;
        message = `Dear ${memberName},\n\nThis is a friendly reminder that your membership with ${organizationName} will expire in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}. Consider renewing early to avoid any lapse in service.`;
        break;
    }

    // TODO: Implement actual notification sending
    // This could be email, SMS, push notifications, etc.
    console.log('Sending notification:', { subject, message });

    // For now, create a notification log in the database
    await prisma.notificationLog.create({
      data: {
        taskId: 'renewal-notification', // dummy taskId
        recipientEmail: notification.email,
        status: 'SENT',
        sentAt: new Date()
      }
    });
  }

  // Get expiring memberships for a specific organization
  async getExpiringMemberships(organizationId: string, daysAhead: number = 30): Promise<ExpiryNotification[]> {
    const targetDate = addDays(new Date(), daysAhead);
    const notifications: ExpiryNotification[] = [];

    const memberships = await prisma.membership.findMany({
      where: {
        orgId: organizationId,
        status: 'accepted',
        approvedAt: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    for (const membership of memberships) {
      if (!membership.approvedAt) continue;

      const expiryDate = new Date(membership.approvedAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      if (isAfter(expiryDate, new Date()) && isBefore(expiryDate, targetDate)) {
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        notifications.push({
          memberId: membership.userId,
          memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
          email: membership.user.email,
          organizationName: membership.organization.name,
          expiryDate,
          daysUntilExpiry,
          notificationType: daysUntilExpiry <= 7 ? 'urgent' : 'warning'
        });
      }
    }

    return notifications;
  }
}

// Singleton instance
export const renewalNotificationService = new RenewalNotificationService();