import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 2,
    errorMethodCount: 8,
    lineLength: 120,
    colors: true,
    printEmojis: true,
    dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
  ),
);

extension StringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return this[0].toUpperCase() + substring(1);
  }

  bool isValidEmail() {
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    return emailRegex.hasMatch(this);
  }
}

extension DateTimeExtension on DateTime {
  String toFormattedString() {
    return '$day/$month/$year ${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }

  String toShortDate() {
    final now = DateTime.now();
    if (difference(now).inDays == 0) {
      return 'Today';
    } else if (difference(now).inDays == 1) {
      return 'Tomorrow';
    } else if (difference(now).inDays == -1) {
      return 'Yesterday';
    }
    return '$day/$month/$year';
  }
}

extension NumExtension on num {
  String toFormattedString() {
    if (this >= 1000000) {
      return '${(this / 1000000).toStringAsFixed(1)}M';
    } else if (this >= 1000) {
      return '${(this / 1000).toStringAsFixed(1)}K';
    }
    return toString();
  }
}
