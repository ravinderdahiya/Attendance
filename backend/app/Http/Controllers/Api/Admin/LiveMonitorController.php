<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class LiveMonitorController extends Controller
{
    public function index(Request $request)
    {
        $records = AttendanceRecord::with(['user:id,name,designation,staff_code', 'outlet:id,name'])
            ->whereDate('shift_date', now()->toDateString())
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('clock_in_at')
            ->get();

        return response()->json(['success' => true, 'records' => $records]);
    }
}
