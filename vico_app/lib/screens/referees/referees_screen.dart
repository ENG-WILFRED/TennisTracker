import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class RefereesScreen extends StatefulWidget {
  const RefereesScreen({Key? key}) : super(key: key);

  @override
  State<RefereesScreen> createState() => _RefereesScreenState();
}

class _RefereesScreenState extends State<RefereesScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('https://vicotennis.onrender.com/referees'));
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



























