<?php

use App\Http\Middleware\EnsureManager;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['manager' => EnsureManager::class]);
        // API-only app: never redirect guests to a named "login" web route.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') || $e instanceof ValidationException) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }

            if ($e instanceof HttpExceptionInterface) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Request failed',
                ], $e->getStatusCode());
            }

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage(),
            ], 500);
        });
    })->create();
