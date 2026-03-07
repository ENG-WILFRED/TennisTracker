import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../services/api_service.dart';
import '../config.dart';

class ChatMessage {
  final String id;
  final String content;
  final String playerId;
  final String playerName;
  final String? photo;
  final DateTime createdAt;
  final DateTime? deliveredAt;
  final DateTime? readAt;

  ChatMessage({
    required this.id,
    required this.content,
    required this.playerId,
    required this.playerName,
    this.photo,
    required this.createdAt,
    this.deliveredAt,
    this.readAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      content: json['content'],
      playerId: json['playerId'],
      playerName: json['playerName'],
      photo: json['photo'],
      createdAt: DateTime.parse(json['createdAt']),
      deliveredAt: json['deliveredAt'] != null ? DateTime.parse(json['deliveredAt']) : null,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
    );
  }
}

class ChatParticipant {
  final String id;
  final String playerId;
  final String playerName;
  final String? playerPhoto;
  final bool isOnline;

  ChatParticipant({
    required this.id,
    required this.playerId,
    required this.playerName,
    this.playerPhoto,
    required this.isOnline,
  });

  factory ChatParticipant.fromJson(Map<String, dynamic> json) {
    return ChatParticipant(
      id: json['id'],
      playerId: json['playerId'],
      playerName: json['playerName'],
      playerPhoto: json['playerPhoto'],
      isOnline: json['isOnline'] ?? false,
    );
  }
}

class ChatWindow extends StatefulWidget {
  final String roomId;
  final VoidCallback? onBack;

  const ChatWindow({super.key, required this.roomId, this.onBack});

  @override
  State<ChatWindow> createState() => _ChatWindowState();
}

class _ChatWindowState extends State<ChatWindow> {
  final ApiService _api = ApiService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessage> _messages = [];
  List<ChatParticipant> _participants = [];
  String _currentUserId = '';
  bool _loading = true;
  bool _participantsVisible = true;
  WebSocketChannel? _channel;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  @override
  void didUpdateWidget(ChatWindow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.roomId != widget.roomId) {
      _cleanup();
      _initializeChat();
    }
  }

  Future<void> _initializeChat() async {
    setState(() => _loading = true);
    try {
      await _fetchRoomData();
      await _connectWebSocket();
      _startPolling();
      await _setOnline();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to initialize chat: $e')),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchRoomData() async {
    try {
      final results = await Future.wait([
        _api.fetchChatMessages(widget.roomId),
        _api.fetchChatParticipants(widget.roomId),
        _api.fetchChatMe(),
      ]);

      final messagesData = results[0] as List<dynamic>;
      final participantsData = results[1] as List<dynamic>;
      final userData = results[2] as Map<String, dynamic>;

      setState(() {
        _messages = messagesData.map((json) => ChatMessage.fromJson(json)).toList();
        _participants = participantsData.map((json) => ChatParticipant.fromJson(json)).toList();
        _currentUserId = userData['id'];
      });

      _scrollToBottom();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> _connectWebSocket() async {
    final wsUrl = Uri.parse(Config.baseUrl.replaceFirst('https://', 'wss://') + '/api/chat/ws?roomId=${widget.roomId}');
    try {
      _channel = WebSocketChannel.connect(wsUrl);
      _channel!.stream.listen((data) {
        try {
          final msg = jsonDecode(data as String) as Map<String, dynamic>;
          if (msg['type'] == 'message') {
            final newMessage = ChatMessage.fromJson(msg['data']);
            setState(() => _messages.add(newMessage));
            _scrollToBottom();
          }
        } catch (e) {
          // Ignore invalid messages
        }
      });
    } catch (e) {
      // WebSocket failed, rely on polling
    }
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) async {
      try {
        final results = await Future.wait([
          _api.fetchChatMessages(widget.roomId),
          _api.fetchChatParticipants(widget.roomId),
        ]);

        final messagesData = results[0] as List<dynamic>;
        final participantsData = results[1] as List<dynamic>;

        setState(() {
          _messages = messagesData.map((json) => ChatMessage.fromJson(json)).toList();
          _participants = participantsData.map((json) => ChatParticipant.fromJson(json)).toList();
        });
      } catch (e) {
        // Ignore polling errors
      }
    });
  }

  Future<void> _setOnline() async {
    try {
      await _api.setChatOnline(widget.roomId);
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _setOffline() async {
    try {
      await _api.setChatOffline(widget.roomId);
    } catch (e) {
      // Ignore
    }
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();

    if (_channel != null) {
      _channel!.sink.add(jsonEncode({'type': 'message', 'content': content}));
    } else {
      // Fallback to API
      _api.sendChatMessage(widget.roomId, content).catchError((e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to send message: $e')),
          );
        }
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _cleanup() {
    _pollTimer?.cancel();
    _channel?.sink.close();
    _setOffline();
  }

  @override
  void dispose() {
    _cleanup();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _showPlayerModal(ChatParticipant participant) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(participant.playerName),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey[300],
              ),
              child: participant.playerPhoto != null
                  ? ClipOval(
                      child: Image.network(
                        'https://picsum.photos/100/100?random=${participant.playerId.hashCode}',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Center(
                          child: Text(
                            participant.playerName[0].toUpperCase(),
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey),
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        participant.playerName[0].toUpperCase(),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            Text('Online: ${participant.isOnline ? 'Yes' : 'No'}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Navigate to profile
                Navigator.pushNamed(context, '/players');
              },
              child: const Text('View Profile'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showMessageSenderModal(ChatMessage message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(message.playerName),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey[300],
              ),
              child: message.photo != null
                  ? ClipOval(
                      child: Image.network(
                        'https://picsum.photos/100/100?random=${message.playerId.hashCode}',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Center(
                          child: Text(
                            message.playerName[0].toUpperCase(),
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey),
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        message.playerName[0].toUpperCase(),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Navigate to profile
                Navigator.pushNamed(context, '/players');
              },
              child: const Text('View Profile'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
        padding: const EdgeInsets.all(6),
        constraints: BoxConstraints(
          maxWidth: (MediaQuery.of(context).size.width - (MediaQuery.of(context).size.width < 600 ? 180 : 250)) * 0.8,
        ),
        decoration: BoxDecoration(
          color: isMe ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe) ...[
              Text(
                message.playerName,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 4),
            ],
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${message.createdAt.hour}:${message.createdAt.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    fontSize: 10,
                    color: isMe ? Colors.white70 : Colors.grey[600],
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    message.readAt != null
                        ? Icons.done_all
                        : message.deliveredAt != null
                            ? Icons.done_all
                            : Icons.done,
                    size: 14,
                    color: message.readAt != null ? Colors.blue : Colors.grey,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Expanded(
          child: Row(
            children: [
              _participantsVisible ? Container(
            width: MediaQuery.of(context).size.width < 600 ? 120 : 150,
            color: Colors.grey[50],
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  color: Colors.white,
                  child: Row(
                    children: [
                      const Text(
                        'Participants',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () {
                          setState(() => _participantsVisible = !_participantsVisible);
                        },
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    children: _participants.map((participant) {
                      return Container(
                        padding: const EdgeInsets.all(6),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: participant.isOnline ? Colors.green : Colors.grey,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => _showPlayerModal(participant),
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  shape: BoxShape.circle,
                                ),
                                child: participant.playerPhoto != null
                                    ? ClipOval(
                                        child: Image.network(
                                          'https://picsum.photos/100/100?random=${participant.playerId.hashCode}',
                                          fit: BoxFit.cover,
                                          loadingBuilder: (context, child, loadingProgress) {
                                            if (loadingProgress == null) return child;
                                            return Center(
                                              child: CircularProgressIndicator(
                                                value: loadingProgress.expectedTotalBytes != null
                                                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                                    : null,
                                              ),
                                            );
                                          },
                                          errorBuilder: (context, error, stackTrace) => Center(
                                            child: Text(
                                              participant.playerName[0].toUpperCase(),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.grey,
                                              ),
                                            ),
                                          ),
                                        ),
                                      )
                                    : Center(
                                        child: Text(
                                          participant.playerName[0].toUpperCase(),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    participant.playerName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                  Text(
                                    participant.isOnline ? 'Online' : 'Offline',
                                    style: TextStyle(
                                      color: Colors.grey[600],
                                      fontSize: 8,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
              ) : SizedBox.shrink(),
              // Messages Area
              Expanded(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(6),
                color: Colors.white,
                child: Row(
                  children: [
                    if (widget.onBack != null) ...[
                      IconButton(
                        icon: const Icon(Icons.arrow_back, size: 16),
                        onPressed: widget.onBack,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: 6),
                    ],
                    const Text(
                      'Chat Room',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    if (!_participantsVisible) ...[
                      IconButton(
                        icon: const Icon(Icons.people, size: 16),
                        onPressed: () {
                          setState(() => _participantsVisible = true);
                        },
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      '${_participants.where((p) => p.isOnline).length} online',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10),
                    ),
                  ],
                ),
              ),
              // Messages
              Expanded(
                child: _messages.isEmpty
                    ? const Center(child: Text('No messages yet. Start the conversation!'))
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(6, 6, 6, 80),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          final isMe = message.playerId == _currentUserId;
                          final showAvatar = !isMe &&
                              (index == 0 || _messages[index - 1].playerId != message.playerId);

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isMe && showAvatar) ...[
                                GestureDetector(
                                  onTap: () => _showMessageSenderModal(message),
                                  child: Container(
                                    width: 24,
                                    height: 24,
                                    margin: const EdgeInsets.only(right: 6, top: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[300],
                                      shape: BoxShape.circle,
                                    ),
                                    child: message.photo != null
                                        ? ClipOval(
                                            child: Image.network(
                                              'https://picsum.photos/100/100?random=${message.playerId.hashCode}',
                                              fit: BoxFit.cover,
                                              loadingBuilder: (context, child, loadingProgress) {
                                                if (loadingProgress == null) return child;
                                                return Center(
                                                  child: CircularProgressIndicator(
                                                    value: loadingProgress.expectedTotalBytes != null
                                                        ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                                        : null,
                                                  ),
                                                );
                                              },
                                              errorBuilder: (context, error, stackTrace) => Center(
                                                child: Text(
                                                  message.playerName[0].toUpperCase(),
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.grey,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          )
                                        : Center(
                                            child: Text(
                                              message.playerName[0].toUpperCase(),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.grey,
                                              ),
                                            ),
                                          ),
                                  ),
                                ),
                              ] else if (!isMe) ...[
                                const SizedBox(width: 30),
                              ],
                              Expanded(child: _buildMessageBubble(message, isMe)),
                            ],
                          );
                        },
                      ),
              ),
            ],
          ),
            ],
          ),
        ),
        // Input
        Padding(
          padding: const EdgeInsets.all(6),
          child: Container(
            padding: const EdgeInsets.all(6),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: const TextStyle(fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(24)),
                      ),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 6),
                FloatingActionButton(
                  onPressed: _sendMessage,
                  mini: true,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}