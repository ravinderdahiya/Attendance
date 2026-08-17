import 'dart:async';

/// Broadcasts "a sync just happened" so already-visible screens (built before
/// the sync ran) can refresh, instead of only picking up the new state on
/// their next initState (e.g. after the user navigates away and back).
class SyncBus {
  SyncBus._();
  static final _controller = StreamController<void>.broadcast();
  static Stream<void> get onSynced => _controller.stream;
  static void notify() => _controller.add(null);
}
