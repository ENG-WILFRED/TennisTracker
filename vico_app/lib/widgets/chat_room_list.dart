import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ChatRoom {
  final String id;
  final String name;
  final String? description;
  final int participantCount;
  final int onlineCount;
  final String? lastMessage;

  ChatRoom({
    required this.id,
    required this.name,
    this.description,
    required this.participantCount,
    required this.onlineCount,
    this.lastMessage,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      participantCount: json['participantCount'] ?? 0,
      onlineCount: json['onlineCount'] ?? 0,
      lastMessage: json['lastMessage'],
    );
  }
}

class ChatRoomList extends StatefulWidget {
  final String? selectedRoomId;
  final Function(String) onSelectRoom;

  const ChatRoomList({
    super.key,
    this.selectedRoomId,
    required this.onSelectRoom,
  });

  @override
  State<ChatRoomList> createState() => _ChatRoomListState();
}

class _ChatRoomListState extends State<ChatRoomList> {
  final ApiService _api = ApiService();
  List<ChatRoom> _rooms = [];
  bool _loading = true;
  bool _showCreateModal = false;
  final TextEditingController _roomNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  Future<void> _fetchRooms() async {
    try {
      final roomsData = await _api.fetchChatRooms();
      setState(() {
        _rooms = roomsData.map((json) => ChatRoom.fromJson(json)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load rooms: $e')),
        );
      }
    }
  }

  Future<void> _createRoom() async {
    if (_roomNameController.text.trim().isEmpty) return;

    try {
      final newRoom = await _api.createChatRoom(_roomNameController.text.trim());
      final room = ChatRoom.fromJson(newRoom);
      setState(() {
        _rooms.add(room);
        _showCreateModal = false;
        _roomNameController.clear();
      });
      widget.onSelectRoom(room.id);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create room: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      color: Colors.grey[100],
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Chat Rooms',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => setState(() => _showCreateModal = true),
                    icon: const Icon(Icons.add),
                    label: const Text('New Room'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Rooms List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _rooms.isEmpty
                    ? const Center(child: Text('No rooms available'))
                    : ListView.builder(
                        itemCount: _rooms.length,
                        itemBuilder: (context, index) {
                          final room = _rooms[index];
                          final isSelected = room.id == widget.selectedRoomId;
                          return InkWell(
                            onTap: () => widget.onSelectRoom(room.id),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.blue[50] : Colors.white,
                                border: Border(
                                  left: BorderSide(
                                    color: isSelected ? Colors.blue : Colors.transparent,
                                    width: 4,
                                  ),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    room.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  if (room.description != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      room.description!,
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 14,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Icon(Icons.people, size: 16, color: Colors.grey[600]),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${room.participantCount}',
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Icon(Icons.circle, size: 12, color: Colors.green),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${room.onlineCount} online',
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          // Create Room Modal
          if (_showCreateModal)
            Container(
              color: Colors.black54,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(32),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Create New Chat Room',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _roomNameController,
                          decoration: const InputDecoration(
                            labelText: 'Room Name',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () => setState(() => _showCreateModal = false),
                              child: const Text('Cancel'),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _createRoom,
                              child: const Text('Create'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}