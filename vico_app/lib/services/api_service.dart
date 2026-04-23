import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

class ApiService {
  static const String baseUrl = 'https://vicotennis.onrender.com/api';
  static const String wsUrl = 'wss://vicotennis.onrender.com';
  
  final _logger = Logger();
  String? _authToken;
  final _storage = const FlutterSecureStorage();

  ApiService() {
    _initToken();
  }

  Future<void> _initToken() async {
    _authToken = await _storage.read(key: 'auth_token');
  }

  Future<void> initToken() async => _initToken();

  String? get authToken => _authToken;

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

  // Community Feed
  Future<List<dynamic>> fetchCommunityFeed() => getList('/community/feed');
  Future<Map<String, dynamic>> createPost(Map<String, dynamic> data) => post('/community', data);
  Future<Map<String, dynamic>> likePost(String postId) => post('/community/$postId/like', {});
  Future<Map<String, dynamic>> addComment(String postId, String content) => post('/community/$postId/comments', {'content': content});

  // Tournaments
  Future<List<dynamic>> fetchTournaments() => getList('/tournaments');
  Future<Map<String, dynamic>> getTournament(String id) => get('/tournaments/$id');
  Future<Map<String, dynamic>> applyForTournament(String tournamentId, Map<String, dynamic> application) => post('/tournaments/$tournamentId/applications', application);
  Future<List<dynamic>> getMyTournamentApplications() => getList('/tournaments/my-applications');

  // Court Bookings
  Future<List<dynamic>> fetchCourts() => getList('/courts');
  Future<Map<String, dynamic>> getCourt(String id) => get('/courts/$id');
  Future<List<dynamic>> getAvailableSlots(String courtId, String date) => getList('/bookings/available-slots?courtId=$courtId&date=$date');
  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> booking) => post('/bookings', booking);
  Future<Map<String, dynamic>> getBooking(String bookingId) => get('/bookings/$bookingId');
  Future<Map<String, dynamic>> cancelBooking(String bookingId) => post('/bookings/$bookingId/cancel', {});

  // Coach Dashboard
  Future<List<dynamic>> fetchCoachSessions() => getList('/coaches/sessions');
  Future<Map<String, dynamic>> createCoachSession(Map<String, dynamic> session) => post('/coaches/sessions', session);
  Future<Map<String, dynamic>> updateSessionStatus(String sessionId, String status) => post('/coaches/sessions/$sessionId/status', {'status': status});
  Future<List<dynamic>> fetchCoachBookings() => getList('/coaches/bookings');
  Future<Map<String, dynamic>> updateBookingStatus(String bookingId, String status) => post('/coaches/bookings/$bookingId/status', {'status': status});
  Future<Map<String, dynamic>> getCoachWallet() => get('/coaches/wallet');
  Future<List<dynamic>> getCoachPayouts() => getList('/coaches/payouts');
  Future<Map<String, dynamic>> requestPayout(Map<String, dynamic> payout) => post('/coaches/payouts', payout);
  Future<List<dynamic>> fetchCoachPlayers() => getList('/coaches/players');
  Future<Map<String, dynamic>> addPlayerNote(String playerId, String note) => post('/coaches/players/$playerId/notes', {'note': note});

  // Chat/Messaging
  Future<List<dynamic>> fetchChatRooms() => getList('/chat/rooms');
  Future<Map<String, dynamic>> createChatRoom(Map<String, dynamic> room) => post('/chat/rooms', room);
  Future<List<dynamic>> fetchRoomMessages(String roomId) => getList('/chat/rooms/$roomId/messages');
  Future<Map<String, dynamic>> sendMessage(String roomId, String content) => post('/chat/rooms/$roomId/messages', {'content': content});
  Future<Map<String, dynamic>> addReaction(String messageId, String reaction) => post('/chat/messages/$messageId/reactions', {'reaction': reaction});
  Future<Map<String, dynamic>> updateOnlineStatus(String roomId, bool online) => post('/chat/rooms/$roomId/status', {'online': online});

  // Organization Management
  Future<List<dynamic>> fetchOrgStaff(String orgId) => getList('/organizations/$orgId/staff');
  Future<List<dynamic>> fetchOrgInventory(String orgId) => getList('/organizations/$orgId/inventory');
  Future<List<dynamic>> fetchOrgPlayers(String orgId) => getList('/organizations/$orgId/players');
  Future<Map<String, dynamic>> updateOrgStaff(String orgId, String staffId, Map<String, dynamic> updates) => post('/organizations/$orgId/staff/$staffId', updates);
  Future<Map<String, dynamic>> addOrgInventory(String orgId, Map<String, dynamic> item) => post('/organizations/$orgId/inventory', item);

  // Payments
  Future<Map<String, dynamic>> createPaymentIntent(Map<String, dynamic> payment) => post('/payments/create-intent', payment);
  Future<Map<String, dynamic>> confirmPayment(String paymentIntentId) => post('/payments/confirm', {'paymentIntentId': paymentIntentId});

  // Dashboard
  Future<Map<String, dynamic>> getDashboardData() => get('/dashboard');
  Future<Map<String, dynamic>> getRoleDashboard() => get('/dashboard/role');

  // User Profile
  Future<Map<String, dynamic>> getUserProfile() => get('/user/profile');
  Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> profile) => post('/user/profile', profile);
}
