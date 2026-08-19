<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    /** Roster for a date range (defaults to the current week), optionally filtered to one staff member. */
    public function index(Request $request)
    {
        $from = $request->query('from', now()->startOfWeek()->toDateString());
        $to = $request->query('to', now()->endOfWeek()->toDateString());

        $shifts = Shift::with(['user:id,name,staff_code', 'outlet:id,name'])
            ->whereDate('shift_date', '>=', $from)
            ->whereDate('shift_date', '<=', $to)
            ->when($request->query('user_id'), fn ($q, $userId) => $q->where('user_id', $userId))
            ->orderBy('shift_date')
            ->orderBy('start_time')
            ->get();

        return response()->json(['success' => true, 'shifts' => $shifts]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'outlet_id' => 'required|exists:outlets,id',
            'shift_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'label' => 'nullable|string|max:255',
        ]);

        $shift = Shift::create($data);

        return response()->json(['success' => true, 'shift' => $shift->load(['user:id,name,staff_code', 'outlet:id,name'])], 201);
    }

    public function update(Request $request, Shift $shift)
    {
        $data = $request->validate([
            'shift_date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'label' => 'nullable|string|max:255',
        ]);

        $shift->update($data);

        return response()->json(['success' => true, 'shift' => $shift->load(['user:id,name,staff_code', 'outlet:id,name'])]);
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();

        return response()->json(['success' => true]);
    }
}
