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
        title: const Text(''),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: Colors.green),
                child: const Text('Vico', style: TextStyle(color: Colors.white, fontSize: 24)),
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
            _buildAbout(context),
            _buildFeatures(context),
            _buildPlayersSection(context),
            _buildCoachesSection(context),
            _buildRefereesSection(context),
            _buildRulesSection(context),
            _buildCTA(context),
            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.only(top: 60, bottom: 60, left: 20, right: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Join Thousands on Vico',
              style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            color: Colors.green,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: const Text(
              'Play. Track. Win.\nOn Vico.',
              style: const TextStyle(
                fontSize: 42,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 1.1,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Connect with players and coaches. Track your matches, analyze your performance, and join a thriving community. Your sports ecosystem awaits.',
            style: const TextStyle(fontSize: 18, color: Colors.black54, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 30),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Get Started Free', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.green),
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Learn More', style: const TextStyle(color: Colors.green, fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 40),
          Wrap(
            spacing: 40,
            runSpacing: 20,
            alignment: WrapAlignment.center,
            children: [
              _buildStat('10K+', 'Active Players'),
              _buildStat('500+', 'Pro Coaches'),
              _buildStat('50K+', 'Matches Tracked'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String number, String label) {
    return Column(
      children: [
        Text(number, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.black54, fontSize: 14, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _sectionHeader(String text, {double fontSize = 32}) {
    return Container(
      width: double.infinity,
      color: Colors.green,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Text(
        text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildAbout(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 0),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
        children: [
          _sectionHeader('The Beautiful Game of Tennis on Vico', fontSize: 44),
          const SizedBox(height: 20),
          const Text(
            'A sport that combines athleticism, strategy, and mental toughness — played and loved worldwide',
            style: const TextStyle(fontSize: 16, color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 60),
          Wrap(
            spacing: 24,
            runSpacing: 24,
            alignment: WrapAlignment.center,
            children: [
              SizedBox(
                width: MediaQuery.of(context).size.width > 800 ? 250 : double.infinity,
                child: _buildAboutPoint('🏆', 'Rich History & Prestige', 'From Wimbledon\'s grass courts to Roland Garros\' clay, tennis boasts centuries of tradition and the most prestigious Grand Slam tournaments in sports.'),
              ),
              SizedBox(
                width: MediaQuery.of(context).size.width > 800 ? 250 : double.infinity,
                child: _buildAboutPoint('💪', 'Total Body Workout', 'Improve cardiovascular health, build strength, enhance agility and coordination. Tennis provides a complete fitness solution for all ages and skill levels.'),
              ),
              SizedBox(
                width: MediaQuery.of(context).size.width > 800 ? 250 : double.infinity,
                child: _buildAboutPoint('🌍', 'Global Community', 'Join millions worldwide in the tennis community. Connect with players, coaches, and enthusiasts who share your passion for the sport.'),
              ),
            ],
          ),
        ],
      ),
    ), // close padding wrapper
    );
  }

  Widget _buildAboutPoint(String icon, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 12, spreadRadius: 2)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: TextStyle(fontSize: 32)),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          Text(
            desc,
            style: TextStyle(color: Colors.black54, height: 1.6, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatures(BuildContext context) {
    final features = [
      {'icon': '📊', 'title': 'Match Analytics', 'desc': 'Comprehensive statistics and insights from every match you play'},
      {'icon': '👥', 'title': 'Player Network', 'desc': 'Connect with thousands of players at your skill level'},
      {'icon': '🏆', 'title': 'Rankings & Leaderboards', 'desc': 'Compete globally and track your progression'},
      {'icon': '👨‍🏫', 'title': 'Expert Coaching', 'desc': 'Get matched with certified coaches tailored to your needs'},
      {'icon': '📈', 'title': 'Performance Tracking', 'desc': 'Monitor your improvement with detailed analytics'},
      {'icon': '📅', 'title': 'Smart Scheduling', 'desc': 'Manage matches, training sessions, and tournaments effortlessly'},
    ];

      return Container(
        padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 0),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              _sectionHeader('Why Choose Vico?', fontSize: 44),
              const SizedBox(height: 20),
              const Text(
                'Your complete sports ecosystem for managing matches, teams, and competition',
                style: const TextStyle(fontSize: 16, color: Colors.black54),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 60),
              Wrap(
                spacing: 20,
                runSpacing: 20,
                alignment: WrapAlignment.center,
                children: features.map((feature) {
                  return SizedBox(
                    width: MediaQuery.of(context).size.width > 900 ? 280 : (MediaQuery.of(context).size.width > 600 ? 250 : double.infinity),
                    child: _buildFeatureCard(feature),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      );
  }

  Widget _buildFeatureCard(Map<String, String> feature) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 12, spreadRadius: 2)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(feature['icon']!, style: TextStyle(fontSize: 32)),
          const SizedBox(height: 16),
          Text(
            feature['title']!,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          Text(
            feature['desc']!,
            style: TextStyle(color: Colors.black54, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayersSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Elite Players', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 20),
              _sectionHeader('Featured Players on Vico', fontSize: 40),
              const SizedBox(height: 20),
              const Text(
                'Discover talented players from around the world and track their journey to excellence',
                style: const TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                textAlign: TextAlign.center,
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
              return Column(
                children: players.map((player) => Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: _buildPlayerCard(player),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerCard(dynamic player) {
    final name = player['name'] ?? player['username'] ?? 'Unknown';
    final level = player['level'] ?? 'Intermediate';
    final matchesPlayed = player['matchesPlayed'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Colors.green, Colors.teal]),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'P',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('$level • $matchesPlayed matches', style: TextStyle(color: Colors.black54, fontSize: 14)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/players/${player['id']}'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Profile', style: const TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachesSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Professional Coaching Staff', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 20),
              _sectionHeader('Meet Our Expert Coaches on Vico', fontSize: 40),
              const SizedBox(height: 20),
              const Text(
                'Learn from certified professionals with years of experience and proven track records',
                style: const TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                textAlign: TextAlign.center,
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
              return Column(
                children: coaches.map((coach) => Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: _buildCoachCard(coach),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCoachCard(dynamic coach) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Colors.orange, Colors.amber]),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                coach['name'] != null && coach['name'].isNotEmpty ? coach['name'][0].toUpperCase() : 'C',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(coach['name'] ?? 'Unknown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(coach['expertise'] ?? 'Professional Coach', style: TextStyle(color: Colors.black54, fontSize: 14)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/coaches/${coach['id']}'),
            child: const Text('Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildRefereesSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Official Referees', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 20),
              _sectionHeader('Meet Our Referees & Ball Crew on Vico', fontSize: 40),
              const SizedBox(height: 20),
              const Text(
                'Certified professionals ensuring fair play and smooth match operations',
                style: const TextStyle(fontSize: 18, color: Colors.black54, height: 1.5),
                textAlign: TextAlign.center,
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
              return Column(
                children: referees.map((referee) => Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: _buildRefereeCard(referee),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRefereeCard(dynamic referee) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Colors.pink, Colors.purple]),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                ((referee['firstName'] ?? '') + (referee['lastName'] ?? '')).isNotEmpty ? (referee['firstName']?[0] ?? 'R').toUpperCase() : 'R',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${referee['firstName'] ?? ''} ${referee['lastName'] ?? ''}'.trim(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(referee['experience'] ?? 'Professional', style: TextStyle(color: Colors.black54, fontSize: 14)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/referees/${referee['id']}'),
            child: const Text('Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildRulesSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          _sectionHeader('Master the Game on Vico', fontSize: 40),
          const SizedBox(height: 20),
          const Text(
            'Everything you need to know to play tennis like a professional',
            style: const TextStyle(fontSize: 18, color: Colors.black54),
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
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(category, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...rules.take(3).map((rule) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Text('${rule['label']}: ${rule['value'] ?? ''}', style: TextStyle(color: Colors.black54)),
          )),
        ],
      ),
    );
  }

  Widget _buildCTA(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Colors.green, Colors.teal]),
      ),
      child: Column(
        children: [
          const Text(
            'Ready to Join Vico?',
            style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          const Text(
            'Thousands of players, coaches, and organizations already compete on Vico. Your next level awaits.',
            style: const TextStyle(fontSize: 18, color: Colors.white70),
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
          Wrap(
            spacing: 16,
            runSpacing: 12,
            alignment: WrapAlignment.center,
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

  Widget _buildFooter(BuildContext context) {
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
                    const Text('Vico', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    const Text(
                      'Your complete sports ecosystem. Connect, compete, and achieve greatness on Vico.',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        IconButton(icon: const Icon(Icons.facebook, color: Colors.grey, size: 20), onPressed: () {}, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                        IconButton(icon: const Icon(Icons.link, color: Colors.grey, size: 20), onPressed: () {}, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                        IconButton(icon: const Icon(Icons.camera_alt, color: Colors.grey, size: 20), onPressed: () {}, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Quick Links', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextButton(onPressed: () {}, child: const Text('About', style: const TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Players', style: const TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Coaches', style: const TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () {}, child: const Text('Rules', style: const TextStyle(color: Colors.grey))),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Get Started', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: const Text('Register', style: const TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/login'), child: const Text('Login', style: const TextStyle(color: Colors.grey))),
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/contact'), child: const Text('Contact', style: const TextStyle(color: Colors.grey))),
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
              const Text('© 2026 Vico. All rights reserved.', style: const TextStyle(color: Colors.grey)),
              Row(
                children: [
                  TextButton(onPressed: () {}, child: const Text('Privacy Policy', style: const TextStyle(color: Colors.grey))),
                  TextButton(onPressed: () {}, child: const Text('Terms of Service', style: const TextStyle(color: Colors.grey))),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
