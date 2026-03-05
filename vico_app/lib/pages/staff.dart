import 'package:flutter/material.dart';
import '../services/api_service.dart';

class StaffPage extends StatefulWidget {
  const StaffPage({super.key});

  @override
  State<StaffPage> createState() => _StaffPageState();
}

class _StaffPageState extends State<StaffPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _staff;
  String _search = '';
  String _roleFilter = 'all';
  List<String> _roles = [];

  @override
  void initState() {
    super.initState();
    _staff = api.fetchStaff().then((items) {
      if (items is List) {
        final roles = <String>{};
        for (var item in items) {
          if (item['role'] != null) roles.add(item['role']);
        }
        setState(() => _roles = roles.toList()..sort());
        return items;
      }
      return [];
    });
  }

  List<dynamic> _filterStaff(List<dynamic> staff) {
    var filtered = staff;

    if (_search.isNotEmpty) {
      filtered = staff.where((s) {
        final name = '${s['firstName'] ?? s['name'] ?? ''} ${s['lastName'] ?? ''}'.toLowerCase();
        return name.contains(_search.toLowerCase());
      }).toList();
    }

    if (_roleFilter != 'all' && _roleFilter.isNotEmpty) {
      filtered = filtered.where((s) => s['role'] == _roleFilter).toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8F4FF), Color(0xFFFBF5FF), Color(0xFFF3E8FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _staff,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final staff = snapshot.data ?? [];
            final display = _filterStaff(staff);

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(staff),
                      SizedBox(height: 20),
                      _buildFilterChips(),
                      SizedBox(height: 20),
                      if (display.isEmpty)
                        _buildEmptyState()
                      else
                        _buildStaffGrid(display),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF7C3AED)))),
          ),
          SizedBox(height: 16),
          Text('Loading staff...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> allStaff) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.groups, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Organization Team', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Staff Members', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Manage your organization team and staff roles', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        SizedBox(height: 20),
        Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${allStaff.length}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Team Members', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('Active staff', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
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
            hintText: 'Search staff...',
            prefixIcon: Icon(Icons.search, color: Color(0xFF7C3AED)),
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
              _buildRoleChip('All Roles', 'all'),
              SizedBox(width: 8),
              ..._roles.map((role) => Padding(
                padding: EdgeInsets.only(right: 8),
                child: _buildRoleChip(role, role),
              )).toList(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRoleChip(String label, String value) {
    final isActive = _roleFilter == value;
    return FilterChip(
      label: Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold, fontSize: 12)),
      selected: isActive,
      onSelected: (_) => setState(() => _roleFilter = value),
      backgroundColor: Colors.white,
      selectedColor: Color(0xFF7C3AED),
      side: BorderSide(color: isActive ? Color(0xFF7C3AED) : Color(0xFFE9D5FF)),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE9D5FF), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.groups, size: 48, color: Color(0xFFC084FC)),
          SizedBox(height: 16),
          Text('No staff found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('Try adjusting your search or filters', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildStaffGrid(List<dynamic> staff) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE9D5FF)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          SizedBox(height: 0),
          Padding(
            padding: const EdgeInsets.all(16),
            child: GridView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: MediaQuery.of(context).size.width > 900 ? 3 : (MediaQuery.of(context).size.width > 600 ? 2 : 1),
                childAspectRatio: 0.75,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: staff.length,
              itemBuilder: (context, index) => _buildStaffCard(staff[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaffCard(dynamic staffMember) {
    final name = '${staffMember['firstName'] ?? staffMember['name'] ?? ''} ${staffMember['lastName'] ?? ''}'.trim();
    final role = staffMember['role'] ?? 'Staff';
    final joinDate = staffMember['joinedAt'];

    return Container(
      decoration: BoxDecoration(
        color: Color(0xFFFAF5FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE9D5FF)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
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
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
                  SizedBox(height: 6),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(role, style: TextStyle(fontSize: 11, color: Color(0xFF7C3AED), fontWeight: FontWeight.w600)),
                  ),
                  if (joinDate != null) ...[
                    SizedBox(height: 8),
                    Text('Joined $joinDate', style: TextStyle(fontSize: 9, color: Colors.grey[600])),
                  ],
                  Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: Icon(Icons.edit, size: 12),
                          label: Text('Edit', style: TextStyle(fontSize: 10)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Color(0xFF7C3AED)),
                            padding: EdgeInsets.symmetric(vertical: 6),
                          ),
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: Icon(Icons.delete, size: 12),
                          label: Text('Remove', style: TextStyle(fontSize: 10)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.red),
                            padding: EdgeInsets.symmetric(vertical: 6),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
