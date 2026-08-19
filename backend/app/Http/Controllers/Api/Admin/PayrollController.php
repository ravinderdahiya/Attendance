<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advance;
use App\Models\AttendanceRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    /**
     * Month-end payroll: for each staff member, their base pay (fixed
     * monthly, or daily rate x days actually present that month) minus
     * whatever cash advances they were given during the month, leaving
     * what's still owed to them.
     */
    public function index(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $start = Carbon::parse("{$month}-01")->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $staff = User::where('role', 'staff')->where('is_active', true)->with('outlet')->orderBy('name')->get();

        $presentDaysByUser = AttendanceRecord::whereIn('user_id', $staff->pluck('id'))
            ->where('status', 'on_time')
            ->whereDate('shift_date', '>=', $start->toDateString())
            ->whereDate('shift_date', '<=', $end->toDateString())
            ->selectRaw('user_id, count(*) as days')
            ->groupBy('user_id')
            ->pluck('days', 'user_id');

        $advancesByUser = Advance::whereIn('user_id', $staff->pluck('id'))
            ->whereBetween('given_at', [$start->toDateString(), $end->toDateString()])
            ->orderBy('given_at')
            ->get()
            ->groupBy('user_id');

        $rows = $staff->map(function (User $person) use ($presentDaysByUser, $advancesByUser) {
            $presentDays = (int) ($presentDaysByUser[$person->id] ?? 0);
            $rate = (float) ($person->pay_rate ?? 0);
            $basePay = $person->pay_type === 'daily' ? $rate * $presentDays : $rate;

            $advances = ($advancesByUser[$person->id] ?? collect())->values();
            $advancesTotal = (float) $advances->sum('amount');

            return [
                'user_id' => $person->id,
                'name' => $person->name,
                'staff_code' => $person->staff_code,
                'outlet' => $person->outlet ? ['id' => $person->outlet->id, 'name' => $person->outlet->name] : null,
                'pay_type' => $person->pay_type,
                'pay_rate' => $rate,
                'present_days' => $person->pay_type === 'daily' ? $presentDays : null,
                'base_pay' => round($basePay, 2),
                'advances_total' => round($advancesTotal, 2),
                'due' => round($basePay - $advancesTotal, 2),
                'advances' => $advances->map(fn ($a) => [
                    'id' => $a->id,
                    'amount' => (float) $a->amount,
                    'note' => $a->note,
                    'given_at' => $a->given_at->toDateString(),
                ]),
            ];
        });

        return response()->json(['success' => true, 'month' => $start->format('Y-m'), 'rows' => $rows]);
    }

    /**
     * One staff member's full history: every advance they've ever taken, plus
     * a month-by-month base pay / advances / due breakdown from the month
     * they joined up to the current month.
     */
    public function history(User $staff)
    {
        abort_unless($staff->role === 'staff', 404);

        $advances = Advance::where('user_id', $staff->id)->orderByDesc('given_at')->get();
        $rate = (float) ($staff->pay_rate ?? 0);

        $months = [];
        $cursor = $staff->created_at->copy()->startOfMonth();
        $end = now()->startOfMonth();

        while ($cursor <= $end) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd = $cursor->copy()->endOfMonth();

            $presentDays = AttendanceRecord::where('user_id', $staff->id)
                ->where('status', 'on_time')
                ->whereBetween('shift_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->count();

            $basePay = $staff->pay_type === 'daily' ? $rate * $presentDays : $rate;
            $monthAdvancesTotal = (float) $advances
                ->filter(fn (Advance $a) => $a->given_at->between($monthStart, $monthEnd))
                ->sum('amount');

            $months[] = [
                'month' => $monthStart->format('Y-m'),
                'base_pay' => round($basePay, 2),
                'present_days' => $staff->pay_type === 'daily' ? $presentDays : null,
                'advances_total' => round($monthAdvancesTotal, 2),
                'due' => round($basePay - $monthAdvancesTotal, 2),
            ];

            $cursor->addMonth();
        }

        $months = array_reverse($months);

        return response()->json([
            'success' => true,
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'staff_code' => $staff->staff_code,
                'pay_type' => $staff->pay_type,
                'pay_rate' => $rate,
            ],
            'advances' => $advances->map(fn (Advance $a) => [
                'id' => $a->id,
                'amount' => (float) $a->amount,
                'note' => $a->note,
                'given_at' => $a->given_at->toDateString(),
            ]),
            'totals' => [
                'advances_total' => round((float) $advances->sum('amount'), 2),
                'base_pay_total' => round(array_sum(array_column($months, 'base_pay')), 2),
                'due_total' => round(array_sum(array_column($months, 'due')), 2),
            ],
            'months' => $months,
        ]);
    }

    public function storeAdvance(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
            'given_at' => 'nullable|date',
        ]);

        $advance = Advance::create([
            'user_id' => $data['user_id'],
            'amount' => $data['amount'],
            'note' => $data['note'] ?? null,
            'given_at' => $data['given_at'] ?? now()->toDateString(),
        ]);

        return response()->json(['success' => true, 'advance' => $advance], 201);
    }

    public function destroyAdvance(Advance $advance)
    {
        $advance->delete();

        return response()->json(['success' => true]);
    }
}
