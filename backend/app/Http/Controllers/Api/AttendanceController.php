<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Shift;
use App\Models\ShiftNotification;
use App\Support\Geo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    // Matches the admin timesheet's late-arrival grace window.
    private const LATE_GRACE_MINUTES = 10;

    /** Today's attendance status for the logged-in staff member's dashboard card. */
    public function today(Request $request)
    {
        $record = AttendanceRecord::where('user_id', $request->user()->id)
            ->whereDate('shift_date', now()->toDateString())
            ->first();

        return response()->json(['success' => true, 'record' => $record]);
    }

    public function history(Request $request)
    {
        $records = AttendanceRecord::where('user_id', $request->user()->id)
            ->orderByDesc('shift_date')
            ->paginate(20);

        return response()->json(['success' => true, 'records' => $records]);
    }

    /** Per-day status for one calendar month, for the staff app's calendar screen. */
    public function calendar(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $start = Carbon::parse("{$month}-01")->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $records = AttendanceRecord::where('user_id', $request->user()->id)
            ->whereDate('shift_date', '>=', $start->toDateString())
            ->whereDate('shift_date', '<=', $end->toDateString())
            ->get()
            ->keyBy(fn ($r) => $r->shift_date->toDateString());

        $days = [];
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $key = $date->toDateString();
            $record = $records->get($key);
            if ($record) {
                $days[$key] = $record->status;
            } elseif ($date->lt(now()->startOfDay())) {
                $days[$key] = 'no_show';
            }
            // Today (still in progress) and future days are simply omitted.
        }

        return response()->json(['success' => true, 'days' => $days]);
    }

    /**
     * Present/absent/late counts for the current calendar month, for the
     * staff app's home screen ("Your current month status" cards).
     */
    public function monthlyStatus(Request $request)
    {
        $userId = $request->user()->id;
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        $shifts = Shift::where('user_id', $userId)
            ->whereDate('shift_date', '>=', $start)
            ->whereDate('shift_date', '<=', $end)
            ->get()
            ->keyBy(fn ($s) => $s->shift_date->toDateString());

        $attendance = AttendanceRecord::where('user_id', $userId)
            ->whereDate('shift_date', '>=', $start)
            ->whereDate('shift_date', '<=', $end)
            ->get();
        $attendanceByDate = $attendance->keyBy(fn ($a) => $a->shift_date->toDateString());

        // Present = any day this month with a genuine on-site clock-in - counted
        // from actual attendance, whether or not a shift happened to be
        // scheduled for that day (a punch-in should always count as showing up).
        $present = $attendance->where('status', 'on_time')->whereNotNull('clock_in_at')->count();

        // Late only makes sense against a scheduled start time, so it's still
        // computed per shift day.
        $late = 0;
        foreach ($shifts as $date => $shift) {
            $record = $attendanceByDate->get($date);
            if ($record?->status === 'on_time' && $record->clock_in_at) {
                $shiftStart = Carbon::parse($date.' '.$shift->start_time);
                if ($record->clock_in_at->gt($shiftStart)
                    && $shiftStart->diffInMinutes($record->clock_in_at) > self::LATE_GRACE_MINUTES) {
                    $late++;
                }
            }
        }

        // Absent = scheduled shift day, already past, never clocked in at all -
        // can't be "absent" from a day nothing was scheduled.
        $absent = 0;
        foreach ($shifts as $date => $shift) {
            $record = $attendanceByDate->get($date);
            if (! $record?->clock_in_at && Carbon::parse($date)->lt(now()->startOfDay())) {
                $absent++;
            }
        }

        return response()->json(['success' => true, 'present' => $present, 'absent' => $absent, 'late' => $late]);
    }

    /** On-time rate, weekly pattern, and shift counts for the staff app's analytics screen. */
    public function analytics(Request $request)
    {
        $userId = $request->user()->id;
        $since = now()->subDays(29)->toDateString();

        $records = AttendanceRecord::where('user_id', $userId)
            ->whereDate('shift_date', '>=', $since)
            ->get();

        $withOutcome = $records->whereIn('status', ['on_time', 'blocked']);
        $onTimeRate = $withOutcome->isEmpty() ? 0 : (int) round($records->where('status', 'on_time')->count() / $withOutcome->count() * 100);

        $weeklyPattern = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $weeklyPattern[] = [
                'date' => $date->toDateString(),
                'clockedIn' => $records->firstWhere('shift_date', $date->toDateString())?->clock_in_at !== null,
            ];
        }

        return response()->json([
            'success' => true,
            'onTimeRatePercent' => $onTimeRate,
            'totalShifts' => $records->count(),
            'noShowCount' => $records->where('status', 'blocked')->count(),
            'weeklyPattern' => $weeklyPattern,
        ]);
    }

    /** GPS-based clock-in - the only way to mark attendance, always geofenced. */
    public function clockIn(Request $request)
    {
        $data = $this->validateProof($request);

        $user = $request->user();
        $outlet = $user->outlet;
        if (! $outlet) {
            throw ValidationException::withMessages(['outlet' => 'No outlet assigned to this account - contact your manager.']);
        }

        // occurred_at lets an offline-queued clock-in report when it actually
        // happened on the device, rather than when the sync request reached
        // the server - shift_date follows suit so it lands on the right day.
        $occurredAt = isset($data['occurred_at']) ? Carbon::parse($data['occurred_at']) : now();
        $syncedOffline = isset($data['occurred_at']);

        $distance = Geo::distanceMeters($data['lat'], $data['lng'], $outlet->latitude, $outlet->longitude);
        $status = $distance <= $outlet->radius_meters ? 'on_time' : 'blocked';

        $attributes = [
            'outlet_id' => $outlet->id,
            'clock_in_at' => $occurredAt,
            'clock_in_lat' => $data['lat'],
            'clock_in_lng' => $data['lng'],
            'clock_in_distance_m' => $distance,
            'status' => $status,
            'clock_in_method' => 'gps',
            'clock_in_photo' => $this->storePhoto($request),
            // Reopen the day - a fresh clock-in supersedes any earlier
            // clock-out on the same day (e.g. re-clocking in after a
            // break), otherwise the stale clock-out would outlive this
            // new session and read as "already clocked out" again.
            'clock_out_at' => null,
            'clock_out_lat' => null,
            'clock_out_lng' => null,
            'clock_out_method' => null,
            'clock_out_photo' => null,
            'clock_out_distance_m' => null,
            'synced_offline' => $syncedOffline,
        ];

        // Not updateOrCreate() - its match array compares shift_date with a
        // plain equality, but the column is stored with a time component, so
        // it would never find today's existing row and try to insert a
        // second one (colliding with the user_id+shift_date unique index).
        $record = AttendanceRecord::where('user_id', $user->id)
            ->whereDate('shift_date', $occurredAt->toDateString())
            ->first();
        if ($record) {
            $record->update($attributes);
        } else {
            $record = AttendanceRecord::create([
                'user_id' => $user->id,
                'shift_date' => $occurredAt->toDateString(),
                ...$attributes,
            ]);
        }

        $message = $status === 'on_time'
            ? 'Clocked in for your shift - verified on-site'
            : "Clock-in blocked - you were {$distance}m from the outlet";
        ShiftNotification::notify($user->id, $status === 'on_time' ? 'clock_in' : 'blocked', $message);

        return response()->json([
            'success' => $status === 'on_time',
            'message' => $status === 'on_time'
                ? 'Clocked in'
                : "You're {$distance}m from the outlet - outside the {$outlet->radius_meters}m radius.",
            'record' => $record,
        ], $status === 'on_time' ? 200 : 422);
    }

    public function clockOut(Request $request)
    {
        $data = $this->validateProof($request);

        $user = $request->user();
        $outlet = $user->outlet;
        if (! $outlet) {
            throw ValidationException::withMessages(['outlet' => 'No outlet assigned to this account - contact your manager.']);
        }

        $occurredAt = isset($data['occurred_at']) ? Carbon::parse($data['occurred_at']) : now();
        $syncedOffline = isset($data['occurred_at']);

        $record = AttendanceRecord::where('user_id', $user->id)
            ->whereDate('shift_date', $occurredAt->toDateString())
            ->whereNotNull('clock_in_at')
            ->whereNull('clock_out_at')
            ->first();

        if (! $record) {
            throw ValidationException::withMessages(['record' => 'No open clock-in found for that day.']);
        }

        // Same 100m geofence as clock-in - staff must still be on-site to
        // clock out, not just to clock in.
        $distance = Geo::distanceMeters($data['lat'], $data['lng'], $outlet->latitude, $outlet->longitude);
        if ($distance > $outlet->radius_meters) {
            return response()->json([
                'success' => false,
                'message' => "You're {$distance}m from the outlet - outside the {$outlet->radius_meters}m radius.",
            ], 422);
        }

        $record->update([
            'clock_out_at' => $occurredAt,
            'clock_out_lat' => $data['lat'],
            'clock_out_lng' => $data['lng'],
            'clock_out_distance_m' => $distance,
            'clock_out_method' => 'gps',
            'clock_out_photo' => $this->storePhoto($request),
            'synced_offline' => $record->synced_offline || $syncedOffline,
        ]);

        return response()->json(['success' => true, 'message' => 'Clocked out', 'record' => $record]);
    }

    private function validateProof(Request $request): array
    {
        return $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'occurred_at' => 'nullable|date',
            // A live selfie proving physical presence, alongside the GPS check -
            // captured on-device even for an offline-queued event, then synced
            // together with it once connectivity returns.
            'photo' => 'required|image|max:5120',
        ]);
    }

    /** Stores the uploaded selfie (if any) under storage/app/public and returns its relative path. */
    private function storePhoto(Request $request): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('attendance-photos', 'public') : null;
    }
}
