import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme.dart';

/// Scans the outlet's printed QR code and pops with its raw token string.
class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  bool _handled = false;

  void _onDetect(BarcodeCapture capture) {
    if (_handled) return;
    final value = capture.barcodes.firstOrNull?.rawValue;
    if (value == null || value.isEmpty) return;
    _handled = true;
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: AppColors.terraDeep,
        foregroundColor: Colors.white,
        title: const Text('Scan outlet QR code'),
      ),
      body: MobileScanner(onDetect: _onDetect),
    );
  }
}

extension on List<Barcode> {
  Barcode? get firstOrNull => isEmpty ? null : first;
}
