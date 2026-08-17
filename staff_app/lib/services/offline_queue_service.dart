import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'sync_bus.dart';

enum QueuedEventType { clockIn, clockOut, qrScan }

class QueuedEvent {
  final QueuedEventType type;
  final double? lat;
  final double? lng;
  final String? qrToken;
  final DateTime occurredAt;

  QueuedEvent({required this.type, required this.occurredAt, this.lat, this.lng, this.qrToken});

  Map<String, dynamic> toJson() => {
        'type': switch (type) { QueuedEventType.clockIn => 'in', QueuedEventType.clockOut => 'out', QueuedEventType.qrScan => 'scan' },
        'lat': lat,
        'lng': lng,
        'qr_token': qrToken,
        'occurred_at': occurredAt.toIso8601String(),
      };

  factory QueuedEvent.fromJson(Map<String, dynamic> json) => QueuedEvent(
        type: switch (json['type']) { 'in' => QueuedEventType.clockIn, 'out' => QueuedEventType.clockOut, _ => QueuedEventType.qrScan },
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
        qrToken: json['qr_token'],
        occurredAt: DateTime.parse(json['occurred_at']),
      );
}

class SyncResult {
  final int synced;
  final int remaining;
  SyncResult(this.synced, this.remaining);
}

/// Clock-in/out and QR-scan events captured while offline, replayed against
/// the real API once connectivity returns. Queued on-device with
/// SharedPreferences (this app's data volume is tiny - a handful of events
/// between syncs - so a full embedded database would be overkill).
class OfflineQueueService {
  static const _key = 'shifttrack_offline_queue';

  static Future<List<QueuedEvent>> getQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    return raw.map((s) => QueuedEvent.fromJson(jsonDecode(s))).toList();
  }

  static Future<void> _save(List<QueuedEvent> queue) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, queue.map((e) => jsonEncode(e.toJson())).toList());
  }

  static Future<void> enqueue(QueuedEvent event) async {
    final queue = await getQueue();
    queue.add(event);
    await _save(queue);
  }

  /// Replays queued events in order (oldest first, so clock-out never syncs
  /// ahead of its clock-in). Stops at the first event that fails for a
  /// network reason (still offline) - later events stay queued for next
  /// time. An event the server definitively rejects (e.g. blocked, invalid
  /// QR) is dropped rather than retried forever.
  static Future<SyncResult> syncAll() async {
    final queue = await getQueue();
    var synced = 0;
    final remaining = <QueuedEvent>[];

    for (var i = 0; i < queue.length; i++) {
      final event = queue[i];
      try {
        switch (event.type) {
          case QueuedEventType.clockIn:
            await ApiService.clockIn(lat: event.lat!, lng: event.lng!, occurredAt: event.occurredAt);
          case QueuedEventType.clockOut:
            await ApiService.clockOut(lat: event.lat!, lng: event.lng!, occurredAt: event.occurredAt);
          case QueuedEventType.qrScan:
            await ApiService.scanQr(event.qrToken!, occurredAt: event.occurredAt);
        }
        synced++;
      } on ApiException {
        // Server responded with a definitive rejection - drop it and move on.
        synced++;
      } catch (_) {
        // Still offline (or some other transport failure) - keep this and
        // everything after it queued for the next sync attempt.
        remaining.addAll(queue.sublist(i));
        break;
      }
    }

    await _save(remaining);
    if (synced > 0) SyncBus.notify();
    return SyncResult(synced, remaining.length);
  }
}
