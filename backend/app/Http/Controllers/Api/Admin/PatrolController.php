<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatrolController extends Controller
{
    // A scan later than expected_time + this many minutes still counts, but
    // shows as late rather than on-time.
    private const LATE_GRACE_MINUTES = 5;

    /** Tonight's route for one guard: every checkpoint at this outlet, with its scan status. */
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $userId = $request->query('user_id');

        $checkpoints = Checkpoint::with(['patrolLogs' => function ($q) use ($date, $userId) {
            $q->where('patrol_date', $date)->when($userId, fn ($q) => $q->where('user_id', $userId));
        }])
            ->where('outlet_id', $request->query('outlet_id'))
            ->orderBy('sequence')
            ->get()
            ->map(function (Checkpoint $checkpoint) use ($date) {
                $log = $checkpoint->patrolLogs->first();
                $expectedAt = Carbon::parse("{$date} {$checkpoint->expected_time}");

                if ($log?->scanned_at) {
                    $status = $log->scanned_at->gt($expectedAt->copy()->addMinutes(self::LATE_GRACE_MINUTES)) ? 'late' : 'on_time';
                } elseif (now()->gt($expectedAt->copy()->addMinutes(self::LATE_GRACE_MINUTES))) {
                    $status = 'missed';
                } else {
                    $status = 'pending';
                }

                return [
                    'id' => $checkpoint->id,
                    'name' => $checkpoint->name,
                    'sequence' => $checkpoint->sequence,
                    'expected_time' => $checkpoint->expected_time,
                    'scanned_at' => $log?->scanned_at,
                    'scanned_by' => $log?->user_id,
                    'status' => $status,
                ];
            });

        return response()->json(['success' => true, 'checkpoints' => $checkpoints]);
    }
}
