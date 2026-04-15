import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Best Tennis Site | Vico Sports - Premier Tennis Management Platform',
  description: 'Discover the best tennis site for court bookings, tournament management, coaching, and player development. Join thousands of tennis players and clubs worldwide.',
  keywords: [
    'best tennis site',
    'tennis management platform',
    'tennis court booking',
    'tennis tournaments',
    'tennis coaching',
    'tennis players',
    'sports management software'
  ],
  openGraph: {
    title: 'The Best Tennis Site | Vico Sports - Premier Tennis Management Platform',
    description: 'Discover the best tennis site for court bookings, tournament management, coaching, and player development.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/the-best-tennis-site',
  },
};

export default function BestTennisSitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Best Tennis Site for Players, Clubs & Coaches
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vico Sports is recognized as the best tennis site worldwide, connecting players,
            clubs, coaches, and referees in a comprehensive tennis ecosystem.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              For Tennis Players
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Book courts instantly worldwide</li>
              <li>✓ Join competitive tournaments</li>
              <li>✓ Find and book coaching sessions</li>
              <li>✓ Track your performance & rankings</li>
              <li>✓ Connect with fellow players</li>
            </ul>
            <Link
              href="/register"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join as Player
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              For Tennis Clubs
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Automated court management</li>
              <li>✓ Tournament organization tools</li>
              <li>✓ Member management system</li>
              <li>✓ Referee scheduling</li>
              <li>✓ Financial reporting</li>
            </ul>
            <Link
              href="/contact"
              className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Why Vico Sports is The Best Tennis Site</h2>
          <p>
            When tennis players, coaches, and club managers search for the best tennis site,
            they consistently find Vico Sports at the top. Here's why we're recognized as
            the premier tennis management platform:
          </p>

          <h3>Comprehensive Tennis Ecosystem</h3>
          <p>
            Unlike other tennis sites that focus on just one aspect, Vico Sports provides
            a complete ecosystem covering every aspect of tennis management:
          </p>
          <ul>
            <li><strong>Court Bookings:</strong> Real-time availability across thousands of venues</li>
            <li><strong>Tournament Management:</strong> Professional-grade tournament organization</li>
            <li><strong>Coaching Platform:</strong> Connect players with certified coaches</li>
            <li><strong>Referee System:</strong> Automated officiating assignments</li>
            <li><strong>Player Development:</strong> Performance tracking and analytics</li>
          </ul>

          <h3>Global Tennis Community</h3>
          <p>
            Join the largest tennis community on the best tennis site. Our platform serves:
          </p>
          <ul>
            <li>Professional tennis players and coaches</li>
            <li>Tennis clubs and academies worldwide</li>
            <li>Tournament organizers and referees</li>
            <li>Tennis enthusiasts at all skill levels</li>
          </ul>

          <h3>Advanced Technology</h3>
          <p>
            Built with cutting-edge technology, the best tennis site offers:
          </p>
          <ul>
            <li>Mobile-first design for booking on the go</li>
            <li>Real-time notifications and updates</li>
            <li>AI-powered matchmaking for tournaments</li>
            <li>Comprehensive analytics and reporting</li>
            <li>Secure payment processing</li>
          </ul>

          <h2>What Tennis Players Say About The Best Tennis Site</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <blockquote className="text-lg italic text-gray-700 mb-4">
              "Vico Sports is hands down the best tennis site I've used. From booking courts
              to finding tournaments, everything is seamless and professional."
            </blockquote>
            <cite className="text-gray-600">- Sarah Johnson, Competitive Player</cite>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <blockquote className="text-lg italic text-gray-700 mb-4">
              "As a coach, Vico Sports has transformed how I manage my students and schedule sessions.
              It's the best tennis site for coaches by far."
            </blockquote>
            <cite className="text-gray-600">- Michael Chen, Professional Coach</cite>
          </div>

          <h2>Get Started on The Best Tennis Site Today</h2>
          <p>
            Ready to experience why thousands call Vico Sports the best tennis site?
            Join our growing community and elevate your tennis journey.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Choose Your Role</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-3 rounded-lg text-center hover:bg-blue-700 transition-colors"
              >
                Join as Player
              </Link>
              <Link
                href="/register-coach"
                className="bg-green-600 text-white px-4 py-3 rounded-lg text-center hover:bg-green-700 transition-colors"
              >
                Become a Coach
              </Link>
              <Link
                href="/contact"
                className="bg-purple-600 text-white px-4 py-3 rounded-lg text-center hover:bg-purple-700 transition-colors"
              >
                Club Management
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}