import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Find Tennis Coach | Certified Instructors & Professional Coaching',
  description: 'Find tennis coaches and instructors near you. Connect with certified professionals, book lessons, and improve your game. All skill levels welcome.',
  keywords: [
    'find tennis coach',
    'tennis instructor',
    'tennis lessons',
    'tennis coaching',
    'certified tennis coach',
    'tennis trainer'
  ],
  openGraph: {
    title: 'Find Tennis Coach | Certified Instructors & Professional Coaching',
    description: 'Find tennis coaches and instructors near you. Connect with certified professionals and book lessons.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/find-tennis-coach',
  },
};

export default function FindTennisCoachPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Tennis Coach: Connect with Expert Instructors
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover certified tennis coaches in your area. From beginner lessons to advanced training,
            find the perfect coach to help you master your game.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Certified Professionals
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ PTR & USPTA certified coaches</li>
              <li>✓ Verified credentials & experience</li>
              <li>✓ Student reviews & ratings</li>
              <li>✓ Background-checked instructors</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              All Skill Levels
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Beginner-friendly coaching</li>
              <li>✓ Intermediate technique work</li>
              <li>✓ Advanced competitive training</li>
              <li>✓ Junior player development</li>
            </ul>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>How to Find the Right Tennis Coach</h2>
          <p>
            Finding a great tennis coach can accelerate your improvement and make the game more enjoyable.
            Our platform connects you with qualified instructors who specialize in different aspects of tennis.
          </p>

          <h3>Types of Tennis Coaches</h3>

          <h4>Private Coaches</h4>
          <p>
            One-on-one instruction tailored to your specific needs and goals:
          </p>
          <ul>
            <li>Personalized lesson plans and drills</li>
            <li>Immediate feedback and technique correction</li>
            <li>Flexible scheduling to fit your availability</li>
            <li>Faster skill development and progress</li>
          </ul>

          <h4>Group Coaches</h4>
          <p>
            Small group lessons for social learning and motivation:
          </p>
          <ul>
            <li>More affordable than private lessons</li>
            <li>Learn from observing other players</li>
            <li>Build camaraderie and friendly competition</li>
            <li>Structured progression through skill levels</li>
          </ul>

          <h4>Specialty Coaches</h4>
          <p>
            Coaches with expertise in specific areas:
          </p>
          <ul>
            <li><strong>Junior Coaches:</strong> Specialized in youth development</li>
            <li><strong>Competitive Coaches:</strong> Tournament preparation and strategy</li>
            <li><strong>Technique Coaches:</strong> Stroke mechanics and fundamentals</li>
            <li><strong>Mental Coaches:</strong> Sports psychology and mental toughness</li>
          </ul>

          <h3>What to Look for in a Tennis Coach</h3>
          <ul>
            <li><strong>Certification:</strong> Professional qualifications (PTR, USPTA, etc.)</li>
            <li><strong>Experience:</strong> Years of coaching and player success stories</li>
            <li><strong>Teaching Style:</strong> Patient, encouraging, and effective communication</li>
            <li><strong>Specialization:</strong> Matches your skill level and goals</li>
            <li><strong>Reviews:</strong> Positive feedback from previous students</li>
            <li><strong>Availability:</strong> Convenient scheduling and location</li>
          </ul>

          <h3>Coaching Services Available</h3>

          <h4>Individual Lessons</h4>
          <p>
            Private one-on-one coaching sessions focused on your development:
          </p>
          <ul>
            <li>Customized training programs</li>
            <li>Video analysis and feedback</li>
            <li>Technique breakdown and correction</li>
            <li>Strategy and tactical development</li>
          </ul>

          <h4>Group Clinics</h4>
          <p>
            Small group training sessions for comprehensive skill development:
          </p>
          <ul>
            <li>Structured curriculum and progression</li>
            <li>Peer learning and motivation</li>
            <li>Cost-effective training option</li>
            <li>Social aspect of group learning</li>
          </ul>

          <h4>Online Coaching</h4>
          <p>
            Remote coaching for flexible learning anywhere:
          </p>
          <ul>
            <li>Access to coaches worldwide</li>
            <li>Convenient scheduling</li>
            <li>Video lesson recordings</li>
            <li>Progress tracking and feedback</li>
          </ul>

          <h2>Getting Started with Tennis Coaching</h2>
          <p>
            Ready to find your perfect tennis coach? Follow these steps:
          </p>
          <ol>
            <li>Assess your current skill level and goals</li>
            <li>Determine your budget and preferred coaching format</li>
            <li>Browse coach profiles and read reviews</li>
            <li>Schedule a trial lesson or consultation</li>
            <li>Discuss your objectives and create a training plan</li>
            <li>Commit to regular practice and coaching sessions</li>
          </ol>

          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4">Find Your Tennis Coach Today</h3>
            <p className="mb-4">
              Browse certified tennis coaches, read reviews, and book your first lesson.
              Start your journey to tennis mastery with expert guidance.
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