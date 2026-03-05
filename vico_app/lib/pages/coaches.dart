import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'coach_detail.dart';

class CoachesPage extends StatefulWidget {
  const CoachesPage({super.key});

  @override
  State<CoachesPage> createState() => _CoachesPageState();
}

class _CoachesPageState extends State<CoachesPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _coaches;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _coaches = api.fetchCoaches();
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
        child: FutureBuilder<List<dynamic>>(
          future: _coaches,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final coaches = snapshot.data ?? [];
            final display = _search.isNotEmpty
                ? coaches.where((c) {
                    final name = '${c['firstName'] ?? c['name'] ?? ''} ${c['lastName'] ?? ''}'.toLowerCase();
                    return name.contains(_search.toLowerCase());
                  }).toList()
                : coaches;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(coaches),
                      SizedBox(height: 24),
                      _buildCoachesGrid(display),
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
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildHeader(List<dynamic> allCoaches) {
    final totalCoaches = allCoaches.length;
    final specializations = [...{...allCoaches.map((c) => c['expertise']).where((e) => e != null)}];

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.green, Color(0xFF22C55E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.people, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$totalCoaches ${totalCoaches == 1 ? 'coach' : 'coaches'} available',
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    if (specializations.isNotEmpty)
                      Text(
                        '${specializations.length} ${specializations.length == 1 ? 'specialty' : 'specialties'}',
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/register_coach'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.add, size: 16),
                    SizedBox(width: 8),
                    Text('Employ Coach'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCoachesGrid(List<dynamic> coaches) {
    if (coaches.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Column(
          children: [
            Icon(Icons.people_outline, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No Coaches Yet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Employ a coach to get professional training assistance', textAlign: TextAlign.center),
            SizedBox(height: 16),
            // Add coach button would go here
          ],
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: coaches.length,
      itemBuilder: (context, index) {
        final coach = coaches[index];
        final isTopCoach = index < 3;
        return _buildCoachCard(coach, isTopCoach, index + 1);
      },
    );
  }

  Widget _buildCoachCard(dynamic coach, bool isTopCoach, int rank) {
    final name = coach['name'] ?? '${coach['firstName'] ?? ''} ${coach['lastName'] ?? ''}'.trim();
    final role = coach['role'] ?? '';
    final expertise = coach['expertise'] ?? '';
    final photo = coach['photo'];
    final yearsExperience = coach['yearsExperience'];
    final rating = coach['rating'];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Stack(
        children: [
          if (isTopCoach)
            Positioned(
              top: -8,
              right: -8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Colors.yellow, Colors.orange]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.white, size: 12),
                    const SizedBox(width: 4),
                    Text('Top $rank', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Avatar
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                  ),
                  child: photo != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(27),
                          child: Image.network(photo, fit: BoxFit.cover),
                        )
                      : Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(colors: [Colors.green, Colors.teal]),
                            borderRadius: BorderRadius.all(Radius.circular(27)),
                          ),
                          child: Center(
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 12),
                // Name
                Text(
                  name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // Role and Expertise
                if (role.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      role,
                      style: TextStyle(color: Colors.green.shade800, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                if (expertise.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      expertise,
                      style: TextStyle(color: Colors.blue.shade800, fontSize: 12),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                // Experience and Rating
                if (yearsExperience != null || rating != null)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (yearsExperience != null) ...[
                        const Icon(Icons.access_time, size: 14, color: Colors.green),
                        const SizedBox(width: 2),
                        Text('$yearsExperience+', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                      if (rating != null) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.star, size: 14, color: Colors.yellow),
                        Text(rating.toString(), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ],
                  ),
                const Spacer(),
                // Buttons
                Column(
                  children: [
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/contact'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        minimumSize: const Size(double.infinity, 32),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text('Contact', style: TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(height: 4),
                    OutlinedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => CoachDetailPage(coachId: coach['id'])),
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 32),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        side: const BorderSide(color: Colors.green),
                      ),
                      child: const Text('View Profile', style: TextStyle(fontSize: 12, color: Colors.green)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

