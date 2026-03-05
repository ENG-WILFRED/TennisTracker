import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/profile_card.dart';
import '../widgets/stats_widget.dart';
import '../widgets/upcoming_matches_widget.dart';
import '../widgets/attendance_chart_widget.dart';
import '../widgets/inventory_panel_widget.dart';
import '../widgets/coaches_panel_widget.dart';
import '../widgets/edit_profile_modal.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final ApiService _api = ApiService();
  final AuthService _auth = AuthService();
  Map<String, dynamic>? _dashboard;
  bool _loading = true;
  String? _playerId;
  String? _error;
  bool _showEditModal = false;
  Map<String, dynamic>? _editForm;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _playerId = prefs.getString('playerId');

      if (_playerId == null) {
        setState(() {
          _error = 'Please log in to view your dashboard.';
          _loading = false;
        });
        return;
      }

      final dashboard = await _api.fetchPlayerDashboard(_playerId!);
      setState(() {
        _dashboard = dashboard;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load dashboard: $e';
        _loading = false;
      });
    }
  }

  void _openEditModal() {
    if (_dashboard == null) return;

    final player = _dashboard!['player'];
    String dateOfBirth = '';
    if (player['dateOfBirth'] != null) {
      dateOfBirth = player['dateOfBirth'].toString().substring(0, 10);
    }

    setState(() {
      _editForm = {
        'firstName': player['firstName'] ?? '',
        'lastName': player['lastName'] ?? '',
        'email': player['email'] ?? '',
        'phone': player['phone'] ?? '',
        'gender': player['gender'] ?? '',
        'dateOfBirth': dateOfBirth,
        'nationality': player['nationality'] ?? '',
        'bio': player['bio'] ?? '',
        'photo': player['photo'] ?? '',
      };
      _showEditModal = true;
    });
  }

  void _handleFieldChange(String field, String value) {
    setState(() {
      _editForm![field] = value;
    });
  }

  Future<void> _saveProfile() async {
    if (_editForm == null || _playerId == null) return;

    try {
      await _api.updatePlayerProfile(_playerId!, _editForm!);
      setState(() => _showEditModal = false);
      _loadDashboard(); // Reload dashboard to show updated data
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update profile: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dashboard')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dashboard')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                child: const Text('Go to Login'),
              ),
            ],
          ),
        ),
      );
    }

    if (_dashboard == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dashboard')),
        body: const Center(child: Text('Could not load dashboard')),
      );
    }

    final player = _dashboard!['player'];
    final rank = _dashboard!['rank'];
    final badges = _dashboard!['badges'] ?? [];
    final upcomingMatches = _dashboard!['upcomingMatches'] ?? [];
    final attendance = _dashboard!['attendance'] ?? [];
    final inventory = _dashboard!['inventory'] ?? [];
    final coaches = _dashboard!['coaches'] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Player Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _openEditModal,
          ),
        ],
      ),
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFe0f7fa), Color(0xFFa5d6a7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  if (constraints.maxWidth > 800) {
                    // Desktop layout
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
                          child: Column(
                            children: [
                              ProfileCard(
                                player: player,
                                rank: rank,
                                badges: badges,
                              ),
                              const SizedBox(height: 16),
                              Expanded(
                                child: InventoryPanel(inventory: inventory),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 2,
                          child: Column(
                            children: [
                              StatsWidget(player: player),
                              const SizedBox(height: 16),
                              AttendanceChartWidget(attendance: attendance),
                              const SizedBox(height: 16),
                              UpcomingMatchesWidget(matches: upcomingMatches),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 1,
                          child: CoachesPanel(coaches: coaches),
                        ),
                      ],
                    );
                  } else {
                    // Mobile layout
                    return ListView(
                      children: [
                        ProfileCard(
                          player: player,
                          rank: rank,
                          badges: badges,
                        ),
                        const SizedBox(height: 16),
                        StatsWidget(player: player),
                        const SizedBox(height: 16),
                        AttendanceChartWidget(attendance: attendance),
                        const SizedBox(height: 16),
                        UpcomingMatchesWidget(matches: upcomingMatches),
                        const SizedBox(height: 16),
                        InventoryPanel(inventory: inventory),
                        const SizedBox(height: 16),
                        CoachesPanel(coaches: coaches),
                      ],
                    );
                  }
                },
              ),
            ),
          ),
          if (_showEditModal && _editForm != null)
            EditProfileModal(
              editForm: _editForm!,
              onFieldChange: _handleFieldChange,
              onSave: _saveProfile,
              onCancel: () => setState(() => _showEditModal = false),
            ),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () => Navigator.pushReplacementNamed(context, '/'),
            ),
            IconButton(
              icon: const Icon(Icons.people),
              onPressed: () => Navigator.pushNamed(context, '/players'),
            ),
            IconButton(
              icon: const Icon(Icons.sports_tennis),
              onPressed: () => Navigator.pushNamed(context, '/matches'),
            ),
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: _openEditModal,
            ),
          ],
        ),
      ),
      floatingActionButton: _showEditModal
          ? null
          : FloatingActionButton(
              onPressed: _openEditModal,
              child: const Icon(Icons.edit),
            ),
    );
  }
}
