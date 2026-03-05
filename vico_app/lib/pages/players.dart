import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'player_detail.dart';

class PlayersPage extends StatefulWidget {
  const PlayersPage({super.key});

  @override
  State<PlayersPage> createState() => _PlayersPageState();
}

class _PlayersPageState extends State<PlayersPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _players;
  String _search = '';

  /// Return a human-friendly display name for a player record. The API
  /// historically returned a flat `name` field but newer payloads may have a
  /// nested `user` object or only a username. We fallback gracefully.
  String _displayName(dynamic p) {
    // try `name`
    final raw = p['name']?.toString().trim() ?? '';
    if (raw.isNotEmpty) return raw;

    // look for user object with first/last names
    if (p['user'] != null) {
      final first = p['user']['firstName']?.toString().trim() ?? '';
      final last = p['user']['lastName']?.toString().trim() ?? '';
      final combined = '$first $last'.trim();
      if (combined.isNotEmpty) return combined;
    }

    // fallback to username if available
    final uname = p['username']?.toString().trim() ?? '';
    if (uname.isNotEmpty) return uname;

    return 'Unknown Player';
  }

  @override
  void initState() {
    super.initState();
    _players = api.fetchPlayers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vico'),
        backgroundColor: Colors.green,
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: Colors.green),
                child: Text('Vico', style: TextStyle(color: Colors.white, fontSize: 24)),
              ),
              ListTile(title: const Text('Home'), leading: const Icon(Icons.home), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/'); }),
              ListTile(title: const Text('Coaches'), leading: const Icon(Icons.sports_tennis), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/coaches'); }),
              ListTile(title: const Text('Players'), leading: const Icon(Icons.person), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/players'); }),
              ListTile(title: const Text('Matches'), leading: const Icon(Icons.view_list), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/matches'); }),
              ListTile(title: const Text('Organizations'), leading: const Icon(Icons.business), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/organizations'); }),
              ListTile(title: const Text('Referees'), leading: const Icon(Icons.gavel), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/referees'); }),
              ListTile(title: const Text('Dashboard'), leading: const Icon(Icons.dashboard), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/dashboard'); }),
              ListTile(title: const Text('Inventory'), leading: const Icon(Icons.inventory), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/inventory'); }),
              ListTile(title: const Text('Analytics'), leading: const Icon(Icons.bar_chart), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/analytics'); }),
              ListTile(title: const Text('Contact'), leading: const Icon(Icons.contact_mail), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/contact'); }),
              ListTile(title: const Text('Chat'), leading: const Icon(Icons.chat), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/chat'); }),
              ListTile(title: const Text('Leaderboard'), leading: const Icon(Icons.leaderboard), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/leaderboard'); }),
              ListTile(title: const Text('Knockout'), leading: const Icon(Icons.sports_kabaddi), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/knockout'); }),
              ListTile(title: const Text('Staff'), leading: const Icon(Icons.people), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/staff'); }),
              ListTile(title: const Text('Teachings'), leading: const Icon(Icons.school), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/teachings'); }),
              ListTile(title: const Text('Login'), leading: const Icon(Icons.login), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/login'); }),
              ListTile(title: const Text('Register'), leading: const Icon(Icons.person_add), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/register'); }),
              ListTile(title: const Text('Register Coach'), leading: const Icon(Icons.person_add), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/register_coach'); }),
            ],
          ),
        ),
      ),
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0FDF4), Color(0xFFF0F9FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _players,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red),
                    SizedBox(height: 16),
                    Text('Error: ${snapshot.error}'),
                  ],
                ),
              );
            }
            final players = snapshot.data ?? [];
            final display = _search.isNotEmpty
                ? players.where((p) {
                    final name = _displayName(p).toLowerCase();
                    final username = (p['username'] ?? '').toString().toLowerCase();
                    final nation = (p['nationality'] ?? '').toString().toLowerCase();
                    return name.contains(_search.toLowerCase()) || username.contains(_search.toLowerCase()) || nation.contains(_search.toLowerCase());
                  }).toList()
                : players;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      _buildHeader(),
                      SizedBox(height: 24),
                      // Stats
                      _buildStats(players.length),
                      SizedBox(height: 24),
                      // Search Bar
                      _buildSearchBar(),
                      SizedBox(height: 24),
                      // Players Grid
                      if (display.isEmpty)
                        _buildEmptyState()
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: MediaQuery.of(context).size.width > 800 ? 3 : (MediaQuery.of(context).size.width > 600 ? 2 : 1),
                            childAspectRatio: 0.85,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                          itemCount: display.length,
                          itemBuilder: (context, index) {
                            final p = display[index];
                            return _buildPlayerCard(p);
                          },
                        ),
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
            child: Center(
              child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF16A34A))),
            ),
          ),
          SizedBox(height: 16),
          Text('Loading players...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Players', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Browse club players, view profiles, and challenge them.',
            style: TextStyle(fontSize: 14, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildStats(int totalCount) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildStatCard('Total Players', totalCount.toString(), Color(0xFF16A34A)),
          SizedBox(width: 12),
          _buildStatCard('Active Members', totalCount.toString(), Color(0xFF0EA5E9)),
          SizedBox(width: 12),
          _buildStatCard('Available to Play', totalCount.toString(), Color(0xFF16A34A)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      width: 160,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search players by name, username, or nationality...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          SizedBox(width: 12),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF15803D)]),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Search', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerCard(dynamic p) {
    final name = _displayName(p);
    final username = p['username'] ?? 'No username';
    final firstLetter = name.isNotEmpty ? name[0].toUpperCase() : 'P';
    final wins = p['wins'] ?? 0;
    final matchesPlayed = p['matchesPlayed'] ?? 0;
    final level = p['level'] ?? 'Beginner';
    final img = p['img'];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar and Name
                Row(
                  children: [
                    if (img != null)
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage(img),
                      )
                    else
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [Color(0xFF4ADE80), Color(0xFF0EA5E9)]),
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
                        ),
                        child: Center(
                          child: Text(firstLetter, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        ),
                      ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                          SizedBox(height: 2),
                          Row(
                            children: [
                              if (p['nationality'] != null)
                                Row(
                                  children: [
                                    Icon(Icons.public, size: 12, color: Colors.grey[600]),
                                    SizedBox(width: 2),
                                    Text(p['nationality'], style: TextStyle(fontSize: 10, color: Colors.grey[600])),
                                  ],
                                ),
                              if ((p['username'] ?? '').toString().isNotEmpty) ...[
                                SizedBox(width: 6),
                                Text('@${p['username']}', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                              ],
                            ],
                          ),
                          SizedBox(height: 2),
                          Text('$level level', style: TextStyle(fontSize: 11, color: Colors.grey[500]), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12),
                // Stats
                Row(
                  children: [
                    Expanded(child: _buildMiniStat('Matches', matchesPlayed.toString())),
                    SizedBox(width: 8),
                    Expanded(child: _buildMiniStat('Wins', wins.toString())),
                    SizedBox(width: 8),
                    Expanded(child: _buildMiniStat('W/L', wins > 0 ? '${(wins / (matchesPlayed > 0 ? matchesPlayed : 1) * 100).toStringAsFixed(0)}%' : '0%')),
                  ],
                ),
              ],
            ),
          ),
          Divider(height: 1),
          // Action Buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => PlayerDetailPage(playerId: p['id'].toString())),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text('View Profile', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Color(0xFF7DD3FC)),
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text('Contact', style: TextStyle(fontSize: 12, color: Color(0xFF0EA5E9))),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Container(
      padding: EdgeInsets.all(8),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFFF0FDF4), Color(0xFFF0F9FF)]),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_outline, size: 64, color: Colors.grey[300]),
          SizedBox(height: 16),
          Text('No players found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[700])),
        ],
      ),
    );
  }
}
