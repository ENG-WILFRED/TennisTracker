import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/page_header.dart';
import 'organization_detail.dart';

class OrganizationPage extends StatefulWidget {
  const OrganizationPage({super.key});

  @override
  State<OrganizationPage> createState() => _OrganizationPageState();
}

class _OrganizationPageState extends State<OrganizationPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _orgs;
  String _search = '';
  String _sortBy = 'rating';
  String _selectedCountry = '';
  List<String> _countries = [];

  @override
  void initState() {
    super.initState();
    _orgs = api.fetchOrganizations();
    // when the list is returned compute unique countries once
    _orgs.then((orgs) {
      final countries = <String>{};
      for (var org in orgs) {
        final c = org['country']?.toString();
        if (c != null && c.isNotEmpty) countries.add(c);
      }
      setState(() {
        _countries = countries.toList()..sort();
      });
    }).catchError((_) {
      // ignore errors here, will be handled by FutureBuilder
    });
  }

  List<dynamic> _filterAndSort(List<dynamic> orgs) {
    var filtered = orgs;

    if (_search.isNotEmpty) {
      filtered = orgs.where((o) {
        final name = (o['name'] ?? '').toString().toLowerCase();
        final desc = (o['description'] ?? '').toString().toLowerCase();
        final city = (o['city'] ?? '').toString().toLowerCase();
        return name.contains(_search.toLowerCase()) || desc.contains(_search.toLowerCase()) || city.contains(_search.toLowerCase());
      }).toList();
    }

    if (_selectedCountry.isNotEmpty) {
      filtered = filtered.where((o) => o['country'] == _selectedCountry).toList();
    }

    filtered.sort((a, b) {
      switch (_sortBy) {
        case 'rating':
          return (b['rating'] ?? 0).compareTo(a['rating'] ?? 0);
        case 'name':
          return (a['name'] ?? '').toString().compareTo(b['name'] ?? '');
        case 'activity':
          return (b['activityScore'] ?? 0).compareTo(a['activityScore'] ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
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
            colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE), Color(0xFFE0E7FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _orgs,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final orgs = snapshot.data ?? [];
            final display = _filterAndSort(orgs);

            return SingleChildScrollView(
              child: SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: PageHeader(
                        title: 'Organizations',
                        description: 'Discover and join tennis organizations',
                        navItems: [
                          NavItem(label: 'Dashboard', route: '/dashboard'),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Main content with sidebar
                          LayoutBuilder(
                            builder: (context, constraints) {
                              if (constraints.maxWidth > 800) {
                                return Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Sidebar
                                    Expanded(
                                      child: _buildSidebar(),
                                      flex: 1,
                                    ),
                                    SizedBox(width: 16),
                                    // Main Grid
                                    Expanded(
                                      flex: 3,
                                      child: _buildOrganizationsGrid(display),
                                    ),
                                  ],
                                );
                              } else {
                                return Column(
                                  children: [
                                    _buildSidebar(),
                                    SizedBox(height: 16),
                                    _buildOrganizationsGrid(display),
                                  ],
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateDialog(context),
        backgroundColor: Color(0xFF0EA5E9),
        child: Icon(Icons.add),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF0EA5E9)))),
          ),
          SizedBox(height: 16),
          Text('Loading organizations...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> allOrgs) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF3B82F6)]),
      ),
      padding: EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.apartment, color: Colors.white, size: 24),
              ),
              SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tennis Clubs & Organizations', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12, fontWeight: FontWeight.w500)),
                  Text('${allOrgs.length} organizations', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          SizedBox(height: 16),
          // Search Bar
          TextField(
            decoration: InputDecoration(
              hintText: 'Search organizations...',
              prefixIcon: Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
            onChanged: (v) => setState(() => _search = v),
          ),
          SizedBox(height: 12),
          // Sort chips
          Wrap(
            spacing: 8,
            children: [
              _buildSortChip('Top Rated', 'rating'),
              _buildSortChip('Name', 'name'),
              _buildSortChip('Activity', 'activity'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isActive = _sortBy == value;
    return FilterChip(
      label: Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold)),
      selected: isActive,
      onSelected: (_) => setState(() => _sortBy = value),
      backgroundColor: Colors.white,
      selectedColor: Color(0xFF0EA5E9),
      side: BorderSide(color: isActive ? Color(0xFF0EA5E9) : Colors.grey[300]!),
    );
  }

  Widget _buildSidebar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFBFDBFE)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
      ),
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Filter by Country', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          SizedBox(height: 12),
          if (_countries.isEmpty)
            Text('No countries available', style: TextStyle(color: Colors.grey[500], fontSize: 12))
          else
            Column(
              children: [
                GestureDetector(
                  onTap: () => setState(() => _selectedCountry = ''),
                  child: Container(
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    decoration: BoxDecoration(
                      color: _selectedCountry.isEmpty ? Color(0xFFDFEFFF) : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('All Countries', style: TextStyle(fontSize: 12, color: _selectedCountry.isEmpty ? Color(0xFF0EA5E9) : Colors.grey[700])),
                  ),
                ),
                SizedBox(height: 8),
                ..._countries.map((country) {
                  final isSelected = _selectedCountry == country;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCountry = country),
                    child: Container(
                      padding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? Color(0xFFDFEFFF) : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(country, style: TextStyle(fontSize: 12, color: isSelected ? Color(0xFF0EA5E9) : Colors.grey[700])),
                    ),
                  );
                }).toList(),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildOrganizationsGrid(List<dynamic> orgs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (orgs.isEmpty)
          Container(
            padding: EdgeInsets.symmetric(vertical: 48),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Color(0xFFBFDBFE), width: 2),
            ),
            child: Column(
              children: [
                Icon(Icons.apartment, size: 48, color: Color(0xFF7DD3FC)),
                SizedBox(height: 16),
                Text('No organizations found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[900])),
                Text('Try adjusting your search', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 3 : (MediaQuery.of(context).size.width > 600 ? 2 : 1),
              childAspectRatio: 0.75,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: orgs.length,
            itemBuilder: (context, index) => _buildOrgCard(orgs[index]),
          ),
      ],
    );
  }

  Widget _buildOrgCard(dynamic org) {
    final name = org['name'] ?? 'Organization';
    final logo = org['logo'];
    final rating = org['rating'] ?? 0.0;
    final ratingCount = org['ratingCount'] ?? 0;

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrganizationDetailPage(orgId: org['id'].toString()))),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Color(0xFFBFDBFE)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Image/Logo
            Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF3B82F6)]),
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: logo != null
                  ? Image.network(logo, fit: BoxFit.cover)
                  : Icon(Icons.apartment, color: Colors.white, size: 40),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
                    SizedBox(height: 4),
                    if (org['city'] != null)
                      Text('${org['city']}${org['country'] != null ? ', ${org['country']}' : ''}', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                    if (org['description'] != null) ...[
                      SizedBox(height: 6),
                      Text(org['description'], style: TextStyle(fontSize: 10, color: Colors.grey[600]), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                    Spacer(),
                    // Stats
                    if (ratingCount > 0)
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.star, size: 12, color: Color(0xFFF59E0B)),
                            SizedBox(width: 4),
                            Text('${rating.toStringAsFixed(1)} ($ratingCount)', style: TextStyle(fontSize: 10, color: Color(0xFF1F2937), fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // CTA Button
            Padding(
              padding: const EdgeInsets.all(12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrganizationDetailPage(orgId: org['id'].toString()))),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF0EA5E9),
                    padding: EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: Text('View Details', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Create Organization'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(decoration: InputDecoration(labelText: 'Organization Name')),
              SizedBox(height: 8),
              TextField(decoration: InputDecoration(labelText: 'City')),
              SizedBox(height: 8),
              TextField(decoration: InputDecoration(labelText: 'Country')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context), child: Text('Create')),
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
                Navigator.pushReplacementNamed(context, '/referees');
              },
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Organization'),
              onTap: () {
                Navigator.pop(context);
                // already on organizations
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
