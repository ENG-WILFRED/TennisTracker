import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Where to Find Coach | Tennis Coaching & Instructor Directory',
  description: 'Find tennis coaches and instructors worldwide. Connect with certified professionals, book lessons, and improve your game. Expert coaching for all skill levels.',
  keywords: [
    'where to find coach',
    'tennis coach',
    'tennis instructor',
    'tennis lessons',
    'find tennis coach',
    'tennis coaching',
    'tennis trainer'
  ],
  openGraph: {
    title: 'Where to Find Coach | Tennis Coaching & Instructor Directory',
    description: 'Find tennis coaches and instructors worldwide. Connect with certified professionals and book lessons.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/where-to-find-coach',
  },
};

export default function FindCoachPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Where to Find Coach: Your Guide to Tennis Coaching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover certified tennis coaches and instructors worldwide. From beginners to professionals,
            find the perfect coach to elevate your game and achieve your tennis goals.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              For Beginners
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Patient, encouraging coaches</li>
              <li>✓ Fundamental technique focus</li>
              <li>✓ Fun, engaging lessons</li>
              <li>✓ Group or private options</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              For Advanced Players
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Competitive strategy coaching</li>
              <li>✓ Performance analysis</li>
              <li>✓ Mental game training</li>
              <li>✓ Tournament preparation</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>How to Find the Right Tennis Coach</h2>
          <p>
            Finding the perfect tennis coach can transform your game. Whether you're just starting out
            or aiming for competitive success, the right coach makes all the difference. Here's where
            to find coaches and what to look for.
          </p>

          <h3>Types of Tennis Coaches Available</h3>

          <h4>Certified Professional Coaches</h4>
          <p>
            Professional coaches with formal certification and extensive experience:
          </p>
          <ul>
            <li><strong>PTR Certified:</strong> Professional Tennis Registry certified instructors</li>
            <li><strong>USPTA Certified:</strong> United States Professional Tennis Association</li>
            <li><strong>LTA Qualified:</strong> Lawn Tennis Association certified coaches</li>
            <li><strong>National Federation Coaches:</strong> Country-specific coaching qualifications</li>
          </ul>

          <h4>Club and Academy Coaches</h4>
          <p>
            Coaches affiliated with tennis clubs and academies:
          </p>
          <ul>
            <li><strong>Club Professionals:</strong> Full-time coaches at tennis facilities</li>
            <li><strong>Academy Directors:</strong> Lead coaches at tennis academies</li>
            <li><strong>Teaching Professionals:</strong> Independent coaches working at clubs</li>
          </ul>

          <h4>Specialized Coaches</h4>
          <p>
            Coaches with expertise in specific areas:
          </p>
          <ul>
            <li><strong>Junior Development:</strong> Coaches specializing in young players</li>
            <li><strong>Competitive Coaching:</strong> Tournament preparation and strategy</li>
            <li><strong>Technique Specialists:</strong> Focus on specific strokes or skills</li>
            <li><strong>Mental Game Coaches:</strong> Sports psychology and mental training</li>
          </ul>

          <h3>Where to Find Tennis Coaches</h3>

          <h4>Online Coach Directories</h4>
          <p>
            Digital platforms connecting players with coaches:
          </p>
          <ul>
            <li><strong>Vico Sports Coach Network:</strong> Verified coaches with ratings and reviews</li>
            <li><strong>Tennis Channel Coaches:</strong> Professional coach matching service</li>
            <li><strong>USTA Coach Locator:</strong> United States Tennis Association directory</li>
            <li><strong>International Coach Databases:</strong> Country-specific coach registries</li>
          </ul>

          <h4>Local Tennis Facilities</h4>
          <p>
            Tennis clubs and resorts often have resident coaches:
          </p>
          <ul>
            <li><strong>Tennis Clubs:</strong> Most clubs have teaching professionals on staff</li>
            <li><strong>Resorts and Hotels:</strong> Many offer tennis coaching packages</li>
            <li><strong>Community Centers:</strong> Local recreation departments with tennis programs</li>
            <li><strong>Universities:</strong> College tennis coaches often offer private lessons</li>
          </ul>

          <h4>Tennis Academies and Schools</h4>
          <p>
            Specialized tennis training centers:
          </p>
          <ul>
            <li><strong>Professional Academies:</strong> Full-time training programs</li>
            <li><strong>Tennis Schools:</strong> Structured learning environments</li>
            <li><strong>High-Performance Centers:</strong> Elite player development programs</li>
          </ul>

          <h3>What to Look for in a Tennis Coach</h3>
          <ul>
            <li><strong>Certification:</strong> Proper qualifications and credentials</li>
            <li><strong>Experience:</strong> Years of coaching and player development success</li>
            <li><strong>Teaching Style:</strong> Matches your learning preferences</li>
            <li><strong>Specialization:</strong> Expertise in your skill level and goals</li>
            <li><strong>Communication:</strong> Clear instruction and feedback</li>
            <li><strong>References:</strong> Testimonials from previous students</li>
          </ul>

          <h3>Coaching Options Available</h3>

          <h4>Private Lessons</h4>
          <p>
            One-on-one coaching tailored to your specific needs:
          </p>
          <ul>
            <li>Personalized attention and customized drills</li>
            <li>Faster skill development and technique correction</li>
            <li>Flexible scheduling to fit your availability</li>
            <li>Direct feedback and immediate adjustments</li>
          </ul>

          <h4>Group Lessons</h4>
          <p>
            Small group coaching for social learning:
          </p>
          <ul>
            <li>More affordable than private lessons</li>
            <li>Learn from watching other players</li>
            <li>Build camaraderie with fellow students</li>
            <li>Structured progression through skill levels</li>
          </ul>

          <h4>Online Coaching</h4>
          <p>
            Remote coaching for flexible learning:
          </p>
          <ul>
            <li>Access to coaches worldwide</li>
            <li>Convenient scheduling and location flexibility</li>
            <li>Video analysis and remote feedback</li>
            <li>Cost-effective coaching options</li>
          </ul>

          <h2>Getting Started with Tennis Coaching</h2>
          <p>
            Ready to find your perfect tennis coach? Here's how to begin:
          </p>
          <ol>
            <li>Assess your current skill level and goals</li>
            <li>Decide on your budget and preferred coaching format</li>
            <li>Research coaches in your area or online</li>
            <li>Read reviews and check qualifications</li>
            <li>Schedule a trial lesson to ensure good fit</li>
            <li>Commit to regular practice and coaching sessions</li>
          </ol>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Find Your Perfect Tennis Coach Today</h3>
            <p className="mb-4">
              Connect with certified tennis coaches worldwide. Browse profiles, read reviews,
              and book your first lesson to start improving your game.
            </p>
            <div className="flex gap-4">
              <Link
                href="/coaches"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Coaches
              </Link>
              <Link
                href="/register-coach"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Become a Coach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}