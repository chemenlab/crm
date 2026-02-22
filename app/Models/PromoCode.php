<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'max_uses',
        'uses_count',
        'max_uses_per_user',
        'applicable_plans',
        'first_payment_only',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'applicable_plans' => 'array',
        'first_payment_only' => 'boolean',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
        'max_uses' => 'integer',
        'uses_count' => 'integer',
        'max_uses_per_user' => 'integer',
    ];

    /**
     * Get usages
     */
    public function usages(): HasMany
    {
        return $this->hasMany(PromoCodeUsage::class);
    }

    /**
     * Check if promo code is valid
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->valid_from && $this->valid_from->isFuture()) {
            return false;
        }

        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }

        if ($this->max_uses && $this->uses_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Check if user can use this promo code
     */
    public function canBeUsedBy(User $user): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        $userUsages = $this->usages()->where('user_id', $user->id)->count();

        return $userUsages < $this->max_uses_per_user;
    }

    /**
     * Check if promo code is applicable to plan
     */
    public function isApplicableToPlan(int $planId): bool
    {
        if (!$this->applicable_plans) {
            return true; // Применим ко всем планам
        }

        return in_array($planId, $this->applicable_plans);
    }

    /**
     * Calculate discount amount
     */
    public function calculateDiscount(float $amount): float
    {
        return match ($this->type) {
            'percentage' => $amount * ($this->value / 100),
            'fixed' => min($this->value, $amount),
            'trial_extension' => 0, // Не влияет на сумму
            default => 0,
        };
    }

    /**
     * Get trial extension days
     */
    public function getTrialExtensionDays(): int
    {
        return $this->type === 'trial_extension' ? (int) $this->value : 0;
    }

    /**
     * Increment usage count
     */
    public function incrementUsage(): void
    {
        $this->increment('uses_count');
    }

    /**
     * Get formatted value
     */
    public function getFormattedValueAttribute(): string
    {
        return match ($this->type) {
            'percentage' => $this->value . '%',
            'fixed' => number_format($this->value, 0, ',', ' ') . ' ₽',
            'trial_extension' => $this->value . ' дней',
            default => (string) $this->value,
        };
    }

    /**
     * Get type label
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'percentage' => 'Процент',
            'fixed' => 'Фиксированная сумма',
            'trial_extension' => 'Продление триала',
            default => 'Неизвестно',
        };
    }

    /**
     * Scope for active promo codes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('valid_from')
                  ->orWhere('valid_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('valid_until')
                  ->orWhere('valid_until', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('max_uses')
                  ->orWhereRaw('uses_count < max_uses');
            });
    }
}
