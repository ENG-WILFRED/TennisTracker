import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OrgInventoryPage extends StatefulWidget {
  final String orgId;
  const OrgInventoryPage({required this.orgId, super.key});

  @override
  State<OrgInventoryPage> createState() => _OrgInventoryPageState();
}

class _OrgInventoryPageState extends State<OrgInventoryPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _inventory;

  @override
  void initState() {
    super.initState();
    _inventory = api.fetchOrgInventory(widget.orgId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory')),
      body: FutureBuilder<List<dynamic>>(
        future: _inventory,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return const Center(child: Text('No inventory items')); }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final item = items[index];
              return ListTile(
                title: Text(item['name'] ?? ''),
                subtitle: Text('Qty: ${item['count'] ?? 0} - ${item['condition'] ?? ''}'),
              );
            },
          );
        },
      ),
    );
  }
}
