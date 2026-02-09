import Link from 'next/link';
import MessagesAnnouncements from '@/components/MessagesAnnouncements';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-br from-green-100 to-sky-100 backdrop-blur-md shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
            <span className="text-2xl">🎾</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Tennis Tracker</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-gray-600 hover:text-green-700 transition-colors font-medium">About</a>
          <a href="#players" className="text-gray-600 hover:text-green-700 transition-colors font-medium">Players</a>
          <a href="#coaches" className="text-gray-600 hover:text-green-700 transition-colors font-medium">Coaches</a>
          <a href="#rules" className="text-gray-600 hover:text-green-700 transition-colors font-medium">Rules</a>
        </nav>
        <div className="flex items-center gap-3">
          <MessagesAnnouncements />
          <Link href="/login" className="px-5 py-2.5 text-green-700 border-2 border-green-700 rounded-lg hover:bg-green-50 transition-all font-semibold transform hover:scale-105">
            Login
          </Link>
          <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg transform hover:scale-105">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
