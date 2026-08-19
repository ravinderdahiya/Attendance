<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\PatrolLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ScanController extends Controller
{
    /**
     * Scans a printed security-patrol checkpoint QR code and logs the visit.
     * Attendance is no longer marked by QR - only GPS geofencing (see
     * AttendanceController) counts as proof of presence for clock-in/out.
     */
    public function scan(Request $request)
    {
        $data = $request->validate([
            'qr_token' => 'required|string',
            'occurred_at' => 'nullable|date',
        ]);

        $user = $request->user();
        $occurredAt = isset($data['occurred_at']) ? Carbon::parse($data['occurred_at']) : now();

        $checkpoint = Checkpoint::where('qr_token', $data['qr_token'])->first();
        if ($checkpoint) {
            $log = PatrolLog::updateOrCreate(
                ['checkpoint_id' => $checkpoint->id, 'user_id' => $user->id, 'patrol_date' => $occurredAt->toDateString()],
                ['scanned_at' => $occurredAt],
            );

            return response()->json([
                'success' => true,
                'type' => 'patrol',
                'message' => "Checkpoint '{$checkpoint->name}' logged",
                'checkpoint' => $checkpoint,
                'log' => $log,
            ]);
        }

        throw ValidationException::withMessages(['qr_token' => 'This QR code is not recognized.']);
    }
}
