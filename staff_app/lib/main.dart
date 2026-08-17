import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'theme.dart';

void main() {
  runApp(const ShiftTrackApp());
}

class ShiftTrackApp extends StatelessWidget {
  const ShiftTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ShiftTrack',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.terra),
        scaffoldBackgroundColor: AppColors.paper,
      ),
      home: const SplashScreen(),
    );
  }
}
