import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'notifications_screen.dart';

class DashboardScreen extends StatefulWidget {
  final StaffUser user;
  const DashboardScreen({super.key, required this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  AttendanceRecord? _today;
  List<Shift> _shifts = [];
  bool _hasUnreadNotifications = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      ApiService.today().catchError((_) => null),
      ApiService.todayShifts().catchError((_) => <Shift>[]),
      ApiService.notifications().catchError((_) => <AppNotification>[]),
    ]);
    if (!mounted) return;
    setState(() {
      _today = results[0] as AttendanceRecord?;
      _shifts = results[1] as List<Shift>;
      _hasUnreadNotifications = (results[2] as List<AppNotification>).any((n) => n.readAt == null);
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hi, ${widget.user.name.split(' ').first} 👋', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: AppColors.terraDeep)),
                    const SizedBox(height: 4),
                    Text(
                      '${DateFormat('EEE, d MMM yyyy').format(DateTime.now())} · ${widget.user.designation ?? ''}',
                      style: const TextStyle(color: AppColors.textMute, fontWeight: FontWeight.w600, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: AppColors.terra),
                    onPressed: () async {
                      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                      _load();
                    },
                  ),
                  if (_hasUnreadNotifications)
                    Positioned(
                      top: 8, right: 8,
                      child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle)),
                    ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_isLoading)
            const Padding(padding: EdgeInsets.only(top: 40), child: Center(child: CircularProgressIndicator()))
          else ...[
            _buildStatusCard(),
            if (_shifts.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Text("TODAY'S SHIFT", style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.textMute, letterSpacing: 0.6)),
              const SizedBox(height: 8),
              ..._shifts.map(_buildShiftRow),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildShiftRow(Shift shift) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          SizedBox(width: 44, child: Text(shift.startTime, style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMute))),
          Container(width: 6, height: 6, margin: const EdgeInsets.symmetric(horizontal: 8), decoration: const BoxDecoration(color: AppColors.terra, shape: BoxShape.circle)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(shift.label ?? 'Shift', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                Text('until ${shift.endTime}', style: const TextStyle(fontSize: 10, color: AppColors.textMute, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final record = _today;
    final isClockedIn = record?.clockInAt != null && record?.status == 'on_time';
    final isClockedOut = record?.clockOutAt != null;

    final String title;
    final IconData icon;
    final Color color;
    if (isClockedOut) {
      title = 'Clocked out ${DateFormat('h:mm a').format(record!.clockOutAt!.toLocal())}';
      icon = Icons.check_circle;
      color = AppColors.mint;
    } else if (isClockedIn) {
      title = 'Clocked in ${DateFormat('h:mm a').format(record!.clockInAt!.toLocal())}';
      icon = Icons.check_circle;
      color = AppColors.mint;
    } else if (record?.status == 'blocked') {
      title = 'Last attempt was outside the outlet radius';
      icon = Icons.location_off;
      color = AppColors.coral;
    } else {
      title = "You haven't clocked in yet today";
      icon = Icons.schedule;
      color = AppColors.textMute;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.mintBg, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: AppColors.mintDeep)),
                if (widget.user.outlet != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(widget.user.outlet!.name, style: const TextStyle(fontSize: 11, color: AppColors.textMute, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
