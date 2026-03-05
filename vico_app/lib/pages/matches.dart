import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'match_detail.dart';

class MatchesPage extends StatefulWidget {
  const MatchesPage({super.key});

  @override
  State<MatchesPage> createState() => _MatchesPageState();
}

class _MatchesPageState extends State<MatchesPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _matches;
  String _search = '';
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _matches = api.fetchMatches();
  }

  List<dynamic> _filterMatches(List<dynamic> matches) {
    var filtered = matches;

    if (_search.isNotEmpty) {
      filtered = matches.where((m) {
        final playerA = '${m['playerA']?['firstName'] ?? ''} ${m['playerA']?['lastName'] ?? ''}'.toLowerCase();
        final playerB = '${m['playerB']?['firstName'] ?? ''} ${m['playerB']?['lastName'] ?? ''}'.toLowerCase();
        return playerA.contains(_search.toLowerCase()) || playerB.contains(_search.toLowerCase());
      }).toList();
    }

    if (_filterStatus != 'all') {
      filtered = filtered.where((m) {
        final status = m['status']?.toLowerCase() ?? 'pending';
        return status == _filterStatus;
      }).toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF5F3FF), Color(0xFFFAF5FF), Color(0xFFF3E8FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _matches,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final matches = snapshot.data ?? [];
            final display = _filterMatches(matches);

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(matches),
                      SizedBox(height: 20),
                      _buildFilterBar(),
                      SizedBox(height: 20),
                      if (display.isEmpty)
                        _buildEmptyState()
                      else
                        _buildMatchesCard(display),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF7C3AED)))),
          ),
          SizedBox(height: 16),
          Text('Loading matches...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(List<dynamic> allMatches) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.sports_tennis, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Live Match Schedule', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Tennis Matches', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Track all upcoming and completed matches', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        SizedBox(height: 20),
        Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${allMatches.length}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total Matches', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('Scheduled & completed', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterBar() {
    return Row(
      children: [
        Expanded(child: _buildFilterButton('All Matches', 'all')),
        SizedBox(width: 8),
        Expanded(child: _buildFilterButton('Pending', 'pending')),
        SizedBox(width: 8),
        Expanded(child: _buildFilterButton('Completed', 'completed')),
      ],
    );
  }

  Widget _buildFilterButton(String label, String value) {
    final isActive = _filterStatus == value;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = value),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          gradient: isActive ? LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]) : null,
          color: isActive ? null : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: isActive ? null : Border.all(color: Color(0xFFE9D5FF)),
          boxShadow: [if (isActive) BoxShadow(color: Color(0xFF7C3AED).withOpacity(0.3), blurRadius: 8)],
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
        border: Border.all(color: Color(0xFFE9D5FF), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.sports_tennis, size: 48, color: Color(0xFFC084FC)),
          SizedBox(height: 16),
          Text('No matches found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('Try adjusting your filters or create a new match', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildMatchesCard(List<dynamic> matches) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE9D5FF)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search matches...',
                prefixIcon: Icon(Icons.search, color: Color(0xFF7C3AED)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Divider(height: 0),
          // Match List
          Padding(
            padding: const EdgeInsets.all(16),
            child: ListView.separated(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: matches.length,
              separatorBuilder: (_, __) => SizedBox(height: 12),
              itemBuilder: (context, index) => _buildMatchItem(matches[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchItem(dynamic match) {
    final playerA = match['playerA'];
    final playerB = match['playerB'];
    final nameA = playerA?['name'] ?? 'TBD';
    final nameB = playerB?['name'] ?? 'TBD';
    final status = match['status']?.toUpperCase() ?? 'PENDING';
    final isCompleted = status == 'COMPLETED';
    final scoreA = match['scoreA'] ?? 0;
    final scoreB = match['scoreB'] ?? 0;
    final venue = match['venue'] ?? 'TBD';
    final date = match['date'] ?? 'TBD';

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => MatchDetailPage(matchId: match['id'].toString())),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: isCompleted ? Color(0xFFF3E8FF) : Color(0xFFFAF5FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Color(0xFFE9D5FF)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
        ),
        padding: EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isCompleted ? Color(0xFFADE80B).withOpacity(0.2) : Color(0xFFC084FC).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isCompleted ? Color(0xFF65A30D) : Color(0xFF7C3AED),
                    ),
                  ),
                ),
                if (date.toString() != 'TBD')
                  Text(date.toString(), style: TextStyle(fontSize: 10, color: Colors.grey[600])),
              ],
            ),
            SizedBox(height: 10),
            // Players and Score
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(nameA, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)]),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('$scoreA - $scoreB', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                Expanded(
                  child: Text(nameB, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis, textAlign: TextAlign.right),
                ),
              ],
            ),
            SizedBox(height: 8),
            // Venue
            Row(
              children: [
                Icon(Icons.location_on, size: 12, color: Colors.grey[600]),
                SizedBox(width: 4),
                Text(venue, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
