<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Проверяем наличие активной подписки
        if (!$user->hasActiveSubscription()) {
            return redirect()->route('subscriptions.index')
                ->with('error', 'Для доступа к этой функции необходима активная подписка');
        }

        return $next($request);
    }
}
