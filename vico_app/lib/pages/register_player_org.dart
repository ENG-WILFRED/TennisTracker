import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegisterPlayerOrgPage extends StatefulWidget {
  final String orgId;
  const RegisterPlayerOrgPage({required this.orgId, super.key});

  @override
  State<RegisterPlayerOrgPage> createState() => _RegisterPlayerOrgPageState();
}

class _RegisterPlayerOrgPageState extends State<RegisterPlayerOrgPage> {
  final ApiService api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  List<dynamic> _registeredPlayers = [];
  bool _isSearching = false;
  bool _isRegistering = false;
  String? _selectedPlayerId;

  @override
  void initState() {
    super.initState();
    _loadRegisteredPlayers();
  }

  Future<void> _loadRegisteredPlayers() async {
    try {
      final players = await api.fetchOrgPlayers(widget.orgId);
      setState(() {
        _registeredPlayers = players;
      });
    } catch (e) {
      // Handle error
    }
  }

  Future<void> _searchPlayers(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    try {
      final results = await api.searchPlayers(query);
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() => _isSearching = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to search players')),
      );
    }
  }

  Future<void> _registerPlayer(String playerId) async {
    setState(() => _isRegistering = true);

    try {
      await api.registerPlayerToOrg(widget.orgId, playerId);
      _searchController.clear();
      setState(() {
        _searchResults = [];
        _selectedPlayerId = null;
      });
      await _loadRegisteredPlayers();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Player registered successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to register player')),
      );
    } finally {
      setState(() => _isRegistering = false);
    }
  }

  bool _isPlayerRegistered(String playerId) {
    return _registeredPlayers.any((p) => p['id'] == playerId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Register Player'),
        backgroundColor: Color(0xFF0EA5E9),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Color(0xFF0EA5E9).withOpacity(0.3)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Register Player',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Search for a player to add to this organization',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Type to search players...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                    onChanged: (value) {
                      _searchPlayers(value);
                      setState(() => _selectedPlayerId = null);
                    },
                  ),
                  SizedBox(height: 16),
                  if (_isSearching)
                    Center(child: CircularProgressIndicator())
                  else if (_searchResults.isNotEmpty)
                    Container(
                      constraints: BoxConstraints(maxHeight: 200),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final player = _searchResults[index];
                          final isRegistered = _isPlayerRegistered(player['id']);

                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: player['img'] != null
                                  ? NetworkImage(player['img'])
                                  : null,
                              child: player['img'] == null
                                  ? Text(player['name']?.substring(0, 1).toUpperCase() ?? 'P')
                                  : null,
                            ),
                            title: Text(player['name'] ?? 'Unknown'),
                            subtitle: Text('@${player['username'] ?? ''}'),
                            trailing: isRegistered
                                ? Container(
                                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.green[100],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      'Registered',
                                      style: TextStyle(
                                        color: Colors.green[800],
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )
                                : null,
                            onTap: isRegistered
                                ? null
                                : () => setState(() => _selectedPlayerId = player['id']),
                            selected: _selectedPlayerId == player['id'],
                            selectedTileColor: Color(0xFF0EA5E9).withOpacity(0.1),
                          );
                        },
                      ),
                    )
                  else if (_searchController.text.isNotEmpty)
                    Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.people, size: 48, color: Colors.grey[400]),
                          SizedBox(height: 8),
                          Text(
                            'No players found',
                            style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Try a different search term',
                            style: TextStyle(color: Colors.grey[500], fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (_selectedPlayerId != null && !_isRegistering)
                          ? () => _registerPlayer(_selectedPlayerId!)
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF0EA5E9),
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isRegistering
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              'Register Player',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Registered Players Section
            Text(
              'Registered Players',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            if (_registeredPlayers.isEmpty)
              Container(
                padding: EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  children: [
                    Icon(Icons.people_outline, size: 48, color: Colors.grey[400]),
                    SizedBox(height: 16),
                    Text(
                      'No players registered yet',
                      style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              )
            else
              ..._registeredPlayers.map((player) => Container(
                margin: EdgeInsets.only(bottom: 8),
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green[200]!),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundImage: player['img'] != null
                          ? NetworkImage(player['img'])
                          : null,
                      child: player['img'] == null
                          ? Text(player['name']?.substring(0, 1).toUpperCase() ?? 'P')
                          : null,
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            player['name'] ?? 'Unknown',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '@${player['username'] ?? ''}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Registered',
                        style: TextStyle(
                          color: Colors.green[800],
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}