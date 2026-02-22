<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_slug',
        'payment_id',
        'yookassa_payment_id',
        'price',
        'currency',
        'pricing_type',
        'status',
        'purchased_at',
        'expires_at',
        'auto_renew',
        'cancelled_at',
        'refunded_at',
        'refund_reason',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'auto_renew' => 'boolean',
        'purchased_at' => 'datetime',
        'expires_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
    }

    /**
     * Get the payment
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Check if purchase is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if purchase is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if purchase is failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if purchase is refunded
     */
    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Check if purchase is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if purchase is active (completed and not expired)
     */
    public function isActive(): bool
    {
        if (!$this->isCompleted()) {
            return false;
        }

        // One-time purchases never expire
        if ($this->pricing_type === 'one_time') {
            return true;
        }

        // Subscription must not be expired
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        if ($this->pricing_type === 'one_time') {
            return false;
        }

        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'purchased_at' => now(),
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(): void
    {
        $this->update([
            'status' => 'failed',
        ]);
    }

    /**
     * Mark as cancelled
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'auto_renew' => false,
        ]);
    }

    /**
     * Mark as refunded
     */
    public function markAsRefunded(?string $reason = null): void
    {
        $this->update([
            'status' => 'refunded',
            'refunded_at' => now(),
            'refund_reason' => $reason,
        ]);
    }

    /**
     * Cancel auto-renewal
     */
    public function cancelAutoRenew(): void
    {
        $this->update(['auto_renew' => false]);
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', ' ') . ' ' . $this->currency;
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Ожидает оплаты',
            'completed' => 'Оплачено',
            'failed' => 'Ошибка',
            'refunded' => 'Возвращено',
            'cancelled' => 'Отменено',
            default => 'Неизвестно',
        };
    }

    /**
     * Get pricing type label
     */
    public function getPricingTypeLabelAttribute(): string
    {
        return match ($this->pricing_type) {
            'subscription' => 'Подписка',
            'one_time' => 'Разовая покупка',
            default => 'Неизвестно',
        };
    }

    /**
     * Scope for completed purchases
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for pending purchases
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for active purchases
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'completed')
            ->where(function ($q) {
                $q->where('pricing_type', 'one_time')
                    ->orWhere(function ($q2) {
                        $q2->where('pricing_type', 'subscription')
                            ->where(function ($q3) {
                                $q3->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', now());
                            });
                    });
            });
    }

    /**
     * Scope for expired subscriptions
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'completed')
            ->where('pricing_type', 'subscription')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope for specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for auto-renew enabled
     */
    public function scopeAutoRenewEnabled($query)
    {
        return $query->where('auto_renew', true);
    }
}
