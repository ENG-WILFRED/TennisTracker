"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Gavel } from 'lucide-react';

export default function RefereeHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const currentRefereeId = user?.role === 'referee' ? user.id : null;
  // If pathname is /referees/[id] or deeper, extract the viewed referee id
  const viewedRefereeId = pathname && pathname.startsWith('/referees/') && pathname.split('/').length >= 3
    ? pathname.split('/')[2]
    : null;

  // Build section links: point to anchors on current page or list page
  const sectionLink = (hash: string) => {
    // If on an individual referee page (/referees/[id]...), keep same path
    if (pathname && pathname.startsWith('/referees/') && pathname.split('/').length >= 3) {
      return `${pathname}#${hash}`;
    }
    return `/referees#${hash}`;
  };

  // Determine active nav pill
  const isActive = (key: string) => {
    if (!pathname) return false;
    if (key === 'overview') return pathname === '/referees' || pathname.startsWith('/referees/');
    if (key === 'players') return pathname.startsWith('/players');
    if (key === 'matches') return pathname.includes('/matches') || pathname.includes('match');
    if (key === 'edit') return pathname.endsWith('/edit');
    return false;
  };

  return (
    <header className="w-full ">
      <div className="w-full mx-auto px-4 py-5">
        <div className="rounded-2xl p-4 md:p-6 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>

            <div className="text-2xl font-extrabold">Referee Dashboard</div>

            <nav className="hidden md:flex items-center gap-2">
              <Link href={sectionLink('overview')} className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive('overview') ? 'bg-white text-pink-600 shadow' : 'bg-white/20 hover:bg-white/30'}`}>
                Overview
              </Link>
              <Link href="/referees" className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive('players') ? 'bg-white text-pink-600 shadow' : 'bg-white/20 hover:bg-white/30'}`}>
                players
              </Link>
              <Link href={sectionLink('matches')} className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive('matches') ? 'bg-white text-pink-600 shadow' : 'bg-white/20 hover:bg-white/30'}`}>
                Matches
              </Link>
              {viewedRefereeId && user && user.role === 'referee' && user.id === viewedRefereeId && (
                <Link href={`/referees/${viewedRefereeId}/edit`} className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive('edit') ? 'bg-white text-pink-600 shadow' : 'bg-white/20 hover:bg-white/30'}`}>
                  Edit Profile
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href={currentRefereeId ? `/referees/${currentRefereeId}` : '/referees'} className="text-sm font-semibold bg-white/20 px-3 py-2 rounded-full">My Profile</Link>
                {viewedRefereeId && user && user.role === 'referee' && user.id === viewedRefereeId && (
                  <Link href={`/referees/${viewedRefereeId}/edit`} className="text-sm font-semibold bg-white/20 px-3 py-2 rounded-full">Edit Profile</Link>
                )}
                <button onClick={() => logout()} className="text-sm font-semibold bg-white/20 px-3 py-2 rounded-full">Logout</button>
                <Link href="/register" className="text-sm font-semibold bg-white px-3 py-2 rounded-full text-pink-600">Register</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold bg-white/20 px-3 py-2 rounded-full">Login</Link>
                <Link href="/register" className="text-sm font-semibold bg-white px-3 py-2 rounded-full text-pink-600">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
