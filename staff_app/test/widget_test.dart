import 'package:flutter_test/flutter_test.dart';

import 'package:shifttrack_staff/main.dart';

void main() {
  testWidgets('App boots to the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MhariDhaniApp());
    await tester.pump();

    expect(find.text("Clocked in only when you're on-site"), findsOneWidget);
  });
}
