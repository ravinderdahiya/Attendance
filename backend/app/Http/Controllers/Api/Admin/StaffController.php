<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
            'staff_code' => 'required|string|unique:users,staff_code',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'outlet_id' => 'required|exists:outlets,id',
        ]);

        $staff = User::create([...$data, 'role' => 'staff', 'is_active' => true]);

        return response()->json(['success' => true, 'staff' => $staff->load('outlet')], 201);
    }

    public function update(Request $request, User $staff)
    {
        abort_unless($staff->role === 'staff', 404);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'mobile' => ['sometimes', 'string', "unique:users,mobile,{$staff->id}"],
            'staff_code' => ['sometimes', 'string', "unique:users,staff_code,{$staff->id}"],
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'outlet_id' => 'sometimes|exists:outlets,id',
            'is_active' => 'sometimes|boolean',
        ]);

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
