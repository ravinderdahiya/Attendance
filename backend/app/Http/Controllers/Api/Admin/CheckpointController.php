<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use Illuminate\Http\Request;

class CheckpointController extends Controller
{
    public function index(Request $request)
    {
        $checkpoints = Checkpoint::where('outlet_id', $request->query('outlet_id'))
            ->orderBy('sequence')
            ->get();

        return response()->json(['success' => true, 'checkpoints' => $checkpoints]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
            'name' => 'required|string|max:255',
            'sequence' => 'required|integer|min:0',
            'expected_time' => 'required|date_format:H:i',
        ]);

        $checkpoint = Checkpoint::create($data);

        return response()->json(['success' => true, 'checkpoint' => $checkpoint], 201);
    }

    public function destroy(Checkpoint $checkpoint)
    {
        $checkpoint->delete();

        return response()->json(['success' => true]);
    }
}
