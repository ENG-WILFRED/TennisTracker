import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../constants/theme.dart';
import '../../models/models.dart';

class RefereesScreen extends StatefulWidget {
  const RefereesScreen({Key? key}) : super(key: key);

  @override
  State<RefereesScreen> createState() => _RefereesScreenState();
}

class _RefereesScreenState extends State<RefereesScreen> {
  late Future<List<dynamic>> _refereesFuture;
  String _filterType = 'ALL';

  @override
  void initState() {
    super.initState();
    final apiService = Provider.of<ApiService>(context, listen: false);
    _refereesFuture = apiService.fetchReferees();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Referees'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() => _filterType = value);
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem(value: 'ALL', child: Text('All')),
              const PopupMenuItem(value: 'REFEREE', child: Text('Referees Only')),
              const PopupMenuItem(value: 'BALL_CREW', child: Text('Ball Crew')),
            ],
          ),
        ],
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _refereesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Error: ${snapshot.error}',
                style: const TextStyle(color: AppColors.error),
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text(
                'No referees found',
                style: TextStyle(color: AppColors.textMuted),
              ),
            );
          }

          final referees = snapshot.data!
              .map((r) => Referee.fromJson(r as Map<String, dynamic>))
              .toList();

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: referees.length,
            itemBuilder: (context, index) {
              return _buildRefereeCard(context, referees[index]);
            },
          );
        },
      ),
    );
  }

  Widget _buildRefereeCard(BuildContext context, Referee referee) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with name and certifications
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    referee.fullName,
                    style: Theme.of(context).textTheme.bodyMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (referee.certifications.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      referee.certifications.first,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.accent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatItem(
                  icon: Icons.sports_tennis,
                  label: 'Matches',
                  value: referee.matchesRefereed.toString(),
                ),
                _buildStatItem(
                  icon: Icons.group,
                  label: 'Ball Crew',
                  value: referee.ballCrewMatches.toString(),
                ),
                _buildStatItem(
                  icon: Icons.school,
                  label: 'Experience',
                  value: '${referee.experience}y',
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Additional info
            if (referee.nationality.isNotEmpty)
              Text(
                '📍 ${referee.nationality}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: AppColors.accent, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }
}
