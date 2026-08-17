<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldVisit;
use Illuminate\Http\Request;

class FieldVisitController extends Controller
{
    /** One staff member's ordered route for a given day. */
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $visits = FieldVisit::with('user:id,name')
            ->where('user_id', $request->query('user_id'))
            ->whereDate('arrived_at', $date)
            ->orderBy('arrived_at')
            ->get();

        return response()->json(['success' => true, 'visits' => $visits]);
    }
}
