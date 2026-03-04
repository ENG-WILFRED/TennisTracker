import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PlayerDetailPage extends StatefulWidget {
  final String playerId;
  const PlayerDetailPage({super.key, required this.playerId});

  @override
  State<PlayerDetailPage> createState() => _PlayerDetailPageState();
}

class _PlayerDetailPageState extends State<PlayerDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _player;

  @override
  void initState() {
    super.initState();
    _player = api.getPlayer(widget.playerId);
  }

  Future<Map<String, dynamic>> fetchPlayer() async {
    return await api.getPlayer(widget.playerId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Player Details')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _player,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null || snapshot.data!.isEmpty) {
            return const Center(child: Text('Player not found'));
          }
          final p = snapshot.data!;
          final firstName = p['firstName'] ?? '';
          final lastName = p['lastName'] ?? '';
          final name = '$firstName $lastName'.trim().isEmpty ? 'Unknown' : '$firstName $lastName'.trim();
          final email = p['email'] ?? 'No email';
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Email: $email'),
                // more fields as needed
              ],
            ),
          );
        },
      ),
    );
  }
}
