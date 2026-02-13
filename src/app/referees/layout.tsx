import Layout from '@/components/Layout';
import RefereeHeader from '@/components/referee/RefereeHeader';

export const metadata = {
  title: 'Referees & Ball Crew - Tennis Tracker',
  description: 'Browse our certified referees and ball crew members',
};

export default function RefereesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RefereeHeader />
      <>{children}</>
    </>
  );
}
