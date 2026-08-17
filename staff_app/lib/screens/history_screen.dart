import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'calendar_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<AttendanceRecord> _records = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final records = await ApiService.history();
      if (mounted) setState(() { _records = records; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Shift history', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.terraDeep)),
              IconButton(
                icon: const Icon(Icons.calendar_month, color: AppColors.terra, size: 20),
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CalendarScreen())),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.coralDeep)))
                  : _records.isEmpty
                      ? const Center(child: Text('No attendance yet', style: TextStyle(color: AppColors.textMute)))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: _records.length,
                            separatorBuilder: (_, _) => const Divider(height: 1, color: AppColors.line),
                            itemBuilder: (context, i) => _buildRow(_records[i]),
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildRow(AttendanceRecord r) {
    final isOnTime = r.status == 'on_time';
    final color = isOnTime ? AppColors.mint : AppColors.coral;
    final label = isOnTime ? 'On time' : 'Blocked';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(9)),
            child: Icon(isOnTime ? Icons.check : Icons.close, color: Colors.white, size: 15),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(DateFormat('EEE, d MMM').format(DateTime.parse(r.shiftDate)), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                if (r.clockInAt != null)
                  Text(DateFormat('h:mm a').format(r.clockInAt!.toLocal()), style: const TextStyle(fontSize: 10, color: AppColors.textMute, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8)),
            child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
