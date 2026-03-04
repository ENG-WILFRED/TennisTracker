import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'pages/analytics.dart';
import 'pages/coaches.dart';
import 'pages/contact.dart';
import 'pages/dashboard.dart';
import 'pages/inventory.dart';
import 'pages/knockout.dart';
import 'pages/leaderboard.dart';
import 'pages/login.dart';
import 'pages/matches.dart';
import 'pages/organization.dart';
import 'pages/players.dart';
import 'pages/referees.dart';
import 'pages/register.dart';
import 'pages/register_coach.dart';
import 'pages/staff.dart';
import 'pages/teachings.dart';
import 'pages/chat.dart';
import 'pages/organization_detail.dart';

void main() {
  runApp(const VicoApp());
}

class VicoApp extends StatelessWidget {
  const VicoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vico App',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _players;

  @override
  void initState() {
    super.initState();
    _players = api.fetchPlayers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vico — Players'),
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: Colors.green),
                child: Text('Vico', style: TextStyle(color: Colors.white, fontSize: 24)),
              ),
              ListTile(title: const Text('Home'), leading: const Icon(Icons.home), onTap: () => Navigator.pop(context)),
              ListTile(title: const Text('Coaches'), leading: const Icon(Icons.sports_tennis), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const CoachesPage())); }),
              ListTile(title: const Text('Players'), leading: const Icon(Icons.person), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const PlayersPage())); }),
              ListTile(title: const Text('Matches'), leading: const Icon(Icons.view_list), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const MatchesPage())); }),
              ListTile(title: const Text('Organizations'), leading: const Icon(Icons.business), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizationPage())); }),
              ListTile(title: const Text('Referees'), leading: const Icon(Icons.gavel), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const RefereesPage())); }),
              ListTile(title: const Text('Dashboard'), leading: const Icon(Icons.dashboard), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const DashboardPage())); }),
              ListTile(title: const Text('Inventory'), leading: const Icon(Icons.inventory), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryPage())); }),
              ListTile(title: const Text('Analytics'), leading: const Icon(Icons.bar_chart), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsPage())); }),
              ListTile(title: const Text('Chat'), leading: const Icon(Icons.chat), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatPage())); }),
              ListTile(title: const Text('Login'), leading: const Icon(Icons.login), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginPage())); }),
              ListTile(title: const Text('Register'), leading: const Icon(Icons.person_add), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())); }),
            ],
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: FutureBuilder<List<dynamic>>(
          future: _players,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: \\${snapshot.error}'));
            }
            final players = snapshot.data ?? [];
            if (players.isEmpty) {
              return const Center(child: Text('No players found'));
            }
            return ListView.separated(
              itemCount: players.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (context, index) {
                final p = players[index];
                final name = (p['user'] != null)
                    ? '\\${p['user']['firstName'] ?? ''} \\${p['user']['lastName'] ?? ''}'
                    : (p['firstName'] ?? 'Unknown');
                final email = p['user']?['email'] ?? p['email'] ?? '';
                return ListTile(
                  title: Text(name),
                  subtitle: Text(email),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
