import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// Caches the staff member's enrolled face embedding on-device so punch-time
/// matching never needs a network round-trip - only refetched from the
/// server when missing locally (e.g. after a reinstall).
class FaceProfileService {
  FaceProfileService._();
  static const _embeddingKey = 'shifttrack_face_embedding';

  static Future<List<double>?> getEmbedding() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_embeddingKey);
    if (raw == null) return null;
    return (jsonDecode(raw) as List).map((e) => (e as num).toDouble()).toList();
  }

  static Future<void> setEmbedding(List<double> embedding) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_embeddingKey, jsonEncode(embedding));
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_embeddingKey);
  }

  /// Returns the cached embedding, backfilling it from the server first if
  /// this device has never enrolled locally (covers a reinstall after
  /// enrollment already happened on a previous install).
  static Future<List<double>?> ensureLoaded() async {
    final cached = await getEmbedding();
    if (cached != null) return cached;
    try {
      final reference = await ApiService.fetchFaceReference();
      if (reference == null) return null;
      await setEmbedding(reference);
      return reference;
    } catch (_) {
      return null;
    }
  }
}
