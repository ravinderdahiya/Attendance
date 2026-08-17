import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import '../models.dart';
import '../services/offline_queue_service.dart';
import '../theme.dart';
import 'dashboard_screen.dart';
import 'clock_in_screen.dart';
import 'history_screen.dart';
import 'analytics_screen.dart';
import 'profile_screen.dart';

class HomeShell extends StatefulWidget {
  final StaffUser user;
  const HomeShell({super.key, required this.user});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  @override
  void initState() {
    super.initState();
    // Best-effort sync on launch (covers "closed app while offline, reopened
    // with signal back"), then again whenever connectivity actually changes -
    // the queue is a no-op sync if it's already empty either way.
    OfflineQueueService.syncAll();
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((r) => r != ConnectivityResult.none)) {
        OfflineQueueService.syncAll();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      DashboardScreen(user: widget.user),
      const ClockInScreen(),
      const HistoryScreen(),
      const AnalyticsScreen(),
      ProfileScreen(user: widget.user),
    ];

    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(child: tabs[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.paper,
        indicatorColor: AppColors.terra.withValues(alpha: 0.1),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home, color: AppColors.terra), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.location_on_outlined), selectedIcon: Icon(Icons.location_on, color: AppColors.terra), label: 'Clock-in'),
          NavigationDestination(icon: Icon(Icons.history), selectedIcon: Icon(Icons.history, color: AppColors.terra), label: 'History'),
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart, color: AppColors.terra), label: 'Reports'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: AppColors.terra), label: 'Profile'),
        ],
      ),
    );
  }
}
