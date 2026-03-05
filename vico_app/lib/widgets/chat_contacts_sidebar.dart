import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ChatContact {
  final String id;
  final String name;
  final String? photo;
  final bool isOnline;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final String role; // player, coach, staff, etc.

  ChatContact({
    required this.id,
    required this.name,
    this.photo,
    required this.isOnline,
    this.lastMessage,
    this.lastMessageTime,
    this.role = 'player',
  });

  factory ChatContact.fromJson(Map<String, dynamic> json) {
    return ChatContact(
      id: json['id'],
      name: json['name'] ?? json['fullName'] ?? 'Unknown',
      photo: json['photo'] ?? json['profilePhoto'],
      isOnline: json['isOnline'] ?? false,
      lastMessage: json['lastMessage'],
      lastMessageTime: json['lastMessageTime'] != null
          ? DateTime.parse(json['lastMessageTime'])
          : null,
      role: json['role'] ?? 'player',
    );
  }
}

class ChatContactsSidebar extends StatefulWidget {
  final String? selectedContactId;
  final Function(String contactId, String contactName) onSelectContact;

  const ChatContactsSidebar({
    super.key,
    this.selectedContactId,
    required this.onSelectContact,
  });

  @override
  State<ChatContactsSidebar> createState() => _ChatContactsSidebarState();
}

class _ChatContactsSidebarState extends State<ChatContactsSidebar> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  
  List<ChatContact> _allContacts = [];
  List<ChatContact> _filteredContacts = [];
  bool _loading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchContacts();
    _searchController.addListener(_filterContacts);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchContacts() async {
    try {
      // Fetch players, coaches, and staff
      final results = await Future.wait([
        _api.get('/api/players'),
        _api.get('/api/coaches'),
        _api.get('/api/staff'),
      ]);

      final players = (results[0] as List<dynamic>)
          .map((json) => ChatContact.fromJson({...json, 'role': 'player'}))
          .toList();
      
      final coaches = (results[1] as List<dynamic>)
          .map((json) => ChatContact.fromJson({...json, 'role': 'coach'}))
          .toList();
      
      final staff = (results[2] as List<dynamic>)
          .map((json) => ChatContact.fromJson({...json, 'role': 'staff'}))
          .toList();

      setState(() {
        _allContacts = [...players, ...coaches, ...staff];
        _filteredContacts = _allContacts;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load contacts: $e')),
        );
      }
    }
  }

  void _filterContacts() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredContacts = _allContacts;
      } else {
        _filteredContacts = _allContacts
            .where((contact) => contact.name.toLowerCase().contains(query))
            .toList();
      }
    });
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'yesterday';
    } else {
      return '${dateTime.month}/${dateTime.day}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          right: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              border: Border(
                bottom: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Messages',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search contacts...',
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      border: InputBorder.none,
                      prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Contacts List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filteredContacts.isEmpty
                    ? Center(
                        child: Text(
                          _searchQuery.isEmpty
                              ? 'No contacts available'
                              : 'No contacts found',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 14,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: _filteredContacts.length,
                        itemBuilder: (context, index) {
                          final contact = _filteredContacts[index];
                          final isSelected = contact.id == widget.selectedContactId;

                          return InkWell(
                            onTap: () =>
                                widget.onSelectContact(contact.id, contact.name),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.blue[50] : Colors.white,
                                border: Border(
                                  left: BorderSide(
                                    width: 3,
                                    color: isSelected
                                        ? Colors.blue
                                        : Colors.transparent,
                                  ),
                                  bottom:
                                    BorderSide(color: Colors.grey[100]!, width: 1),
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Avatar
                                  Stack(
                                    children: [
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.grey[300],
                                          image: contact.photo != null &&
                                                  contact.photo!.isNotEmpty
                                              ? DecorationImage(
                                                  image: NetworkImage(
                                                      contact.photo!),
                                                  fit: BoxFit.cover,
                                                )
                                              : null,
                                        ),
                                        child: contact.photo == null ||
                                                contact.photo!.isEmpty
                                            ? Icon(
                                                contact.role == 'coach'
                                                    ? Icons.sports_tennis
                                                    : contact.role == 'staff'
                                                        ? Icons.person
                                                        : Icons.person,
                                                color: Colors.grey[700],
                                              )
                                            : null,
                                      ),
                                      // Online indicator
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          width: 16,
                                          height: 16,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: contact.isOnline
                                                ? Colors.green
                                                : Colors.grey,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: 2,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  // Contact info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          contact.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                            color: Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        if (contact.lastMessage != null) ...[
                                          Text(
                                            contact.lastMessage!,
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 13,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ] else ...[
                                          Text(
                                            contact.role.capitalize(),
                                            style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 13,
                                            ),
                                          ),
                                        ]
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Time
                                  if (contact.lastMessageTime != null)
                                    Text(
                                      _formatTime(contact.lastMessageTime!),
                                      style: TextStyle(
                                        color: Colors.grey[500],
                                        fontSize: 12,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}
