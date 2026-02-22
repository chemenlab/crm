<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminLoginAttempt extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'email',
        'ip_address',
        'user_agent',
        'success',
        'failure_reason',
        'created_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'created_at' => 'datetime',
    ];

    // Статические методы для работы с попытками входа
    public static function recordAttempt(string $email, string $ip, bool $success, ?string $failureReason = null): void
    {
        self::create([
            'email' => $email,
            'ip_address' => $ip,
            'user_agent' => request()->userAgent(),
            'success' => $success,
            'failure_reason' => $failureReason,
            'created_at' => now(),
        ]);
    }

    public static function getRecentFailedAttempts(string $email, int $minutes = 15): int
    {
        return self::where('email', $email)
            ->where('success', false)
            ->where('created_at', '>', now()->subMinutes($minutes))
            ->count();
    }

    public static function getRecentFailedAttemptsByIp(string $ip, int $minutes = 15): int
    {
        return self::where('ip_address', $ip)
            ->where('success', false)
            ->where('created_at', '>', now()->subMinutes($minutes))
            ->count();
    }

    public static function isBlocked(string $email, string $ip, int $maxAttempts = 5): bool
    {
        $emailAttempts = self::getRecentFailedAttempts($email);
        $ipAttempts = self::getRecentFailedAttemptsByIp($ip);

        return $emailAttempts >= $maxAttempts || $ipAttempts >= $maxAttempts;
    }
}
