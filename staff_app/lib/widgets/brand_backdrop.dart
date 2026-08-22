import 'package:flutter/material.dart';
import '../theme.dart';

class BrandAssets {
  static const logo = 'assets/brand/logo.png';
  static const entrance = 'assets/brand/entrance.png';
  static const storefront = 'assets/brand/storefront.jpg';
  static const facade = 'assets/brand/facade.png';
  static const interior = 'assets/brand/interior.jpg';
  static const food = 'assets/brand/food.png';
}

/// Full-bleed restaurant photo with a cinematic gradient so the picture
/// stays clear at the centre and the UI stays readable at the edges.
class BrandAtmosphere extends StatelessWidget {
  final Widget child;
  final String asset;

  const BrandAtmosphere({
    super.key,
    required this.child,
    this.asset = BrandAssets.facade,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColorFiltered(
          colorFilter: const ColorFilter.matrix(<double>[
            1.08, 0.04, 0.02, 0, 6,
            0.02, 1.05, 0.02, 0, 4,
            0.01, 0.03, 1.02, 0, 2,
            0, 0, 0, 1, 0,
          ]),
          child: Image.asset(
            asset,
            fit: BoxFit.cover,
            alignment: const Alignment(0, -0.15),
            errorBuilder: (_, __, ___) => const ColoredBox(color: AppColors.terraDeep),
          ),
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xD4131019),
                Color(0x66131019),
                Color(0xF2131019),
              ],
              stops: [0.0, 0.42, 1.0],
            ),
          ),
        ),
        child,
      ],
    );
  }
}

class BrandName extends StatelessWidget {
  final Color color;
  final bool compact;
  const BrandName({super.key, this.color = Colors.white, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'म्हारी ढाणी',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w800,
            fontSize: compact ? 18 : 28,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          'Mhari Dhani',
          style: TextStyle(
            color: color.withValues(alpha: 0.9),
            fontWeight: FontWeight.w800,
            fontSize: compact ? 11 : 14,
            letterSpacing: 0.4,
          ),
        ),
      ],
    );
  }
}
