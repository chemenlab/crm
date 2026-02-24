<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Services\EmailVerificationService;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class RegisterController extends Controller
{
    public function __construct(
        private EmailVerificationService $verificationService,
        private SubscriptionService $subscriptionService
    ) {
    }

    /**
     * Display the registration form.
     */
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle registration request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['required', 'string', 'max:20', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'name.required' => 'Пожалуйста, укажите ваше имя',
            'email.required' => 'Пожалуйста, укажите email',
            'email.email' => 'Укажите корректный email адрес',
            'email.unique' => 'Пользователь с таким email уже существует',
            'phone.required' => 'Пожалуйста, укажите номер телефона',
            'phone.unique' => 'Пользователь с таким номером телефона уже существует',
            'password.required' => 'Пожалуйста, укажите пароль',
            'password.min' => 'Пароль должен содержать минимум :min символов',
            'password.confirmed' => 'Пароли не совпадают',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'onboarding_completed' => false,
        ]);

        Auth::login($user);

        // Активируем триальную подписку "Максимальная" на 14 дней
        try {
            $this->subscriptionService->activateTrial($user);
        } catch (\RuntimeException $e) {
            Log::warning('Trial activation failed during registration', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Generate and send verification code
        $verificationCode = $this->verificationService->generateCode($user, $user->email);

        Mail::to($user->email)->queue(
            new VerificationCodeMail($verificationCode->code, $user->name)
        );

        // Redirect to email verification
        return redirect()->route('verification.notice')->with('message', 'Код подтверждения отправлен на вашу почту');
    }
}
