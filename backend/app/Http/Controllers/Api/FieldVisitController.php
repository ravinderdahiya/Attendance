<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FieldVisit;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FieldVisitController extends Controller
{
    public function start(Request $request)
    {
        $data = $request->validate([
            'location_name' => 'required|string|max:255',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $open = FieldVisit::where('user_id', $request->user()->id)->whereNull('departed_at')->first();
        if ($open) {
            throw ValidationException::withMessages(['visit' => "You're still at {$open->location_name} - end that visit first."]);
        }

        $visit = FieldVisit::create([
            'user_id' => $request->user()->id,
            'location_name' => $data['location_name'],
            'latitude' => $data['lat'] ?? null,
            'longitude' => $data['lng'] ?? null,
            'arrived_at' => now(),
        ]);

        return response()->json(['success' => true, 'visit' => $visit], 201);
    }

    public function end(Request $request, FieldVisit $visit)
    {
        if ($visit->user_id !== $request->user()->id) {
            abort(403);
        }

        $visit->update(['departed_at' => now()]);

        return response()->json(['success' => true, 'visit' => $visit]);
    }

    public function today(Request $request)
    {
        $visits = FieldVisit::where('user_id', $request->user()->id)
            ->whereDate('arrived_at', now()->toDateString())
            ->orderBy('arrived_at')
            ->get();

        return response()->json(['success' => true, 'visits' => $visits]);
    }
}
