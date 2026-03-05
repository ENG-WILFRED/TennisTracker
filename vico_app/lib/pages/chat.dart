import 'package:flutter/material.dart';
import '../widgets/chat_room_list.dart';
import '../widgets/chat_window.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  String? _selectedRoomId;

  void _handleSelectRoom(String roomId) {
    setState(() => _selectedRoomId = roomId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Row(
        children: [
          // Sidebar - Chat Rooms List
          ChatRoomList(
            selectedRoomId: _selectedRoomId,
            onSelectRoom: _handleSelectRoom,
          ),
          // Main Chat Area
          Expanded(
            child: _selectedRoomId != null
                ? ChatWindow(roomId: _selectedRoomId!)
                : Container(
                    color: Colors.grey[50],
                    child: const Center(
                      child: Text(
                        'Select a chat room to start messaging',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
