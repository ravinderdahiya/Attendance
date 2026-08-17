import 'package:flutter/material.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  final StaffUser user;
  const ProfileScreen({super.key, required this.user});

  Future<void> _logout(BuildContext context) async {
    await ApiService.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final initials = user.name.split(' ').where((p) => p.isNotEmpty).take(2).map((p) => p[0]).join().toUpperCase();

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 30),
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF3B3849), AppColors.terra, AppColors.terraDeep]),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(26)),
          ),
          child: Column(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Center(child: Text(initials, style: const TextStyle(color: AppColors.terra, fontWeight: FontWeight.w800, fontSize: 18))),
              ),
              const SizedBox(height: 10),
              Text(user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
              const SizedBox(height: 3),
              Text(
                '${user.staffCode ?? ''} · ${user.designation ?? ''}',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontFamily: 'monospace', fontSize: 10),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _row(Icons.apartment_outlined, user.outlet?.name ?? 'No outlet assigned'),
              _row(Icons.badge_outlined, user.department ?? 'No department'),
              const Divider(color: AppColors.line),
              ListTile(
                leading: const Icon(Icons.logout, color: AppColors.terra),
                title: const Text('Logout', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                onTap: () => _logout(context),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _row(IconData icon, String label) => ListTile(
        leading: Icon(icon, color: AppColors.terra, size: 20),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
      );
}
