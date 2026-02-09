"use client";
import PageHeader from '@/components/PageHeader';
import KnockoutContainer from './KnockoutContainer';

export default function Page() {
  return (
    <>
      <PageHeader
        title="World Cup Style Tournament"
        description="Manage knockout stages and record match results"
        navItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Back to Pools', href: '/matches' },
          { label: 'Leaderboard', href: '/leaderboard' },
        ]}
      />
      <KnockoutContainer />
    </>
  );
}