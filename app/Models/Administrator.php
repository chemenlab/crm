<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Administrator extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'name',
        'role',
        'is_active',
        'last_login_at',
        'last_login_ip',
        'two_factor_secret',
        'two_factor_enabled',
        'allowed_ips',
        'telegram_id',
        'telegram_username',
        'telegram_verification_code',
        'telegram_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'allowed_ips' => 'array',
        'last_login_at' => 'datetime',
        'telegram_verified_at' => 'datetime',
    ];

    // Relationships
    public function activityLogs()
    {
        return $this->hasMany(AdminActivityLog::class);
    }

    // Helper methods
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }

    public function isModerator(): bool
    {
        return $this->role === 'moderator';
    }

    public function hasPermission(string $permission): bool
    {
        // Super admin имеет все права
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Определяем права для каждой роли
        $permissions = [
            'admin' => [
                'view_subscriptions',
                'manage_subscriptions',
                'view_promo_codes',
                'manage_promo_codes',
                'view_users',
                'view_payments',
                'view_analytics',
            ],
            'moderator' => [
                'view_subscriptions',
                'view_promo_codes',
                'view_users',
                'view_payments',
            ],
        ];

        return in_array($permission, $permissions[$this->role] ?? []);
    }

    public function isIpAllowed(string $ip): bool
    {
        // Если whitelist не настроен, разрешаем все IP
        if (empty($this->allowed_ips)) {
            return true;
        }

        return in_array($ip, $this->allowed_ips);
    }

    public function updateLastLogin(string $ip): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);
    }
}
