"use server";

import { notify } from '@/app/api/notification';

export type LoginNotificationPayload = {
  email: string;
  firstName: string;
  selectedRole: string;
  userId: string;
};

export async function sendLoginNotification(payload: LoginNotificationPayload) {
  try {
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${payload.selectedRole}/${payload.userId}`;

    const result = await notify({
      to: payload.email,
      channel: 'email',
      template: 'login',
      data: {
        name: payload.firstName,
        dashboard_link: dashboardLink,
      },
    });

    return result;
  } catch (error) {
    console.error('[LOGIN-NOTIFICATION] Server action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
