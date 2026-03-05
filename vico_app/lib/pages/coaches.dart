import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/page_header.dart';
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
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
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
                      _buildPageHeader(),
                      const SizedBox(height: 24),
                      _buildCoachesContainer(coaches, display),
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

  Widget _buildPageHeader() {
    return const PageHeader(
      title: 'Coaching Staff',
      description: 'Browse available coaches and contact them',
      navItems: [
        NavItem(label: 'Dashboard', route: '/dashboard'),
        NavItem(label: 'Matches', route: '/matches'),
      ],
    );
  }

  Widget _buildCoachesContainer(List<dynamic> allCoaches, List<dynamic> displayCoaches) {
    final totalCoaches = allCoaches.length;
    final specializations = [...{...allCoaches.map((c) => c['expertise']).where((e) => e != null)}];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Column(
        children: [
          // Header with gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green, Color(0xFF22C55E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
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
                        border: Border.all(color: Colors.white.withOpacity(0.3)),
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
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
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
                        elevation: 0,
                        shadowColor: Colors.transparent,
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.add, size: 16),
                          SizedBox(width: 8),
                          Text('Employ Coach', style: TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(24),
            child: displayCoaches.isEmpty
                ? _buildEmptyState()
                : _buildCoachesGrid(displayCoaches),
          ),

          // Specializations footer
          if (allCoaches.isNotEmpty && specializations.isNotEmpty)
            _buildSpecializationsFooter(specializations),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(40),
            ),
            child: Icon(
              Icons.people_outline,
              size: 40,
              color: Colors.green.shade600,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No Coaches Yet',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF424242),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Employ a coach to get professional training assistance and take your tennis game to the next level.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/register_coach'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              elevation: 2,
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add),
                SizedBox(width: 8),
                Text('Add Your First Coach', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachesGrid(List<dynamic> coaches) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 600;
        final crossAxisCount = isMobile ? 1 : 2;
        final childAspectRatio = isMobile ? 1.2 : 1.1;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 20,
            mainAxisSpacing: 20,
            childAspectRatio: childAspectRatio,
          ),
          itemCount: coaches.length,
          itemBuilder: (context, index) {
            final coach = coaches[index];
            final isTopCoach = index < 3;
            return _buildCoachCard(coach, isTopCoach, index + 1);
          },
        );
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
        border: Border.all(
          color: isTopCoach ? Colors.green.shade200 : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: isTopCoach ? Colors.green.shade100 : Colors.grey.shade100,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Stack(
        children: [
          if (isTopCoach)
            Positioned(
              top: -8,
              right: -8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Colors.yellow, Colors.orange],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4)],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Top $rank',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar and basic info
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                      ),
                      child: photo != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(29),
                              child: Image.network(photo, fit: BoxFit.cover),
                            )
                          : Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.green, Colors.teal],
                                ),
                                borderRadius: BorderRadius.all(Radius.circular(29)),
                              ),
                              child: Center(
                                child: Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          // Role badge
                          if (role.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                role,
                                style: TextStyle(
                                  color: Colors.green.shade800,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Expertise badge
                if (expertise.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      expertise,
                      style: TextStyle(
                        color: Colors.blue.shade800,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),

                const SizedBox(height: 12),

                // Experience and Rating
                if (yearsExperience != null || rating != null)
                  Row(
                    children: [
                      if (yearsExperience != null) ...[
                        Icon(Icons.access_time, size: 16, color: Colors.green.shade600),
                        const SizedBox(width: 4),
                        Text(
                          '$yearsExperience+ years',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      if (rating != null) ...[
                        const SizedBox(width: 16),
                        Icon(Icons.star, size: 16, color: Colors.yellow.shade600),
                        const SizedBox(width: 4),
                        Text(
                          '$rating/5.0',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),

                const Spacer(),

                // Action buttons
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/contact'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.mail, size: 16),
                            SizedBox(width: 6),
                            Text('Contact', style: TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => CoachDetailPage(coachId: coach['id']),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Colors.green),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.visibility, size: 16, color: Colors.green),
                            SizedBox(width: 6),
                            Text(
                              'View Profile',
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
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

  Widget _buildSpecializationsFooter(List<dynamic> specializations) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Specializations Available:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF616161),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: specializations.take(6).map<Widget>((spec) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  spec.toString(),
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF616161),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
          if (specializations.length > 6)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                '+${specializations.length - 6} more',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

