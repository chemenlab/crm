<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;

class TwoFactorAuth extends Model
{
    protected $table = 'two_factor_auth';

    protected $fillable = [
        'user_id',
        'secret',
        'recovery_codes',
        'enabled_at',
    ];

    protected $hidden = [
        'secret',
        'recovery_codes',
    ];

    protected $casts = [
        'recovery_codes' => 'array',
        'enabled_at' => 'datetime',
    ];

    /**
     * Get the user that owns the 2FA settings.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if 2FA is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled_at !== null;
    }

    /**
     * Mark 2FA as enabled.
     */
    public function markAsEnabled(): void
    {
        $this->update(['enabled_at' => now()]);
    }

    /**
     * Use a recovery code.
     */
    public function useRecoveryCode(string $code): bool
    {
        $codes = $this->recovery_codes ?? [];
        
        if (($key = array_search($code, $codes)) !== false) {
            unset($codes[$key]);
            $this->update(['recovery_codes' => array_values($codes)]);
            return true;
        }

        return false;
    }

    /**
     * Check if there are unused recovery codes.
     */
    public function hasUnusedRecoveryCodes(): bool
    {
        return $this->getUnusedRecoveryCodesCount() > 0;
    }

    /**
     * Get count of unused recovery codes.
     */
    public function getUnusedRecoveryCodesCount(): int
    {
        $codes = $this->recovery_codes ?? [];
        
        return collect($codes)->filter(function ($code) {
            return !($code['used'] ?? false);
        })->count();
    }

    /**
     * Mark a recovery code as used.
     */
    public function markRecoveryCodeAsUsed(string $code): void
    {
        $codes = $this->recovery_codes ?? [];
        
        foreach ($codes as $index => $recoveryCode) {
            if (!$recoveryCode['used'] && Hash::check($code, $recoveryCode['code'])) {
                $codes[$index]['used'] = true;
                $this->update(['recovery_codes' => $codes]);
                break;
            }
        }
    }
}
