import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/page_header.dart';

class RefereesPage extends StatefulWidget {
  const RefereesPage({super.key});

  @override
  State<RefereesPage> createState() => _RefereesPageState();
}

class _RefereesPageState extends State<RefereesPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _refs;
  String _search = '';
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _refs = api.fetchReferees();
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
      drawer: _buildDrawer(),
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFDF2F8), Color(0xFFFAF5FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _refs,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final refs = snapshot.data ?? [];
            final display = _search.isNotEmpty
                ? refs.where((r) => '${r['firstName'] ?? r['name'] ?? ''} ${r['lastName'] ?? ''}'.toLowerCase().contains(_search.toLowerCase())).toList()
                : refs;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PageHeader(
                        title: 'Referees & Ball Crew',
                        description: 'Meet the certified professionals ensuring fair play',
                        navItems: [
                          NavItem(label: 'Dashboard', route: '/dashboard'),
                        ],
                      ),
                      const SizedBox(height: 20),
                      _buildHeader(refs),
                      const SizedBox(height: 20),
                      _buildFilterButtons(),
                      const SizedBox(height: 20),
                      if (display.isEmpty)
                        _buildEmptyState()
                      else
                        _buildRefereesGrid(display),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFFEC4899)))),
          ),
          SizedBox(height: 16),
          Text('Loading referees...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> allRefs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFFEC4899), Color(0xFF9333EA)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.scale, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Official Referees & Ball Crew', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Referees & Ball Crew', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Meet the certified professionals ensuring fair play', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        SizedBox(height: 20),
        Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFFEC4899), Color(0xFF9333EA)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${allRefs.length}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total Staff', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('Ready to serve', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterButtons() {
    return Row(
      children: [
        _buildFilterButton('All Staff', 'all'),
        SizedBox(width: 8),
        _buildFilterButton('Referees', 'referees'),
        SizedBox(width: 8),
        _buildFilterButton('Ball Crew', 'ballcrew'),
      ],
    );
  }

  Widget _buildFilterButton(String label, String value) {
    final isActive = _filter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: isActive ? LinearGradient(colors: [Color(0xFFEC4899), Color(0xFF9333EA)]) : null,
            color: isActive ? null : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: isActive ? null : Border.all(color: Color(0xFFFBCFE8)),
            boxShadow: [if (isActive) BoxShadow(color: Color(0xFFEC4899).withOpacity(0.3), blurRadius: 8)],
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold, fontSize: 12)),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFFBCFE8), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.scale, size: 48, color: Color(0xFFFB7185)),
          SizedBox(height: 16),
          Text('No referees found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('Try adjusting your filters', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildRefereesGrid(List<dynamic> refs) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFFBCFE8)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search referees...',
                prefixIcon: Icon(Icons.search, color: Color(0xFFEC4899)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Divider(height: 0),
          // Grid
          Padding(
            padding: const EdgeInsets.all(16),
            child: GridView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: MediaQuery.of(context).size.width > 900 ? 3 : (MediaQuery.of(context).size.width > 600 ? 2 : 1),
                childAspectRatio: 0.7,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: refs.length,
              itemBuilder: (context, index) => _buildRefereeCard(refs[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRefereeCard(dynamic ref) {
    final name = '${ref['firstName'] ?? ''} ${ref['lastName'] ?? ''}'.trim();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFFBCFE8)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
      ),
      child: Column(
        children: [
          // Image/Gradient header
          Container(
            height: 120,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFFEC4899), Color(0xFF9333EA)]),
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Stack(
              children: [
                if (ref['photo'] != null)
                  Image.network(ref['photo'], fit: BoxFit.cover, width: double.infinity)
                else
                  Center(child: Icon(Icons.person, color: Colors.white, size: 40)),
                // Certified badge
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 2)],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star, size: 12, color: Color(0xFFEC4899)),
                        SizedBox(width: 4),
                        Text('Certified', style: TextStyle(fontSize: 10, color: Color(0xFFEC4899), fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  SizedBox(height: 4),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Color(0xFFFCE7F3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      ref['nationality'] ?? 'International',
                      style: TextStyle(fontSize: 10, color: Color(0xFFBE123C), fontWeight: FontWeight.w600),
                    ),
                  ),
                  SizedBox(height: 8),
                  if (ref['experience'] != null)
                    Text('${ref['experience']}+ years', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                  if (ref['matchesRefereed'] != null)
                    Text('${ref['matchesRefereed']} matches refereed', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                  Spacer(),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFFEC4899),
                        padding: EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text('View Profile', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                color: Colors.green,
              ),
              child: Text(
                'Vico App',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Dashboard'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/dashboard');
              },
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Players'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/players');
              },
            ),
            ListTile(
              leading: const Icon(Icons.sports_tennis),
              title: const Text('Matches'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/matches');
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory),
              title: const Text('Inventory'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/inventory');
              },
            ),
            ListTile(
              leading: const Icon(Icons.analytics),
              title: const Text('Analytics'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/analytics');
              },
            ),
            ListTile(
              leading: const Icon(Icons.contact_mail),
              title: const Text('Contact'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/contact');
              },
            ),
            ListTile(
              leading: const Icon(Icons.group),
              title: const Text('Staff'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/staff');
              },
            ),
            ListTile(
              leading: const Icon(Icons.school),
              title: const Text('Teachings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/teachings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.gavel),
              title: const Text('Referees'),
              onTap: () {
                Navigator.pop(context);
                // already on referees
              },
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Organization'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/organizations');
              },
            ),
            ListTile(
              leading: const Icon(Icons.chat),
              title: const Text('Chat'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/chat');
              },
            ),
            ListTile(
              leading: const Icon(Icons.leaderboard),
              title: const Text('Leaderboard'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/leaderboard');
              },
            ),
            ListTile(
              leading: const Icon(Icons.sports),
              title: const Text('Coaches'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/coaches');
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_events),
              title: const Text('Knockout'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/knockout');
              },
            ),
          ],
        ),
      ),
    );
  }
}
