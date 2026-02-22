<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class ModuleUsageStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_slug',
        'date',
        'installs',
        'uninstalls',
        'active_users',
        'purchases',
        'revenue',
    ];

    protected $casts = [
        'date' => 'date',
        'revenue' => 'decimal:2',
    ];

    /**
     * Get the module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
    }

    /**
     * Get net installs (installs - uninstalls)
     */
    public function getNetInstallsAttribute(): int
    {
        return $this->installs - $this->uninstalls;
    }

    /**
     * Get formatted revenue
     */
    public function getFormattedRevenueAttribute(): string
    {
        return number_format($this->revenue, 0, ',', ' ') . ' ₽';
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope for date range
     */
    public function scopeForDateRange($query, $from, $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Scope for specific date
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope for today
     */
    public function scopeToday($query)
    {
        return $query->where('date', Carbon::today());
    }

    /**
     * Scope for this week
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek(),
        ]);
    }

    /**
     * Scope for this month
     */
    public function scopeThisMonth($query)
    {
        return $query->whereBetween('date', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        ]);
    }

    /**
     * Scope for this year
     */
    public function scopeThisYear($query)
    {
        return $query->whereBetween('date', [
            Carbon::now()->startOfYear(),
            Carbon::now()->endOfYear(),
        ]);
    }

    /**
     * Get or create stat record for module and date
     */
    public static function getOrCreateForDate(string $moduleSlug, $date = null): static
    {
        $date = $date ?? Carbon::today();

        return static::firstOrCreate(
            [
                'module_slug' => $moduleSlug,
                'date' => $date,
            ],
            [
                'installs' => 0,
                'uninstalls' => 0,
                'active_users' => 0,
                'purchases' => 0,
                'revenue' => 0,
            ]
        );
    }

    /**
     * Increment installs for today
     */
    public static function incrementInstalls(string $moduleSlug): void
    {
        $stat = static::getOrCreateForDate($moduleSlug);
        $stat->increment('installs');
    }

    /**
     * Increment uninstalls for today
     */
    public static function incrementUninstalls(string $moduleSlug): void
    {
        $stat = static::getOrCreateForDate($moduleSlug);
        $stat->increment('uninstalls');
    }

    /**
     * Increment purchases and add revenue for today
     */
    public static function recordPurchase(string $moduleSlug, float $amount): void
    {
        $stat = static::getOrCreateForDate($moduleSlug);
        $stat->increment('purchases');
        $stat->increment('revenue', $amount);
    }

    /**
     * Get aggregated stats for module
     */
    public static function getAggregatedStats(string $moduleSlug, $from = null, $to = null): array
    {
        $query = static::forModule($moduleSlug);

        if ($from && $to) {
            $query->forDateRange($from, $to);
        }

        return [
            'total_installs' => $query->sum('installs'),
            'total_uninstalls' => $query->sum('uninstalls'),
            'total_purchases' => $query->sum('purchases'),
            'total_revenue' => $query->sum('revenue'),
            'avg_active_users' => round($query->avg('active_users') ?? 0),
        ];
    }

    /**
     * Get stats grouped by date for chart
     */
    public static function getChartData(string $moduleSlug, $from, $to): array
    {
        return static::forModule($moduleSlug)
            ->forDateRange($from, $to)
            ->orderBy('date')
            ->get()
            ->map(fn ($stat) => [
                'date' => $stat->date->format('Y-m-d'),
                'installs' => $stat->installs,
                'uninstalls' => $stat->uninstalls,
                'active_users' => $stat->active_users,
                'purchases' => $stat->purchases,
                'revenue' => (float) $stat->revenue,
            ])
            ->toArray();
    }
}
