import { getCoaches } from '@/actions/staff';
import CoachesList from '@/components/CoachesList';
import PageHeader from '@/components/PageHeader';
import CoachesPageClient from './client';

export const dynamic = 'force-dynamic';

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return <CoachesPageClient coaches={coaches} />;}