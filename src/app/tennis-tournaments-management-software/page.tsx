import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tennis Tournaments Management Software | Vico Sports',
  description: 'Professional tournament management software for tennis clubs. Automate registrations, scheduling, scoring, and results. Perfect for clubs, associations, and tournament directors.',
  keywords: [
    'tennis tournament software',
    'tournament management system',
    'tennis competition software',
    'tournament scheduling',
    'tennis scoring system',
    'tournament registration software'
  ],
  openGraph: {
    title: 'Tennis Tournaments Management Software | Vico Sports',
    description: 'Professional tournament management software for tennis clubs. Automate registrations, scheduling, scoring, and results.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/tennis-tournaments-management-software',
  },
};

export default function TournamentManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tennis Tournaments Management Software
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete tournament management solution for tennis clubs and associations.
            Automate every aspect of tournament organization from registration to results.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Automated Registration
            </h3>
            <p className="text-gray-700">
              Online registration with instant confirmation and payment processing.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Scheduling
            </h3>
            <p className="text-gray-700">
              Intelligent draw creation and match scheduling based on player rankings.
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Live Scoring
            </h3>
            <p className="text-gray-700">
              Real-time score updates and automated results calculation.
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Why Choose Professional Tournament Software?</h2>
          <p>
            Managing tennis tournaments manually is time-consuming and error-prone.
            Professional tournament management software automates the entire process,
            from player registration to final results, allowing tournament directors
            to focus on creating great tennis experiences.
          </p>

          <h3>Key Features for Tournament Directors</h3>
          <ul>
            <li><strong>Online Registration:</strong> Players can register and pay online 24/7</li>
            <li><strong>Automated Draws:</strong> Create fair brackets based on rankings and seeds</li>
            <li><strong>Match Scheduling:</strong> Optimize court usage and player availability</li>
            <li><strong>Live Updates:</strong> Keep players and spectators informed in real-time</li>
            <li><strong>Results Management:</strong> Automatic calculation of winners and rankings</li>
            <li><strong>Reporting:</strong> Generate tournament statistics and analytics</li>
          </ul>

          <h3>Benefits for Tennis Clubs</h3>
          <p>
            Tournament software doesn't just make organization easier—it also increases
            participation and revenue for clubs:
          </p>
          <ul>
            <li>Increased tournament participation through easy online registration</li>
            <li>Reduced administrative workload for club staff</li>
            <li>Professional presentation that attracts more players</li>
            <li>Accurate record-keeping for rankings and statistics</li>
            <li>Additional revenue from tournament entry fees</li>
          </ul>

          <h3>How Tournament Management Software Works</h3>
          <p>
            Modern tournament software integrates seamlessly with existing club management
            systems. Players register through a user-friendly interface, draws are generated
            automatically, and matches are scheduled based on court availability and player
            preferences. Referees can update scores in real-time, and results are instantly
            available to all participants.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Run Better Tournaments?</h3>
            <p className="mb-4">
              Join tennis clubs worldwide using Vico Sports for professional tournament management.
              Start with a free trial and see the difference automated tournament software makes.
            </p>
            <div className="flex gap-4">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                href="/tournaments"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}