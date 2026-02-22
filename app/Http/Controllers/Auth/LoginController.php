<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * Display the login form.
     */
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle login request.
     */
    public function store(Request $request)
    {
        $key = 'login:' . Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => "Слишком много попыток входа. Попробуйте через {$seconds} сек.",
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'Пожалуйста, укажите email',
            'email.email' => 'Укажите корректный email адрес',
            'password.required' => 'Пожалуйста, укажите пароль',
        ]);

        // Attempt to authenticate
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($key);
            $user = Auth::user();

            // Check if 2FA is enabled
            if ($user->hasTwoFactorEnabled()) {
                // Logout temporarily
                Auth::logout();

                // Store user ID and remember preference in session
                session([
                    '2fa_user_id' => $user->id,
                    '2fa_remember' => $request->boolean('remember'),
                ]);

                // Redirect to 2FA challenge
                return redirect()->route('two-factor.challenge');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        RateLimiter::hit($key, 900); // 15 минут

        throw ValidationException::withMessages([
            'email' => 'Неверный email или пароль',
        ]);
    }

    /**
     * Handle logout request.
     */
    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
