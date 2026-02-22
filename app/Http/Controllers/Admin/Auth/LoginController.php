<?php

namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AdminLoginAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Admin/Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $ip = $request->ip();
        $email = $request->email;

        // Проверяем rate limiting (5 попыток за 15 минут)
        $key = 'admin-login:' . $ip;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            
            AdminLoginAttempt::recordAttempt($email, $ip, false, 'Rate limit exceeded');
            
            return back()->withErrors([
                'email' => "Слишком много попыток входа. Попробуйте через {$seconds} секунд.",
            ]);
        }

        // Проверяем блокировку по email/IP
        if (AdminLoginAttempt::isBlocked($email, $ip)) {
            AdminLoginAttempt::recordAttempt($email, $ip, false, 'Account blocked');
            
            return back()->withErrors([
                'email' => 'Аккаунт временно заблокирован из-за множественных неудачных попыток входа. Попробуйте через 15 минут.',
            ]);
        }

        // Попытка аутентификации
        $credentials = $request->only('email', 'password');
        $credentials['is_active'] = true; // Только активные администраторы

        if (Auth::guard('admin')->attempt($credentials, $request->filled('remember'))) {
            $admin = Auth::guard('admin')->user();

            // Проверяем IP whitelist
            if (!$admin->isIpAllowed($ip)) {
                Auth::guard('admin')->logout();
                
                AdminLoginAttempt::recordAttempt($email, $ip, false, 'IP not in whitelist');
                
                return back()->withErrors([
                    'email' => 'Доступ с вашего IP адреса запрещен.',
                ]);
            }

            // Успешный вход
            $request->session()->regenerate();
            RateLimiter::clear($key);

            // Обновляем информацию о последнем входе
            $admin->updateLastLogin($ip);

            // Логируем успешный вход
            AdminLoginAttempt::recordAttempt($email, $ip, true);
            AdminActivityLog::log($admin->id, 'login', null, null, null, 'Успешный вход в систему');

            return redirect()->intended(route('admin.dashboard'));
        }

        // Неудачная попытка входа
        RateLimiter::hit($key, 900); // 15 минут
        AdminLoginAttempt::recordAttempt($email, $ip, false, 'Invalid credentials');

        return back()->withErrors([
            'email' => 'Неверный email или пароль.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        $admin = Auth::guard('admin')->user();
        
        if ($admin) {
            AdminActivityLog::log($admin->id, 'logout', null, null, null, 'Выход из системы');
        }

        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
