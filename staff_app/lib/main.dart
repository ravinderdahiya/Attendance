import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'theme.dart';

void main() {
  runApp(const MhariDhaniApp());
}

class MhariDhaniApp extends StatelessWidget {
  const MhariDhaniApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mhari Dhani',
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
