import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final notifications = await ApiService.notifications();
      if (mounted) setState(() { _notifications = notifications; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  IconData _iconFor(String type) => switch (type) {
        'clock_in' => Icons.check,
        'blocked' => Icons.location_off,
        _ => Icons.emoji_events,
      };
  Color _colorFor(String type) => switch (type) {
        'clock_in' => AppColors.mint,
        'blocked' => AppColors.coral,
        _ => AppColors.terra,
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        backgroundColor: AppColors.paper,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.terra),
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.terraDeep)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.coralDeep)))
              : _notifications.isEmpty
                  ? const Center(child: Text('No notifications yet', style: TextStyle(color: AppColors.textMute)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, _) => const Divider(height: 1, color: AppColors.line),
                        itemBuilder: (context, i) {
                          final n = _notifications[i];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 28, height: 28,
                                  decoration: BoxDecoration(color: _colorFor(n.type), borderRadius: BorderRadius.circular(9)),
                                  child: Icon(_iconFor(n.type), color: Colors.white, size: 14),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(n.message, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5, color: AppColors.ink900)),
                                      const SizedBox(height: 3),
                                      Text(DateFormat('MMM d, h:mm a').format(n.createdAt.toLocal()), style: const TextStyle(fontSize: 9, color: AppColors.textMute, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
