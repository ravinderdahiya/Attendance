<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $staff = User::where('role', 'staff')
            ->with('outlet')
            ->when($request->query('search'), fn ($q, $search) => $q->where(
                fn ($q) => $q->where('name', 'ilike', "%{$search}%")->orWhere('staff_code', 'ilike', "%{$search}%")
            ))
            ->when($request->query('department'), fn ($q, $dept) => $q->where('department', $dept))
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'staff' => $staff]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:users,mobile',
            // The PIN is how this mobile number logs into the staff app - only
            // the admin sets it, so only an admin-registered number+PIN pair works.
            'pin' => 'required|digits:4',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'outlet_id' => 'required|exists:outlets,id',
            'pay_type' => 'required|in:monthly,daily',
            'pay_rate' => 'required|numeric|min:0',
        ]);

        $staff = User::create([
            ...Arr::except($data, ['pin']),
            'staff_code' => $this->nextStaffCode(),
            'password' => $data['pin'], // hashed automatically by the model's 'hashed' cast
            'role' => 'staff',
            'is_active' => true,
        ]);

        return response()->json(['success' => true, 'staff' => $staff->load('outlet')], 201);
    }

    /** Next sequential "STF-xxxx" code, continuing from whatever the highest one so far is. */
    private function nextStaffCode(): string
    {
        $highest = User::where('staff_code', 'like', 'STF-%')
            ->get()
            ->map(fn (User $u) => (int) substr($u->staff_code, 4))
            ->max();

        return 'STF-' . str_pad((string) (($highest ?? 1000) + 1), 4, '0', STR_PAD_LEFT);
    }

    public function update(Request $request, User $staff)
    {
        abort_unless($staff->role === 'staff', 404);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'mobile' => ['sometimes', 'string', "unique:users,mobile,{$staff->id}"],
            'staff_code' => ['sometimes', 'string', "unique:users,staff_code,{$staff->id}"],
            // Optional here - only reset the login PIN when the admin actually types a new one.
            'pin' => 'sometimes|digits:4',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'outlet_id' => 'sometimes|exists:outlets,id',
            'is_active' => 'sometimes|boolean',
            'pay_type' => 'sometimes|in:monthly,daily',
            'pay_rate' => 'sometimes|numeric|min:0',
        ]);

        if (isset($data['pin'])) {
            $data['password'] = $data['pin'];
        }
        unset($data['pin']);

        $staff->update($data);

        return response()->json(['success' => true, 'staff' => $staff->load('outlet')]);
    }

    public function destroy(User $staff)
    {
        abort_unless($staff->role === 'staff', 404);
        $staff->delete();

        return response()->json(['success' => true]);
    }
}
