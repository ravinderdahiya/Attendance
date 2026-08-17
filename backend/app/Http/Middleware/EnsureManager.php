<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureManager
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'manager') {
            return response()->json(['success' => false, 'message' => 'Managers only'], 403);
        }

        return $next($request);
    }
}
