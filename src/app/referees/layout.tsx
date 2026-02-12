import Layout from '@/components/Layout';

export const metadata = {
  title: 'Referees & Ball Crew - Tennis Tracker',
  description: 'Browse our certified referees and ball crew members',
};

export default function RefereesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
