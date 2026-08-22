import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../services/face_profile_service.dart';
import '../services/face_recognition_service.dart';
import '../theme.dart';

/// Small in-app camera preview shown as a dialog over whatever screen asked
/// for the attendance selfie - a single button captures the live frame,
/// verifies it's the enrolled staff member's own face (on-device, see
/// FaceRecognitionService), and submits it in one tap, so this never hands
/// off to the phone's separate camera app.
class CameraCaptureScreen extends StatefulWidget {
  final bool isClockingOut;
  const CameraCaptureScreen({super.key, required this.isClockingOut});

  @override
  State<CameraCaptureScreen> createState() => _CameraCaptureScreenState();
}

class _CameraCaptureScreenState extends State<CameraCaptureScreen> {
  CameraController? _controller;
  String? _error;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) throw Exception('No camera found on this device.');
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final controller = CameraController(front, ResolutionPreset.medium, enableAudio: false);
      await controller.initialize();
      if (!mounted) {
        controller.dispose();
        return;
      }
      setState(() => _controller = controller);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureAndSubmit() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || _isCapturing) return;
    setState(() { _isCapturing = true; _error = null; });

    late final File photo;
    try {
      final shot = await controller.takePicture();
      final dir = await getApplicationDocumentsDirectory();
      final dest = '${dir.path}/attendance_${DateTime.now().microsecondsSinceEpoch}.jpg';
      await File(shot.path).copy(dest);
      photo = File(dest);
    } catch (_) {
      if (mounted) setState(() { _error = 'Could not capture the photo - try again.'; _isCapturing = false; });
      return;
    }

    try {
      final service = FaceRecognitionService.instance;
      final face = await service.detectSingleFace(photo);
      final embedding = await service.computeEmbedding(photo, face);
      final reference = await FaceProfileService.ensureLoaded();
      if (reference == null) {
        throw Exception('Face not enrolled - go to Profile > Enroll Face ID first.');
      }
      final confidence = service.cosineSimilarity(embedding, reference);
      if (confidence < FaceRecognitionService.matchThreshold) {
        throw Exception("Face doesn't match your enrolled profile - try again.");
      }

      if (mounted) Navigator.of(context).pop({'path': photo.path, 'confidence': confidence});
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _isCapturing = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    final ready = controller != null && controller.value.isInitialized;

    return Dialog(
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.all(24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Attendance selfie', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.terraDeep)),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: SizedBox(
                width: 230,
                height: 300,
                child: !ready
                    ? Container(
                        color: AppColors.line,
                        child: Center(
                          child: _error != null
                              ? Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.coralDeep, fontWeight: FontWeight.w600, fontSize: 12)),
                                )
                              : const CircularProgressIndicator(),
                        ),
                      )
                    : FittedBox(
                        fit: BoxFit.cover,
                        child: SizedBox(
                          width: controller.value.previewSize!.height,
                          height: controller.value.previewSize!.width,
                          child: CameraPreview(controller),
                        ),
                      ),
              ),
            ),
            if (ready && _error != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.coralDeep, fontWeight: FontWeight.w600, fontSize: 11.5)),
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: (!ready || _isCapturing) ? null : _captureAndSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.terra,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  _isCapturing ? 'Capturing…' : 'CAPTURE & ${widget.isClockingOut ? 'PUNCH OUT' : 'PUNCH IN'}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
