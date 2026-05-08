'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import SessionDetailView from '@/components/SessionDetailView';

export default function DashboardSessionDetailPage() {
  const params = useParams();
  const role = params?.role as string;
  const userId = params?.userId as string;
  const sessionId = params?.sessionId as string;

  const redirectBasePath = role && userId ? `/dashboard/${role}/${userId}` : '/dashboard';

  if (!sessionId) {
    return <div>Session ID is missing</div>;
  }

  return <SessionDetailView sessionId={sessionId} redirectBasePath={redirectBasePath} />;
}
