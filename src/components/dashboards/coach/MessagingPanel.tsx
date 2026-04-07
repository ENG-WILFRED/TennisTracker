'use client';

import React from 'react';
import MessagingPanel from '@/components/dashboards/MessagingPanel';

/**
 * Coach-specific MessagingPanel wrapper
 * Re-exports the main MessagingPanel component with coach-specific props
 */
export default function CoachMessagingPanel({ coachId }: { coachId: string }) {
  return <MessagingPanel userId={coachId} userType="coach" />;
}
