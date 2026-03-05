import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MatchDetailPage extends StatefulWidget {
  final String matchId;
  const MatchDetailPage({super.key, required this.matchId});

  @override
  State<MatchDetailPage> createState() => _MatchDetailPageState();
}

class _MatchDetailPageState extends State<MatchDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _match;

  @override
  void initState() {
    super.initState();
    _match = api.getMatch(widget.matchId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Match Details')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _match,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null) {
            return const Center(child: Text('Match not found'));
          }
          final m = snapshot.data!;
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Match: ${m['playerA']?['name'] ?? 'TBD'} vs ${m['playerB']?['name'] ?? 'TBD'}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Date: ${m['date'] ?? ''}'),
                Text('Status: ${m['status'] ?? ''}'),
                const SizedBox(height: 12),
                Text('Score: ${m['scoreA'] ?? ''} - ${m['scoreB'] ?? ''}'),
              ],
            ),
          );
        },
      ),
    );
  }
}
