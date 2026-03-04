import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'org_staff.dart';
import 'org_inventory.dart';

class OrganizationDetailPage extends StatefulWidget {
  final String orgId;
  const OrganizationDetailPage({required this.orgId, super.key});

  @override
  State<OrganizationDetailPage> createState() => _OrganizationDetailPageState();
}

class _OrganizationDetailPageState extends State<OrganizationDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _org;

  @override
  void initState() {
    super.initState();
    _org = api.getOrganization(widget.orgId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Organization Detail')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _org,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final org = snapshot.data;
          if (org == null) return const Center(child: Text('Organization not found'));
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: _getGradientColors(org),
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(org['name'] ?? '',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 8),
                      Text(org['description'] ?? '', style: const TextStyle(color: Colors.white70)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _statCard('Members', org['_count']?['members']?.toString() ?? '0', Icons.people),
                          _statCard('Courts', org['_count']?['courts']?.toString() ?? '0', Icons.sports_tennis),
                          _statCard('Events', org['_count']?['events']?.toString() ?? '0', Icons.event),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => OrgStaffPage(orgId: org['id'].toString())));
                            },
                            child: const Text('View Staff'),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => OrgInventoryPage(orgId: org['id'].toString())));
                            },
                            child: const Text('View Inventory'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            children: [
              Icon(icon, size: 32, color: Colors.green),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  List<Color> _getGradientColors(Map<String, dynamic> org) {
    try {
      final primaryHex = org['primaryColor'] as String?;
      if (primaryHex != null && primaryHex.isNotEmpty) {
        Color primary = _hexToColor(primaryHex);
        // generate darker shade for gradient
        Color secondary = Color.fromARGB(
            primary.alpha,
            (primary.red * 0.8).toInt(),
            (primary.green * 0.8).toInt(),
            (primary.blue * 0.8).toInt());
        return [primary, secondary];
      }
    } catch (e) {
      // fall back to default
    }
    return [Colors.blue.shade600, Colors.indigo.shade600];
  }

  Color _hexToColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
