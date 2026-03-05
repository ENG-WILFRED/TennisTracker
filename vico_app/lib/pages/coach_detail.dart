import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CoachDetailPage extends StatefulWidget {
  final String coachId;
  const CoachDetailPage({super.key, required this.coachId});

  @override
  State<CoachDetailPage> createState() => _CoachDetailPageState();
}

class _CoachDetailPageState extends State<CoachDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _coachData;

  @override
  void initState() {
    super.initState();
    _coachData = fetchCoachData();
  }

  Future<Map<String, dynamic>> fetchCoachData() async {
    try {
      final coach = await api.getCoach(widget.coachId);
      // For now, we'll simulate the dashboard data structure
      // In a real implementation, you'd have a getCoachDashboard endpoint
      final students = await api.fetchPlayers(); // This would be filtered by coach in real API
      final mockStats = {
        'totalStudents': students.length,
        'totalStudentWins': students.fold<int>(0, (sum, p) => sum + ((p['matchesWon'] ?? 0) as int)),
        'totalStudentMatches': students.fold<int>(0, (sum, p) => sum + ((p['matchesPlayed'] ?? 0) as int)),
        'averageWinRate': students.isNotEmpty
            ? students.fold<double>(0.0, (sum, p) {
                final played = (p['matchesPlayed'] ?? 0) as int;
                final won = (p['matchesWon'] ?? 0) as int;
                return sum + (played > 0 ? won / played : 0);
              }) / students.length
            : 0.0,
      };

      return {
        'coach': coach,
        'students': students.take(10).toList(), // Limit for demo
        'studentsStats': mockStats,
        'overallRating': 4.5, // Mock rating
        'performanceData': [], // Would need separate endpoint
      };
    } catch (e) {
      throw Exception('Failed to load coach data: $e');
    }
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
              ListTile(title: const Text('Home'), leading: const Icon(Icons.home), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/'); }),
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
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0FDF4), Color(0xFFF0F9FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _coachData,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError || snapshot.data == null) {
              return _buildErrorState(snapshot.error);
            }

            final data = snapshot.data!;
            final coach = data['coach'] as Map<String, dynamic>;
            final students = data['students'] as List<dynamic>;
            final stats = data['studentsStats'] as Map<String, dynamic>;
            final overallRating = data['overallRating'] as double;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildProfileHeader(coach, overallRating),
                      const SizedBox(height: 24),
                      _buildCoachingStatistics(stats),
                      const SizedBox(height: 24),
                      _buildContentGrid(students, stats),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading coach details...', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object? error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          const Text('Failed to load coach details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(error?.toString() ?? 'Unknown error', textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => setState(() => _coachData = fetchCoachData()),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(Map<String, dynamic> coach, double overallRating) {
    final name = coach['name'] ?? '${coach['firstName'] ?? ''} ${coach['lastName'] ?? ''}'.trim();
    final role = coach['role'] ?? '';
    final expertise = coach['expertise'] ?? '';
    final photo = coach['photo'];
    final contact = coach['contact'];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 8)],
                ),
                child: photo != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(56),
                        child: Image.network(photo, fit: BoxFit.cover),
                      )
                    : Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [Colors.green, Color(0xFF22C55E)]),
                          borderRadius: BorderRadius.all(Radius.circular(56)),
                        ),
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
              ),
              const SizedBox(width: 24),
              // Coach Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        if (role.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.work, size: 16, color: Colors.green),
                                const SizedBox(width: 6),
                                Text(role, style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        if (overallRating > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.yellow.shade100,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star, size: 16, color: Colors.yellow),
                                const SizedBox(width: 6),
                                Text('${overallRating.toStringAsFixed(1)} / 5.0', style: TextStyle(color: Colors.yellow.shade800, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Expertise and Contact
                    if (expertise.isNotEmpty || contact != null) ...[
                      const Divider(),
                      const SizedBox(height: 12),
                      if (expertise.isNotEmpty)
                        Row(
                          children: [
                            const Icon(Icons.verified, size: 20, color: Colors.blue),
                            const SizedBox(width: 8),
                            const Text('Specialization:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                            const SizedBox(width: 8),
                            Text(expertise, style: const TextStyle(color: Colors.black87)),
                          ],
                        ),
                      if (contact != null) ...[
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () => Navigator.pushNamed(context, '/contact'),
                          child: Row(
                            children: [
                              const Icon(Icons.email, size: 20, color: Colors.green),
                              const SizedBox(width: 8),
                              Text(contact, style: const TextStyle(color: Colors.green, decoration: TextDecoration.underline)),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCoachingStatistics(Map<String, dynamic> stats) {
    final totalStudents = stats['totalStudents'] ?? 0;
    final totalWins = stats['totalStudentWins'] ?? 0;
    final totalMatches = stats['totalStudentMatches'] ?? 0;
    final avgWinRate = stats['averageWinRate'] ?? 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.bar_chart, size: 24, color: Colors.green),
            const SizedBox(width: 8),
            const Text('Coaching Statistics', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            _buildStatCard('Total Students', totalStudents.toString(), Colors.green, Icons.people),
            _buildStatCard('Student Wins', totalWins.toString(), Colors.blue, Icons.check_circle),
            _buildStatCard('Total Matches', totalMatches.toString(), Colors.purple, Icons.sports_tennis),
            _buildStatCard('Avg Win Rate', '${(avgWinRate * 100).toStringAsFixed(1)}%', Colors.yellow, Icons.trending_up),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildContentGrid(List<dynamic> students, Map<String, dynamic> stats) {
    return GridView.count(
      crossAxisCount: 1,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      children: [
        _buildStudentsSection(students),
        _buildPerformanceSection(),
      ],
    );
  }

  Widget _buildStudentsSection(List<dynamic> students) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.group, size: 20, color: Colors.green),
              const SizedBox(width: 8),
              const Text('Students Coached', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${students.length}', style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (students.isEmpty)
            _buildEmptyState('No students assigned yet', 'Students will appear here once assigned')
          else
            SizedBox(
              height: 300,
              child: ListView.builder(
                itemCount: students.length,
                itemBuilder: (context, index) {
                  final student = students[index];
                  final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
                  final matchesPlayed = student['matchesPlayed'] ?? 0;
                  final matchesWon = student['matchesWon'] ?? 0;
                  final winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed * 100).round() : 0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Colors.green, Colors.teal]),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text('$matchesPlayed matches • $matchesWon wins', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text('$winRate%', style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPerformanceSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.analytics, size: 20, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('Recent Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          _buildEmptyState('No performance data yet', 'Performance records will appear here'),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(Icons.info_outline, size: 48, color: Colors.grey),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
