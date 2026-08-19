import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../services/attendance_punch_service.dart';
import '../services/offline_queue_service.dart';
import '../theme.dart';
import 'notifications_screen.dart';

enum _PunchStatus { idle, working }

class DashboardScreen extends StatefulWidget {
  final StaffUser user;
  const DashboardScreen({super.key, required this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  AttendanceRecord? _today;
  List<Shift> _shifts = [];
  MonthlyStatus? _monthlyStatus;
  bool _hasUnreadNotifications = false;
  bool _isLoading = true;

  _PunchStatus _punchStatus = _PunchStatus.idle;
  String? _punchError;

  Timer? _tick;

  @override
  void initState() {
    super.initState();
    _load();
    // Keeps "Working hours" ticking upward while a shift is in progress -
    // every 30s is plenty for a duration display, no need for per-second.
    _tick = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted && _today?.clockInAt != null && _today?.clockOutAt == null) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      ApiService.today().catchError((_) => null),
      ApiService.todayShifts().catchError((_) => <Shift>[]),
      ApiService.notifications().catchError((_) => <AppNotification>[]),
      ApiService.monthlyStatus().catchError((_) => MonthlyStatus(present: 0, absent: 0, late: 0)),
    ]);
    if (!mounted) return;
    setState(() {
      _today = results[0] as AttendanceRecord?;
      _shifts = results[1] as List<Shift>;
      _hasUnreadNotifications = (results[2] as List<AppNotification>).any((n) => n.readAt == null);
      _monthlyStatus = results[3] as MonthlyStatus?;
      _isLoading = false;
    });
  }

  bool get _isOnActiveShift => _today?.status == 'on_time' && _today?.clockInAt != null && _today?.clockOutAt == null;
  bool get _isDayDone => _today?.clockOutAt != null;

  /// Punches in or out - whichever the current record calls for - reusing
  /// the same GPS+selfie proof and offline-queue fallback as the Clock-in tab.
  Future<void> _handlePunch() async {
    final clockingOut = _isOnActiveShift;
    setState(() { _punchStatus = _PunchStatus.working; _punchError = null; });

    late final Position position;
    try {
      position = await AttendancePunchService.resolvePosition();
    } catch (e) {
      setState(() { _punchStatus = _PunchStatus.idle; _punchError = e.toString().replaceFirst('Exception: ', ''); });
      return;
    }

    if (!mounted) return;
    late final File photo;
    try {
      photo = await AttendancePunchService.capturePhoto(context, isClockingOut: clockingOut);
    } catch (e) {
      setState(() { _punchStatus = _PunchStatus.idle; _punchError = e.toString().replaceFirst('Exception: ', ''); });
      return;
    }

    try {
      final record = clockingOut
          ? await ApiService.clockOut(lat: position.latitude, lng: position.longitude, photo: photo)
          : await ApiService.clockIn(lat: position.latitude, lng: position.longitude, photo: photo);
      setState(() { _today = record; _punchStatus = _PunchStatus.idle; });
      ApiService.monthlyStatus().then((s) { if (mounted) setState(() => _monthlyStatus = s); }).catchError((_) {});
    } on ApiException catch (e) {
      setState(() { _punchStatus = _PunchStatus.idle; _punchError = e.message; });
    } catch (_) {
      await OfflineQueueService.enqueue(QueuedEvent(
        type: clockingOut ? QueuedEventType.clockOut : QueuedEventType.clockIn,
        lat: position.latitude, lng: position.longitude,
        occurredAt: DateTime.now(), photoPath: photo.path,
      ));
      setState(() {
        _punchStatus = _PunchStatus.idle;
        _punchError = 'No connection - saved on this device and will sync automatically.';
      });
    }
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
            _buildPunchCard(),
            const SizedBox(height: 20),
            _buildMonthlyStatus(),
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

  /// "Punch In HH:MM" / working hours so far / "Punch Out HH:MM", plus one
  /// big button that captures the GPS+selfie proof and submits it - the
  /// whole clock-in/out action in a single tap from the home screen.
  Widget _buildPunchCard() {
    final record = _today;
    final blockedAttempt = record?.status == 'blocked' && record?.clockOutAt == null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _punchTimeColumn('PUNCH IN', record?.clockInAt != null && !blockedAttempt ? DateFormat('h:mm a').format(record!.clockInAt!.toLocal()) : '—'),
              Column(
                children: [
                  Text(_workingHoursText(record), style: const TextStyle(fontFamily: 'monospace', fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.gold)),
                  const SizedBox(height: 2),
                  const Text('WORKING HOURS', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w700, color: AppColors.textMute, letterSpacing: 0.4)),
                ],
              ),
              _punchTimeColumn('PUNCH OUT', record?.clockOutAt != null ? DateFormat('h:mm a').format(record!.clockOutAt!.toLocal()) : '—'),
            ],
          ),
          const SizedBox(height: 16),
          if (blockedAttempt)
            _buildBanner("You're outside the outlet's radius - move closer and try again.", AppColors.coralBg, AppColors.coralDeep)
          else if (_punchError != null)
            _buildBanner(_punchError!, AppColors.coralBg, AppColors.coralDeep),
          if (blockedAttempt || _punchError != null) const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: (_punchStatus == _PunchStatus.working || _isDayDone) ? null : _handlePunch,
              style: ElevatedButton.styleFrom(
                backgroundColor: _isDayDone ? AppColors.textMute : (_isOnActiveShift ? AppColors.coral : AppColors.terra),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                disabledBackgroundColor: AppColors.textMute.withValues(alpha: 0.4),
              ),
              child: Text(_punchButtonLabel(), style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _punchTimeColumn(String label, String time) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMute, letterSpacing: 0.4)),
        const SizedBox(height: 4),
        Text(time, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.terraDeep)),
      ],
    );
  }

  Widget _buildBanner(String text, Color bg, Color fg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(text, textAlign: TextAlign.center, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 11.5)),
    );
  }

  String _punchButtonLabel() {
    if (_punchStatus == _PunchStatus.working) return 'Submitting…';
    if (_isDayDone) return 'Day completed';
    if (_isOnActiveShift) return 'PUNCH OUT YOUR DAY';
    return 'PUNCH IN';
  }

  /// Live elapsed time while clocked in, final total once clocked out,
  /// otherwise a dash - never the raw "null" a naive server value would show.
  String _workingHoursText(AttendanceRecord? record) {
    if (record?.clockInAt == null) return '—';
    final end = record!.clockOutAt ?? (record.status == 'on_time' ? DateTime.now() : null);
    if (end == null) return '—';
    final worked = end.difference(record.clockInAt!);
    if (worked.isNegative) return '—';
    return '${worked.inHours}h ${worked.inMinutes % 60}m';
  }

  Widget _buildMonthlyStatus() {
    final s = _monthlyStatus;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('YOUR CURRENT MONTH STATUS', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.textMute, letterSpacing: 0.6)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _statTile('Present', s?.present, AppColors.mintDeep, AppColors.mintBg)),
            const SizedBox(width: 10),
            Expanded(child: _statTile('Absent', s?.absent, AppColors.coralDeep, AppColors.coralBg)),
            const SizedBox(width: 10),
            Expanded(child: _statTile('Late', s?.late, AppColors.amber, AppColors.amberBg)),
          ],
        ),
      ],
    );
  }

  Widget _statTile(String label, int? value, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)),
      child: Column(
        children: [
          Text('${value ?? 0}', style: TextStyle(fontFamily: 'monospace', fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text(label.toUpperCase(), style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.4)),
        ],
      ),
    );
  }
}
