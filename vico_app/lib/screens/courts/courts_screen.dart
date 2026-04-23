import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class CourtsScreen extends StatefulWidget {
  const CourtsScreen({Key? key}) : super(key: key);

  @override
  State<CourtsScreen> createState() => _CourtsScreenState();
}

class _CourtsScreenState extends State<CourtsScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('https://vicotennis.onrender.com/courts'));
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
