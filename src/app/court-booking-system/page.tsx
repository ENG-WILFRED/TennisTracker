import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Court Booking System | Tennis Court Reservation Software',
  description: 'Professional tennis court booking system for clubs and facilities. Real-time availability, automated scheduling, payment processing, and member management.',
  keywords: [
    'court booking system',
    'tennis court reservation',
    'sports facility booking',
    'court scheduling software',
    'tennis court management',
    'booking automation'
  ],
  openGraph: {
    title: 'Court Booking System | Tennis Court Reservation Software',
    description: 'Professional tennis court booking system for clubs and facilities. Real-time availability and automated scheduling.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/court-booking-system',
  },
};

export default function CourtBookingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Court Booking System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete court reservation solution for tennis clubs and sports facilities.
            Maximize court utilization while providing exceptional member experience.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Real-Time Booking
            </h3>
            <p className="text-gray-700">
              Instant court availability and booking confirmation. No more phone calls or confusion.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Automated Scheduling
            </h3>
            <p className="text-gray-700">
              Smart scheduling prevents double-bookings and optimizes court usage across peak hours.
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Member Management
            </h3>
            <p className="text-gray-700">
              Comprehensive member profiles with booking history, preferences, and payment tracking.
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>Why Court Booking Software Matters</h2>
          <p>
            Traditional court booking methods—phone calls, sign-up sheets, manual calendars—are
            inefficient and frustrating for both staff and members. Modern court booking systems
            eliminate these problems while providing data-driven insights for facility management.
          </p>

          <h3>Essential Features for Tennis Clubs</h3>
          <ul>
            <li><strong>Online Booking Portal:</strong> 24/7 court reservations from any device</li>
            <li><strong>Real-Time Availability:</strong> Live court status and instant booking confirmation</li>
            <li><strong>Automated Payments:</strong> Secure payment processing with membership discounts</li>
            <li><strong>Waitlist Management:</strong> Automatic notifications when courts become available</li>
            <li><strong>Recurring Bookings:</strong> Set up regular court time for lessons or practice</li>
            <li><strong>Calendar Integration:</strong> Sync bookings with personal calendars</li>
          </ul>

          <h3>Advanced Features for Large Facilities</h3>
          <p>
            Professional court booking systems offer sophisticated features for managing complex facilities:
          </p>
          <ul>
            <li>Multi-court complexes with different court types (hard, clay, grass, indoor)</li>
            <li>Member priority systems and peak hour management</li>
            <li>Integration with existing membership management systems</li>
            <li>Detailed analytics on court utilization and revenue</li>
            <li>Automated maintenance scheduling and court closures</li>
            <li>Group booking and tournament court blocks</li>
          </ul>

          <h3>The Business Case for Court Booking Software</h3>
          <p>
            Court booking systems pay for themselves through increased utilization and reduced administrative costs:
          </p>
          <ul>
            <li><strong>Increased Revenue:</strong> More bookings through easier access and reduced no-shows</li>
            <li><strong>Reduced Staff Time:</strong> Automated processes eliminate manual booking management</li>
            <li><strong>Better Member Satisfaction:</strong> Convenient booking leads to higher retention</li>
            <li><strong>Data-Driven Decisions:</strong> Analytics help optimize pricing and scheduling</li>
          </ul>

          <h3>Mobile-First Design</h3>
          <p>
            The best court booking systems are designed for mobile use. Members expect to
            book courts on their phones while at work or between matches. Mobile apps provide
            push notifications, quick booking, and easy court status checks.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Ready to Modernize Court Bookings?</h3>
            <p className="mb-4">
              Join tennis clubs worldwide using professional court booking systems.
              Increase utilization, reduce costs, and improve member satisfaction.
            </p>
            <div className="flex gap-4">
              <Link
                href="/courts"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Court Booking
              </Link>
              <Link
                href="/contact"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}