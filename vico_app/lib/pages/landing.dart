import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _players;
  late Future<List<dynamic>> _coaches;
  late Future<List<dynamic>> _referees;
  late Future<Map<String, dynamic>> _rules;

  @override
  void initState() {
    super.initState();
    _players = api.fetchPlayers();
    _coaches = api.fetchCoaches();
    _referees = api.fetchReferees();
    _rules = api.fetchRules();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vico'),
        backgroundColor: Colors.green,
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: Colors.green),
                child: Text('Vico', style: TextStyle(color: Colors.white, fontSize: 24)),
              ),
              ListTile(title: const Text('Home'), leading: const Icon(Icons.home), onTap: () => Navigator.pop(context)),
              ListTile(title: const Text('Coaches'), leading: const Icon(Icons.sports_tennis), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/coaches'); }),
              ListTile(title: const Text('Players'), leading: const Icon(Icons.person), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/players'); }),
              ListTile(title: const Text('Matches'), leading: const Icon(Icons.view_list), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/matches'); }),
              ListTile(title: const Text('Organizations'), leading: const Icon(Icons.business), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/organizations'); }),
              ListTile(title: const Text('Referees'), leading: const Icon(Icons.gavel), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/referees'); }),
              ListTile(title: const Text('Dashboard'), leading: const Icon(Icons.dashboard), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/dashboard'); }),
              ListTile(title: const Text('Inventory'), leading: const Icon(Icons.inventory), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/inventory'); }),
              ListTile(title: const Text('Analytics'), leading: const Icon(Icons.bar_chart), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/analytics'); }),
              ListTile(title: const Text('Contact'), leading: const Icon(Icons.contact_mail), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/contact'); }),
              ListTile(title: const Text('Chat'), leading: const Icon(Icons.chat), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/chat'); }),
              ListTile(title: const Text('Leaderboard'), leading: const Icon(Icons.leaderboard), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/leaderboard'); }),
              ListTile(title: const Text('Knockout'), leading: const Icon(Icons.sports_kabaddi), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/knockout'); }),
              ListTile(title: const Text('Staff'), leading: const Icon(Icons.people), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/staff'); }),
              ListTile(title: const Text('Teachings'), leading: const Icon(Icons.school), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/teachings'); }),
              ListTile(title: const Text('Login'), leading: const Icon(Icons.login), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/login'); }),
              ListTile(title: const Text('Register'), leading: const Icon(Icons.person_add), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/register'); }),
              ListTile(title: const Text('Register Coach'), leading: const Icon(Icons.person_add), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/register_coach'); }),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHero(),
            _buildAbout(),
            _buildFeatures(),
            _buildPlayersSection(),
            _buildCoachesSection(),
            _buildRefereesSection(),
            _buildRulesSection(),
            _buildCTA(),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Join Thousands on Vico',
                        style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Play. Track. Win.\nOn Vico.',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Connect with players and coaches. Track your matches, analyze your performance, and join a thriving community. Your sports ecosystem awaits.',
                      style: TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                    ),
                    const SizedBox(height: 30),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: () => Navigator.pushNamed(context, '/register'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Get Started Free', style: TextStyle(fontSize: 16)),
                        ),
                        const SizedBox(width: 20),
                        OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.green),
                            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Learn More', style: TextStyle(color: Colors.green, fontSize: 16)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),
                    Row(
                      children: [
                        _buildStat('10K+', 'Active Players'),
                        const SizedBox(width: 40),
                        _buildStat('500+', 'Pro Coaches'),
                        const SizedBox(width: 40),
                        _buildStat('50K+', 'Matches Tracked'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 40),
              Expanded(
                child: Container(
                  height: 400,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    image: const DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String number, String label) {
    return Column(
      children: [
        Text(number, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87)),
        Text(label, style: const TextStyle(color: Colors.black54)),
      ],
    );
  }

  Widget _buildAbout() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          const Text(
            'The Beautiful Game of Tennis',
            style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          const Text(
            'A sport that combines athleticism, strategy, and mental toughness — played and loved worldwide',
            style: TextStyle(fontSize: 18, color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 60),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 300,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    image: const DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 40),
              Expanded(
                child: Column(
                  children: [
                    _buildAboutPoint('🏆', 'Rich History & Prestige', 'From Wimbledon\'s grass courts to Roland Garros\' clay, tennis boasts centuries of tradition and the most prestigious Grand Slam tournaments in sports.'),
                    const SizedBox(height: 20),
                    _buildAboutPoint('💪', 'Total Body Workout', 'Improve cardiovascular health, build strength, enhance agility and coordination. Tennis provides a complete fitness solution for all ages and skill levels.'),
                    const SizedBox(height: 20),
                    _buildAboutPoint('🌍', 'Global Community', 'Join millions worldwide in the tennis community. Connect with players, coaches, and enthusiasts who share your passion for the sport.'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAboutPoint(String icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Colors.green, Colors.teal]),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Center(child: Text(icon, style: const TextStyle(fontSize: 24))),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 8),
              Text(desc, style: const TextStyle(color: Colors.black54, height: 1.5)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeatures() {
    final features = [
      {'icon': '📊', 'title': 'Match Analytics', 'desc': 'Comprehensive statistics and insights from every match you play'},
      {'icon': '👥', 'title': 'Player Network', 'desc': 'Connect with thousands of players at your skill level'},
      {'icon': '🏆', 'title': 'Rankings & Leaderboards', 'desc': 'Compete globally and track your progression'},
      {'icon': '👨‍🏫', 'title': 'Expert Coaching', 'desc': 'Get matched with certified coaches tailored to your needs'},
      {'icon': '📈', 'title': 'Performance Tracking', 'desc': 'Monitor your improvement with detailed analytics'},
      {'icon': '📅', 'title': 'Smart Scheduling', 'desc': 'Manage matches, training sessions, and tournaments effortlessly'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          const Text(
            'Why Choose Vico?',
            style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          const Text(
            'Your complete sports ecosystem for managing matches, teams, and competition',
            style: TextStyle(fontSize: 18, color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 60),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 400,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    image: const DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 40),
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: features.map((feature) => _buildFeatureCard(feature)).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(Map<String, String> feature) {
    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Colors.blue, Colors.cyan]),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Center(child: Text(feature['icon']!, style: const TextStyle(fontSize: 24))),
          ),
          const SizedBox(height: 15),
          Text(feature['title']!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 8),
          Text(feature['desc']!, style: const TextStyle(color: Colors.black54, fontSize: 14), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildPlayersSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Elite Players', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Featured Players',
                      style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Discover talented players from around the world and track their journey to excellence',
                      style: TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/players'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('View All Players'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          FutureBuilder<List<dynamic>>(
            future: _players,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return const Center(child: Text('Error loading players'));
              }
              final players = snapshot.data?.take(3) ?? [];
              return Row(
                children: players.map((player) => Expanded(child: _buildPlayerCard(player))).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerCard(dynamic player) {
    final name = player['name'] ?? player['username'] ?? 'Unknown';
    final matchesWon = player['matchesWon'] ?? 0;
    final matchesPlayed = player['matchesPlayed'] ?? 0;
    final winRate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).round() : 0;

    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundImage: player['photo'] != null ? NetworkImage(player['photo']) : null,
            child: player['photo'] == null ? const Icon(Icons.person, size: 40) : null,
          ),
          const SizedBox(height: 15),
          Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text('Win Rate: $winRate%', style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/players/${player['id']}'),
            child: const Text('View Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachesSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Professional Coaching Staff', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Meet Our Expert Coaches',
                      style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Learn from certified professionals with years of experience and proven track records',
                      style: TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/coaches'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('View All Coaches'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          FutureBuilder<List<dynamic>>(
            future: _coaches,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return const Center(child: Text('Error loading coaches'));
              }
              final coaches = snapshot.data?.take(3) ?? [];
              return Row(
                children: coaches.map((coach) => Expanded(child: _buildCoachCard(coach))).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCoachCard(dynamic coach) {
    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundImage: coach['photo'] != null ? NetworkImage(coach['photo']) : null,
            child: coach['photo'] == null ? const Icon(Icons.person, size: 40) : null,
          ),
          const SizedBox(height: 15),
          Text(coach['name'] ?? 'Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text(coach['expertise'] ?? '', style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/coaches/${coach['id']}'),
            child: const Text('View Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildRefereesSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Official Referees', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Meet Our Referees & Ball Crew',
                      style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Certified professionals ensuring fair play and smooth match operations',
                      style: TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/referees'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('View All Referees'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          FutureBuilder<List<dynamic>>(
            future: _referees,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return const Center(child: Text('Error loading referees'));
              }
              final referees = snapshot.data?.take(3) ?? [];
              return Row(
                children: referees.map((referee) => Expanded(child: _buildRefereeCard(referee))).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRefereeCard(dynamic referee) {
    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundImage: referee['photo'] != null ? NetworkImage(referee['photo']) : null,
            child: referee['photo'] == null ? const Icon(Icons.person, size: 40) : null,
          ),
          const SizedBox(height: 15),
          Text('${referee['firstName'] ?? ''} ${referee['lastName'] ?? ''}'.trim(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text(referee['experience'] ?? '', style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/referees/${referee['id']}'),
            child: const Text('View Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildRulesSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F5E8), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          const Text(
            'Master the Game',
            style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          const Text(
            'Everything you need to know to play tennis like a professional',
            style: TextStyle(fontSize: 18, color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/teachings'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('View Full Teachings'),
          ),
          const SizedBox(height: 40),
          FutureBuilder<Map<String, dynamic>>(
            future: _rules,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return const Center(child: Text('Error loading rules'));
              }
              final rules = snapshot.data ?? {};
              return Column(
                children: rules.entries.take(4).map((entry) => _buildRulesCategory(entry.key, entry.value)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRulesCategory(String category, List<dynamic> rules) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(category, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...rules.take(3).map((rule) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Text('${rule['label']}: ${rule['value'] ?? ''}', style: const TextStyle(color: Colors.black54)),
          )),
        ],
      ),
    );
  }

  Widget _buildCTA() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Colors.green, Colors.teal]),
      ),
      child: Column(
        children: [
          const Text(
            'Ready to Join Vico?',
            style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          const Text(
            'Thousands of players, coaches, and organizations already compete on Vico. Your next level awaits.',
            style: TextStyle(fontSize: 18, color: Colors.white70),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Join Vico Free'),
              ),
              const SizedBox(width: 20),
              OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Sign In'),
              ),
            ],
          ),
          const SizedBox(height: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildCTABenefit('Free Forever'),
              _buildCTABenefit('No Credit Card'),
              _buildCTABenefit('Cancel Anytime'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCTABenefit(String text) {
    return Row(
      children: [
        const Icon(Icons.check, color: Colors.white),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(color: Colors.white)),
        const SizedBox(width: 20),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      color: Colors.grey[900],
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Vico', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    const Text(
                      'Your complete sports ecosystem. Connect, compete, and achieve greatness on Vico.',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        IconButton(icon: const Icon(Icons.facebook, color: Colors.grey), onPressed: () {}),
                        IconButton(icon: const Icon(Icons.link, color: Colors.grey), onPressed: () {}),
                        IconButton(icon: const Icon(Icons.camera_alt, color: Colors.grey), onPressed: () {}),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Quick Links', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextButton(onPressed: () {}, child: const Text('About', style: TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Players', style: TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Coaches', style: TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Rules', style: TextStyle(color: Colors.grey))),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Get Started', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: const Text('Register', style: TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/login'), child: const Text('Login', style: TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/contact'), child: const Text('Contact', style: TextStyle(color: Colors.grey))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.grey),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('© 2026 Vico. All rights reserved.', style: TextStyle(color: Colors.grey)),
              Row(
                children: [
                  TextButton(onPressed: () {}, child: const Text('Privacy Policy', style: TextStyle(color: Colors.grey))),
                  TextButton(onPressed: () {}, child: const Text('Terms of Service', style: TextStyle(color: Colors.grey))),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}