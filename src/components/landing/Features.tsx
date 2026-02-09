export default function Features() {
  const features = [
    { 
      icon: '📊', 
      title: 'Match Analytics', 
      desc: 'Comprehensive statistics and insights from every match you play',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: '👥', 
      title: 'Player Network', 
      desc: 'Connect with thousands of players at your skill level',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      icon: '🏆', 
      title: 'Rankings & Leaderboards', 
      desc: 'Compete globally and track your progression',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: '👨‍🏫', 
      title: 'Expert Coaching', 
      desc: 'Get matched with certified coaches tailored to your needs',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: '📈', 
      title: 'Performance Tracking', 
      desc: 'Monitor your improvement with detailed analytics',
      color: 'from-red-500 to-rose-500'
    },
    { 
      icon: '📅', 
      title: 'Smart Scheduling', 
      desc: 'Manage matches, training sessions, and tournaments effortlessly',
      color: 'from-indigo-500 to-blue-500'
    },
  ];

  return (
    <section className="w-full py-5 px-4 bg-gradient-to-br from-green-100 to-sky-100">
      <div className="w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Tennis Tracker?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to excel in tennis, all in one platform</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80"
                alt="Tennis player in action"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Right Side - Features Grid */}
          <div className="order-1 lg:order-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
