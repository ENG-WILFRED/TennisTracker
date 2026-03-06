import 'package:flutter/material.dart';

class UpcomingMatchesWidget extends StatelessWidget {
  final List<dynamic> matches;

  const UpcomingMatchesWidget({super.key, required this.matches});

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
              'Upcoming Matches',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (matches.isEmpty)
              const Text('No upcoming matches')
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: matches.length,
                itemBuilder: (context, index) {
                  final match = matches[index];
                  return ListTile(
                    leading: const Icon(Icons.sports_tennis, color: Colors.green),
                    title: Text('vs ${match['opponent'] ?? 'Unknown'}'),
                    subtitle: Text('${match['role'] ?? ''} • Round ${match['round'] ?? ''}'),
                    trailing: Text(
                      match['date'] != null
                          ? DateTime.parse(match['date']).toLocal().toString().substring(0, 10)
                          : '',
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}