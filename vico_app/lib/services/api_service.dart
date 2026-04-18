import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  static const String wsUrl = 'ws://localhost:3001';
  
  final _logger = Logger();
  String? _authToken;
  final _storage = const FlutterSecureStorage();

  ApiService() {
    _initToken();
  }

  Future<void> _initToken() async {
    _authToken = await _storage.read(key: 'auth_token');
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );

      _logger.i('POST $endpoint: ${response.statusCode}');
      return _handleResponse(response);
    } catch (e) {
      _logger.e('POST $endpoint error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      );

      _logger.i('GET $endpoint: ${response.statusCode}');
      return _handleResponse(response);
    } catch (e) {
      _logger.e('GET $endpoint error: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getList(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      );

      _logger.i('GET $endpoint: ${response.statusCode}');
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
      throw Exception('Failed to fetch list: ${response.statusCode}');
    } catch (e) {
      _logger.e('GET $endpoint error: $e');
      rethrow;
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 401) {
      _authToken = null;
      _storage.delete(key: 'auth_token');
      throw Exception('Unauthorized');
    } else {
      throw Exception('Request failed: ${response.statusCode}');
    }
  }

  Future<void> setAuthToken(String token) async {
    _authToken = token;
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> clearAuthToken() async {
    _authToken = null;
    await _storage.delete(key: 'auth_token');
  }

  // Players
  Future<List<dynamic>> fetchPlayers({String? query}) async {
    String endpoint = '/players';
    if (query != null) {
      endpoint += '?query=$query';
    }
    return getList(endpoint);
  }

  // Coaches
  Future<List<dynamic>> fetchCoaches() => getList('/coaches');
  Future<Map<String, dynamic>> getCoach(String id) => get('/coaches/$id');

  // Matches
  Future<List<dynamic>> fetchMatches() => getList('/matches');
  Future<Map<String, dynamic>> getMatch(String id) => get('/matches/$id');

  // Referees
  Future<List<dynamic>> fetchReferees() => getList('/referees');
  Future<Map<String, dynamic>> getReferee(String id) => get('/referees/$id');

  // Staff
  Future<List<dynamic>> fetchStaff() => getList('/staff');

  // Inventory
  Future<List<dynamic>> fetchInventory() => getList('/inventory');

  // Organizations
  Future<List<dynamic>> fetchOrganizations() => getList('/organizations');
  Future<Map<String, dynamic>> getOrganization(String id) =>
      get('/organizations/$id');

  // Leaderboard
  Future<List<dynamic>> fetchLeaderboard({String sort = 'rating'}) =>
      getList('/leaderboard?sort=$sort');

  // Analytics
  Future<Map<String, dynamic>> getAnalytics({String? range}) async {
    String endpoint = '/analytics';
    if (range != null) {
      endpoint += '?range=$range';
    }
    return get(endpoint);
  }

  // Community
  Future<Map<String, dynamic>> createPost(Map<String, dynamic> data) =>
      post('/community', data);
  Future<List<dynamic>> fetchCommunityFeed() => getList('/community/feed');

  // Court Booking
  Future<List<dynamic>> fetchCourts() => getList('/courts');
  Future<List<dynamic>> fetchCourtAvailability(String courtId) =>
      getList('/courts/$courtId/availability');
  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> data) =>
      post('/bookings', data);

  // Tournaments
  Future<List<dynamic>> fetchTournaments() => getList('/tournaments');
  Future<Map<String, dynamic>> getTournament(String id) =>
      get('/tournaments/$id');
}
