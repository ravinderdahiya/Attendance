import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart';
import '../services/face_profile_service.dart';
import '../services/face_recognition_service.dart';
import '../theme.dart';

/// Full-screen face enrollment - captures one clear frontal selfie, computes
/// its on-device embedding (see FaceRecognitionService), and uploads it as
/// this staff member's reference face for every future punch match. Pops
/// `true` on success so ProfileScreen knows to refresh the user's
/// `faceEnrolled` flag.
class FaceEnrollmentScreen extends StatefulWidget {
  const FaceEnrollmentScreen({super.key});

  @override
  State<FaceEnrollmentScreen> createState() => _FaceEnrollmentScreenState();
}

class _FaceEnrollmentScreenState extends State<FaceEnrollmentScreen> {
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

  Future<void> _captureAndEnroll() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || _isCapturing) return;
    setState(() { _isCapturing = true; _error = null; });

    late final File photo;
    try {
      final shot = await controller.takePicture();
      final dir = await getApplicationDocumentsDirectory();
      final dest = '${dir.path}/face_enroll_${DateTime.now().microsecondsSinceEpoch}.jpg';
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
      await ApiService.enrollFace(photo: photo, embedding: embedding);
      await FaceProfileService.setEmbedding(embedding);

      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _isCapturing = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    final ready = controller != null && controller.value.isInitialized;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.terraDeep,
        title: const Text('Enroll Face ID', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Text(
                'Look straight at the camera in good lighting - this becomes the face Mhari Dhani checks against every clock-in and clock-out.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMute, fontWeight: FontWeight.w600, fontSize: 12),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
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
                height: 48,
                child: ElevatedButton(
                  onPressed: (!ready || _isCapturing) ? null : _captureAndEnroll,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.terra,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(_isCapturing ? 'Enrolling…' : 'CAPTURE & ENROLL', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
