import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LeaderboardPage extends StatefulWidget {
  const LeaderboardPage({super.key});

  @override
  State<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends State<LeaderboardPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _rankings;
  String _filterBy = 'all';

  @override
  void initState() {
    super.initState();
    _rankings = api.fetchLeaderboard(sort: 'rating').then((data) {
      if (data is List) return data;
      return [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0F4F8), Color(0xFFE0E7FF), Color(0xFFF3E8FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _rankings,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final rankings = snapshot.data ?? [];

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(rankings),
                      SizedBox(height: 20),
                      _buildFilterButtons(),
                      SizedBox(height: 20),
                      if (rankings.isEmpty)
                        _buildEmptyState()
                      else
                        _buildLeaderboard(rankings),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)]),
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF4F46E5)))),
          ),
          SizedBox(height: 16),
          Text('Loading rankings...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> rankings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.leaderboard, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Player Rankings', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Leaderboard', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Top players and their ratings', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        SizedBox(height: 20),
        Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${rankings.length}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total Players', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('In rankings', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterButtons() {
    return Row(
      children: [
        Expanded(child: _buildFilterButton('All', 'all')),
        SizedBox(width: 8),
        Expanded(child: _buildFilterButton('Top 10', 'top10')),
        SizedBox(width: 8),
        Expanded(child: _buildFilterButton('Women', 'women')),
      ],
    );
  }

  Widget _buildFilterButton(String label, String value) {
    final isActive = _filterBy == value;
    return GestureDetector(
      onTap: () => setState(() => _filterBy = value),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          gradient: isActive ? LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)]) : null,
          color: isActive ? null : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: isActive ? null : Border.all(color: Color(0xFFE0E7FF)),
          boxShadow: [if (isActive) BoxShadow(color: Color(0xFF4F46E5).withOpacity(0.3), blurRadius: 8)],
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold, fontSize: 12)),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE0E7FF), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.leaderboard, size: 48, color: Color(0xFFA8B5FF)),
          SizedBox(height: 16),
          Text('No rankings yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('Rankings will appear when matches are completed', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildLeaderboard(List<dynamic> rankings) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE0E7FF)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Header Row
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)]),
            ),
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                SizedBox(width: 40, child: Text('Rank', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11))),
                SizedBox(width: 8),
                Expanded(child: Text('Player', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11))),
                SizedBox(width: 20, child: Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11), textAlign: TextAlign.center)),
                SizedBox(width: 20, child: Text('L', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11), textAlign: TextAlign.center)),
                SizedBox(width: 50, child: Text('Rating', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11), textAlign: TextAlign.right)),
              ],
            ),
          ),
          // Leaderboard Items
          ListView.separated(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: rankings.length,
            separatorBuilder: (_, __) => Divider(height: 0, color: Color(0xFFE0E7FF)),
            itemBuilder: (context, index) => _buildRankingItem(rankings[index], index),
          ),
        ],
      ),
    );
  }

  Widget _buildRankingItem(dynamic player, int index) {
    final name = player['name'] ?? 'Unknown';
    final wins = player['wins'] ?? 0;
    final losses = player['matchesPlayed'] != null ? (player['matchesPlayed'] - wins) : 0;
    final rating = player['level'] ?? 'N/A';
    final isMedalist = index < 3;
    final medalColor = index == 0 ? Color(0xFFFFB700) : (index == 1 ? Color(0xFFC0C0C0) : Color(0xFFCD7F32));

    return Container(
      color: isMedalist ? Color(0xFFFAF5FF) : Colors.white,
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // Rank
          if (isMedalist)
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: medalColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(Icons.emoji_events, color: Colors.white, size: 20),
              ),
            )
          else
            SizedBox(
              width: 40,
              child: Text(
                '${index + 1}',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[800]),
                textAlign: TextAlign.center,
              ),
            ),
          SizedBox(width: 8),
          // Player Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                if (player['nationality'] != null)
                  Text(player['nationality'], style: TextStyle(fontSize: 10, color: Colors.grey[600])),
              ],
            ),
          ),
          // Wins
          SizedBox(
            width: 20,
            child: Text('$wins', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF22C55E)), textAlign: TextAlign.center),
          ),
          // Losses
          SizedBox(
            width: 20,
            child: Text('$losses', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFEF4444)), textAlign: TextAlign.center),
          ),
          // Rating
          SizedBox(
            width: 50,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: Color(0xFFEDE9FE),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text('$rating', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF4F46E5)), textAlign: TextAlign.right),
            ),
          ),
        ],
      ),
    );
  }
}
