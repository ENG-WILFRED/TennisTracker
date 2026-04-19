import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class CoachDashboardScreen extends StatefulWidget {
  final String? role;

  const CoachDashboardScreen({Key? key, this.role = 'coach'}) : super(key: key);

  @override
  State<CoachDashboardScreen> createState() => _CoachDashboardScreenState();
}

class _CoachDashboardScreenState extends State<CoachDashboardScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)      ..setUserAgent('Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36')      ..loadRequest(Uri.parse('https://vicotennis.onrender.com/dashboard/${widget.role}'));
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
