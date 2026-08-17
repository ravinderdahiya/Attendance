import 'package:flutter_test/flutter_test.dart';

import 'package:shifttrack_staff/main.dart';

void main() {
  testWidgets('App boots to the login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ShiftTrackApp());
    await tester.pump();

    expect(find.text('ShiftTrack'), findsOneWidget);
  });
}
