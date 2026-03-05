import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../services/auth_service.dart';
import '../config.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final AuthService _auth = AuthService();
  WebSocketChannel? _channel;
  String _roomId = '';
  List<Map<String, dynamic>> _messages = [];
  final TextEditingController _msgController = TextEditingController();
  bool _connected = false;

  Future<void> _connect() async {
    final token = await _auth.getToken();
    if (token == null) return;
    final wsUrl = Uri.parse(Config.baseUrl.replaceFirst('https://', 'wss://') + '/api/chat/ws?roomId=$_roomId');
    _channel = WebSocketChannel.connect(wsUrl);
    _channel!.stream.listen((data) {
      try {
        final msg = jsonDecode(data as String) as Map<String, dynamic>;
        if (msg['type'] == 'message') {
          setState(() {
            _messages.add(msg['data']);
          });
        }
      } catch (_) {}
    }, onDone: () {
      setState(() => _connected = false);
    });
    setState(() => _connected = true);
  }

  void _sendMessage() {
    if (_channel != null && _msgController.text.trim().isNotEmpty) {
      _channel!.sink.add(jsonEncode({'type': 'message', 'content': _msgController.text.trim()}));
      _msgController.clear();
    }
  }

  @override
  void dispose() {
    _channel?.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              decoration: const InputDecoration(labelText: 'Room ID'),
              onChanged: (v) => _roomId = v,
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _connected ? null : _connect,
              child: Text(_connected ? 'Connected' : 'Join Room'),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final m = _messages[index];
                  return ListTile(
                    title: Text(m['playerName'] ?? 'Anon'),
                    subtitle: Text(m['content'] ?? ''),
                  );
                },
              ),
            ),
            if (_connected)
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      decoration: const InputDecoration(hintText: 'Type message'),
                    ),
                  ),
                  IconButton(onPressed: _sendMessage, icon: const Icon(Icons.send)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
