<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    /** The logged-in staff member's shifts for today, matching the dashboard's "Today's shift" section. */
    public function today(Request $request)
    {
        $shifts = Shift::where('user_id', $request->user()->id)
            ->where('shift_date', now()->toDateString())
            ->orderBy('start_time')
            ->get();

        return response()->json(['success' => true, 'shifts' => $shifts]);
    }
}
