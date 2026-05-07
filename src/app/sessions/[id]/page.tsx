'use client';

import { useParams } from 'next/navigation';
import SessionDetailView from '@/components/SessionDetailView';

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  return <SessionDetailView sessionId={sessionId} />;
}
