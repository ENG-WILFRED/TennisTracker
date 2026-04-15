import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tennis Courts Kenya | Book Courts in Nairobi, Mombasa & Across Kenya',
  description: 'Find and book tennis courts in Kenya. Premium facilities in Nairobi, Mombasa, Kisumu. Real-time availability, instant booking, professional courts.',
  keywords: [
    'tennis courts Kenya',
    'tennis facilities Kenya',
    'book tennis courts Kenya',
    'Nairobi tennis courts',
    'Mombasa tennis courts',
    'Kenya tennis venues'
  ],
  openGraph: {
    title: 'Tennis Courts Kenya | Book Courts in Nairobi, Mombasa & Across Kenya',
    description: 'Find and book tennis courts in Kenya. Premium facilities in Nairobi, Mombasa, Kisumu.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/tennis-courts-kenya',
  },
};

export default function TennisCourtsKenyaPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tennis Courts Kenya: Premier Facilities Nationwide
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover Kenya's finest tennis courts. From championship venues in Nairobi to coastal resorts in Mombasa,
            book world-class facilities with real-time availability.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nairobi Courts
            </h3>
            <p className="text-gray-700">
              Premium facilities in Westlands, Karen, and central Nairobi.
              Indoor and outdoor courts available.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mombasa Courts
            </h3>
            <p className="text-gray-700">
              Coastal tennis with ocean views. Year-round playing conditions
              at luxury resorts and clubs.
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Regional Courts
            </h3>
            <p className="text-gray-700">
              Quality facilities in Kisumu, Nakuru, Eldoret, and other cities
              across Kenya.
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Why Choose Tennis Courts in Kenya?</h2>
          <p>
            Kenya offers exceptional tennis facilities that rival international standards.
            Whether you're a competitive player or recreational enthusiast, our courts provide
            the perfect environment for your game.
          </p>

          <h3>Court Types Available</h3>
          <ul>
            <li><strong>Clay Courts:</strong> Traditional European-style play</li>
            <li><strong>Hard Courts:</strong> Fast-playing acrylic surfaces</li>
            <li><strong>Grass Courts:</strong> Classic Wimbledon-style courts</li>
            <li><strong>Indoor Courts:</strong> Climate-controlled facilities</li>
          </ul>

          <h3>Premium Facilities</h3>
          <ul>
            <li>Professional lighting for evening play</li>
            <li>Changing rooms and shower facilities</li>
            <li>Equipment rental and pro shops</li>
            <li>Coaching services available</li>
            <li>Restaurant and lounge areas</li>
          </ul>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Book Tennis Courts in Kenya Today</h3>
            <p className="mb-4">
              Real-time availability, instant booking, secure payments.
              Play on Kenya's best tennis courts.
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