import Link from 'next/link';

export default function Hero() {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-green-100 to-sky-100">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative w-full px-4 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Join 10,000+ Tennis Players
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Elevate Your
              <span className="block mt-2 bg-gradient-to-r from-green-600 via-emerald-600 to-sky-600 bg-clip-text text-transparent">Tennis Game</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
              Track matches, connect with coaches, analyze performance, and join a thriving tennis community. Your complete platform for tennis excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2">
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="#about" className="px-8 py-4 border-2 border-green-600 text-green-700 rounded-xl hover:bg-green-50 transition-all font-semibold text-lg text-center transform hover:scale-105">
                Learn More
              </a>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Active Players</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Pro Coaches</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Matches Tracked</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80" 
                alt="Tennis player in action"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="text-2xl font-bold mb-2">Start Your Journey Today</div>
                <div className="text-white/90">Professional tennis tracking made simple</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
