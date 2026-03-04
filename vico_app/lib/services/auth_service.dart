import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../config.dart';

class AuthService {
  final String baseUrl;

  AuthService({this.baseUrl = Config.baseUrl});

  static const _tokenKey = 'vico_access_token';

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  /// Calls the web login API and returns the parsed response map.
  /// Expected response shape: { accessToken, refreshToken, user }
  Future<Map<String, dynamic>> login(String usernameOrEmail, String password) async {
    final uri = Uri.parse('$baseUrl/api/auth/login');
    final res = await http.post(uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'usernameOrEmail': usernameOrEmail,
          'password': password,
        }));

    if (res.statusCode != 200) {
      throw Exception('Login failed: ${res.statusCode} ${res.body}');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (data.containsKey('accessToken')) {
      await saveToken(data['accessToken'] as String);
    }
    return data;
  }
}
