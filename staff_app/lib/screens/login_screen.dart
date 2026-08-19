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
  final _pinController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  Future<void> _login() async {
    if (_mobileController.text.trim().isEmpty || _pinController.text.trim().isEmpty) return;
    setState(() { _isSubmitting = true; _error = null; });
    try {
      final user = await ApiService.staffLogin(_mobileController.text.trim(), _pinController.text.trim());
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
              const Text('Sign in to ShiftTrack',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: AppColors.terraDeep)),
              const SizedBox(height: 8),
              const Text(
                'Enter your registered mobile number and PIN',
                style: TextStyle(color: AppColors.textMute, fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                decoration: _fieldDecoration('Mobile number'),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _pinController,
                keyboardType: TextInputType.number,
                obscureText: true,
                maxLength: 4,
                decoration: _fieldDecoration('4-digit PIN').copyWith(counterText: ''),
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
                  onPressed: _isSubmitting ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.terra,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    _isSubmitting ? 'Please wait…' : 'Sign in',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
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
