import { getCoaches } from '@/actions/staff';
import CoachesList from '@/components/CoachesList';
import PageHeader from '@/components/PageHeader';
import CoachesPageClient from './client';

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return <CoachesPageClient coaches={coaches} />;}