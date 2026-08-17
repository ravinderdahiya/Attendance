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

        $shifts = Shift::whereBetween('shift_date', [$from, $to])
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->get()
            ->groupBy(fn ($s) => $s->user_id.'|'.$s->shift_date->toDateString());

        $attendance = AttendanceRecord::whereBetween('shift_date', [$from, $to])
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
}
