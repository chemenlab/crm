<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    protected TwoFactorService $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    /**
     * Show 2FA challenge page.
     */
    public function show(): Response
    {
        if (!session('2fa_user_id')) {
            return redirect()->route('login');
        }

        $throttleKey = $this->throttleKey();
        $attemptsLeft = 5 - RateLimiter::attempts($throttleKey);

        return Inertia::render('Auth/TwoFactorChallenge', [
            'attemptsLeft' => max(0, $attemptsLeft),
        ]);
    }

    /**
     * Verify TOTP code and log user in.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $userId = session('2fa_user_id');

        if (!$userId) {
            return redirect()->route('login')->with('error', 'Сессия истекла');
        }

        // Rate limiting
        $throttleKey = $this->throttleKey();
        
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->with('error', "Слишком много попыток. Попробуйте через {$seconds} секунд");
        }

        $user = \App\Models\User::find($userId);

        if (!$user || !$user->hasTwoFactorEnabled()) {
            return redirect()->route('login')->with('error', 'Ошибка аутентификации');
        }

        // Verify TOTP code
        $secret = $user->getTwoFactorSecret();
        
        if (!$this->twoFactorService->verifyCode($secret, $request->code)) {
            RateLimiter::hit($throttleKey, 900); // 15 minutes
            
            $attemptsLeft = 5 - RateLimiter::attempts($throttleKey);
            
            return back()->with('error', "Неверный код аутентификации. Осталось попыток: {$attemptsLeft}");
        }

        // Clear rate limiter
        RateLimiter::clear($throttleKey);

        // Log user in
        Auth::login($user, session('2fa_remember', false));

        // Clear 2FA session data
        session()->forget(['2fa_user_id', '2fa_remember']);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Use recovery code to log in.
     */
    public function useRecoveryCode(Request $request)
    {
        $request->validate([
            'recovery_code' => 'required|string',
        ]);

        $userId = session('2fa_user_id');

        if (!$userId) {
            return redirect()->route('login')->with('error', 'Сессия истекла');
        }

        // Rate limiting
        $throttleKey = $this->throttleKey();
        
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->with('error', "Слишком много попыток. Попробуйте через {$seconds} секунд");
        }

        $user = \App\Models\User::find($userId);

        if (!$user || !$user->hasTwoFactorEnabled()) {
            return redirect()->route('login')->with('error', 'Ошибка аутентификации');
        }

        // Verify recovery code
        $code = strtoupper(str_replace(' ', '', $request->recovery_code));
        
        if (!$this->twoFactorService->verifyRecoveryCode($user, $code)) {
            RateLimiter::hit($throttleKey, 900); // 15 minutes
            
            return back()->with('error', 'Неверный код восстановления');
        }

        // Clear rate limiter
        RateLimiter::clear($throttleKey);

        // Log user in
        Auth::login($user, session('2fa_remember', false));

        // Clear 2FA session data
        session()->forget(['2fa_user_id', '2fa_remember']);

        // Check if all recovery codes are used
        if (!$user->twoFactorAuth->hasUnusedRecoveryCodes()) {
            session()->flash('warning', 'Все коды восстановления использованы. Пожалуйста, сгенерируйте новые в настройках безопасности');
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Get the rate limiting throttle key.
     */
    protected function throttleKey(): string
    {
        return 'two-factor:' . session('2fa_user_id') . ':' . request()->ip();
    }
}
