class Outlet {
  final int id;
  final String name;
  final String? address;
  final double latitude;
  final double longitude;
  final int radiusMeters;

  Outlet({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
  });

  factory Outlet.fromJson(Map<String, dynamic> json) => Outlet(
        id: json['id'],
        name: json['name'],
        address: json['address'],
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        radiusMeters: json['radius_meters'],
      );
}

class StaffUser {
  final int id;
  final String name;
  final String? mobile;
  final String? staffCode;
  final String? designation;
  final String? department;
  final Outlet? outlet;
  final bool faceEnrolled;

  StaffUser({
    required this.id,
    required this.name,
    required this.mobile,
    required this.staffCode,
    required this.designation,
    required this.department,
    required this.outlet,
    required this.faceEnrolled,
  });

  factory StaffUser.fromJson(Map<String, dynamic> json) => StaffUser(
        id: json['id'],
        name: json['name'],
        mobile: json['mobile'],
        staffCode: json['staff_code'],
        designation: json['designation'],
        department: json['department'],
        outlet: json['outlet'] != null ? Outlet.fromJson(json['outlet']) : null,
        faceEnrolled: json['face_enrolled'] == true,
      );
}

class Shift {
  final int id;
  final String shiftDate;
  final String startTime;
  final String endTime;
  final String? label;

  Shift({required this.id, required this.shiftDate, required this.startTime, required this.endTime, required this.label});

  factory Shift.fromJson(Map<String, dynamic> json) => Shift(
        id: json['id'],
        shiftDate: json['shift_date'],
        startTime: (json['start_time'] as String).substring(0, 5),
        endTime: (json['end_time'] as String).substring(0, 5),
        label: json['label'],
      );
}

class AttendanceRecord {
  final int id;
  final String shiftDate;
  final DateTime? clockInAt;
  final int? clockInDistanceM;
  final String? status; // on_time | blocked
  final DateTime? clockOutAt;
  final String? clockInPhotoUrl;
  final String? clockOutPhotoUrl;

  AttendanceRecord({
    required this.id,
    required this.shiftDate,
    required this.clockInAt,
    required this.clockInDistanceM,
    required this.status,
    required this.clockOutAt,
    this.clockInPhotoUrl,
    this.clockOutPhotoUrl,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
        id: json['id'],
        shiftDate: json['shift_date'],
        clockInAt: json['clock_in_at'] != null ? DateTime.parse(json['clock_in_at']) : null,
        clockInDistanceM: json['clock_in_distance_m'],
        status: json['status'],
        clockOutAt: json['clock_out_at'] != null ? DateTime.parse(json['clock_out_at']) : null,
        clockInPhotoUrl: json['clock_in_photo_url'],
        clockOutPhotoUrl: json['clock_out_photo_url'],
      );
}

class WeeklyPatternDay {
  final String date;
  final bool clockedIn;
  WeeklyPatternDay({required this.date, required this.clockedIn});

  factory WeeklyPatternDay.fromJson(Map<String, dynamic> json) => WeeklyPatternDay(
        date: json['date'],
        clockedIn: json['clockedIn'] == true,
      );
}

class Analytics {
  final int onTimeRatePercent;
  final int totalShifts;
  final int noShowCount;
  final List<WeeklyPatternDay> weeklyPattern;

  Analytics({required this.onTimeRatePercent, required this.totalShifts, required this.noShowCount, required this.weeklyPattern});

  factory Analytics.fromJson(Map<String, dynamic> json) => Analytics(
        onTimeRatePercent: json['onTimeRatePercent'],
        totalShifts: json['totalShifts'],
        noShowCount: json['noShowCount'],
        weeklyPattern: (json['weeklyPattern'] as List).cast<Map<String, dynamic>>().map(WeeklyPatternDay.fromJson).toList(),
      );
}

class MonthlyStatus {
  final int present;
  final int absent;
  final int late;

  MonthlyStatus({required this.present, required this.absent, required this.late});

  factory MonthlyStatus.fromJson(Map<String, dynamic> json) => MonthlyStatus(
        present: json['present'],
        absent: json['absent'],
        late: json['late'],
      );
}

class AppNotification {
  final int id;
  final String type; // clock_in | blocked | streak
  final String message;
  final DateTime? readAt;
  final DateTime createdAt;

  AppNotification({required this.id, required this.type, required this.message, required this.readAt, required this.createdAt});

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'],
        type: json['type'],
        message: json['message'],
        readAt: json['read_at'] != null ? DateTime.parse(json['read_at']) : null,
        createdAt: DateTime.parse(json['created_at']),
      );
}
