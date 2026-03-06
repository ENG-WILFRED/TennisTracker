import 'package:flutter/material.dart';

class InventoryPanel extends StatelessWidget {
  final List<dynamic> inventory;

  const InventoryPanel({super.key, required this.inventory});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Club Inventory',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (inventory.isEmpty)
              const Text('No inventory items available')
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: inventory.length,
                itemBuilder: (context, index) {
                  final item = inventory[index];
                  final isBorrowed = item['borrowed'] ?? false;
                  return ListTile(
                    leading: Icon(
                      isBorrowed ? Icons.inventory_2 : Icons.check_circle,
                      color: isBorrowed ? Colors.orange : Colors.green,
                    ),
                    title: Text(item['name'] ?? 'Unknown Item'),
                    subtitle: Text(isBorrowed ? 'Borrowed' : 'Available'),
                    trailing: isBorrowed
                        ? const Icon(Icons.warning, color: Colors.orange)
                        : const Icon(Icons.check, color: Colors.green),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}