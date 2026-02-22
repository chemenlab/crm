<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_period',
        'features', // JSON with limits and feature flags
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'features' => 'array', // Cast JSON to array
        'sort_order' => 'integer',
    ];

    /**
     * Get subscriptions for this plan
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Check if plan is free
     */
    public function isFree(): bool
    {
        return $this->price == 0;
    }

    /**
     * Get limit for a specific metric
     */
    public function getLimit(string $metric): int
    {
        $limit = $this->features['limits'][$metric] ?? null;
        
        // Если лимит не задан, возвращаем 0 (нет доступа)
        if ($limit === null) {
            return 0;
        }
        
        return $limit;
    }

    /**
     * Check if feature is available
     */
    public function hasFeature(string $feature): bool
    {
        return $this->features['features'][$feature] ?? false;
    }

    /**
     * Check if resource is unlimited
     */
    public function isUnlimited(string $metric): bool
    {
        $limit = $this->features['limits'][$metric] ?? null;
        return $limit === -1;
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->isFree()) {
            return 'Бесплатно';
        }

        return number_format($this->price, 0, ',', ' ') . ' ₽';
    }

    /**
     * Get billing period label
     */
    public function getBillingPeriodLabelAttribute(): string
    {
        return match ($this->billing_period) {
            'monthly' => 'в месяц',
            'yearly' => 'в год',
            default => '',
        };
    }

    /**
     * Scope for active plans
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered plans
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }
}
