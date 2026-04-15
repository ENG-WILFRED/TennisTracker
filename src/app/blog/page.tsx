import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vico Sports Blog | Tennis Technology & Management Insights',
  description: 'Expert insights on tennis club management, tournament organization, referee scheduling, and sports technology. Learn from tennis industry professionals.',
  keywords: [
    'tennis management blog',
    'sports technology',
    'tournament organization',
    'tennis club management',
    'referee scheduling',
    'sports software'
  ],
  openGraph: {
    title: 'Vico Sports Blog | Tennis Technology & Management Insights',
    description: 'Expert insights on tennis club management, tournament organization, and sports technology.',
    type: 'website',
    url: 'https://vicotennis.onrender.com/blog',
  },
};

const blogPosts = [
  {
    title: 'What is a Tennis Management System? A Complete Guide',
    slug: 'what-is-tennis-management-system',
    excerpt: 'Learn how modern tennis clubs use comprehensive management software to streamline operations, improve member experience, and increase revenue.',
    date: '2024-04-15',
    readTime: '8 min read'
  },
  {
    title: 'The Architecture of Modern Sports Management Platforms',
    slug: 'architecture-sports-management-platforms',
    excerpt: 'Deep dive into the technical architecture that powers successful sports management platforms like Vico Sports.',
    date: '2024-04-10',
    readTime: '12 min read'
  },
  {
    title: 'How We Built a Real-Time Tournament Management System',
    slug: 'building-real-time-tournament-system',
    excerpt: 'Technical case study on building scalable tournament management with real-time updates, automated scheduling, and live scoring.',
    date: '2024-04-05',
    readTime: '15 min read'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vico Sports Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights on tennis technology, club management, tournament organization,
            and the future of sports software.
          </p>
        </header>

        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="border-b border-gray-200 pb-8">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</time>
                <span className="mx-2">•</span>
                <span>{post.readTime}</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="text-gray-700 text-lg leading-relaxed">
                {post.excerpt}
              </p>

              <div className="mt-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Want to stay updated with the latest in tennis technology?
          </p>
          <Link
            href="/contact"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}