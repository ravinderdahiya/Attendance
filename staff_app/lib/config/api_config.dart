/// Base URL for the ShiftTrack Laravel backend.
class ApiConfig {
  ApiConfig._();

  /// Override anytime:
  /// `flutter run --dart-define=API_BASE_URL=http://192.168.1.23:8090`
  static const String _fromEnvironment = String.fromEnvironment('API_BASE_URL');

  /// Phone connects via this PC's Mobile Hotspot. Change this IP if the
  /// machine's hotspot address changes - "127.0.0.1" from a physical/emulated
  /// device means the device itself, not this PC, so it won't reach the backend.
  static const String localBaseUrl = 'http://192.168.137.1:8090';

  static String get baseUrl {
    if (_fromEnvironment.isNotEmpty) return _fromEnvironment;
    return localBaseUrl;
  }
}
