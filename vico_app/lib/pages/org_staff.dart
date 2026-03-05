import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OrgStaffPage extends StatefulWidget {
  final String orgId;
  const OrgStaffPage({required this.orgId, super.key});

  @override
  State<OrgStaffPage> createState() => _OrgStaffPageState();
}

class _OrgStaffPageState extends State<OrgStaffPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _staff;

  @override
  void initState() {
    super.initState();
    _staff = api.fetchOrgStaff(widget.orgId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Staff')),
      body: FutureBuilder<List<dynamic>>(
        future: _staff,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final staff = snapshot.data ?? [];
          if (staff.isEmpty) {
            return const Center(child: Text('No staff members')); }
          return ListView.separated(
            itemCount: staff.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final s = staff[index];
              final firstName = s['user']?['firstName'] ?? '';
              final lastName = s['user']?['lastName'] ?? '';
              final name = '$firstName $lastName'.trim().isEmpty ? 'Unknown' : '$firstName $lastName'.trim();
              return ListTile(
                title: Text(name),
                subtitle: Text(s['role'] ?? ''),
              );
            },
          );
        },
      ),
    );
  }
}
