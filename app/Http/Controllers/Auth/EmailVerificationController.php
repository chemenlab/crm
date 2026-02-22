<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\VerificationCodeMail;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class EmailVerificationController extends Controller
{
    public function __construct(
        private EmailVerificationService $verificationService
    ) {}

    /**
     * Show the email verification form.
     */
    public function show()
    {
        if (auth()->user()->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/VerifyEmail', [
            'email' => auth()->user()->email,
        ]);
    }

    /**
     * Verify the email with code.
     */
    public function verify(Request $request)
    {
        // Rate limit verification attempts (5 per minute)
        $key = 'verify-email:' . auth()->id();
        
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'code' => "Слишком много попыток. Попробуйте через {$seconds} секунд.",
            ]);
        }
        
        RateLimiter::hit($key, 60);

        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'Пожалуйста, введите код',
            'code.size' => 'Код должен содержать 6 цифр',
        ]);

        $verified = $this->verificationService->verifyCode(
            auth()->user()->email,
            $request->code
        );

        if (!$verified) {
            return back()->withErrors([
                'code' => 'Неверный или истекший код',
            ]);
        }

        RateLimiter::clear($key);

        return redirect()->route('dashboard')->with('success', 'Email успешно подтвержден!');
    }

    /**
     * Resend verification code.
     */
    public function resend(Request $request)
    {
        $user = auth()->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('error', 'Email уже подтвержден');
        }

        // Rate limit resend attempts (3 per 5 minutes)
        $key = 'resend-verification:' . $user->id;
        
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);
            return back()->withErrors([
                'code' => "Слишком много запросов. Попробуйте через {$minutes} мин.",
            ]);
        }

        if (!$this->verificationService->canResendCode($user->email)) {
            return back()->withErrors([
                'code' => 'Пожалуйста, подождите минуту перед повторной отправкой',
            ]);
        }

        RateLimiter::hit($key, 300); // 5 minutes

        $verificationCode = $this->verificationService->generateCode($user, $user->email);

        Mail::to($user->email)->queue(
            new VerificationCodeMail($verificationCode->code, $user->name)
        );

        return back()->with('success', 'Код отправлен повторно');
    }
}
