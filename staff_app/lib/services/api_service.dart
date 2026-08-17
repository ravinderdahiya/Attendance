import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});
  bool get isUnauthenticated => statusCode == 401;
  @override
  String toString() => message;
}

class ApiService {
  static const _tokenKey = 'shifttrack_token';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = false,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    late final http.Response res;
    switch (method) {
      case 'GET':
        res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));
        break;
      case 'POST':
        res = await http.post(uri, headers: headers, body: jsonEncode(body ?? {})).timeout(const Duration(seconds: 15));
        break;
      default:
        throw ApiException('Unsupported method');
    }

    final data = res.body.isNotEmpty ? jsonDecode(res.body) as Map<String, dynamic> : <String, dynamic>{};

    if (res.statusCode >= 400) {
      final message = data['errors'] != null
          ? (data['errors'] as Map<String, dynamic>).values.first[0]
          : (data['message'] ?? 'Request failed (${res.statusCode})');
      throw ApiException(message.toString(), statusCode: res.statusCode);
    }

    return data;
  }

  static Future<void> sendOtp(String mobile) => _request('POST', '/api/auth/staff/send-otp', body: {'mobile': mobile});

  static Future<StaffUser> verifyOtp(String mobile, String code) async {
    final data = await _request('POST', '/api/auth/staff/verify-otp', body: {'mobile': mobile, 'code': code});
    await setToken(data['token']);
    return StaffUser.fromJson(data['user']);
  }

  static Future<StaffUser> me() async {
    final data = await _request('GET', '/api/me', auth: true);
    return StaffUser.fromJson(data['user']);
  }

  static Future<void> logout() async {
    try {
      await _request('POST', '/api/logout', auth: true);
    } catch (_) {
      // token may already be invalid server-side - clear locally regardless
    }
    await clearToken();
  }

  static Future<AttendanceRecord?> today() async {
    final data = await _request('GET', '/api/attendance/today', auth: true);
    return data['record'] != null ? AttendanceRecord.fromJson(data['record']) : null;
  }

  static Future<List<AttendanceRecord>> history() async {
    final data = await _request('GET', '/api/attendance/history', auth: true);
    final items = (data['records']['data'] as List).cast<Map<String, dynamic>>();
    return items.map(AttendanceRecord.fromJson).toList();
  }

  /// Throws ApiException with the server's message (e.g. "outside the radius")
  /// on a blocked clock-in - that's a definitive server answer, not a network
  /// problem, so callers should show it as-is rather than queue and retry.
  /// A plain (non-ApiException) throw here means the request never reached
  /// the server - that's the signal callers use to fall back to the offline
  /// queue instead.
  static Future<AttendanceRecord> clockIn({required double lat, required double lng, DateTime? occurredAt}) async {
    final data = await _request('POST', '/api/attendance/clock-in', auth: true, body: {
      'lat': lat,
      'lng': lng,
      if (occurredAt != null) 'occurred_at': occurredAt.toIso8601String(),
    });
    return AttendanceRecord.fromJson(data['record']);
  }

  static Future<AttendanceRecord> clockOut({required double lat, required double lng, DateTime? occurredAt}) async {
    final data = await _request('POST', '/api/attendance/clock-out', auth: true, body: {
      'lat': lat,
      'lng': lng,
      if (occurredAt != null) 'occurred_at': occurredAt.toIso8601String(),
    });
    return AttendanceRecord.fromJson(data['record']);
  }

  /// One endpoint for every printed QR code - the server figures out whether
  /// it's an entrance code (attendance) or a patrol checkpoint and reacts
  /// accordingly, so the app never needs to know in advance which it scanned.
  static Future<ScanResult> scanQr(String qrToken, {DateTime? occurredAt}) async {
    final data = await _request('POST', '/api/scan', auth: true, body: {
      'qr_token': qrToken,
      if (occurredAt != null) 'occurred_at': occurredAt.toIso8601String(),
    });
    return ScanResult.fromJson(data);
  }

  static Future<List<Shift>> todayShifts() async {
    final data = await _request('GET', '/api/shifts/today', auth: true);
    return (data['shifts'] as List).cast<Map<String, dynamic>>().map(Shift.fromJson).toList();
  }

  static Future<Map<String, String>> calendar(String month) async {
    final data = await _request('GET', '/api/attendance/calendar?month=$month', auth: true);
    return (data['days'] as Map<String, dynamic>).map((k, v) => MapEntry(k, v as String));
  }

  static Future<Analytics> analytics() async {
    final data = await _request('GET', '/api/attendance/analytics', auth: true);
    return Analytics.fromJson(data);
  }

  static Future<List<AppNotification>> notifications() async {
    final data = await _request('GET', '/api/notifications', auth: true);
    return (data['notifications'] as List).cast<Map<String, dynamic>>().map(AppNotification.fromJson).toList();
  }
}
