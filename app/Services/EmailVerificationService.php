<?php

namespace App\Services;

use App\Models\EmailVerificationCode;
use App\Models\User;
use Illuminate\Support\Str;

class EmailVerificationService
{
    /**
     * Generate a 6-digit verification code.
     */
    public function generateCode(User $user, string $email): EmailVerificationCode
    {
        // Delete old codes for this email
        EmailVerificationCode::where('email', $email)
            ->where('verified_at', null)
            ->delete();

        // Generate new code
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return EmailVerificationCode::create([
            'user_id' => $user->id ?? null,
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);
    }

    /**
     * Verify the code.
     */
    public function verifyCode(string $email, string $code): bool
    {
        $verificationCode = EmailVerificationCode::where('email', $email)
            ->where('code', $code)
            ->where('verified_at', null)
            ->first();

        if (!$verificationCode) {
            return false;
        }

        if ($verificationCode->isExpired()) {
            return false;
        }

        $verificationCode->markAsVerified();

        // Mark user email as verified if user exists
        if ($verificationCode->user_id) {
            User::where('id', $verificationCode->user_id)
                ->update(['email_verified_at' => now()]);
        }

        return true;
    }

    /**
     * Check if can resend code (rate limiting).
     */
    public function canResendCode(string $email): bool
    {
        $lastCode = EmailVerificationCode::where('email', $email)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastCode) {
            return true;
        }

        // Allow resend after 1 minute
        return $lastCode->created_at->addMinute()->isPast();
    }
}
