export interface Outlet {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  staff_count?: number;
}

export type PayType = 'monthly' | 'daily';

export interface StaffUser {
  id: number;
  role: 'staff' | 'manager';
  name: string;
  mobile: string | null;
  staff_code: string | null;
  designation: string | null;
  department: string | null;
  outlet_id: number | null;
  outlet?: Outlet | null;
  is_active: boolean;
  pay_type?: PayType | null;
  pay_rate?: number | null;
}

export type AttendanceStatus = 'on_time' | 'blocked';

export interface AttendanceRecord {
  id: number;
  user_id: number;
  outlet_id: number;
  shift_date: string;
  clock_in_at: string | null;
  clock_in_distance_m: number | null;
  status: AttendanceStatus | null;
  clock_out_at: string | null;
  clock_in_photo_url: string | null;
  clock_out_photo_url: string | null;
  user?: Pick<StaffUser, 'id' | 'name' | 'designation' | 'staff_code'>;
  outlet?: Pick<Outlet, 'id' | 'name'>;
}

export interface DashboardStats {
  totalStaff: number;
  clockedInToday: number;
  noShowToday: number;
  blockedToday: number;
}

export interface TrendPoint {
  shift_date: string;
  on_time_count: number;
}

export interface Shift {
  id: number;
  user_id: number;
  outlet_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  label: string | null;
  user?: Pick<StaffUser, 'id' | 'name' | 'staff_code'>;
  outlet?: Pick<Outlet, 'id' | 'name'>;
}

export interface TimesheetRow {
  user_id: number;
  name: string;
  staff_code: string | null;
  shift_date: string;
  scheduled_start: string;
  scheduled_end: string;
  scheduled_hours: number;
  clock_in_at: string | null;
  clock_out_at: string | null;
  worked_hours: number | null;
  late_minutes: number;
  overtime_hours: number;
  status: AttendanceStatus | 'no_show';
}

export interface Advance {
  id: number;
  amount: number;
  note: string | null;
  given_at: string;
}

export interface PayrollMonthRow {
  month: string;
  base_pay: number;
  present_days: number | null;
  advances_total: number;
  due: number;
}

export interface PayrollHistory {
  staff: { id: number; name: string; staff_code: string | null; pay_type: PayType | null; pay_rate: number };
  advances: Advance[];
  totals: { advances_total: number; base_pay_total: number; due_total: number };
  months: PayrollMonthRow[];
}

export interface PayrollRow {
  user_id: number;
  name: string;
  staff_code: string | null;
  outlet: Pick<Outlet, 'id' | 'name'> | null;
  pay_type: PayType | null;
  pay_rate: number;
  present_days: number | null;
  base_pay: number;
  advances_total: number;
  due: number;
  advances: Advance[];
}

export interface Visitor {
  id: number;
  outlet_id: number;
  name: string;
  purpose: string;
  host_user_id: number | null;
  check_in_at: string;
  check_out_at: string | null;
  host?: Pick<StaffUser, 'id' | 'name'> | null;
}

export interface VisitorStats {
  today: number;
  onSite: number;
  avgDurationMinutes: number;
}

export type PatrolStatus = 'on_time' | 'late' | 'missed' | 'pending';

export interface PatrolCheckpointStatus {
  id: number;
  name: string;
  sequence: number;
  expected_time: string;
  scanned_at: string | null;
  scanned_by: number | null;
  status: PatrolStatus;
}

export interface Checkpoint {
  id: number;
  outlet_id: number;
  name: string;
  sequence: number;
  expected_time: string;
  qr_token: string;
}

export interface LabourSite {
  id: number;
  name: string;
}

export interface LabourWorkerRow {
  id: number;
  name: string;
  trade: string;
  present_today: boolean;
  days_present_this_month: number;
  days_recorded_this_month: number;
}

export interface FieldVisit {
  id: number;
  user_id: number;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  arrived_at: string;
  departed_at: string | null;
  user?: Pick<StaffUser, 'id' | 'name'>;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: 'clock_in' | 'blocked' | 'streak';
  message: string;
  read_at: string | null;
  created_at: string;
}
