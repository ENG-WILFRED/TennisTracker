import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vico Sports API Documentation | Developer Resources',
  description: 'Complete API documentation for Vico Sports tennis management platform. Integrate court bookings, tournament data, and player management into your applications.',
  keywords: [
    'tennis API',
    'sports management API',
    'court booking API',
    'tournament API',
    'developer documentation',
    'REST API'
  ],
  openGraph: {
    title: 'Vico Sports API Documentation | Developer Resources',
    description: 'Complete API documentation for Vico Sports tennis management platform.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/docs',
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vico Sports API Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Integrate tennis management functionality into your applications.
            Access court bookings, tournament data, player profiles, and more.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Getting Started
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Authentication setup</li>
              <li>• API key management</li>
              <li>• Rate limiting</li>
              <li>• Error handling</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Core Endpoints
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Courts & Bookings</li>
              <li>• Tournaments</li>
              <li>• Players & Coaches</li>
              <li>• Referees</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>API Overview</h2>
          <p>
            The Vico Sports API provides RESTful access to tennis management functionality.
            Use our API to build mobile apps, integrate with existing systems, or create
            custom tennis management solutions.
          </p>

          <h3>Base URL</h3>
          <p><code>https://api.vico.tennis/v1</code></p>

          <h3>Authentication</h3>
          <p>
            All API requests require authentication using API keys. Include your API key
            in the Authorization header:
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>
{`Authorization: Bearer your_api_key_here`}
            </code>
          </pre>

          <h2>Core Resources</h2>

          <h3>Courts API</h3>
          <p>Get court information and manage bookings:</p>
          <ul>
            <li><code>GET /courts</code> - List all courts</li>
            <li><code>GET /courts/{"{id}"}</code> - Get court details</li>
            <li><code>GET /courts/{"{id}"}/availability</code> - Check availability</li>
            <li><code>POST /bookings</code> - Create booking</li>
            <li><code>GET /bookings</code> - List user bookings</li>
          </ul>

          <h3>Tournaments API</h3>
          <p>Access tournament data and registration:</p>
          <ul>
            <li><code>GET /tournaments</code> - List tournaments</li>
            <li><code>GET /tournaments/{"{id}"}</code> - Get tournament details</li>
            <li><code>POST /tournaments/{"{id}"}/register</code> - Register for tournament</li>
            <li><code>GET /tournaments/{"{id}"}/draw</code> - Get tournament bracket</li>
            <li><code>GET /matches/{"{id}"}/score</code> - Get live scores</li>
          </ul>

          <h3>Players API</h3>
          <p>Manage player profiles and rankings:</p>
          <ul>
            <li><code>GET /players</code> - Search players</li>
            <li><code>GET /players/{"{id}"}</code> - Get player profile</li>
            <li><code>GET /players/{"{id}"}/rankings</code> - Get player rankings</li>
            <li><code>POST /players</code> - Create player profile</li>
          </ul>

          <h3>Referees API</h3>
          <p>Access referee scheduling and assignments:</p>
          <ul>
            <li><code>GET /referees</code> - List referees</li>
            <li><code>GET /referees/{"{id}"}</code> - Get referee details</li>
            <li><code>POST /matches/{"{id}"}/assign-referee</code> - Assign referee</li>
            <li><code>GET /referees/{"{id}"}/schedule</code> - Get referee schedule</li>
          </ul>

          <h2>Example Usage</h2>

          <h3>Check Court Availability</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>
{`curl -X GET "https://api.vico.tennis/v1/courts/123/availability?date=2024-04-15" \\
  -H "Authorization: Bearer your_api_key"`}
            </code>
          </pre>

          <h3>Book a Court</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>
{`curl -X POST "https://api.vico.tennis/v1/bookings" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "court_id": 123,
    "start_time": "2024-04-15T14:00:00Z",
    "duration_minutes": 60,
    "player_count": 2
  }'`}
            </code>
          </pre>

          <h2>Webhooks</h2>
          <p>
            Receive real-time notifications about important events:
          </p>
          <ul>
            <li><code>booking.created</code> - New booking made</li>
            <li><code>tournament.started</code> - Tournament begins</li>
            <li><code>match.completed</code> - Match finishes with results</li>
            <li><code>referee.assigned</code> - Referee assigned to match</li>
          </ul>

          <h2>Rate Limits</h2>
          <p>
            API requests are limited to prevent abuse:
          </p>
          <ul>
            <li>1000 requests per hour for read operations</li>
            <li>100 requests per hour for write operations</li>
            <li>Rate limit headers included in all responses</li>
          </ul>

          <h2>SDKs and Libraries</h2>
          <p>
            Official SDKs make integration easier:
          </p>
          <ul>
            <li><strong>JavaScript/TypeScript:</strong> <code>npm install @vico-sports/api</code></li>
            <li><strong>Python:</strong> <code>pip install vico-sports</code></li>
            <li><strong>PHP:</strong> Available via Composer</li>
            <li><strong>.NET:</strong> NuGet package available</li>
          </ul>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Build with Vico Sports?</h3>
            <p className="mb-4">
              Get your API key and start integrating tennis management functionality
              into your applications. Join developers building the future of sports technology.
            </p>
            <div className="flex gap-4">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get API Key
              </Link>
              <Link
                href="https://github.com/vicosports"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View SDKs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}