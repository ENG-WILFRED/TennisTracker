import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/page_header.dart';

class InventoryPage extends StatefulWidget {
  const InventoryPage({super.key});

  @override
  State<InventoryPage> createState() => _InventoryPageState();
}

class _InventoryPageState extends State<InventoryPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _inventory;
  String _search = '';
  String _filterCategory = 'all';
  List<String> _categories = [];

  @override
  void initState() {
    super.initState();
    _inventory = api.fetchInventory().then((items) {
      if (items is List) {
        final cats = <String>{};
        for (var item in items) {
          if (item['category'] != null) cats.add(item['category']);
        }
        setState(() => _categories = cats.toList()..sort());
        return items;
      }
      return [];
    });
  }

  List<dynamic> _filterInventory(List<dynamic> items) {
    var filtered = items;

    if (_search.isNotEmpty) {
      filtered = items.where((i) {
        final name = (i['name'] ?? '').toString().toLowerCase();
        return name.contains(_search.toLowerCase());
      }).toList();
    }

    if (_filterCategory != 'all' && _filterCategory.isNotEmpty) {
      filtered = filtered.where((i) => i['category'] == _filterCategory).toList();
    }

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
            colors: [Color(0xFFFEF2F2), Color(0xFFFFF7ED), Color(0xFFFEF3C7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _inventory,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final items = snapshot.data ?? [];
            final display = _filterInventory(items);

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PageHeader(
                        title: 'Inventory',
                        description: 'Manage equipment and supplies',
                        navItems: [
                          NavItem(label: 'Dashboard', route: '/dashboard'),
                        ],
                      ),
                      const SizedBox(height: 20),
                      _buildHeader(items),
                      const SizedBox(height: 20),
                      _buildFilterChips(),
                      const SizedBox(height: 20),
                      if (display.isEmpty)
                        _buildEmptyState()
                      else
                        _buildInventoryGrid(display),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFFEA580C)))),
          ),
          SizedBox(height: 16),
          Text('Loading inventory...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> allItems) {
    final totalStock = allItems.fold<int>(0, (sum, item) => sum + ((item['quantity'] ?? 0) as int));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFFEA580C), Color(0xFFF97316)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inventory_2, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Equipment Management', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Inventory Management', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Track and manage all club equipment and supplies', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        SizedBox(height: 20),
        Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFFEA580C), Color(0xFFF97316)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${allItems.length}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Items Total', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('$totalStock units in stock', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterChips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          decoration: InputDecoration(
            hintText: 'Search items...',
            prefixIcon: Icon(Icons.search, color: Color(0xFFEA580C)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          onChanged: (v) => setState(() => _search = v),
        ),
        SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildCategoryChip('All Items', 'all'),
              SizedBox(width: 8),
              ..._categories.map((cat) => Padding(
                padding: EdgeInsets.only(right: 8),
                child: _buildCategoryChip(cat, cat),
              )).toList(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryChip(String label, String value) {
    final isActive = _filterCategory == value;
    return FilterChip(
      label: Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold, fontSize: 12)),
      selected: isActive,
      onSelected: (_) => setState(() => _filterCategory = value),
      backgroundColor: Colors.white,
      selectedColor: Color(0xFFEA580C),
      side: BorderSide(color: isActive ? Color(0xFFEA580C) : Color(0xFFFFEDD5)),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFFFEDD5), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.inventory_2, size: 48, color: Color(0xFFFED7AA)),
          SizedBox(height: 16),
          Text('No items found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('Try adjusting your search or filters', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildInventoryGrid(List<dynamic> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFFFEDD5)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      clipBehavior: Clip.hardEdge,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: MediaQuery.of(context).size.width > 900 ? 3 : (MediaQuery.of(context).size.width > 600 ? 2 : 1),
            childAspectRatio: 0.8,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) => _buildItemCard(items[index]),
        ),
      ),
    );
  }

  Widget _buildItemCard(dynamic item) {
    final name = item['name'] ?? 'Unnamed Item';
    final quantity = item['quantity'] ?? 0;
    final category = item['category'] ?? 'General';
    final isLowStock = quantity < (item['minStock'] ?? 5);

    return Container(
      decoration: BoxDecoration(
        color: isLowStock ? Color(0xFFFEE2E2) : Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isLowStock ? Color(0xFFFECACA) : Color(0xFFFFEDD5)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [Color(0xFFEA580C), Color(0xFFF97316)]),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.inventory_2, color: Colors.white, size: 18),
                ),
                if (isLowStock)
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Color(0xFFFECACA),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('Low', style: TextStyle(fontSize: 9, color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
            SizedBox(height: 8),
            // Name
            Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
            SizedBox(height: 4),
            // Category
            Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Color(0xFFFFEDD5),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(category, style: TextStyle(fontSize: 10, color: Color(0xFFEA580C), fontWeight: FontWeight.w600)),
            ),
            Spacer(),
            // Stock Count
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Color(0xFFFFEDD5)),
              ),
              child: Column(
                children: [
                  Text('$quantity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFFEA580C))),
                  Text('Units', style: TextStyle(fontSize: 9, color: Colors.grey[600])),
                ],
              ),
            ),
            SizedBox(height: 8),
            // Action Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Color(0xFFEA580C)),
                  padding: EdgeInsets.symmetric(vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: Text('Details', style: TextStyle(color: Color(0xFFEA580C), fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
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
                // already here
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
