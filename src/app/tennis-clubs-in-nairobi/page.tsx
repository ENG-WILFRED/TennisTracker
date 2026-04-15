import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tennis Clubs in Nairobi | Find Courts, Book Matches & Join Tournaments',
  description: 'Discover the best tennis clubs in Nairobi. Book courts, join tournaments, find coaches, and connect with players. Vico Sports powers Nairobi\'s tennis community.',
  keywords: [
    'tennis clubs Nairobi',
    'tennis courts Nairobi',
    'book tennis court Nairobi',
    'tennis tournaments Nairobi',
    'tennis coaching Nairobi',
    'tennis players Nairobi'
  ],
  openGraph: {
    title: 'Tennis Clubs in Nairobi | Find Courts, Book Matches & Join Tournaments',
    description: 'Discover the best tennis clubs in Nairobi. Book courts, join tournaments, find coaches, and connect with players.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/tennis-clubs-in-nairobi',
  },
};

export default function TennisClubsNairobiPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tennis Clubs in Nairobi
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover Nairobi's premier tennis facilities, book courts instantly,
            join competitive tournaments, and connect with skilled players and coaches.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Court Booking Made Simple
            </h2>
            <p className="text-gray-700 mb-4">
              Reserve tennis courts at Nairobi's top clubs with real-time availability.
              Book for singles, doubles, or group sessions with instant confirmation.
            </p>
            <Link
              href="/courts"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Courts Now
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tournament Opportunities
            </h2>
            <p className="text-gray-700 mb-4">
              Join competitive tournaments across Nairobi. From local club events
              to regional championships, find matches that match your skill level.
            </p>
            <Link
              href="/tournaments"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Tournaments
            </Link>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Why Nairobi's Tennis Scene is Thriving</h2>
          <p>
            Nairobi has emerged as East Africa's tennis capital, with world-class facilities
            and a growing community of passionate players. Whether you're a beginner looking
            for lessons or a competitive player seeking challenging matches, Nairobi offers
            everything you need.
          </p>

          <h3>Top Tennis Facilities in Nairobi</h3>
          <ul>
            <li><strong>Premium Club Courts:</strong> Hard courts, clay courts, and indoor facilities</li>
            <li><strong>Professional Coaching:</strong> Certified coaches for all skill levels</li>
            <li><strong>Tournament Hosting:</strong> Regular competitions and ranking events</li>
            <li><strong>Player Communities:</strong> Connect with fellow tennis enthusiasts</li>
          </ul>

          <h3>Getting Started with Tennis in Nairobi</h3>
          <p>
            Ready to join Nairobi's tennis community? Here's how to get started:
          </p>
          <ol>
            <li>Find a court that matches your location and preferences</li>
            <li>Book your first session or lesson</li>
            <li>Join a local tournament to meet other players</li>
            <li>Connect with coaches for personalized training</li>
          </ol>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Play?</h3>
            <p className="mb-4">
              Join thousands of tennis players in Nairobi who trust Vico Sports
              for their court bookings and tournament registrations.
            </p>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up Free
              </Link>
              <Link
                href="/courts"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Browse Courts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}