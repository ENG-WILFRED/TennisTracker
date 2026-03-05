import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ChatMessageBubble extends StatelessWidget {
  final String content;
  final bool isOwn;
  final String senderName;
  final String? senderPhoto;
  final DateTime timestamp;
  final bool isDelivered;
  final bool isRead;

  const ChatMessageBubble({
    super.key,
    required this.content,
    required this.isOwn,
    required this.senderName,
    this.senderPhoto,
    required this.timestamp,
    this.isDelivered = false,
    this.isRead = false,
  });

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(dateTime.year, dateTime.month, dateTime.day);

    if (messageDate == today) {
      return DateFormat('HH:mm').format(dateTime);
    } else if (messageDate == yesterday) {
      return 'Yesterday ${DateFormat('HH:mm').format(dateTime)}';
    } else {
      return DateFormat('MMM d, HH:mm').format(dateTime);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isOwn && !isMobile)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey[300],
                  image: senderPhoto != null && senderPhoto!.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(senderPhoto!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: senderPhoto == null || senderPhoto!.isEmpty
                    ? Icon(Icons.person, size: 18, color: Colors.grey[700])
                    : null,
              ),
            ),
          if (!isOwn && isMobile)
            const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isOwn)
                  Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 4),
                    child: Text(
                      senderName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700],
                      ),
                    ),
                  ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isOwn ? Colors.blue : Colors.grey[200],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    content,
                    style: TextStyle(
                      color: isOwn ? Colors.white : Colors.black87,
                      fontSize: 15,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: isOwn
                        ? MainAxisAlignment.end
                        : MainAxisAlignment.start,
                    children: [
                      Text(
                        _formatTime(timestamp),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                        ),
                      ),
                      if (isOwn) ...[
                        const SizedBox(width: 4),
                        Icon(
                          isRead
                              ? Icons.done_all
                              : isDelivered
                                  ? Icons.done
                                  : Icons.schedule,
                          size: 14,
                          color: isRead
                              ? Colors.blue
                              : Colors.grey[400],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (!isOwn && !isMobile) const SizedBox(width: 8),
        ],
      ),
    );
  }
}
