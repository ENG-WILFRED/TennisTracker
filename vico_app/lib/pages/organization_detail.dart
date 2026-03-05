import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'org_staff.dart';
import 'org_inventory.dart';
import 'register_player_org.dart';

class OrganizationDetailPage extends StatefulWidget {
  final String orgId;
  const OrganizationDetailPage({required this.orgId, super.key});

  @override
  State<OrganizationDetailPage> createState() => _OrganizationDetailPageState();
}

class _OrganizationDetailPageState extends State<OrganizationDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _org;
  List<dynamic> _staff = [];
  List<dynamic> _inventory = [];
  List<dynamic> _players = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    _org = api.getOrganization(widget.orgId);
    try {
      final results = await Future.wait([
        api.fetchOrgStaff(widget.orgId),
        api.fetchOrgInventory(widget.orgId),
        api.fetchOrgPlayers(widget.orgId),
      ]);
      setState(() {
        _staff = results[0] as List<dynamic>;
        _inventory = results[1] as List<dynamic>;
        _players = results[2] as List<dynamic>;
      });
    } catch (e) {
      // Handle error silently for now
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Organization Detail'),
        backgroundColor: Color(0xFF0EA5E9),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _org,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final org = snapshot.data;
          if (org == null) return Center(child: Text('Organization not found'));
          return _buildDetailView(org);
        },
      ),
    );
  }

  Widget _buildDetailView(Map<String, dynamic> org) {
    final primaryColor = _getPrimaryColor(org);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(vertical: 32, horizontal: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primaryColor, primaryColor.withOpacity(0.7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: Center(
                        child: Text(
                          org['name']?.toString().substring(0, 1).toUpperCase() ?? 'O',
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            org['name'] ?? '',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(height: 4),
                          if (org['city'] != null || org['country'] != null)
                            Text(
                              '${org['city'] ?? ''}${org['city'] != null && org['country'] != null ? ', ' : ''}${org['country'] ?? ''}',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white70,
                              ),
                            ),
                          if (org['description'] != null) ...[
                            SizedBox(height: 8),
                            Text(
                              org['description'],
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Stats
          Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                _statCard('Members', _players.length.toString(), Icons.people, Color(0xFF0EA5E9)),
                SizedBox(width: 12),
                _statCard('Staff', _staff.length.toString(), Icons.group, Color(0xFF10B981)),
                SizedBox(width: 12),
                _statCard('Inventory', _inventory.length.toString(), Icons.inventory, Color(0xFFF59E0B)),
              ],
            ),
          ),

          // Management Sections
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Management',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 16),

                // Player Registration
                _managementCard(
                  'Player Registration',
                  'Register new players for this organization',
                  Icons.person_add,
                  Color(0xFF0EA5E9),
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RegisterPlayerOrgPage(orgId: org['id'].toString()),
                    ),
                  ).then((_) => _loadData()),
                ),

                SizedBox(height: 12),

                // Staff Management
                _managementCard(
                  'Staff Management',
                  'Manage organization staff members',
                  Icons.group,
                  Color(0xFF10B981),
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OrgStaffPage(orgId: org['id'].toString()),
                    ),
                  ).then((_) => _loadData()),
                ),

                SizedBox(height: 12),

                // Inventory Management
                _managementCard(
                  'Inventory Management',
                  'Manage organization equipment and supplies',
                  Icons.inventory,
                  Color(0xFFF59E0B),
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OrgInventoryPage(orgId: org['id'].toString()),
                    ),
                  ).then((_) => _loadData()),
                ),
              ],
            ),
          ),

          SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
            ),
            SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _managementCard(String title, String description, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.grey[400], size: 16),
          ],
        ),
      ),
    );
  }

  Color _getPrimaryColor(Map<String, dynamic> org) {
    try {
      final hex = org['primaryColor'] as String?;
      if (hex != null && hex.isNotEmpty) {
        final colorHex = hex.replaceFirst('#', '');
        return Color(int.parse(colorHex, radix: 16) + 0xFF000000);
      }
    } catch (e) {
      // Fall back to default
    }
    return Color(0xFF0EA5E9);
  }
}