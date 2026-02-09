"use client";

import { useRouter } from 'next/navigation';
import CoachesList from '@/components/CoachesList';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';

export default function CoachesPageClient({ coaches }: { coaches: any[] }) {
  const router = useRouter();
  let auth;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false } as any;
  }
  const { isLoggedIn } = auth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-full flex-1">
        <PageHeader
          title="Coaching Staff"
          description="Browse available coaches and contact them"
          navItems={
            isLoggedIn
              ? [
                  { label: 'Dashboard', onClick: () => router.push('/dashboard') },
                  { label: 'Matches', onClick: () => router.push('/matches') },
                  { label: 'Coaches', active: true },
                ]
              : [{ label: 'Coaches', active: true }]
          }
        />

        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <CoachesList coaches={coaches} isDashboard={false} />
        </div>
      </div>
    </div>
  );
}
