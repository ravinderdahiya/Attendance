import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _mobileController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;
  bool _isSubmitting = false;
  String? _error;

  Future<void> _sendOtp() async {
    if (_mobileController.text.trim().isEmpty) return;
    setState(() { _isSubmitting = true; _error = null; });
    try {
      await ApiService.sendOtp(_mobileController.text.trim());
      setState(() => _otpSent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.trim().isEmpty) return;
    setState(() { _isSubmitting = true; _error = null; });
    try {
      final user = await ApiService.verifyOtp(_mobileController.text.trim(), _otpController.text.trim());
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => HomeShell(user: user)));
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_otpSent ? "Verify it's you" : 'Sign in to ShiftTrack',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: AppColors.terraDeep)),
              const SizedBox(height: 8),
              Text(
                _otpSent ? 'Enter the OTP sent to ${_mobileController.text}' : 'Enter your registered mobile number',
                style: const TextStyle(color: AppColors.textMute, fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 24),
              if (!_otpSent)
                TextField(
                  controller: _mobileController,
                  keyboardType: TextInputType.phone,
                  decoration: _fieldDecoration('Mobile number'),
                )
              else
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: _fieldDecoration('OTP code'),
                ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.coralBg, borderRadius: BorderRadius.circular(10)),
                  child: Text(_error!, style: const TextStyle(color: AppColors.coralDeep, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : (_otpSent ? _verifyOtp : _sendOtp),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.terra,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    _isSubmitting ? 'Please wait…' : (_otpSent ? 'Verify & continue' : 'Send OTP'),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _isSubmitting ? null : () => setState(() { _otpSent = false; _otpController.clear(); _error = null; }),
                  child: const Text('Change mobile number', style: TextStyle(color: AppColors.textMute, fontWeight: FontWeight.w600)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _fieldDecoration(String label) => InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.line)),
      );
}
