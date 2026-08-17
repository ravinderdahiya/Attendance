import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../services/offline_queue_service.dart';
import '../services/sync_bus.dart';
import '../theme.dart';
import 'qr_scan_screen.dart';

enum _Status { idle, locating, submitting, success, blocked, error, queued, patrolLogged }

class ClockInScreen extends StatefulWidget {
  const ClockInScreen({super.key});

  @override
  State<ClockInScreen> createState() => _ClockInScreenState();
}

class _ClockInScreenState extends State<ClockInScreen> {
  _Status _status = _Status.idle;
  String? _message;
  AttendanceRecord? _record;
  bool _clockingOut = false;
  int _pendingCount = 0;
  // Best-effort UI toggle for "already clocked in" right after a queued
  // (offline) clock-in - not persisted, so a fresh app launch won't remember
  // it, but the pending-sync banner still shows the queued event is there.
  bool _queuedClockedIn = false;
  bool _isSyncing = false;
  StreamSubscription<void>? _syncSub;

  @override
  void initState() {
    super.initState();
    _refreshPendingCount();
    _loadToday();
    // A background sync (e.g. triggered by HomeShell noticing connectivity
    // return) updates the server and the local queue, but this screen may
    // already be built and wouldn't otherwise know to refresh - listen for it.
    _syncSub = SyncBus.onSynced.listen((_) {
      _refreshPendingCount();
      _loadToday();
      if (mounted) setState(() { _queuedClockedIn = false; _status = _Status.idle; });
    });
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    super.dispose();
  }

  Future<void> _loadToday() async {
    try {
      final record = await ApiService.today();
      if (mounted) setState(() => _record = record);
    } catch (_) {
      // Fine to stay null here - the ring just shows "Ready to clock in".
    }
  }

  Future<void> _refreshPendingCount() async {
    final queue = await OfflineQueueService.getQueue();
    if (mounted) setState(() => _pendingCount = queue.length);
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);
    try {
      await OfflineQueueService.syncAll();
      await _refreshPendingCount();
      await _loadToday();
      if (mounted) setState(() => _queuedClockedIn = false);
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<Position> _resolvePosition() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required to clock in.');
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Turn on location services to clock in.');
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  Future<void> _handleClockIn() async {
    setState(() { _status = _Status.locating; _message = null; });

    late final Position position;
    try {
      position = await _resolvePosition();
    } catch (e) {
      // Permission/service issues aren't network problems - surface directly.
      setState(() { _status = _Status.error; _message = e.toString().replaceFirst('Exception: ', ''); });
      return;
    }
    setState(() => _status = _Status.submitting);

    try {
      final record = await ApiService.clockIn(lat: position.latitude, lng: position.longitude);
      setState(() { _status = _Status.success; _record = record; });
    } on ApiException catch (e) {
      setState(() { _status = _Status.blocked; _message = e.message; });
    } catch (_) {
      await OfflineQueueService.enqueue(QueuedEvent(
        type: QueuedEventType.clockIn, lat: position.latitude, lng: position.longitude, occurredAt: DateTime.now(),
      ));
      await _refreshPendingCount();
      setState(() { _status = _Status.queued; _queuedClockedIn = true; });
    }
  }

  Future<void> _handleClockOut() async {
    setState(() { _clockingOut = true; _message = null; });

    late final Position position;
    try {
      position = await _resolvePosition();
    } catch (e) {
      setState(() { _clockingOut = false; _message = e.toString().replaceFirst('Exception: ', ''); });
      return;
    }

    try {
      final record = await ApiService.clockOut(lat: position.latitude, lng: position.longitude);
      setState(() => _record = record);
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } catch (_) {
      await OfflineQueueService.enqueue(QueuedEvent(
        type: QueuedEventType.clockOut, lat: position.latitude, lng: position.longitude, occurredAt: DateTime.now(),
      ));
      await _refreshPendingCount();
      setState(() { _status = _Status.queued; _queuedClockedIn = false; });
    } finally {
      if (mounted) setState(() => _clockingOut = false);
    }
  }

  /// One scanner, any printed code - the server (not this screen) decides
  /// whether it was an entrance code (attendance) or a patrol checkpoint.
  Future<void> _scanQr() async {
    final token = await Navigator.of(context).push<String>(MaterialPageRoute(builder: (_) => const QrScanScreen()));
    if (token == null || !mounted) return;

    setState(() { _status = _Status.submitting; _message = null; });
    try {
      final result = await ApiService.scanQr(token);
      if (result.type == 'patrol') {
        setState(() { _status = _Status.patrolLogged; _message = result.message; });
      } else {
        setState(() { _status = _Status.success; _record = result.record; });
      }
    } on ApiException catch (e) {
      setState(() { _status = _Status.blocked; _message = e.message; });
    } catch (_) {
      await OfflineQueueService.enqueue(QueuedEvent(type: QueuedEventType.qrScan, qrToken: token, occurredAt: DateTime.now()));
      await _refreshPendingCount();
      setState(() { _status = _Status.queued; _queuedClockedIn = true; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final alreadyClockedIn = (_record?.status == 'on_time' && _record?.clockOutAt == null) || _queuedClockedIn;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
      child: Column(
        children: [
          if (_pendingCount > 0) _buildPendingBanner(),
          Text(_titleFor(), textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.terraDeep)),
          const SizedBox(height: 24),
          _buildRing(),
          const SizedBox(height: 24),
          if (_message != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _status == _Status.patrolLogged ? AppColors.mintBg : AppColors.coralBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _message!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _status == _Status.patrolLogged ? AppColors.mintDeep : AppColors.coralDeep,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: (_status == _Status.locating || _status == _Status.submitting || _clockingOut)
                  ? null
                  : (alreadyClockedIn ? _handleClockOut : _handleClockIn),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.terra,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_buttonLabel(alreadyClockedIn), style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: (_status == _Status.locating || _status == _Status.submitting || _clockingOut) ? null : _scanQr,
              icon: const Icon(Icons.qr_code_scanner, size: 18),
              label: const Text('Scan QR instead', style: TextStyle(fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(foregroundColor: AppColors.terra, side: const BorderSide(color: AppColors.terra)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: AppColors.amberBg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(Icons.cloud_off, size: 16, color: AppColors.amber),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$_pendingCount ${_pendingCount == 1 ? 'event' : 'events'} waiting to sync',
              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.amber),
            ),
          ),
          TextButton(
            onPressed: _isSyncing ? null : _syncNow,
            child: Text(_isSyncing ? 'Syncing…' : 'Sync now', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5)),
          ),
        ],
      ),
    );
  }

  String _titleFor() {
    switch (_status) {
      case _Status.locating:
        return 'Confirming your location…';
      case _Status.submitting:
        return 'Verifying with outlet…';
      case _Status.success:
        return 'Within the outlet radius';
      case _Status.blocked:
        return 'Outside the outlet radius';
      case _Status.queued:
        return 'Recorded offline — will sync automatically';
      case _Status.patrolLogged:
        return 'Checkpoint logged';
      default:
        return 'Ready to clock in';
    }
  }

  String _buttonLabel(bool alreadyClockedIn) {
    if (_status == _Status.locating) return 'Getting location…';
    if (_status == _Status.submitting) return 'Verifying…';
    if (_clockingOut) return 'Clocking out…';
    return alreadyClockedIn ? 'Clock out' : 'Clock in';
  }

  Widget _buildRing() {
    final distance = _record?.clockInDistanceM;
    final isQueued = _status == _Status.queued;
    final isPatrol = _status == _Status.patrolLogged;
    final ringColor = _status == _Status.blocked ? AppColors.coralBg : (isQueued ? AppColors.amberBg : AppColors.mintBg);
    final textColor = _status == _Status.blocked ? AppColors.coralDeep : (isQueued ? AppColors.amber : AppColors.mintDeep);

    return Container(
      width: 150, height: 150,
      decoration: BoxDecoration(color: ringColor, shape: BoxShape.circle),
      child: Center(
        child: (_status == _Status.locating || _status == _Status.submitting)
            ? const CircularProgressIndicator()
            : isQueued
                ? Icon(Icons.cloud_off, size: 36, color: textColor)
                : isPatrol
                    ? Icon(Icons.shield_outlined, size: 36, color: AppColors.mintDeep)
                    : Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            distance != null ? '${distance}m' : '—',
                            style: TextStyle(fontFamily: 'monospace', fontSize: 26, fontWeight: FontWeight.w700, color: textColor),
                          ),
                          Text('FROM OUTLET', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: textColor, letterSpacing: 0.5)),
                        ],
                      ),
      ),
    );
  }
}
