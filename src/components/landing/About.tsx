export default function About() {
  return (
    <section id="about" className="w-full py-20 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">The Beautiful Game of Tennis</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">A sport that combines athleticism, strategy, and mental toughness — played and loved worldwide</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
            <img 
              src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80" 
              alt="Tennis court aerial view"
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Rich History & Prestige</h3>
                <p className="text-gray-600 leading-relaxed">From Wimbledon's grass courts to Roland Garros' clay, tennis boasts centuries of tradition and the most prestigious Grand Slam tournaments in sports.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💪</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Total Body Workout</h3>
                <p className="text-gray-600 leading-relaxed">Improve cardiovascular health, build strength, enhance agility and coordination. Tennis provides a complete fitness solution for all ages and skill levels.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Global Community</h3>
                <p className="text-gray-600 leading-relaxed">Join millions worldwide in the tennis community. Connect with players, coaches, and enthusiasts who share your passion for the sport.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
