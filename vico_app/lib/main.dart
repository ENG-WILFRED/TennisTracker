import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/theme.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/toast_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/home_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/coaches/coaches_screen.dart';
import 'screens/courts/courts_screen.dart';
import 'screens/matches/matches_screen.dart';
import 'screens/players/players_screen.dart';
import 'screens/referees/referees_screen.dart';
import 'screens/tournaments/tournaments_screen.dart';
import 'screens/web_page_screen.dart';
import 'screens/role_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const VICOApp());
}

class VICOApp extends StatelessWidget {
  const VICOApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
        ChangeNotifierProvider<AuthService>(
          create: (_) => AuthService(),
        ),
      ],
      child: MaterialApp(
        title: 'VICO - Tennis Tracker',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark,
        debugShowCheckedModeBanner: false,
        scaffoldMessengerKey: ToastService.scaffoldMessengerKey,
        home: Consumer<AuthService>(
          builder: (context, authService, _) {
            if (authService.isAuthenticated) {
              final role = authService.userRole;
              if (role != null) {
                return RoleDashboardScreen(role: role);
              } else {
                return const DashboardScreen();
              }
            }
            return const HomeScreen();
          },
        ),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/dashboard': (context) => const DashboardScreen(),
          '/analytics': (context) => const AnalyticsScreen(),
          '/admin-dashboard': (context) => const RoleDashboardScreen(role: 'admin'),
          '/coach-dashboard': (context) => const RoleDashboardScreen(role: 'coach'),
          '/referee-dashboard': (context) => const RoleDashboardScreen(role: 'referee'),
          '/developer-dashboard': (context) => const RoleDashboardScreen(role: 'developer'),
          '/finance-dashboard': (context) => const RoleDashboardScreen(role: 'finance'),
          '/finance-officer-dashboard': (context) => const RoleDashboardScreen(role: 'finance_officer'),
          '/member-dashboard': (context) => const RoleDashboardScreen(role: 'member'),
          '/organisation-dashboard': (context) => const RoleDashboardScreen(role: 'organisation'),
          '/organization-dashboard': (context) => const RoleDashboardScreen(role: 'organization'),
          '/org-dashboard': (context) => const RoleDashboardScreen(role: 'org'),
          '/player-dashboard': (context) => const RoleDashboardScreen(role: 'player'),
          '/community': (context) => const CommunityScreen(),
          '/coaches': (context) => const CoachesScreen(),
          '/courts': (context) => const CourtsScreen(),
          '/matches': (context) => const MatchesScreen(),
          '/players': (context) => const PlayersScreen(),
          '/referees': (context) => const RefereesScreen(),
          '/tournaments': (context) => const TournamentsScreen(),
        },
        onGenerateRoute: (settings) {
          final routeName = settings.name;
          if (routeName == null || routeName == '/') {
            return null;
          }

          final path = routeName.startsWith('/') ? routeName.substring(1) : routeName;
          return MaterialPageRoute(
            builder: (context) => WebPageScreen(path: path),
            settings: settings,
          );
        },
      ),
    );
  }
}
