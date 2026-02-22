<?php

namespace App\Http\Middleware;

use App\Models\AdminLoginAttempt;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        // Проверяем аутентификацию через admin guard
        if (!Auth::guard('admin')->check()) {
            return redirect()->route('admin.login');
        }

        $admin = Auth::guard('admin')->user();

        // Проверяем активность администратора
        if (!$admin->is_active) {
            Auth::guard('admin')->logout();
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Ваш аккаунт деактивирован.']);
        }

        // Проверяем IP whitelist
        if (!$admin->isIpAllowed($request->ip())) {
            Auth::guard('admin')->logout();
            
            // Логируем попытку доступа с неразрешенного IP
            AdminLoginAttempt::recordAttempt(
                $admin->email,
                $request->ip(),
                false,
                'IP not in whitelist'
            );

            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Доступ с вашего IP адреса запрещен.']);
        }

        return $next($request);
    }
}
