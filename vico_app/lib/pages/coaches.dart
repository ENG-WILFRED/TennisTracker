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
                      _buildHeader(),
                      SizedBox(height: 24),
                      _buildCoachesCard(coaches, display),
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)]),
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF16A34A)))),
          ),
          SizedBox(height: 16),
          Text('Loading coaches...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Coaching Staff', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Browse available coaches and contact them', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildCoachesCard(List<dynamic> allCoaches, List<dynamic> displayCoaches) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
        border: Border.all(color: Colors.grey[200]!),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Header
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)]),
            ),
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.people, color: Colors.white, size: 24),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${allCoaches.length} coaches available',
                              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14, fontWeight: FontWeight.w500)),
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
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search coaches...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
                SizedBox(height: 20),
                // Coaches List
                if (displayCoaches.isEmpty)
                  Center(child: Text('No coaches found', style: TextStyle(color: Colors.grey[600])))
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: MediaQuery.of(context).size.width > 800 ? 2 : 1,
                      childAspectRatio: 0.8,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: displayCoaches.length,
                    itemBuilder: (context, index) {
                      final c = displayCoaches[index];
                      return _buildCoachCard(c, index);
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachCard(dynamic c, int index) {
    final isTopCoach = index < 3;
    final name = c['name'] ?? 'Unknown Coach';
    final firstLetter = name.isNotEmpty ? name[0].toUpperCase() : 'C';

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            color: isTopCoach ? Color(0xFFF0FDF4) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isTopCoach ? Color(0xFFDCFCE7) : Colors.grey[200]!),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)]),
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
                      ),
                      child: Center(
                        child: Text(
                          firstLetter,
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                          SizedBox(height: 4),
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              c['role'] ?? 'Coach',
                              style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12),
                if (c['expertise'] != null)
                  Text(c['expertise'], style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                if (c['studentCount'] != null) ...[
                  SizedBox(height: 4),
                  Text('${c['studentCount']} students', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                ],
                Spacer(),
                ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => CoachDetailPage(coachId: c['id'].toString())),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF16A34A),
                    minimumSize: Size.fromHeight(40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('View Profile', style: TextStyle(color: Colors.white, fontSize: 12)),
                ),
              ],
            ),
          ),
        ),
        if (isTopCoach)
          Positioned(
            top: -8,
            right: -8,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFFEAB308), Color(0xFFF59E0B)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('Top ${index + 1}', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
