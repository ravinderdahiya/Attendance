<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OutletQrCode;
use Illuminate\Http\Request;

class OutletQrCodeController extends Controller
{
    public function index(Request $request)
    {
        $codes = OutletQrCode::with('outlet:id,name')
            ->when($request->query('outlet_id'), fn ($q, $id) => $q->where('outlet_id', $id))
            ->orderByDesc('scan_count')
            ->get();

        return response()->json(['success' => true, 'codes' => $codes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
            'label' => 'required|string|max:255',
        ]);

        $code = OutletQrCode::create($data);

        return response()->json(['success' => true, 'code' => $code->load('outlet:id,name')], 201);
    }

    public function regenerate(OutletQrCode $code)
    {
        $code->regenerateToken();

        return response()->json(['success' => true, 'code' => $code]);
    }

    public function toggle(OutletQrCode $code)
    {
        $code->update(['is_active' => ! $code->is_active]);

        return response()->json(['success' => true, 'code' => $code]);
    }
}
