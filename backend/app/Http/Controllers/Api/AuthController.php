<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Staff login: mobile number (admin-registered) + 4-digit PIN (admin-set). */
    public function staffLogin(Request $request)
    {
        $data = $request->validate([
            'mobile' => 'required|string',
            'pin' => 'required|string',
        ]);

        $user = User::where('mobile', $data['mobile'])->where('role', 'staff')->first();
        if (! $user || ! $user->password || ! Hash::check($data['pin'], $user->password)) {
            throw ValidationException::withMessages(['mobile' => 'Invalid mobile number or PIN.']);
        }
        if (! $user->is_active) {
            throw ValidationException::withMessages(['mobile' => 'This account has been deactivated.']);
        }

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
