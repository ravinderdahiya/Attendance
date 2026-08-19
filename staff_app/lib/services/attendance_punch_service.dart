import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../screens/camera_capture_screen.dart';

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
  /// queued offline event.
  static Future<File> capturePhoto(BuildContext context, {required bool isClockingOut}) async {
    final path = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CameraCaptureScreen(isClockingOut: isClockingOut),
    );
    if (path == null) throw Exception('A selfie is required to mark attendance.');
    return File(path);
  }
}
