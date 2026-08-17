<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Checkpoint;
use App\Models\OutletQrCode;
use App\Models\PatrolLog;
use App\Models\ShiftNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ScanController extends Controller
{
    /**
     * One scan endpoint for every printed QR code in the building - the
     * staff app doesn't need to know in advance whether a code is an
     * entrance (attendance) or a patrol checkpoint; this looks the token up
     * across both and reacts accordingly. Scanning the same entrance code
     * again toggles clock-in/out, the way a real attendance kiosk works.
     */
    public function scan(Request $request)
    {
        $data = $request->validate([
            'qr_token' => 'required|string',
            'occurred_at' => 'nullable|date',
        ]);

        $user = $request->user();
        $outlet = $user->outlet;
        $occurredAt = isset($data['occurred_at']) ? Carbon::parse($data['occurred_at']) : now();

        $entranceCode = OutletQrCode::where('token', $data['qr_token'])->where('is_active', true)->first();
        if ($entranceCode) {
            if (! $outlet || $entranceCode->outlet_id !== $outlet->id) {
                throw ValidationException::withMessages(['qr_token' => "This code belongs to a different outlet than yours."]);
            }

            $entranceCode->recordScan();

            $openRecord = AttendanceRecord::where('user_id', $user->id)
                ->where('shift_date', $occurredAt->toDateString())
                ->whereNotNull('clock_in_at')
                ->whereNull('clock_out_at')
                ->first();

            if ($openRecord) {
                $openRecord->update(['clock_out_at' => $occurredAt, 'clock_out_method' => 'qr']);

                return response()->json(['success' => true, 'type' => 'attendance', 'action' => 'clock_out', 'message' => 'Clocked out', 'record' => $openRecord]);
            }

            $record = AttendanceRecord::updateOrCreate(
                ['user_id' => $user->id, 'shift_date' => $occurredAt->toDateString()],
                [
                    'outlet_id' => $outlet->id,
                    'clock_in_at' => $occurredAt,
                    'clock_in_lat' => null,
                    'clock_in_lng' => null,
                    'clock_in_distance_m' => null,
                    'status' => 'on_time',
                    'clock_in_method' => 'qr',
                    'clock_out_at' => null,
                    'clock_out_lat' => null,
                    'clock_out_lng' => null,
                    'clock_out_method' => null,
                    'synced_offline' => isset($data['occurred_at']),
                ],
            );

            ShiftNotification::notify($user->id, 'clock_in', 'Clocked in via QR code - verified on-site');

            return response()->json(['success' => true, 'type' => 'attendance', 'action' => 'clock_in', 'message' => 'Clocked in', 'record' => $record]);
        }

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
