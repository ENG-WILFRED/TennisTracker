import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:logger/logger.dart';
import 'dart:convert';

typedef MessageCallback = void Function(Map<String, dynamic>);

class WebSocketService {
  final String userId;
  final String baseUrl;
  
  WebSocketChannel? _channel;
  final _logger = Logger();
  final Map<String, List<MessageCallback>> _listeners = {};
  bool _isConnected = false;

  WebSocketService({
    required this.userId,
    this.baseUrl = 'ws://localhost:3001',
  });

  bool get isConnected => _isConnected;

  Future<void> connect() async {
    try {
      _logger.i('WebSocket connecting to $baseUrl');
      _channel = WebSocketChannel.connect(Uri.parse(baseUrl));
      
      _channel!.stream.listen(
        (message) {
          _logger.d('WebSocket message: $message');
          _handleMessage(message);
        },
        onError: (error) {
          _logger.e('WebSocket error: $error');
          _isConnected = false;
        },
        onDone: () {
          _logger.i('WebSocket closed');
          _isConnected = false;
        },
      );

      _isConnected = true;
      _logger.i('WebSocket connected');
      
      // Send auth message
      _send({
        'type': 'auth',
        'userId': userId,
      });
    } catch (e) {
      _logger.e('WebSocket connection failed: $e');
      _isConnected = false;
      rethrow;
    }
  }

  void _send(Map<String, dynamic> data) {
    if (_channel == null || !_isConnected) {
      _logger.w('WebSocket not connected, cannot send: $data');
      return;
    }
    _channel!.sink.add(jsonEncode(data));
  }

  void subscribe(String eventType, MessageCallback callback) {
    if (!_listeners.containsKey(eventType)) {
      _listeners[eventType] = [];
    }
    _listeners[eventType]!.add(callback);
    _logger.d('Subscribed to $eventType');
  }

  void unsubscribe(String eventType, MessageCallback callback) {
    _listeners[eventType]?.remove(callback);
  }

  void _handleMessage(String message) {
    try {
      final data = jsonDecode(message) as Map<String, dynamic>;
      final type = data['type'] as String?;
      
      if (type != null && _listeners.containsKey(type)) {
        for (final callback in _listeners[type]!) {
          callback(data);
        }
      }
    } catch (e) {
      _logger.e('Error handling message: $e');
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
    _logger.i('WebSocket disconnected');
  }
}
