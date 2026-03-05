import 'package:flutter/material.dart';

class ProfileCard extends StatelessWidget {
  final Map<String, dynamic> player;
  final int rank;
  final List<dynamic> badges;

  const ProfileCard({
    super.key,
    required this.player,
    required this.rank,
    required this.badges,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage: player['photo'] != null
                  ? NetworkImage(player['photo'])
                  : null,
              child: player['photo'] == null
                  ? Text(
                      '${player['firstName']?[0] ?? ''}${player['lastName']?[0] ?? ''}',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    )
                  : null,
            ),
            const SizedBox(height: 16),
            Text(
              '${player['firstName'] ?? ''} ${player['lastName'] ?? ''}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text('@${player['username'] ?? ''}'),
            const SizedBox(height: 8),
            Text('Rank: #$rank'),
            const SizedBox(height: 16),
            if (badges.isNotEmpty) ...[
              const Text('Badges', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: badges.map<Widget>((badge) {
                  return Chip(
                    label: Text(badge['name'] ?? ''),
                    backgroundColor: Colors.amber,
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}