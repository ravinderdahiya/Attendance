<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $visitors = Visitor::with('host:id,name')
            ->whereDate('check_in_at', $date)
            ->orderByDesc('check_in_at')
            ->get();

        $onSite = $visitors->whereNull('check_out_at');
        $durations = $visitors->whereNotNull('check_out_at')
            ->map(fn ($v) => $v->check_in_at->diffInMinutes($v->check_out_at));

        return response()->json([
            'success' => true,
            'visitors' => $visitors,
            'stats' => [
                'today' => $visitors->count(),
                'onSite' => $onSite->count(),
                'avgDurationMinutes' => $durations->isEmpty() ? 0 : (int) round($durations->avg()),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
            'name' => 'required|string|max:255',
            'purpose' => 'required|string|max:255',
            'host_user_id' => 'nullable|exists:users,id',
        ]);

        $visitor = Visitor::create([...$data, 'check_in_at' => now()]);

        return response()->json(['success' => true, 'visitor' => $visitor->load('host:id,name')], 201);
    }

    public function checkOut(Visitor $visitor)
    {
        $visitor->update(['check_out_at' => now()]);

        return response()->json(['success' => true, 'visitor' => $visitor]);
    }
}
