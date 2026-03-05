import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final ApiService api = ApiService();
  late Future<void> _dataFuture;
  List<dynamic> _players = [];
  List<dynamic> _coaches = [];
  List<dynamic> _matches = [];
  Map<String, dynamic> _analytics = {};

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadAll();
  }

  Future<void> _loadAll() async {
    final results = await Future.wait([
      api.fetchPlayers(),
      api.fetchCoaches(),
      api.fetchMatches(),
      api.getAnalytics(),
    ]);
    _players = results[0] as List<dynamic>;
    _coaches = results[1] as List<dynamic>;
    _matches = results[2] as List<dynamic>;
    final analytics = results[3];
    if (analytics is Map) {
      _analytics = analytics.cast<String, dynamic>();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: FutureBuilder<void>(
        future: _dataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          // summary metrics
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Welcome to the Dashboard', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
                  shrinkWrap: true,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 2.5,
                  children: [
                    _metricCard('Total Players', _players.length, Colors.blue),
                    _metricCard('Total Matches', _matches.length, Colors.purple),
                    _metricCard('Total Coaches', _coaches.length, Colors.teal),
                    _metricCard('Avg Rating', '${_analytics['avgRating'] ?? 0.0}', Colors.orange),
                  ],
                ),
                SizedBox(height: 24),
                if (_players.isNotEmpty) ...[
                  Text('Top Players', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Column(
                    children: _players
                        .take(3)
                        .map((p) => ListTile(
                              title: Text(p['name'] ?? p['username'] ?? 'Unknown'),
                              subtitle: Text('Wins: ${p['wins'] ?? 0}, Matches: ${p['matchesPlayed'] ?? 0}'),
                            ))
                        .toList(),
                  ),
                  SizedBox(height: 24),
                ],
                if (_coaches.isNotEmpty) ...[
                  Text('Featured Coaches', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Column(
                    children: _coaches
                        .take(3)
                        .map((c) => ListTile(
                              title: Text(c['name'] ?? 'Coach'),
                              subtitle: Text(c['role'] ?? ''),
                            ))
                        .toList(),
                  ),
                  SizedBox(height: 24),
                ],
                if (_matches.isNotEmpty) ...[
                  Text('Upcoming Matches', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Column(
                    children: _matches
                        .take(3)
                        .map((m) {
                          final pa = m['playerA'];
                          final pb = m['playerB'];
                          final status = m['status'] ?? '';
                          return ListTile(
                            title: Text(
                                '${pa?['firstName'] ?? ''} ${pa?['lastName'] ?? ''} vs ${pb?['firstName'] ?? ''} ${pb?['lastName'] ?? ''}'),
                            subtitle: Text('Status: $status'),
                          );
                        })
                        .toList(),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _metricCard(String label, dynamic value, Color color) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          SizedBox(height: 6),
          Text('$value', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
