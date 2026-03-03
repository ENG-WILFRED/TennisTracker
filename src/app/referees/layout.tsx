import Layout from '@/components/Layout';
import RefereeHeader from '@/components/referee/RefereeHeader';

export const metadata = {
  title: 'Referees & Officials - Vico',
  description: 'Browse our certified referees and officials on Vico',
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
