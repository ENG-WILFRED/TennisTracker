import 'package:flutter/material.dart';

class StatsWidget extends StatelessWidget {
  final Map<String, dynamic> player;

  const StatsWidget({super.key, required this.player});

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
              'Statistics',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: 'Played',
                  value: '${player['matchesPlayed'] ?? 0}',
                  color: Colors.blue,
                ),
                _StatItem(
                  label: 'Won',
                  value: '${player['matchesWon'] ?? 0}',
                  color: Colors.green,
                ),
                _StatItem(
                  label: 'Lost',
                  value: '${player['matchesLost'] ?? 0}',
                  color: Colors.red,
                ),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: player['matchesPlayed'] != null && player['matchesPlayed'] > 0
                  ? (player['matchesWon'] ?? 0) / player['matchesPlayed']
                  : 0,
              backgroundColor: Colors.grey[300],
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
            ),
            const SizedBox(height: 8),
            Text(
              'Win Rate: ${player['matchesPlayed'] != null && player['matchesPlayed'] > 0 ? ((player['matchesWon'] ?? 0) / player['matchesPlayed'] * 100).round() : 0}%',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(color: Colors.grey[600], fontSize: 10),
        ),
      ],
    );
  }
}