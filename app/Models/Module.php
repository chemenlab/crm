<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'long_description',
        'documentation',
        'changelog',
        'version',
        'author',
        'category',
        'icon',
        'screenshots',
        'pricing_type',
        'price',
        'subscription_period',
        'min_plan',
        'dependencies',
        'hooks',
        'permissions',
        'is_active',
        'is_featured',
        'installs_count',
        'rating',
    ];

    protected $casts = [
        'screenshots' => 'array',
        'dependencies' => 'array',
        'hooks' => 'array',
        'permissions' => 'array',
        'price' => 'decimal:2',
        'rating' => 'decimal:1',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    /**
     * Get user modules for this module
     */
    public function userModules(): HasMany
    {
        return $this->hasMany(UserModule::class, 'module_slug', 'slug');
    }

    /**
     * Get purchases for this module
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(ModulePurchase::class, 'module_slug', 'slug');
    }

    /**
     * Get settings for this module
     */
    public function settings(): HasMany
    {
        return $this->hasMany(ModuleSetting::class, 'module_slug', 'slug');
    }

    /**
     * Get global settings for this module
     */
    public function globalSettings(): HasMany
    {
        return $this->hasMany(ModuleGlobalSetting::class, 'module_slug', 'slug');
    }

    /**
     * Get grants for this module
     */
    public function grants(): HasMany
    {
        return $this->hasMany(ModuleGrant::class, 'module_slug', 'slug');
    }

    /**
     * Get usage stats for this module
     */
    public function usageStats(): HasMany
    {
        return $this->hasMany(ModuleUsageStat::class, 'module_slug', 'slug');
    }

    /**
     * Get error logs for this module
     */
    public function errorLogs(): HasMany
    {
        return $this->hasMany(ModuleErrorLog::class, 'module_slug', 'slug');
    }

    /**
     * Get reviews for this module
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ModuleReview::class, 'module_slug', 'slug');
    }

    /**
     * Get approved reviews for this module
     */
    public function approvedReviews(): HasMany
    {
        return $this->reviews()->approved();
    }

    /**
     * Recalculate rating from reviews
     */
    public function recalculateRating(): void
    {
        $avgRating = $this->reviews()
            ->approved()
            ->avg('rating');

        $this->update([
            'rating' => round($avgRating ?? 0, 1)
        ]);
    }

    /**
     * Check if module is free
     */
    public function isFree(): bool
    {
        return $this->pricing_type === 'free';
    }

    /**
     * Check if module is subscription-based
     */
    public function isSubscription(): bool
    {
        return $this->pricing_type === 'subscription';
    }

    /**
     * Check if module is one-time purchase
     */
    public function isOneTime(): bool
    {
        return $this->pricing_type === 'one_time';
    }

    /**
     * Check if module is globally active
     */
    public function isGloballyActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if module has dependencies
     */
    public function hasDependencies(): bool
    {
        return !empty($this->dependencies);
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->isFree()) {
            return 'Бесплатно';
        }

        $price = number_format((float) $this->price, 0, ',', ' ') . ' ₽';

        if ($this->isSubscription()) {
            $period = $this->subscription_period === 'monthly' ? '/мес' : '/год';
            return $price . $period;
        }

        return $price;
    }

    /**
     * Get pricing type label
     */
    public function getPricingTypeLabelAttribute(): string
    {
        return match ($this->pricing_type) {
            'free' => 'Бесплатно',
            'subscription' => 'Подписка',
            'one_time' => 'Разовая покупка',
            default => 'Неизвестно',
        };
    }

    /**
     * Get category label
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'finance' => 'Финансы',
            'marketing' => 'Маркетинг',
            'communication' => 'Коммуникации',
            'analytics' => 'Аналитика',
            'productivity' => 'Продуктивность',
            'integration' => 'Интеграции',
            default => 'Другое',
        };
    }

    /**
     * Scope for active modules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for featured modules
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope for free modules
     */
    public function scopeFree($query)
    {
        return $query->where('pricing_type', 'free');
    }

    /**
     * Scope for paid modules
     */
    public function scopePaid($query)
    {
        return $query->whereIn('pricing_type', ['subscription', 'one_time']);
    }

    /**
     * Scope by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Increment installs count
     */
    public function incrementInstalls(): void
    {
        $this->increment('installs_count');
    }

    /**
     * Decrement installs count
     */
    public function decrementInstalls(): void
    {
        if ($this->installs_count > 0) {
            $this->decrement('installs_count');
        }
    }
}
