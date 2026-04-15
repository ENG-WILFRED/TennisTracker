import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Kenyan Tennis Tournament | National Championships & Events',
  description: 'Discover Kenyan tennis tournaments from national championships to local club events. Register for tournaments, track results, and join Kenya\'s competitive tennis scene.',
  keywords: [
    'Kenyan tennis tournament',
    'Kenya tennis championships',
    'tennis tournaments Kenya',
    'Kenya Open',
    'tennis competitions Kenya',
    'Nairobi tennis tournaments'
  ],
  openGraph: {
    title: 'The Kenyan Tennis Tournament | National Championships & Events',
    description: 'Discover Kenyan tennis tournaments from national championships to local club events.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/the-kenyan-tennis-tournament',
  },
};

export default function KenyanTennisTournamentPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Kenyan Tennis Tournament: National Championships & Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience Kenya's vibrant tennis tournament scene. From the prestigious Kenya Open
            to local club championships, discover competitive opportunities across all skill levels.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              National Championships
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Kenya Open tournaments</li>
              <li>✓ National rankings events</li>
              <li>✓ Age-group championships</li>
              <li>✓ Professional competitions</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Regional Events
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Nairobi club tournaments</li>
              <li>✓ Mombasa coastal events</li>
              <li>✓ University championships</li>
              <li>✓ Corporate leagues</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Kenya's Premier Tennis Tournament Circuit</h2>
          <p>
            Kenyan tennis tournaments attract players from across East Africa and beyond.
            Whether you're a competitive player seeking ranking points or a recreational player
            looking for friendly competition, Kenya offers a diverse tournament calendar.
          </p>

          <h3>Major Kenyan Tennis Tournaments</h3>

          <h4>Kenya Open Series</h4>
          <p>
            The flagship tournament series featuring professional and amateur divisions:
          </p>
          <ul>
            <li><strong>Kenya Open Main Draw:</strong> Premier professional tournament</li>
            <li><strong>Kenya Open Qualifiers:</strong> Pathway to main competition</li>
            <li><strong>Kenya Open Junior Championships:</strong> Youth development focus</li>
            <li><strong>Kenya Open Veterans:</strong> Masters category competitions</li>
          </ul>

          <h4>National Ranking Tournaments</h4>
          <p>
            Competitive events that contribute to national rankings:
          </p>
          <ul>
            <li><strong>Nairobi International:</strong> ATP Challenger level competition</li>
            <li><strong>Mombasa Beach Open:</strong> Coastal tournament with international appeal</li>
            <li><strong>Kisumu Lakeside Classic:</strong> Regional championship event</li>
            <li><strong>Nakuru Highlands Open:</strong> Altitude advantage competitions</li>
          </ul>

          <h3>Regional & Club Tournaments</h3>
          <p>
            Local competitions that build Kenya's tennis community:
          </p>
          <ul>
            <li><strong>Nairobi Club Championships:</strong> Annual club member tournaments</li>
            <li><strong>Coastal Circuit:</strong> Mombasa and Malindi regional events</li>
            <li><strong>University Games:</strong> Inter-varsity competitions</li>
            <li><strong>Corporate Leagues:</strong> Business house tournaments</li>
          </ul>

          <h3>Tournament Categories in Kenya</h3>
          <p>
            Kenyan tennis tournaments cater to all skill levels and age groups:
          </p>
          <ul>
            <li><strong>Professional:</strong> ATP/ITF sanctioned events</li>
            <li><strong>Amateur:</strong> Competitive club-level play</li>
            <li><strong>Junior:</strong> U12, U14, U16, U18 categories</li>
            <li><strong>Veterans:</strong> 35+, 45+, 55+ age divisions</li>
            <li><strong>Mixed Doubles:</strong> Team-based competitions</li>
          </ul>

          <h3>Why Compete in Kenyan Tennis Tournaments?</h3>
          <ul>
            <li><strong>National Ranking Points:</strong> Improve your Kenya tennis ranking</li>
            <li><strong>International Exposure:</strong> Many tournaments attract regional players</li>
            <li><strong>Quality Facilities:</strong> World-class courts and venues</li>
            <li><strong>Professional Organization:</strong> Well-run events with proper officiating</li>
            <li><strong>Year-Round Competition:</strong> Favorable climate for consistent play</li>
          </ul>

          <h3>Tournament Registration & Management</h3>
          <p>
            Vico Sports provides comprehensive tournament management for Kenyan events:
          </p>
          <ul>
            <li>Online registration and payment processing</li>
            <li>Automated draw generation and scheduling</li>
            <li>Live scoring and results tracking</li>
            <li>Referee assignment and officiating</li>
            <li>Player communication and updates</li>
          </ul>

          <h2>Upcoming Kenyan Tennis Tournaments</h2>
          <p>
            Kenya's tournament calendar includes events throughout the year:
          </p>
          <ul>
            <li><strong>January-March:</strong> Peak season with international tournaments</li>
            <li><strong>April-June:</strong> Regional championships and qualifiers</li>
            <li><strong>July-September:</strong> Junior development tournaments</li>
            <li><strong>October-December:</strong> Year-end championships and awards</li>
          </ul>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Compete in Kenyan Tennis Tournaments?</h3>
            <p className="mb-4">
              Join Kenya's competitive tennis scene. Register for tournaments, track your progress,
              and connect with fellow players across the country.
            </p>
            <div className="flex gap-4">
              <Link
                href="/tournaments"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Tournaments
              </Link>
              <Link
                href="/register"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Register to Play
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}