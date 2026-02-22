<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageTracking extends Model
{
    use HasFactory;

    protected $table = 'usage_tracking';

    protected $fillable = [
        'user_id',
        'resource_type',
        'current_usage',
        'limit_value',
        'period_start',
        'period_end',
        'warning_sent',
        'limit_reached',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'warning_sent' => 'boolean',
        'limit_reached' => 'boolean',
        'current_usage' => 'integer',
        'limit_value' => 'integer',
    ];

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if limit is reached
     */
    public function isLimitReached(): bool
    {
        if ($this->limit_value === -1) {
            return false; // Безлимит
        }

        return $this->current_usage >= $this->limit_value;
    }

    /**
     * Check if warning threshold reached (80%)
     */
    public function isWarningThresholdReached(): bool
    {
        if ($this->limit_value === -1) {
            return false; // Безлимит
        }

        return $this->current_usage >= ($this->limit_value * 0.8);
    }

    /**
     * Get usage percentage
     */
    public function getUsagePercentage(): float
    {
        if ($this->limit_value === -1) {
            return 0; // Безлимит
        }

        if ($this->limit_value === 0) {
            return 100;
        }

        return min(100, ($this->current_usage / $this->limit_value) * 100);
    }

    /**
     * Get remaining usage
     */
    public function getRemainingUsage(): int
    {
        if ($this->limit_value === -1) {
            return -1; // Безлимит
        }

        return max(0, $this->limit_value - $this->current_usage);
    }

    /**
     * Increment usage
     */
    public function incrementUsage(int $amount = 1): void
    {
        $this->increment('current_usage', $amount);

        if ($this->isLimitReached()) {
            $this->update(['limit_reached' => true]);
        }
    }

    /**
     * Decrement usage
     */
    public function decrementUsage(int $amount = 1): void
    {
        $this->decrement('current_usage', max(0, $amount));

        if (!$this->isLimitReached()) {
            $this->update(['limit_reached' => false]);
        }
    }

    /**
     * Reset usage for new period
     */
    public function resetForNewPeriod(\DateTime $periodStart, \DateTime $periodEnd): void
    {
        $this->update([
            'current_usage' => 0,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'warning_sent' => false,
            'limit_reached' => false,
        ]);
    }

    /**
     * Scope for current period
     */
    public function scopeCurrentPeriod($query)
    {
        return $query->where('period_start', '<=', now())
            ->where('period_end', '>=', now());
    }

    /**
     * Scope for specific resource
     */
    public function scopeForResource($query, string $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    /**
     * Scope for limit reached
     */
    public function scopeLimitReached($query)
    {
        return $query->where('limit_reached', true);
    }
}
