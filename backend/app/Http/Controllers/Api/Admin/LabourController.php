<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LabourAttendance;
use App\Models\LabourSite;
use App\Models\LabourWorker;
use Illuminate\Http\Request;

class LabourController extends Controller
{
    public function sites()
    {
        return response()->json(['success' => true, 'sites' => LabourSite::orderBy('name')->get()]);
    }

    public function storeSite(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);
        $site = LabourSite::create($data);

        return response()->json(['success' => true, 'site' => $site], 201);
    }

    public function storeWorker(Request $request)
    {
        $data = $request->validate([
            'site_id' => 'required|exists:labour_sites,id',
            'name' => 'required|string|max:255',
            'trade' => 'required|string|max:255',
        ]);
        $worker = LabourWorker::create($data);

        return response()->json(['success' => true, 'worker' => $worker], 201);
    }

    /** Today's (or a given date's) roster for one site, with each worker's month-to-date attendance rate. */
    public function attendance(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $siteId = $request->query('site_id');
        $monthStart = now()->startOfMonth()->toDateString();

        $workers = LabourWorker::where('site_id', $siteId)
            ->with(['attendance' => fn ($q) => $q->where('attendance_date', $date)])
            ->get()
            ->map(function (LabourWorker $worker) use ($date, $monthStart) {
                $monthRecords = LabourAttendance::where('worker_id', $worker->id)
                    ->whereBetween('attendance_date', [$monthStart, $date])
                    ->get();

                return [
                    'id' => $worker->id,
                    'name' => $worker->name,
                    'trade' => $worker->trade,
                    'present_today' => $worker->attendance->first()?->present ?? false,
                    'days_present_this_month' => $monthRecords->where('present', true)->count(),
                    'days_recorded_this_month' => $monthRecords->count(),
                ];
            });

        return response()->json(['success' => true, 'date' => $date, 'workers' => $workers]);
    }

    /** Bulk save: [{worker_id, present}, ...] for a given date. */
    public function saveAttendance(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'entries' => 'required|array',
            'entries.*.worker_id' => 'required|exists:labour_workers,id',
            'entries.*.present' => 'required|boolean',
        ]);

        foreach ($data['entries'] as $entry) {
            LabourAttendance::updateOrCreate(
                ['worker_id' => $entry['worker_id'], 'attendance_date' => $data['date']],
                ['present' => $entry['present']],
            );
        }

        return response()->json(['success' => true]);
    }
}
