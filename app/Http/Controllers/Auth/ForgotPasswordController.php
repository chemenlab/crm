<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    /**
     * Show forgot password form.
     */
    public function showForgotForm()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Send password reset link.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Пожалуйста, укажите email',
            'email.email' => 'Укажите корректный email адрес',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Не раскрываем, существует ли пользователь
            return back()->with('status', 'Если аккаунт с таким email существует, мы отправили инструкции по восстановлению пароля.');
        }

        // Генерируем токен
        $token = Str::random(64);

        // Удаляем старые токены
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Сохраняем новый токен
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Отправляем email
        Mail::to($user->email)->queue(new PasswordResetMail($token, $user->name));

        return back()->with('status', 'Если аккаунт с таким email существует, мы отправили инструкции по восстановлению пароля.');
    }

    /**
     * Show reset password form.
     */
    public function showResetForm(Request $request, string $token)
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    /**
     * Reset password.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ], [
            'email.required' => 'Пожалуйста, укажите email',
            'email.email' => 'Укажите корректный email адрес',
            'password.required' => 'Пожалуйста, укажите новый пароль',
            'password.min' => 'Пароль должен содержать минимум :min символов',
            'password.confirmed' => 'Пароли не совпадают',
        ]);

        // Проверяем токен
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return back()->withErrors(['email' => 'Неверный токен сброса пароля.']);
        }

        // Проверяем срок действия (60 минут)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return back()->withErrors(['email' => 'Срок действия токена истёк. Запросите новый.']);
        }

        // Проверяем хеш токена
        if (!Hash::check($request->token, $record->token)) {
            return back()->withErrors(['email' => 'Неверный токен сброса пароля.']);
        }

        // Обновляем пароль
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'Пользователь не найден.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Удаляем токен
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return redirect()->route('login')->with('status', 'Пароль успешно изменён! Теперь вы можете войти.');
    }
}
