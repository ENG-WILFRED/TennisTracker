import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Referee Scheduling System | Tennis Match Officials Management',
  description: 'Professional referee scheduling software for tennis tournaments. Automate referee assignments, track availability, manage certifications, and ensure fair officiating.',
  keywords: [
    'referee scheduling software',
    'tennis referee management',
    'match officials system',
    'umpire scheduling',
    'referee assignment software',
    'tennis tournament officials'
  ],
  openGraph: {
    title: 'Referee Scheduling System | Tennis Match Officials Management',
    description: 'Professional referee scheduling software for tennis tournaments. Automate referee assignments and ensure fair officiating.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/referee-scheduling-system',
  },
};

export default function RefereeSchedulingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Referee Scheduling System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete referee management solution for tennis tournaments and leagues.
            Automate assignments, track certifications, and ensure every match has qualified officials.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Automated Assignments
            </h2>
            <p className="text-gray-700 mb-4">
              Smart algorithms match referees to matches based on certification level,
              availability, location, and experience. No more manual scheduling headaches.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Certification Tracking
            </h2>
            <p className="text-gray-700 mb-4">
              Maintain complete records of referee certifications, training completion,
              and performance evaluations. Ensure compliance with tournament standards.
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>The Challenge of Referee Scheduling</h2>
          <p>
            Tournament directors know that finding qualified referees for every match
            is one of the biggest challenges in running successful tennis events.
            Manual scheduling leads to conflicts, unqualified officials, and frustrated players.
          </p>

          <h3>How Professional Referee Scheduling Works</h3>
          <p>
            Modern referee scheduling systems use intelligent algorithms to match
            the right official to each match. The system considers:
          </p>
          <ul>
            <li>Referee certification level and experience</li>
            <li>Match importance and tournament level</li>
            <li>Geographic location and travel time</li>
            <li>Referee availability and preferences</li>
            <li>Conflict avoidance (referees can't officiate players they know)</li>
          </ul>

          <h3>Key Features for Tournament Organizers</h3>
          <ul>
            <li><strong>Referee Database:</strong> Complete profiles with certifications and ratings</li>
            <li><strong>Availability Management:</strong> Real-time scheduling and conflict resolution</li>
            <li><strong>Automated Notifications:</strong> SMS and email alerts for assignments</li>
            <li><strong>Performance Tracking:</strong> Monitor referee quality and feedback</li>
            <li><strong>Payment Integration:</strong> Automated invoicing and payment processing</li>
            <li><strong>Mobile Access:</strong> Referees can view assignments on any device</li>
          </ul>

          <h3>Benefits for Referees</h3>
          <p>
            Professional scheduling systems make life easier for referees too:
          </p>
          <ul>
            <li>Clear assignment notifications with all match details</li>
            <li>Easy-to-use mobile interface for confirmations</li>
            <li>Reliable payment processing and record-keeping</li>
            <li>Professional development tracking and certifications</li>
            <li>Reduced scheduling conflicts and confusion</li>
          </ul>

          <h3>Integration with Tournament Management</h3>
          <p>
            The best referee scheduling systems integrate seamlessly with tournament
            management software. As matches are scheduled, referees are automatically
            assigned. Changes to the tournament bracket automatically update referee assignments.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Streamline Your Referee Management</h3>
            <p className="mb-4">
              Join tennis organizations worldwide using automated referee scheduling.
              Eliminate scheduling conflicts and ensure every match has qualified officials.
            </p>
            <div className="flex gap-4">
              <Link
                href="/referees"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Referee System
              </Link>
              <Link
                href="/contact"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}