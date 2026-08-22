import 'dart:io';
import 'dart:math';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

/// On-device face detection + embedding - detection via ML Kit, embeddings via
/// a bundled MobileFaceNet TFLite model (see assets/models/NOTICE.md). Both
/// run entirely on the phone; nothing here makes a network call.
class FaceRecognitionService {
  FaceRecognitionService._();
  static final FaceRecognitionService instance = FaceRecognitionService._();

  /// Cosine similarity floor for a punch to count as a match - mirrored
  /// server-side in AttendanceController::FACE_MATCH_THRESHOLD.
  static const matchThreshold = 0.65;

  static const _modelAsset = 'assets/models/face_embedding.tflite';
  static const _inputSize = 112;

  final _detector = FaceDetector(options: FaceDetectorOptions(performanceMode: FaceDetectorMode.accurate));
  Interpreter? _interpreter;

  Future<Interpreter> _loadInterpreter() async {
    return _interpreter ??= await Interpreter.fromAsset(_modelAsset);
  }

  /// Runs ML Kit on the captured photo and returns the one face found.
  /// Throws a user-facing message on zero or multiple faces - callers show
  /// it inline and let the person retry the shot.
  Future<Face> detectSingleFace(File photo) async {
    final faces = await _detector.processImage(InputImage.fromFilePath(photo.path));
    if (faces.isEmpty) throw Exception('No face detected - center your face in the frame and try again.');
    if (faces.length > 1) throw Exception('More than one face in frame - make sure only you are visible.');
    return faces.first;
  }

  /// Crops to the detected face, resizes to the model's input size, and runs
  /// inference to produce the raw embedding vector.
  Future<List<double>> computeEmbedding(File photo, Face face) async {
    final decoded = img.decodeImage(await photo.readAsBytes());
    if (decoded == null) throw Exception('Could not read the captured photo - try again.');

    final left = face.boundingBox.left.round().clamp(0, decoded.width - 1);
    final top = face.boundingBox.top.round().clamp(0, decoded.height - 1);
    final width = face.boundingBox.width.round().clamp(1, decoded.width - left);
    final height = face.boundingBox.height.round().clamp(1, decoded.height - top);

    final resized = img.copyResize(
      img.copyCrop(decoded, x: left, y: top, width: width, height: height),
      width: _inputSize,
      height: _inputSize,
    );

    // MobileFaceNet expects [1, 112, 112, 3] float32 normalized to [-1, 1].
    final input = [
      List.generate(_inputSize, (y) => List.generate(_inputSize, (x) {
            final pixel = resized.getPixel(x, y);
            return [(pixel.r / 127.5) - 1.0, (pixel.g / 127.5) - 1.0, (pixel.b / 127.5) - 1.0];
          })),
    ];

    final interpreter = await _loadInterpreter();
    final embeddingLength = interpreter.getOutputTensor(0).shape.last;
    final output = List.generate(1, (_) => List.filled(embeddingLength, 0.0));
    interpreter.run(input, output);
    return output[0];
  }

  double cosineSimilarity(List<double> a, List<double> b) {
    if (a.length != b.length || a.isEmpty) return 0;
    double dot = 0, normA = 0, normB = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA == 0 || normB == 0) return 0;
    return dot / (sqrt(normA) * sqrt(normB));
  }
}
