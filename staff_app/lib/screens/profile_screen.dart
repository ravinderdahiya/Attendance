import 'package:flutter/material.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../services/face_profile_service.dart';
import '../theme.dart';
import 'face_enrollment_screen.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  final StaffUser user;
  final ValueChanged<StaffUser> onUserUpdated;
  const ProfileScreen({super.key, required this.user, required this.onUserUpdated});

  Future<void> _logout(BuildContext context) async {
    await ApiService.logout();
    await FaceProfileService.clear();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false);
  }

  Future<void> _enrollFace(BuildContext context) async {
    final enrolled = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const FaceEnrollmentScreen()));
    if (enrolled != true) return;
    try {
      onUserUpdated(await ApiService.me());
    } catch (_) {
      // Enrollment already succeeded server-side - the flag will catch up
      // next time `me()` is fetched (e.g. next app launch).
    }
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
                leading: Icon(user.faceEnrolled ? Icons.verified_user : Icons.face_retouching_natural, color: AppColors.terra),
                title: Text(
                  user.faceEnrolled ? 'Face ID enrolled - tap to re-enroll' : 'Enroll Face ID',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
                trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.textMute),
                onTap: () => _enrollFace(context),
              ),
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
