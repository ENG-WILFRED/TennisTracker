import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final _logger = Logger();
  final _apiService = ApiService();

  String? _accessToken;
  String? _userId;
  String? _userEmail;
  String? _userRole;
  bool _isLoading = false;
  String? _error;

  bool get isAuthenticated => _accessToken != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userId => _userId;
  String? get userEmail => _userEmail;
  String? get userRole => _userRole;

  AuthService() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    await _apiService.initToken();
    if (_apiService.authToken != null) {
      _accessToken = _apiService.authToken;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      final token = response['accessToken'] as String?;
      if (token == null) {
        throw Exception('No token in response');
      }

      _accessToken = token;
      _userEmail = email;
      _userId = response['userId'] as String?;
      _userRole = response['role'] as String?;

      await _apiService.setAuthToken(token);

      _logger.i('Login successful for $email');
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _logger.e('Login failed: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/register', data);

      final token = response['accessToken'] as String?;
      if (token == null) {
        throw Exception('No token in response');
      }

      _accessToken = token;
      _userEmail = data['email'] as String?;
      _userId = response['userId'] as String?;
      _userRole = response['role'] as String?;

      await _apiService.setAuthToken(token);

      _logger.i('Registration successful for ${data['email']}');
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _logger.e('Registration failed: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.clearAuthToken();
      _accessToken = null;
      _userId = null;
      _userEmail = null;
      _userRole = null;
      _error = null;
      _logger.i('Logout successful');
      notifyListeners();
    } catch (e) {
      _logger.e('Logout failed: $e');
      notifyListeners();
    }
  }
}
