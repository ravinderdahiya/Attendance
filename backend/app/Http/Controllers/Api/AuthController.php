<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const OTP_TTL_MINUTES = 5;

    /** Staff login step 1: issue an OTP to a pre-registered staff mobile number. */
    public function sendOtp(Request $request)
    {
        $data = $request->validate(['mobile' => 'required|string']);

        $user = User::where('mobile', $data['mobile'])->where('role', 'staff')->first();
        if (! $user) {
            throw ValidationException::withMessages(['mobile' => 'No staff account found for this mobile number.']);
        }
        if (! $user->is_active) {
            throw ValidationException::withMessages(['mobile' => 'This account has been deactivated.']);
        }

        $code = config('services.otp.static_bypass') ?: (string) random_int(1000, 9999);

        OtpCode::create([
            'mobile' => $data['mobile'],
            'code' => $code,
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
        ]);

        // No SMS gateway wired up yet - logged so it's visible in dev instead of
        // silently vanishing. Swap for a real SMS send once a provider is chosen.
        Log::info('ShiftTrack OTP issued', ['mobile' => $data['mobile'], 'code' => $code]);

        return response()->json(['success' => true, 'message' => 'OTP sent']);
    }

    /** Staff login step 2: verify the OTP and issue a Sanctum token. */
    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'mobile' => 'required|string',
            'code' => 'required|string',
        ]);

        $otp = OtpCode::where('mobile', $data['mobile'])
            ->where('code', $data['code'])
            ->whereNull('consumed_at')
            ->where('expires_at', '>=', now())
            ->latest('id')
            ->first();

        if (! $otp) {
            throw ValidationException::withMessages(['code' => 'Invalid or expired OTP.']);
        }

        $otp->update(['consumed_at' => now()]);

        $user = User::where('mobile', $data['mobile'])->where('role', 'staff')->firstOrFail();
        $token = $user->createToken('staff-app')->plainTextToken;

        return response()->json(['success' => true, 'token' => $token, 'user' => $user->load('outlet')]);
    }

    /** Manager/admin login via username + password. */
    public function managerLogin(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $data['username'])->where('role', 'manager')->first();
        if (! $user || ! $user->password || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['username' => 'Invalid credentials.']);
        }
        if (! $user->is_active) {
            throw ValidationException::withMessages(['username' => 'This account has been deactivated.']);
        }

        $token = $user->createToken('manager-panel')->plainTextToken;

        return response()->json(['success' => true, 'token' => $token, 'user' => $user]);
    }

    public function me(Request $request)
    {
        return response()->json(['success' => true, 'user' => $request->user()->load('outlet')]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true]);
    }
}
