<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TimesheetController extends Controller
{
    // Clock-in later than (shift start + this) counts as late.
    private const LATE_GRACE_MINUTES = 10;

    public function index(Request $request)
    {
        $from = $request->query('from', now()->startOfWeek()->toDateString());
        $to = $request->query('to', now()->endOfWeek()->toDateString());
        $userId = $request->query('user_id');

        $shifts = Shift::whereDate('shift_date', '>=', $from)
            ->whereDate('shift_date', '<=', $to)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->get()
            ->groupBy(fn ($s) => $s->user_id.'|'.$s->shift_date->toDateString());

        $attendance = AttendanceRecord::whereDate('shift_date', '>=', $from)
            ->whereDate('shift_date', '<=', $to)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->get()
            ->keyBy(fn ($a) => $a->user_id.'|'.$a->shift_date->toDateString());

        $staff = User::where('role', 'staff')
            ->when($userId, fn ($q) => $q->where('id', $userId))
            ->get(['id', 'name', 'staff_code']);

        $rows = [];
        foreach ($shifts as $key => $dayShifts) {
            [$uid, $date] = explode('|', $key);
            $person = $staff->firstWhere('id', (int) $uid);
            if (! $person) {
                continue;
            }

            $record = $attendance->get($key);
            $scheduledStart = $dayShifts->min('start_time');
            $scheduledEnd = $dayShifts->max('end_time');
            $scheduledHours = $dayShifts->sum(fn ($s) => Carbon::parse($s->start_time)->diffInMinutes(Carbon::parse($s->end_time)) / 60);

            $workedHours = null;
            $lateMinutes = 0;
            $overtimeHours = 0;
            $status = 'no_show';

            if ($record?->clock_in_at) {
                $status = $record->status;
                $shiftStart = Carbon::parse($date.' '.$scheduledStart);
                if ($record->clock_in_at->gt($shiftStart)) {
                    $lateMinutes = max(0, $shiftStart->diffInMinutes($record->clock_in_at) - self::LATE_GRACE_MINUTES);
                }

                if ($record->clock_out_at) {
                    $workedHours = round($record->clock_in_at->diffInMinutes($record->clock_out_at) / 60, 2);
                    $overtimeHours = max(0, round($workedHours - $scheduledHours, 2));
                }
            }

            $rows[] = [
                'user_id' => (int) $uid,
                'name' => $person->name,
                'staff_code' => $person->staff_code,
                'shift_date' => $date,
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'scheduled_hours' => round($scheduledHours, 2),
                'clock_in_at' => $record?->clock_in_at,
                'clock_out_at' => $record?->clock_out_at,
                'worked_hours' => $workedHours,
                'late_minutes' => $lateMinutes,
                'overtime_hours' => $overtimeHours,
                'status' => $status,
            ];
        }

        usort($rows, fn ($a, $b) => [$a['shift_date'], $a['name']] <=> [$b['shift_date'], $b['name']]);

        return response()->json(['success' => true, 'rows' => $rows]);
    }

    /**
     * Per-employee attendance record for one calendar month - scheduled vs present
     * vs leave (no-show on a scheduled day), late count, worked/overtime hours.
     * This is the "how many leaves did X take this month" report.
     */
    public function monthlySummary(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $start = Carbon::parse("{$month}-01")->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $shifts = Shift::whereDate('shift_date', '>=', $start)
            ->whereDate('shift_date', '<=', $end)
            ->get()
            ->groupBy(fn ($s) => $s->user_id.'|'.$s->shift_date->toDateString());

        $attendance = AttendanceRecord::whereDate('shift_date', '>=', $start)
            ->whereDate('shift_date', '<=', $end)
            ->get()
            ->keyBy(fn ($a) => $a->user_id.'|'.$a->shift_date->toDateString());

        $staff = User::where('role', 'staff')->orderBy('name')->get(['id', 'name', 'staff_code', 'designation']);

        $rows = [];
        foreach ($staff as $person) {
            $personShiftKeys = $shifts->keys()->filter(fn ($k) => explode('|', $k)[0] === (string) $person->id);
            if ($personShiftKeys->isEmpty()) {
                continue;
            }

            $scheduledDays = 0;
            $presentDays = 0;
            $leaveDays = 0;
            $lateDays = 0;
            $workedHours = 0.0;
            $overtimeHours = 0.0;

            foreach ($personShiftKeys as $key) {
                [, $date] = explode('|', $key);
                $dayShifts = $shifts->get($key);
                $record = $attendance->get($key);
                $scheduledStart = $dayShifts->min('start_time');
                $scheduledHoursForDay = $dayShifts->sum(
                    fn ($s) => Carbon::parse($s->start_time)->diffInMinutes(Carbon::parse($s->end_time)) / 60
                );

                $scheduledDays++;

                if ($record?->clock_in_at) {
                    $presentDays++;
                    $shiftStart = Carbon::parse($date.' '.$scheduledStart);
                    if ($record->clock_in_at->gt($shiftStart)
                        && $shiftStart->diffInMinutes($record->clock_in_at) > self::LATE_GRACE_MINUTES) {
                        $lateDays++;
                    }
                    if ($record->clock_out_at) {
                        $hours = $record->clock_in_at->diffInMinutes($record->clock_out_at) / 60;
                        $workedHours += $hours;
                        $overtimeHours += max(0, $hours - $scheduledHoursForDay);
                    }
                } elseif (Carbon::parse($date)->lt(now()->startOfDay())) {
                    // Scheduled, day has passed, never clocked in - counts as a leave/absence.
                    $leaveDays++;
                }
            }

            $rows[] = [
                'user_id' => $person->id,
                'name' => $person->name,
                'staff_code' => $person->staff_code,
                'designation' => $person->designation,
                'scheduled_days' => $scheduledDays,
                'present_days' => $presentDays,
                'leave_days' => $leaveDays,
                'late_days' => $lateDays,
                'worked_hours' => round($workedHours, 2),
                'overtime_hours' => round($overtimeHours, 2),
            ];
        }

        usort($rows, fn ($a, $b) => $a['name'] <=> $b['name']);

        return response()->json(['success' => true, 'month' => $month, 'rows' => $rows]);
    }
}
