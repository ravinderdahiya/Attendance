<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FaceController extends Controller
{
    /**
     * Enrolls (or re-enrolls) the logged-in staff member's reference face.
     * The embedding is computed on-device (ML Kit + a bundled TFLite model) -
     * this endpoint just stores it so punch-time matching can run locally
     * without a network round-trip, and so a reinstalled app can resync via
     * reference() instead of asking the staff member to re-enroll.
     */
    public function enroll(Request $request)
    {
        $data = $request->validate([
            'photo' => 'required|image|max:5120',
            'embedding' => 'required|array|min:10',
            'embedding.*' => 'numeric',
        ]);

        $user = $request->user();
        $user->update([
            'face_embedding' => $data['embedding'],
            'face_reference_photo' => $request->file('photo')->store('face-reference', 'public'),
            'face_enrolled_at' => now(),
        ]);

        return response()->json(['success' => true, 'user' => $user]);
    }

    /** Lets a reinstalled app resync its local embedding cache without re-enrolling. */
    public function reference(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'enrolled' => $user->face_enrolled,
            'embedding' => $user->face_embedding,
            'photo_url' => $user->face_reference_photo_url,
            'enrolled_at' => $user->face_enrolled_at,
        ]);
    }
}
