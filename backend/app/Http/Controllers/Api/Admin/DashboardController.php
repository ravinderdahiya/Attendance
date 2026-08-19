<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();

        $totalStaff = User::where('role', 'staff')->where('is_active', true)->count();
        $todayRecords = AttendanceRecord::whereDate('shift_date', $today)->get();

        $clockedIn = $todayRecords->where('status', 'on_time')->count();
        $blocked = $todayRecords->where('status', 'blocked')->count();
        $noShow = max(0, $totalStaff - $todayRecords->pluck('user_id')->unique()->count());

        // Last 14 days on-time count, for the trend bar chart.
        $trendStart = now()->subDays(13)->toDateString();
        $trend = AttendanceRecord::selectRaw('shift_date, count(*) filter (where status = \'on_time\') as on_time_count')
            ->whereDate('shift_date', '>=', $trendStart)
            ->whereDate('shift_date', '<=', $today)
            ->groupBy('shift_date')
            ->orderBy('shift_date')
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'totalStaff' => $totalStaff,
                'clockedInToday' => $clockedIn,
                'noShowToday' => $noShow,
                'blockedToday' => $blocked,
            ],
            'trend' => $trend,
        ]);
    }
}
