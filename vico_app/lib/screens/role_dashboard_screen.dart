import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class RoleDashboardScreen extends StatefulWidget {
  final String role;

  const RoleDashboardScreen({Key? key, required this.role}) : super(key: key);

  @override
  State<RoleDashboardScreen> createState() => _RoleDashboardScreenState();
}

class _RoleDashboardScreenState extends State<RoleDashboardScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();

    final roleUrls = {
      'admin': 'https://vicotennis.onrender.com/dashboard/admin',
      'coach': 'https://vicotennis.onrender.com/dashboard/coach',
      'referee': 'https://vicotennis.onrender.com/dashboard/referee',
      'developer': 'https://vicotennis.onrender.com/dashboard/developer',
      'finance': 'https://vicotennis.onrender.com/dashboard/finance',
      'finance_officer': 'https://vicotennis.onrender.com/dashboard/finance',
      'member': 'https://vicotennis.onrender.com/dashboard/member',
      'player': 'https://vicotennis.onrender.com/dashboard/player',
      'spectator': 'https://vicotennis.onrender.com/dashboard/spectator',
      'org': 'https://vicotennis.onrender.com/dashboard/organization',
      'organisation': 'https://vicotennis.onrender.com/dashboard/organization',
      'organization': 'https://vicotennis.onrender.com/dashboard/organization',
    };

    final roleKey = widget.role.trim().toLowerCase();
    final url = roleUrls[roleKey] ?? 'https://vicotennis.onrender.com/dashboard';

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent('Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36')
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: controller),
      ),
    );
  }
}