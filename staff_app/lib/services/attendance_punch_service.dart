import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../screens/camera_capture_screen.dart';

/// A captured attendance selfie plus the on-device face-match confidence
/// computed against the staff member's enrolled reference (see
/// FaceRecognitionService) - both required by the clock-in/out API.
class PunchCapture {
  final File photo;
  final double faceConfidence;
  PunchCapture({required this.photo, required this.faceConfidence});
}

/// GPS + selfie capture shared by every screen that can punch in/out - one
/// place for the exact same proof-of-presence steps.
class AttendancePunchService {
  AttendancePunchService._();

  static Future<Position> resolvePosition() async {
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

  /// Opens ShiftTrack's own small in-app camera preview (as a dialog over the
  /// current screen) for an attendance selfie - not a hand-off to the
  /// phone's separate camera app, and no gallery picker so staff can't
  /// submit an old or borrowed photo as "proof" of presence. The captured
  /// shot is already copied into app-private storage (see
  /// CameraCaptureScreen), so it survives until synced, even if this was a
  /// queued offline event. CameraCaptureScreen also runs the on-device face
  /// match before it ever pops - a mismatch stays in the dialog for retry,
  /// so a result reaching here has already passed verification.
  static Future<PunchCapture> capturePhoto(BuildContext context, {required bool isClockingOut}) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CameraCaptureScreen(isClockingOut: isClockingOut),
    );
    if (result == null) throw Exception('A selfie is required to mark attendance.');
    return PunchCapture(photo: File(result['path'] as String), faceConfidence: result['confidence'] as double);
  }
}
