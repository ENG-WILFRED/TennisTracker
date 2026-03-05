import 'package:flutter/material.dart';
import '../widgets/chat_contacts_sidebar.dart';
import '../widgets/chat_window.dart';
import '../widgets/page_header.dart';
import '../services/api_service.dart';

class ImprovedChatPage extends StatefulWidget {
  const ImprovedChatPage({super.key});

  @override
  State<ImprovedChatPage> createState() => _ImprovedChatPageState();
}

class _ImprovedChatPageState extends State<ImprovedChatPage> {
  String? _selectedContactId;
  String? _selectedContactName;
  bool _sidebarVisible = true;
  final ApiService _api = ApiService();

  void _handleSelectContact(String contactId, String contactName) {
    setState(() {
      _selectedContactId = contactId;
      _selectedContactName = contactName;
      // On mobile, hide sidebar after selecting
      if (MediaQuery.of(context).size.width < 600) {
        _sidebarVisible = false;
      }
    });
  }

  void _toggleSidebar() {
    setState(() => _sidebarVisible = !_sidebarVisible);
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(''),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
      ),
      drawer: _buildDrawer(),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          children: [
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: PageHeader(
                  title: 'Messages',
                  description:
                      _selectedContactName != null
                          ? 'Chat with ${_selectedContactName!}'
                          : 'Select a contact to start messaging',
                  navItems: [
                    NavItem(label: 'Dashboard', route: '/dashboard'),
                  ],
                ),
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  // Sidebar
                  if (_sidebarVisible || !isMobile)
                    ChatContactsSidebar(
                      selectedContactId: _selectedContactId,
                      onSelectContact: _handleSelectContact,
                    ),
                  // Chat Window
                  Expanded(
                    child: _selectedContactId != null
                        ? ChatWindow(roomId: _selectedContactId!)
                        : Container(
                            color: Colors.grey[50],
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.message,
                                    size: 64,
                                    color: Colors.grey[300],
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No conversation selected',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey[500],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Select a contact from the sidebar to start chatting',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[400],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                color: Colors.green,
              ),
              child: Text(
                'Vico App',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Dashboard'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/dashboard');
              },
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Players'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/players');
              },
            ),
            ListTile(
              leading: const Icon(Icons.sports_tennis),
              title: const Text('Matches'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/matches');
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory),
              title: const Text('Inventory'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/inventory');
              },
            ),
            ListTile(
              leading: const Icon(Icons.analytics),
              title: const Text('Analytics'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/analytics');
              },
            ),
            ListTile(
              leading: const Icon(Icons.contact_mail),
              title: const Text('Contact'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/contact');
              },
            ),
            ListTile(
              leading: const Icon(Icons.group),
              title: const Text('Staff'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/staff');
              },
            ),
            ListTile(
              leading: const Icon(Icons.school),
              title: const Text('Teachings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/teachings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.gavel),
              title: const Text('Referees'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/referees');
              },
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Organization'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/organizations');
              },
            ),
            ListTile(
              leading: const Icon(Icons.chat),
              title: const Text('Chat'),
              onTap: () {
                Navigator.pop(context);
                // already on chat
              },
            ),
            ListTile(
              leading: const Icon(Icons.leaderboard),
              title: const Text('Leaderboard'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/leaderboard');
              },
            ),
            ListTile(
              leading: const Icon(Icons.sports),
              title: const Text('Coaches'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/coaches');
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_events),
              title: const Text('Knockout'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(context, '/knockout');
              },
            ),
          ],
        ),
      ),
    );
  }
}
