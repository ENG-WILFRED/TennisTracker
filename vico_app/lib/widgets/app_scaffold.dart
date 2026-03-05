import 'package:flutter/material.dart';

/// A reusable scaffold that applies the project-wide background gradient and 
/// consistent padding for inner pages.
class AppScaffold extends StatelessWidget {
  final Widget child;
  final String title;
  const AppScaffold({super.key, required this.child, this.title = ''});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: const [
              // drawer items moved elsewhere; maybe keep same as main
            ],
          ),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFe0f7fa), Color(0xFFa5d6a7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: child,
        ),
      ),
    );
  }
}
