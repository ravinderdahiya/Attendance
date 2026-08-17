<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use Illuminate\Http\Request;

class OutletController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'outlets' => Outlet::withCount('staff')->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:5000',
        ]);

        $outlet = Outlet::create([...$data, 'is_active' => true]);

        return response()->json(['success' => true, 'outlet' => $outlet], 201);
    }

    public function update(Request $request, Outlet $outlet)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'radius_meters' => 'sometimes|integer|min:10|max:5000',
            'is_active' => 'sometimes|boolean',
        ]);

        $outlet->update($data);

        return response()->json(['success' => true, 'outlet' => $outlet]);
    }
}
