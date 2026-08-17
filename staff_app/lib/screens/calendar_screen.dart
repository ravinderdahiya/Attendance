import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, String> _days = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final days = await ApiService.calendar(DateFormat('yyyy-MM').format(_month));
      if (mounted) setState(() { _days = days; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _changeMonth(int delta) {
    setState(() => _month = DateTime(_month.year, _month.month + delta));
    _load();
  }

  Color _bgColor(String status) => switch (status) {
        'on_time' => AppColors.mintBg,
        'blocked' => AppColors.coralBg,
        _ => AppColors.line,
      };
  Color _textColor(String status) => switch (status) {
        'on_time' => AppColors.mintDeep,
        'blocked' => AppColors.coralDeep,
        _ => AppColors.textMute,
      };

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final leadingBlanks = firstDay.weekday % 7; // Sunday-first grid

    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        backgroundColor: AppColors.paper,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.terra),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(icon: const Icon(Icons.chevron_left), color: AppColors.terra, onPressed: () => _changeMonth(-1)),
            Text(DateFormat('MMMM yyyy').format(_month), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.terraDeep)),
            IconButton(icon: const Icon(Icons.chevron_right), color: AppColors.textMute, onPressed: () => _changeMonth(1)),
          ],
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.coralDeep)))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                            .map((d) => Expanded(child: Center(child: Text(d, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMute)))))
                            .toList(),
                      ),
                      const SizedBox(height: 6),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 4, crossAxisSpacing: 4),
                        itemCount: leadingBlanks + daysInMonth,
                        itemBuilder: (context, i) {
                          if (i < leadingBlanks) return const SizedBox.shrink();
                          final day = i - leadingBlanks + 1;
                          final key = DateFormat('yyyy-MM-dd').format(DateTime(_month.year, _month.month, day));
                          final status = _days[key];
                          return Container(
                            decoration: BoxDecoration(
                              color: status != null ? _bgColor(status) : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text('$day', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: status != null ? _textColor(status) : AppColors.ink900)),
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _legendItem('On time', AppColors.mint),
                          const SizedBox(width: 14),
                          _legendItem('Blocked', AppColors.coral),
                        ],
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _legendItem(String label, Color color) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 7, height: 7, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMute)),
        ],
      );
}
