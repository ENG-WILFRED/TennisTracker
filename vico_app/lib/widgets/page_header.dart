import 'package:flutter/material.dart';

class PageHeader extends StatelessWidget {
  final String title;
  final String? description;
  final Widget? icon;
  final List<NavItem> navItems;

  const PageHeader({
    super.key,
    required this.title,
    this.description,
    this.icon,
    this.navItems = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF059669), Color(0xFF10B981)], // green-600 to emerald-600
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.all(Radius.circular(16.0)),
      ),
      padding: const EdgeInsets.all(24.0),
      margin: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  padding: const EdgeInsets.all(12.0),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: icon,
                ),
                const SizedBox(width: 12.0),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 32.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (description != null) ...[
                      const SizedBox(height: 4.0),
                      Text(
                        description!,
                        style: const TextStyle(
                          color: Color(0xFFDCFCE7), // green-100
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (navItems.isNotEmpty) ...[
                const SizedBox(width: 12.0),
                Wrap(
                  spacing: 8.0,
                  children: navItems.map((item) => item.build(context)).toList(),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class NavItem {
  final String label;
  final VoidCallback? onPressed;
  final bool active;
  final String? route;

  const NavItem({
    required this.label,
    this.onPressed,
    this.active = false,
    this.route,
  });

  Widget build(BuildContext context) {
    final buttonStyle = active
        ? ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF047857), // green-700
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20.0),
            ),
          )
        : ElevatedButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.2),
            foregroundColor: Colors.white,
            side: const BorderSide(color: Color(0x66FFFFFF)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20.0),
            ),
          );

    return ElevatedButton(
      style: buttonStyle,
      onPressed: onPressed ?? (route != null ? () => Navigator.pushNamed(context, route!) : null),
      child: Text(label),
    );
  }
}