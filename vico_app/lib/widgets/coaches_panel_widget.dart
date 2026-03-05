import 'package:flutter/material.dart';

class CoachesPanel extends StatelessWidget {
  final List<dynamic> coaches;

  const CoachesPanel({super.key, required this.coaches});

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
              'Coaches',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (coaches.isEmpty)
              const Text('No coaches available')
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: coaches.length,
                itemBuilder: (context, index) {
                  final coach = coaches[index];
                  return ListTile(
                    leading: CircleAvatar(
                      child: Text('${coach['firstName']?[0] ?? ''}${coach['lastName']?[0] ?? ''}'),
                    ),
                    title: Text('${coach['firstName'] ?? ''} ${coach['lastName'] ?? ''}'),
                    subtitle: Text(coach['role'] ?? 'Coach'),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}