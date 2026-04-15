import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Courts in Kenya | Tennis Facilities & Court Bookings in Kenya',
  description: 'Find and book tennis courts in Kenya. Discover premium facilities in Nairobi, Mombasa, Kisumu, and across Kenya. Real-time availability and instant bookings.',
  keywords: [
    'courts in Kenya',
    'tennis courts Kenya',
    'tennis facilities Kenya',
    'book tennis court Kenya',
    'tennis venues Kenya',
    'Nairobi tennis courts',
    'Kenya tennis facilities'
  ],
  openGraph: {
    title: 'The Courts in Kenya | Tennis Facilities & Court Bookings in Kenya',
    description: 'Find and book tennis courts in Kenya. Discover premium facilities in Nairobi, Mombasa, Kisumu, and across Kenya.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/the-courts-in-kenya',
  },
};

export default function CourtsInKenyaPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Courts in Kenya: Premier Tennis Facilities Nationwide
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover world-class tennis courts across Kenya. From Nairobi's premium clubs
            to coastal resorts in Mombasa, find and book the perfect court for your game.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nairobi Courts
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Premium club facilities</li>
              <li>✓ Indoor and outdoor courts</li>
              <li>✓ Professional coaching available</li>
              <li>✓ Tournament-ready venues</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Coastal Courts
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Mombasa resort courts</li>
              <li>✓ Ocean-view facilities</li>
              <li>✓ Year-round playing conditions</li>
              <li>✓ Holiday tournament venues</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Premium Tennis Courts Across Kenya</h2>
          <p>
            Kenya boasts some of East Africa's finest tennis facilities. Whether you're in Nairobi,
            Mombasa, Kisumu, or Nakuru, you'll find world-class courts ready for your game.
            Our platform connects you with the best courts in Kenya for instant booking.
          </p>

          <h3>Nairobi: The Tennis Capital of Kenya</h3>
          <p>
            Nairobi is home to Kenya's most extensive tennis infrastructure. The courts in Nairobi
            range from exclusive country clubs to public facilities, all accessible through our platform:
          </p>
          <ul>
            <li><strong>Limuru Country Club:</strong> Championship-grade clay and hard courts</li>
            <li><strong>Nairobi Club:</strong> Historic facility with multiple court options</li>
            <li><strong>Westlands Sports Club:</strong> Modern indoor courts with lighting</li>
            <li><strong>University facilities:</strong> Student-accessible courts for public play</li>
          </ul>

          <h3>Mombasa: Coastal Tennis Excellence</h3>
          <p>
            The coastal city of Mombasa offers unique tennis experiences with ocean views and
            tropical weather. The courts in Mombasa are perfect for year-round play:
          </p>
          <ul>
            <li><strong>Mombasa Club:</strong> Beachside courts with sea breeze</li>
            <li><strong>Serena Beach Resort:</strong> Luxury resort tennis facilities</li>
            <li><strong>PrideInn Paradise Beach Resort:</strong> Championship tournament venue</li>
            <li><strong>Public coastal facilities:</strong> Accessible community courts</li>
          </ul>

          <h3>Regional Courts Across Kenya</h3>
          <p>
            Beyond the major cities, Kenya's tennis scene extends to regional centers:
          </p>
          <ul>
            <li><strong>Kisumu:</strong> Lake Victoria region courts with growing facilities</li>
            <li><strong>Nakuru:</strong> Rift Valley tennis clubs and resorts</li>
            <li><strong>Eldoret:</strong> University and community court facilities</li>
            <li><strong>Other regions:</strong> Emerging facilities in Naivasha, Nyeri, and more</li>
          </ul>

          <h3>Court Types Available in Kenya</h3>
          <p>
            Kenya offers diverse court surfaces to suit different playing styles and preferences:
          </p>
          <ul>
            <li><strong>Clay Courts:</strong> Traditional red clay for European-style play</li>
            <li><strong>Hard Courts:</strong> Fast-playing acrylic surfaces</li>
            <li><strong>Grass Courts:</strong> Traditional Wimbledon-style courts</li>
            <li><strong>Indoor Courts:</strong> Climate-controlled facilities</li>
          </ul>

          <h3>Why Book Courts in Kenya Through Vico Sports?</h3>
          <ul>
            <li><strong>Real-Time Availability:</strong> See court schedules instantly</li>
            <li><strong>Instant Booking:</strong> Secure your court with one click</li>
            <li><strong>Verified Facilities:</strong> All courts inspected and rated</li>
            <li><strong>Mobile Access:</strong> Book from anywhere in Kenya</li>
            <li><strong>Local Support:</strong> Kenyan-based customer service</li>
          </ul>

          <h2>Tennis Tournaments in Kenya</h2>
          <p>
            The courts in Kenya regularly host competitive tournaments and events. Major venues include:
          </p>
          <ul>
            <li>Kenya Open tournaments at premium clubs</li>
            <li>University championships and inter-college competitions</li>
            <li>Corporate tennis leagues and social events</li>
            <li>International tournaments and exhibition matches</li>
          </ul>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Play on Kenya's Best Courts?</h3>
            <p className="mb-4">
              Join thousands of Kenyan tennis players who trust Vico Sports for court bookings.
              Find your perfect court and start playing today.
            </p>
            <div className="flex gap-4">
              <Link
                href="/courts"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Courts
              </Link>
              <Link
                href="/register"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}