import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../theme.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Analytics? _analytics;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final analytics = await ApiService.analytics();
      if (mounted) setState(() { _analytics = analytics; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 24, 20, 8),
          child: Text('Attendance analytics', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.terraDeep)),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.coralDeep)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        children: [
                          _buildDonutCard(),
                          const SizedBox(height: 16),
                          const Text('WEEKLY PATTERN', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: AppColors.textMute, letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          _buildWeeklyBars(),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(child: _miniStat('${_analytics!.totalShifts}', 'SHIFTS')),
                              const SizedBox(width: 8),
                              Expanded(child: _miniStat('${_analytics!.noShowCount}', 'BLOCKED')),
                            ],
                          ),
                        ],
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildDonutCard() {
    final rate = _analytics!.onTimeRatePercent;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF3B3849), AppColors.terraDeep]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 56,
            height: 56,
            child: CustomPaint(
              painter: _DonutPainter(percent: rate / 100),
              child: Center(child: Text('$rate%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13, fontFamily: 'monospace'))),
            ),
          ),
          const SizedBox(width: 14),
          const Text('On-time rate', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildWeeklyBars() {
    return SizedBox(
      height: 64,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: _analytics!.weeklyPattern.map((day) {
          final label = DateFormat('E').format(DateTime.parse(day.date))[0];
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    height: day.clockedIn ? 44 : 8,
                    decoration: BoxDecoration(color: day.clockedIn ? AppColors.mint : AppColors.line, borderRadius: const BorderRadius.vertical(top: Radius.circular(3))),
                  ),
                  const SizedBox(height: 4),
                  Text(label, style: const TextStyle(fontSize: 8, color: AppColors.textMute, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _miniStat(String value, String label) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: const Color(0xFFF1EEEA), borderRadius: BorderRadius.circular(10)),
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontFamily: 'monospace', fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.terraDeep)),
          Text(label, style: const TextStyle(fontSize: 8, color: AppColors.textMute, fontWeight: FontWeight.w700, letterSpacing: 0.4)),
        ],
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  final double percent;
  _DonutPainter({required this.percent});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;
    final bgPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6;
    final fgPaint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -1.5708, 6.28319 * percent, false, fgPaint);
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) => oldDelegate.percent != percent;
}
