import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/page_header.dart';

class TeachingsPage extends StatefulWidget {
  const TeachingsPage({super.key});

  @override
  State<TeachingsPage> createState() => _TeachingsPageState();
}

class _TeachingsPageState extends State<TeachingsPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _rules;

  @override
  void initState() {
    super.initState();
    _rules = api.fetchRules().then((data) => data is Map ? data : {});
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
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8F9FA), Color(0xFFE8F5E9)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _rules,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final rules = snapshot.data ?? {};

            return SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    PageHeader(
                      title: 'Master Tennis Rules & Scoring',
                      description: 'Learn everything you need to know about tennis rules, scoring systems, court regulations, and key violations to play the game like a pro.',
                      icon: Icon(Icons.school, color: Colors.white),
                      navItems: [
                        NavItem(label: 'Dashboard', route: '/dashboard'),
                        NavItem(label: 'Players', route: '/players'),
                      ],
                    ),
                    const SizedBox(height: 32),
                    // Rules Categories Grid
                    LayoutBuilder(
                      builder: (context, constraints) {
                        int columns = constraints.maxWidth > 900 ? 4 : (constraints.maxWidth > 600 ? 2 : 1);
                        final categories = [
                          {
                            'key': 'Scoring',
                            'icon': Icons.flag,
                            'color': Color(0xFF059669),
                            'bgColor': Color(0xFFF0FDF4),
                          },
                          {
                            'key': 'Basic Rules',
                            'icon': Icons.gavel,
                            'color': Color(0xFF0284C7),
                            'bgColor': Color(0xFFF0F9FF),
                          },
                          {
                            'key': 'Court & Equipment',
                            'icon': Icons.sports_tennis,
                            'color': Color(0xFFB45309),
                            'bgColor': Color(0xFFFEF3C7),
                          },
                          {
                            'key': 'Key Violations',
                            'icon': Icons.warning,
                            'color': Color(0xFFDC2626),
                            'bgColor': Color(0xFFFEF2F2),
                          },
                        ];

                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: columns,
                            mainAxisSpacing: 20,
                            crossAxisSpacing: 20,
                            childAspectRatio: 1.0,
                          ),
                          itemCount: categories.length,
                          itemBuilder: (context, index) {
                            final category = categories[index];
                            final categoryKey = category['key'] as String;
                            final categoryRules = rules[categoryKey] as List<dynamic>? ?? [];

                            return _buildCategoryCard(
                              categoryKey,
                              category['icon'] as IconData,
                              category['color'] as Color,
                              category['bgColor'] as Color,
                              categoryRules,
                            );
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 32),
                    // Detailed Sections
                    ..._buildDetailedSections(rules),
                    const SizedBox(height: 32),
                    // Call to Action
                    _buildCallToAction(),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  List<Widget> _buildDetailedSections(Map<String, dynamic> rules) {
    final categories = [
      {
        'key': 'Scoring',
        'icon': Icons.flag,
        'color': Color(0xFF059669),
        'gradient': [Color(0xFF059669), Color(0xFF0D9488)],
      },
      {
        'key': 'Basic Rules',
        'icon': Icons.gavel,
        'color': Color(0xFF0284C7),
        'gradient': [Color(0xFF0284C7), Color(0xFF0891B2)],
      },
      {
        'key': 'Court & Equipment',
        'icon': Icons.sports_tennis,
        'color': Color(0xFFB45309),
        'gradient': [Color(0xFFB45309), Color(0xFFEA580C)],
      },
      {
        'key': 'Key Violations',
        'icon': Icons.warning,
        'color': Color(0xFFDC2626),
        'gradient': [Color(0xFFDC2626), Color(0xFFEF4444)],
      },
    ];

    return categories.map((category) {
      final categoryKey = category['key'] as String;
      final categoryRules = rules[categoryKey] as List<dynamic>? ?? [];
      if (categoryRules.isEmpty) return SizedBox.shrink();

      return Container(
        margin: const EdgeInsets.only(bottom: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: category['gradient'] as List<Color>,
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      category['icon'] as IconData,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          categoryKey,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Complete guide to ${categoryKey.toLowerCase()}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: categoryKey == 'Scoring'
                  ? _buildScoringGrid(categoryRules, category['gradient'] as List<Color>)
                  : _buildRulesGrid(categoryRules, category['color'] as Color),
            ),
          ],
        ),
      );
    }).toList();
  }

  Widget _buildScoringGrid(List<dynamic> rules, List<Color> gradient) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.5,
      ),
      itemCount: rules.length,
      itemBuilder: (context, index) {
        final rule = rules[index];
        final label = rule is Map ? rule['label'] ?? '' : rule.toString();
        final value = rule is Map ? rule['value'] ?? '' : '';

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              if (value.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Represented as: $value',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildRulesGrid(List<dynamic> rules, Color color) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.2,
      ),
      itemCount: rules.length,
      itemBuilder: (context, index) {
        final rule = rules[index];
        final label = rule is Map ? rule['label'] ?? '' : rule.toString();

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCallToAction() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF059669), Color(0xFF0D9488)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Ready to Master Tennis?',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'Now that you understand the rules and scoring, book a session with one of our expert coaches to improve your game.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/coaches'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Color(0xFF059669),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Book a Coach',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(
    String title,
    IconData icon,
    Color color,
    Color bgColor,
    List<dynamic> items,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Column(
              children: [
                ...items.take(3).map((item) {
                  final label = item is Map ? item['label'] ?? '' : item.toString();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 6, right: 8),
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            label,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.black87,
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (items.length > 3)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '+${items.length - 3} more',
                      style: TextStyle(
                        fontSize: 12,
                        color: color,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                foregroundColor: color,
                textStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('View More'),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 16),
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
                // Already on teachings
              },
            ),
          ],
        ),
      ),
    );
  }
}
