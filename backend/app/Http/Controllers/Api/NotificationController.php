<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShiftNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = ShiftNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'notifications' => $notifications]);
    }

    public function markRead(Request $request, ShiftNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
