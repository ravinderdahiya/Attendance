<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\ShiftNotification;
use App\Support\Geo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    /** Today's attendance status for the logged-in staff member's dashboard card. */
    public function today(Request $request)
    {
        $record = AttendanceRecord::where('user_id', $request->user()->id)
            ->where('shift_date', now()->toDateString())
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
            ->whereBetween('shift_date', [$start->toDateString(), $end->toDateString()])
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

    /** On-time rate, weekly pattern, and shift counts for the staff app's analytics screen. */
    public function analytics(Request $request)
    {
        $userId = $request->user()->id;
        $since = now()->subDays(29)->toDateString();

        $records = AttendanceRecord::where('user_id', $userId)
            ->where('shift_date', '>=', $since)
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

    /**
     * GPS-based clock-in. QR-based attendance goes through ScanController
     * instead (one endpoint recognizes both entrance and patrol codes).
     */
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

        $record = AttendanceRecord::updateOrCreate(
            ['user_id' => $user->id, 'shift_date' => $occurredAt->toDateString()],
            [
                'outlet_id' => $outlet->id,
                'clock_in_at' => $occurredAt,
                'clock_in_lat' => $data['lat'],
                'clock_in_lng' => $data['lng'],
                'clock_in_distance_m' => $distance,
                'status' => $status,
                'clock_in_method' => 'gps',
                // Reopen the day - a fresh clock-in supersedes any earlier
                // clock-out on the same day (e.g. re-clocking in after a
                // break), otherwise the stale clock-out would outlive this
                // new session and read as "already clocked out" again.
                'clock_out_at' => null,
                'clock_out_lat' => null,
                'clock_out_lng' => null,
                'clock_out_method' => null,
                'synced_offline' => $syncedOffline,
            ],
        );

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

        $occurredAt = isset($data['occurred_at']) ? Carbon::parse($data['occurred_at']) : now();
        $syncedOffline = isset($data['occurred_at']);

        $record = AttendanceRecord::where('user_id', $request->user()->id)
            ->where('shift_date', $occurredAt->toDateString())
            ->whereNotNull('clock_in_at')
            ->whereNull('clock_out_at')
            ->first();

        if (! $record) {
            throw ValidationException::withMessages(['record' => 'No open clock-in found for that day.']);
        }

        $record->update([
            'clock_out_at' => $occurredAt,
            'clock_out_lat' => $data['lat'],
            'clock_out_lng' => $data['lng'],
            'clock_out_method' => 'gps',
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
        ]);
    }
}
