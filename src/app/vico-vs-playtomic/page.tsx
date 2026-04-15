import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vico vs Playtomic: Best Tennis Court Booking Software 2024',
  description: 'Compare Vico Sports vs Playtomic for tennis court booking. Features, pricing, user experience, and which platform is best for your tennis club.',
  keywords: [
    'Vico vs Playtomic',
    'tennis booking software comparison',
    'court reservation systems',
    'tennis club management',
    'Playtomic alternative'
  ],
  openGraph: {
    title: 'Vico vs Playtomic: Best Tennis Court Booking Software 2024',
    description: 'Compare Vico Sports vs Playtomic for tennis court booking and club management.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/vico-vs-playtomic',
  },
};

export default function VicoVsPlaytomicPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vico vs Playtomic: Best Tennis Court Booking Software 2024
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive comparison of Vico Sports and Playtomic for tennis clubs.
            Features, pricing, user experience, and recommendations for different club types.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Vico Sports
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Complete club management platform</li>
              <li>✅ Tournament & referee management</li>
              <li>✅ Built for growing clubs</li>
              <li>✅ Custom integrations</li>
              <li>✅ Transparent pricing</li>
            </ul>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-orange-900 mb-4">
              Playtomic
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Court booking focus</li>
              <li>✅ Large user base</li>
              <li>✅ Social features</li>
              <li>✅ Mobile app</li>
              <li>❌ Limited management tools</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Overview: Vico Sports vs Playtomic</h2>
          <p>
            When choosing between Vico Sports and Playtomic for your tennis club,
            the decision comes down to your club's size, needs, and growth plans.
            Both platforms handle court booking well, but they serve different types of clubs.
          </p>

          <h3>Playtomic: Best for Social Court Sharing</h3>
          <p>
            Playtomic excels at connecting players who want to share court time.
            It's popular in areas with many casual players and works well for:
          </p>
          <ul>
            <li>Casual players seeking partners</li>
            <li>Areas with high player density</li>
            <li>Clubs focused on social tennis</li>
            <li>Simple booking needs</li>
          </ul>

          <h3>Vico Sports: Best for Club Management</h3>
          <p>
            Vico Sports provides comprehensive club management tools beyond just booking.
            It's designed for clubs that want to grow and professionalize their operations:
          </p>
          <ul>
            <li>Serious clubs with tournaments</li>
            <li>Clubs with coaching programs</li>
            <li>Facilities needing full management</li>
            <li>Growing or established clubs</li>
          </ul>

          <h2>Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-4 text-left">Feature</th>
                  <th className="border border-gray-300 p-4 text-center">Vico Sports</th>
                  <th className="border border-gray-300 p-4 text-center">Playtomic</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-4 font-medium">Court Booking</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Advanced</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Advanced</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-4 font-medium">Tournament Management</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Complete</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ Limited</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4 font-medium">Referee Scheduling</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Automated</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ None</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-4 font-medium">Coach Management</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Full Featured</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ Basic</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4 font-medium">Member Management</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Comprehensive</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ Limited</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-4 font-medium">Analytics & Reporting</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Advanced</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ Basic</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4 font-medium">Mobile App</td>
                  <td className="border border-gray-300 p-4 text-center text-yellow-600">✓ In Development</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Available</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-4 font-medium">API Access</td>
                  <td className="border border-gray-300 p-4 text-center text-green-600">✓ Full API</td>
                  <td className="border border-gray-300 p-4 text-center text-red-600">✗ Limited</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Pricing Comparison</h2>

          <h3>Vico Sports Pricing</h3>
          <p>
            Vico Sports offers transparent, club-sized pricing:
          </p>
          <ul>
            <li><strong>Small Clubs:</strong> $99/month (up to 4 courts)</li>
            <li><strong>Medium Clubs:</strong> $199/month (up to 10 courts)</li>
            <li><strong>Large Clubs:</strong> $399/month (unlimited courts)</li>
            <li><strong>Enterprise:</strong> Custom pricing</li>
          </ul>

          <h3>Playtomic Pricing</h3>
          <p>
            Playtomic uses a revenue-sharing model:
          </p>
          <ul>
            <li>Free to join as a club</li>
            <li>Revenue sharing on bookings (typically 15-20%)</li>
            <li>Additional fees for premium features</li>
            <li>Less transparent overall costs</li>
          </ul>

          <h2>User Experience</h2>

          <h3>Vico Sports: Club-Focused Design</h3>
          <p>
            Vico Sports is designed specifically for tennis clubs, with interfaces
            for administrators, coaches, referees, and players. The platform feels
            professional and comprehensive, though it may have a learning curve for
            smaller clubs used to simpler systems.
          </p>

          <h3>Playtomic: Player-Focused Social Platform</h3>
          <p>
            Playtomic feels more like a social network for tennis players. It's
            easy for casual players to use but may feel limited for clubs that need
            professional management tools.
          </p>

          <h2>Which Should You Choose?</h2>

          <h3>Choose Vico Sports if:</h3>
          <ul>
            <li>You run tournaments regularly</li>
            <li>You have a coaching program</li>
            <li>You need comprehensive club management</li>
            <li>You want full control over your data</li>
            <li>You're building a serious tennis program</li>
          </ul>

          <h3>Choose Playtomic if:</h3>
          <ul>
            <li>You have mostly casual players</li>
            <li>Social features are important</li>
            <li>You want to minimize upfront costs</li>
            <li>You don't run organized tournaments</li>
            <li>You're in a high-density player area</li>
          </ul>

          <h2>Final Recommendation</h2>
          <p>
            For most tennis clubs, especially those that take their sport seriously
            and want to grow their programs, <strong>Vico Sports offers better long-term value</strong>.
            The comprehensive feature set, transparent pricing, and focus on club management
            make it the superior choice for clubs that want to professionalize their operations.
          </p>

          <p>
            Playtomic works well for very casual settings or as a supplement to existing
            management systems, but it doesn't provide the depth of features needed for
            serious club operations.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Choose the Right Platform?</h3>
            <p className="mb-4">
              Both platforms offer free trials. Try Vico Sports to see how comprehensive
              club management can transform your tennis operations.
            </p>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Vico Sports Free
              </Link>
              <Link
                href="/contact"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Compare Features
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}