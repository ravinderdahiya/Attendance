import 'dart:convert';
import 'dart:io';
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

  /// Login with the admin-registered mobile number + the admin-set PIN -
  /// only that pairing works, since the admin controls both.
  static Future<StaffUser> staffLogin(String mobile, String pin) async {
    final data = await _request('POST', '/api/auth/staff/login', body: {'mobile': mobile, 'pin': pin});
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

  /// Multipart POST used by clock-in/out - the selfie rides alongside lat/lng
  /// as a file field, so this can't be plain JSON like the rest of _request.
  static Future<Map<String, dynamic>> _proofRequest(
    String path, {
    required double lat,
    required double lng,
    required File photo,
    required double faceConfidence,
    DateTime? occurredAt,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final request = http.MultipartRequest('POST', uri);
    final token = await getToken();
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'application/json';
    request.fields['lat'] = lat.toString();
    request.fields['lng'] = lng.toString();
    request.fields['face_confidence'] = faceConfidence.toString();
    if (occurredAt != null) request.fields['occurred_at'] = occurredAt.toIso8601String();
    request.files.add(await http.MultipartFile.fromPath('photo', photo.path));

    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final res = await http.Response.fromStream(streamed);
    final data = res.body.isNotEmpty ? jsonDecode(res.body) as Map<String, dynamic> : <String, dynamic>{};

    if (res.statusCode >= 400) {
      final message = data['errors'] != null
          ? (data['errors'] as Map<String, dynamic>).values.first[0]
          : (data['message'] ?? 'Request failed (${res.statusCode})');
      throw ApiException(message.toString(), statusCode: res.statusCode);
    }

    return data;
  }

  /// Throws ApiException with the server's message (e.g. "outside the radius")
  /// on a blocked clock-in - that's a definitive server answer, not a network
  /// problem, so callers should show it as-is rather than queue and retry.
  /// A plain (non-ApiException) throw here means the request never reached
  /// the server - that's the signal callers use to fall back to the offline
  /// queue instead.
  static Future<AttendanceRecord> clockIn({required double lat, required double lng, required File photo, required double faceConfidence, DateTime? occurredAt}) async {
    final data = await _proofRequest('/api/attendance/clock-in', lat: lat, lng: lng, photo: photo, faceConfidence: faceConfidence, occurredAt: occurredAt);
    return AttendanceRecord.fromJson(data['record']);
  }

  static Future<AttendanceRecord> clockOut({required double lat, required double lng, required File photo, required double faceConfidence, DateTime? occurredAt}) async {
    final data = await _proofRequest('/api/attendance/clock-out', lat: lat, lng: lng, photo: photo, faceConfidence: faceConfidence, occurredAt: occurredAt);
    return AttendanceRecord.fromJson(data['record']);
  }

  /// Uploads the enrolled reference selfie + its on-device embedding. Sent as
  /// bracketed `embedding[i]` fields (not a JSON string) so Laravel parses it
  /// as an array for validation.
  static Future<StaffUser> enrollFace({required File photo, required List<double> embedding}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/face/enroll');
    final request = http.MultipartRequest('POST', uri);
    final token = await getToken();
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'application/json';
    for (var i = 0; i < embedding.length; i++) {
      request.fields['embedding[$i]'] = embedding[i].toString();
    }
    request.files.add(await http.MultipartFile.fromPath('photo', photo.path));

    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final res = await http.Response.fromStream(streamed);
    final data = res.body.isNotEmpty ? jsonDecode(res.body) as Map<String, dynamic> : <String, dynamic>{};
    if (res.statusCode >= 400) {
      final message = data['errors'] != null
          ? (data['errors'] as Map<String, dynamic>).values.first[0]
          : (data['message'] ?? 'Request failed (${res.statusCode})');
      throw ApiException(message.toString(), statusCode: res.statusCode);
    }
    return StaffUser.fromJson(data['user']);
  }

  /// Backfills the local embedding cache on a reinstall - null if this
  /// account has never enrolled a face.
  static Future<List<double>?> fetchFaceReference() async {
    final data = await _request('GET', '/api/face/reference', auth: true);
    if (data['enrolled'] != true || data['embedding'] == null) return null;
    return (data['embedding'] as List).map((e) => (e as num).toDouble()).toList();
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

  static Future<MonthlyStatus> monthlyStatus() async {
    final data = await _request('GET', '/api/attendance/monthly-status', auth: true);
    return MonthlyStatus.fromJson(data);
  }

  static Future<List<AppNotification>> notifications() async {
    final data = await _request('GET', '/api/notifications', auth: true);
    return (data['notifications'] as List).cast<Map<String, dynamic>>().map(AppNotification.fromJson).toList();
  }
}
