import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'auth_service.dart';

class ApiService {
  final String baseUrl;
  String? _authToken;
  final AuthService _auth = AuthService();

  ApiService({this.baseUrl = Config.baseUrl});

  Future<void> _ensureToken() async {
    if (_authToken == null) {
      _authToken = await _auth.getToken();
    }
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Future<Map<String, String>> _headers() async {
    await _ensureToken();
    final headers = {'Content-Type': 'application/json'};
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<List<dynamic>> fetchPlayers({String? query}) async {
    try {
      var uri = Uri.parse('$baseUrl/api/players');
      if (query != null && query.isNotEmpty) {
        uri = uri.replace(queryParameters: {'query': query});
      }
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch players: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching players: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching players: $e');
    }
  }

  Future<List<dynamic>> fetchCoaches() async {
    try {
      final uri = Uri.parse('$baseUrl/api/coaches');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch coaches: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching coaches: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching coaches: $e');
    }
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final res = await http.post(uri, headers: await _headers(), body: jsonEncode(body));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('Failed to post to $path: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while posting to $path: ${e.message}');
    } catch (e) {
      throw Exception('Error posting to $path: $e');
    }
  }

  Future<List<dynamic>> fetchMatches() async {
    try {
      final uri = Uri.parse('$baseUrl/api/matches');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch matches: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching matches: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching matches: $e');
    }
  }

  Future<Map<String, dynamic>> getMatch(String id) async {
    try {
      final uri = Uri.parse('$baseUrl/api/matches/$id');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('Failed to fetch match: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching match $id: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching match $id: $e');
    }
  }

  // Referees
  Future<List<dynamic>> fetchReferees() async {
    try {
      final uri = Uri.parse('$baseUrl/api/referees');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch referees: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching referees: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching referees: $e');
    }
  }

  Future<Map<String, dynamic>> getReferee(String id) async {
    try {
      final uri = Uri.parse('$baseUrl/api/referees/$id');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('Failed to fetch referee: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching referee $id: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching referee $id: $e');
    }
  }

  // Rules (returns grouped by category)
  Future<Map<String, dynamic>> fetchRules() async {
    try {
      final uri = Uri.parse('$baseUrl/api/rules');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('Failed to fetch rules: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching rules: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching rules: $e');
    }
  }

  // Organizations
  Future<List<dynamic>> fetchOrganizations() async {
    try {
      final uri = Uri.parse('$baseUrl/api/organization');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch organizations: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching organizations: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching organizations: $e');
    }
  }

  Future<Map<String, dynamic>> getOrganization(String id) async {
    try {
      final uri = Uri.parse('$baseUrl/api/organization/$id');
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('Failed to fetch organization: ${res.statusCode}');
    } on SocketException catch (e) {
      throw Exception('Network error while fetching organization $id: ${e.message}');
    } catch (e) {
      throw Exception('Error fetching organization $id: $e');
    }
  }

  Future<List<dynamic>> fetchOrgStaff(String orgId) async {
    final uri = Uri.parse('$baseUrl/api/organization/$orgId/staff');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch staff: ${res.statusCode}');
  }

  Future<List<dynamic>> fetchOrgInventory(String orgId) async {
    final uri = Uri.parse('$baseUrl/api/organization/$orgId/inventory');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch inventory: ${res.statusCode}');
  }

  Future<List<dynamic>> fetchOrgPlayers(String orgId) async {
    final uri = Uri.parse('$baseUrl/api/organization/$orgId/players');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch players: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createOrganization(Map<String, dynamic> data) async {
    return await postData('/api/organization', data) as Map<String, dynamic>;
  }

  Future<List<dynamic>> searchPlayers(String query) async {
    final uri = Uri.parse('$baseUrl/api/players?query=${Uri.encodeComponent(query)}');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to search players: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> registerPlayerToOrg(String orgId, String playerId) async {
    final uri = Uri.parse('$baseUrl/api/organization/$orgId/register-player');
    final res = await http.post(uri, headers: await _headers(), body: jsonEncode({'playerId': playerId}));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to register player: ${res.statusCode}');
  }

  // Generic GET method for any endpoint
  Future<dynamic> get(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception('Failed to fetch: ${res.statusCode}');
  }

  // Generic POST method
  Future<dynamic> postData(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await http.post(uri, headers: await _headers(), body: jsonEncode(body));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body);
    }
    throw Exception('Request failed: ${res.statusCode}');
  }

  // Get single player
  Future<Map<String, dynamic>> getPlayer(String id) async {
    final uri = Uri.parse('$baseUrl/api/players/$id');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to fetch player: ${res.statusCode}');
  }

  // Get single coach
  Future<Map<String, dynamic>> getCoach(String id) async {
    final uri = Uri.parse('$baseUrl/api/coaches/$id');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to fetch coach: ${res.statusCode}');
  }

  // Get leaderboard
  Future<List<dynamic>> fetchLeaderboard({String sort = 'rating'}) async {
    final uri = Uri.parse('$baseUrl/api/players?sort=$sort');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch leaderboard: ${res.statusCode}');
  }

  // Get analytics
  Future<Map<String, dynamic>> getAnalytics({String? range}) async {
    var uri = Uri.parse('$baseUrl/api/analytics');
    if (range != null && range.isNotEmpty) {
      uri = uri.replace(queryParameters: {'range': range});
    }
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to fetch analytics: ${res.statusCode}');
  }

  // Get staff
  Future<List<dynamic>> fetchStaff({String? query, String? role}) async {
    var uri = Uri.parse('$baseUrl/api/staff');
    final params = <String,String>{};
    if (query != null && query.isNotEmpty) params['query'] = query;
    if (role != null && role.isNotEmpty && role != 'all') params['role'] = role;
    if (params.isNotEmpty) {
      uri = uri.replace(queryParameters: params);
    }
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch staff: ${res.statusCode}');
  }

  // Get inventory
  Future<List<dynamic>> fetchInventory() async {
    final uri = Uri.parse('$baseUrl/api/inventory');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch inventory: ${res.statusCode}');
  }

  // Chat functions
  Future<List<dynamic>> fetchChatRooms() async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch chat rooms: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createChatRoom(String name) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms');
    final res = await http.post(uri, headers: await _headers(), body: jsonEncode({'name': name}));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to create chat room: ${res.statusCode}');
  }

  Future<List<dynamic>> fetchChatMessages(String roomId) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms/$roomId/messages');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch chat messages: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> sendChatMessage(String roomId, String content) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms/$roomId/messages');
    final res = await http.post(uri, headers: await _headers(), body: jsonEncode({'content': content}));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to send message: ${res.statusCode}');
  }

  Future<List<dynamic>> fetchChatParticipants(String roomId) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms/$roomId/participants');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to fetch participants: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> fetchChatMe() async {
    final uri = Uri.parse('$baseUrl/api/chat/me');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to fetch user: ${res.statusCode}');
  }

  Future<void> setChatOnline(String roomId) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms/$roomId/status');
    final res = await http.post(uri, headers: await _headers());
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return;
    }
    throw Exception('Failed to set online: ${res.statusCode}');
  }

  Future<void> setChatOffline(String roomId) async {
    final uri = Uri.parse('$baseUrl/api/chat/rooms/$roomId/status');
    final res = await http.delete(uri, headers: await _headers());
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return;
    }
    throw Exception('Failed to set offline: ${res.statusCode}');
  }

  // Dashboard functions
  Future<Map<String, dynamic>> fetchPlayerDashboard(String playerId) async {
    final uri = Uri.parse('$baseUrl/api/dashboard?playerId=$playerId');
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to fetch dashboard: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> updatePlayerProfile(String playerId, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/api/players/$playerId');
    final res = await http.put(uri, headers: await _headers(), body: jsonEncode(data));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to update profile: ${res.statusCode}');
  }
}

