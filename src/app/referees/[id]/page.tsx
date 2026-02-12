import Link from 'next/link';
import { Gavel, Globe, ArrowLeft } from 'lucide-react';
import { PrismaClient } from '@/generated/prisma';

interface Props {
  params: {
    id: string;
  };
}

export default async function RefereeProfilePage({ params }: Props) {
  const prisma = new PrismaClient();
  const referee = await prisma.referee.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      nationality: true,
      bio: true,
      matchesRefereed: true,
      ballCrewMatches: true,
      experience: true,
      certifications: true,
    },
  });

  if (!referee) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Referee not found</h2>
          <Link href="/referees" className="text-green-600 underline">Back to referees</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative h-64 bg-gradient-to-br from-green-500 to-emerald-600">
          <img src={referee.photo ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80'} alt={`${referee.firstName} ${referee.lastName}`} className="w-full h-full object-cover opacity-80" />
          <div className="absolute left-6 bottom-6 text-white">
            <h1 className="text-4xl font-bold">{referee.firstName} {referee.lastName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur"> 
                <Globe className="w-4 h-4" /> {referee.nationality || 'Unknown'}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur">
                <Gavel className="w-4 h-4" /> Referee
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-2">About</h2>
              <p className="text-slate-700 mb-4">{referee.bio || 'No biography available.'}</p>

              <h3 className="text-lg font-semibold mb-2">Experience</h3>
              <p className="text-slate-700 mb-4">{referee.experience || 'Not specified'}</p>

              {referee.certifications && referee.certifications.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Certifications</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {referee.certifications.map((cert, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-100">{cert}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <aside className="bg-green-50 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-xs text-slate-600">Matches Refereed</p>
                <p className="text-2xl font-bold text-green-700">{referee.matchesRefereed || 0}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-600">Ball Crew Matches</p>
                <p className="text-2xl font-bold text-green-700">{referee.ballCrewMatches || 0}</p>
              </div>

              <Link href="/referees" className="inline-flex items-center gap-2 text-green-600 font-semibold">
                <ArrowLeft className="w-4 h-4" /> Back to list
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
