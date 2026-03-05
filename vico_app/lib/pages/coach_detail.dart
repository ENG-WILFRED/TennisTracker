import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CoachDetailPage extends StatefulWidget {
  final String coachId;
  const CoachDetailPage({super.key, required this.coachId});

  @override
  State<CoachDetailPage> createState() => _CoachDetailPageState();
}

class _CoachDetailPageState extends State<CoachDetailPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _coach;

  @override
  void initState() {
    super.initState();
    _coach = fetchCoach();
  }

  Future<Map<String, dynamic>> fetchCoach() async {
    // Fetch all coaches and find the matching one since no individual endpoint exists
    final list = await api.fetchCoaches();
    return list.firstWhere((c) => c['id'] == widget.coachId, orElse: () => {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coach Details')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _coach,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null || snapshot.data!.isEmpty) {
            return const Center(child: Text('Coach not found'));
          }
          final c = snapshot.data!;
          final name = c['name'] ?? '';
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (c['photo'] != null)
                  Center(
                    child: CircleAvatar(
                      radius: 60,
                      backgroundImage: NetworkImage(c['photo']),
                    ),
                  ),
                const SizedBox(height: 12),
                Center(child: Text(name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                const SizedBox(height: 8),
                Text('Role: ${c['role'] ?? ''}'),
                Text('Expertise: ${c['expertise'] ?? ''}'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    // navigate to contact page or use external link
                    Navigator.pushNamed(context, '/contact');
                  },
                  child: const Text('Contact Coach'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
