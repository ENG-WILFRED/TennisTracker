import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'pages/analytics.dart';
import 'pages/coaches.dart';
import 'pages/contact.dart';
import 'pages/dashboard.dart';
import 'pages/inventory.dart';
import 'pages/knockout.dart';
import 'pages/landing.dart';
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
      initialRoute: '/',
      routes: {
        '/': (context) => const LandingPage(),
        '/coaches': (context) => const CoachesPage(),
        '/players': (context) => const PlayersPage(),
        '/matches': (context) => const MatchesPage(),
        '/organizations': (context) => const OrganizationPage(),
        '/referees': (context) => const RefereesPage(),
        '/dashboard': (context) => const DashboardPage(),
        '/inventory': (context) => const InventoryPage(),
        '/analytics': (context) => const AnalyticsPage(),
        '/contact': (context) => const ContactPage(),
        '/chat': (context) => const ChatPage(),
        '/leaderboard': (context) => const LeaderboardPage(),
        '/knockout': (context) => const KnockoutPage(),
        '/staff': (context) => const StaffPage(),
        '/teachings': (context) => const TeachingsPage(),
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/register_coach': (context) => const RegisterCoachPage(),
      },
    );
  }
}
