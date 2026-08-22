import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/brand_backdrop.dart';
import 'login_screen.dart';
import 'home_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String? _retryError;

  @override
  void initState() {
    super.initState();
    _resolveSession();
  }

  Future<void> _resolveSession() async {
    setState(() => _retryError = null);
    final token = await ApiService.getToken();
    if (token == null) {
      _goTo(const LoginScreen());
      return;
    }
    try {
      final user = await ApiService.me();
      _goTo(HomeShell(user: user));
    } catch (e) {
      // Only a genuine 401 means the token itself is invalid - a network
      // hiccup or backend timeout shouldn't force a fresh OTP login, so keep
      // the token and let the user retry instead.
      if (e is ApiException && e.isUnauthenticated) {
        await ApiService.clearToken();
        _goTo(const LoginScreen());
      } else if (mounted) {
        setState(() => _retryError = e.toString());
      }
    }
  }

  void _goTo(Widget destination) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => destination));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.terraDeep,
      body: BrandAtmosphere(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                BrandAssets.logo,
                height: 56,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const BrandName(),
              ),
              const SizedBox(height: 16),
              Text(
                "Clocked in only when you're on-site",
                style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontSize: 12, fontWeight: FontWeight.w600),
              ),
              if (_retryError != null) ...[
                const SizedBox(height: 24),
                Text(_retryError!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _resolveSession,
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white)),
                  child: const Text('Retry'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
