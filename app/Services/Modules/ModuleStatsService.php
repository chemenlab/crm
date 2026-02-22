<?php

namespace App\Services\Modules;

use App\Models\Module;
use App\Models\ModulePurchase;
use App\Models\ModuleUsageStat;
use App\Models\UserModule;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ModuleStatsService
{
    /**
     * Get overview statistics for all modules
     * 
     * @return array
     */
    public function getOverviewStats(): array
    {
        $totalModules = Module::count();
        $activeModules = Module::active()->count();
        $totalInstalls = UserModule::enabled()->count();
        $totalPurchases = ModulePurchase::completed()->count();
        $totalRevenue = ModulePurchase::completed()->sum('price');
        
        // Stats for today
        $todayStats = ModuleUsageStat::today()->selectRaw('
            SUM(installs) as installs,
            SUM(uninstalls) as uninstalls,
            SUM(purchases) as purchases,
            SUM(revenue) as revenue
        ')->first();
        
        // Stats for this month
        $monthStats = ModuleUsageStat::thisMonth()->selectRaw('
            SUM(installs) as installs,
            SUM(uninstalls) as uninstalls,
            SUM(purchases) as purchases,
            SUM(revenue) as revenue
        ')->first();
        
        return [
            'total_modules' => $totalModules,
            'active_modules' => $activeModules,
            'total_installs' => $totalInstalls,
            'total_purchases' => $totalPurchases,
            'total_revenue' => (float) $totalRevenue,
            'today' => [
                'installs' => (int) ($todayStats->installs ?? 0),
                'uninstalls' => (int) ($todayStats->uninstalls ?? 0),
                'purchases' => (int) ($todayStats->purchases ?? 0),
                'revenue' => (float) ($todayStats->revenue ?? 0),
            ],
            'this_month' => [
                'installs' => (int) ($monthStats->installs ?? 0),
                'uninstalls' => (int) ($monthStats->uninstalls ?? 0),
                'purchases' => (int) ($monthStats->purchases ?? 0),
                'revenue' => (float) ($monthStats->revenue ?? 0),
            ],
        ];
    }


    /**
     * Get statistics for a specific module
     * 
     * @param string $moduleSlug
     * @param Carbon|null $from
     * @param Carbon|null $to
     * @return array
     */
    public function getModuleStats(string $moduleSlug, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $module = Module::where('slug', $moduleSlug)->first();
        
        if (!$module) {
            return [];
        }
        
        // Default to last 30 days if no dates provided
        $from = $from ?? Carbon::now()->subDays(30);
        $to = $to ?? Carbon::now();
        
        // Current stats
        $currentInstalls = UserModule::forModule($moduleSlug)->enabled()->count();
        $totalInstalls = $module->installs_count;
        $activeUsers = UserModule::forModule($moduleSlug)
            ->enabled()
            ->where('last_used_at', '>=', Carbon::now()->subDays(7))
            ->count();
        
        // Purchase stats
        $totalPurchases = ModulePurchase::forModule($moduleSlug)->completed()->count();
        $totalRevenue = ModulePurchase::forModule($moduleSlug)->completed()->sum('price');
        $activeSubscriptions = ModulePurchase::forModule($moduleSlug)
            ->active()
            ->where('pricing_type', 'subscription')
            ->count();
        
        // Period stats
        $periodStats = ModuleUsageStat::forModule($moduleSlug)
            ->forDateRange($from, $to)
            ->selectRaw('
                SUM(installs) as installs,
                SUM(uninstalls) as uninstalls,
                SUM(purchases) as purchases,
                SUM(revenue) as revenue,
                AVG(active_users) as avg_active_users
            ')
            ->first();
        
        // Chart data
        $chartData = ModuleUsageStat::getChartData($moduleSlug, $from, $to);
        
        return [
            'module' => [
                'slug' => $module->slug,
                'name' => $module->name,
                'category' => $module->category,
                'pricing_type' => $module->pricing_type,
                'price' => (float) $module->price,
                'rating' => (float) $module->rating,
            ],
            'current' => [
                'installs' => $currentInstalls,
                'total_installs' => $totalInstalls,
                'active_users' => $activeUsers,
                'active_subscriptions' => $activeSubscriptions,
            ],
            'totals' => [
                'purchases' => $totalPurchases,
                'revenue' => (float) $totalRevenue,
            ],
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'installs' => (int) ($periodStats->installs ?? 0),
                'uninstalls' => (int) ($periodStats->uninstalls ?? 0),
                'purchases' => (int) ($periodStats->purchases ?? 0),
                'revenue' => (float) ($periodStats->revenue ?? 0),
                'avg_active_users' => round($periodStats->avg_active_users ?? 0),
            ],
            'chart' => $chartData,
        ];
    }

    /**
     * Get top modules by installs
     * 
     * @param int $limit
     * @return Collection
     */
    public function getTopModules(int $limit = 5): Collection
    {
        return Module::active()
            ->orderByDesc('installs_count')
            ->limit($limit)
            ->get()
            ->map(fn (Module $module) => [
                'slug' => $module->slug,
                'name' => $module->name,
                'category' => $module->category,
                'installs_count' => $module->installs_count,
                'pricing_type' => $module->pricing_type,
                'price' => (float) $module->price,
                'rating' => (float) $module->rating,
            ]);
    }

    /**
     * Get top modules by revenue
     * 
     * @param int $limit
     * @param Carbon|null $from
     * @param Carbon|null $to
     * @return Collection
     */
    public function getTopModulesByRevenue(int $limit = 5, ?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $query = ModulePurchase::completed()
            ->select('module_slug')
            ->selectRaw('SUM(price) as total_revenue')
            ->selectRaw('COUNT(*) as purchases_count')
            ->groupBy('module_slug')
            ->orderByDesc('total_revenue')
            ->limit($limit);
        
        if ($from && $to) {
            $query->whereBetween('purchased_at', [$from, $to]);
        }
        
        return $query->get()->map(function ($item) {
            $module = Module::where('slug', $item->module_slug)->first();
            return [
                'slug' => $item->module_slug,
                'name' => $module?->name ?? $item->module_slug,
                'category' => $module?->category,
                'total_revenue' => (float) $item->total_revenue,
                'purchases_count' => (int) $item->purchases_count,
            ];
        });
    }


    /**
     * Get revenue by module for a period
     * 
     * @param Carbon|null $from
     * @param Carbon|null $to
     * @return Collection
     */
    public function getRevenueByModule(?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $query = ModulePurchase::completed()
            ->select('module_slug')
            ->selectRaw('SUM(price) as total_revenue')
            ->selectRaw('COUNT(*) as purchases_count')
            ->groupBy('module_slug')
            ->orderByDesc('total_revenue');
        
        if ($from && $to) {
            $query->whereBetween('purchased_at', [$from, $to]);
        }
        
        return $query->get()->map(function ($item) {
            $module = Module::where('slug', $item->module_slug)->first();
            return [
                'slug' => $item->module_slug,
                'name' => $module?->name ?? $item->module_slug,
                'category' => $module?->category,
                'pricing_type' => $module?->pricing_type,
                'total_revenue' => (float) $item->total_revenue,
                'purchases_count' => (int) $item->purchases_count,
            ];
        });
    }

    /**
     * Get users of a specific module with pagination
     * 
     * @param string $moduleSlug
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getModuleUsers(string $moduleSlug, int $perPage = 20): LengthAwarePaginator
    {
        return UserModule::forModule($moduleSlug)
            ->with('user:id,name,email,avatar')
            ->orderByDesc('enabled_at')
            ->paginate($perPage)
            ->through(fn (UserModule $userModule) => [
                'user_id' => $userModule->user_id,
                'user_name' => $userModule->user?->name,
                'user_email' => $userModule->user?->email,
                'user_avatar' => $userModule->user?->avatar,
                'is_enabled' => $userModule->is_enabled,
                'enabled_at' => $userModule->enabled_at?->toDateTimeString(),
                'disabled_at' => $userModule->disabled_at?->toDateTimeString(),
                'last_used_at' => $userModule->last_used_at?->toDateTimeString(),
                'usage_count' => $userModule->usage_count,
            ]);
    }

    /**
     * Get purchase history for a specific module
     * 
     * @param string $moduleSlug
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getModulePurchaseHistory(string $moduleSlug, int $perPage = 20): LengthAwarePaginator
    {
        return ModulePurchase::forModule($moduleSlug)
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(fn (ModulePurchase $purchase) => [
                'id' => $purchase->id,
                'user_id' => $purchase->user_id,
                'user_name' => $purchase->user?->name,
                'user_email' => $purchase->user?->email,
                'price' => (float) $purchase->price,
                'currency' => $purchase->currency,
                'pricing_type' => $purchase->pricing_type,
                'status' => $purchase->status,
                'purchased_at' => $purchase->purchased_at?->toDateTimeString(),
                'expires_at' => $purchase->expires_at?->toDateTimeString(),
                'auto_renew' => $purchase->auto_renew,
            ]);
    }

    /**
     * Aggregate daily statistics for all modules
     * Called by cron job
     * 
     * @param Carbon|null $date Date to aggregate (defaults to yesterday)
     * @return void
     */
    public function aggregateDailyStats(?Carbon $date = null): void
    {
        $date = $date ?? Carbon::yesterday();
        $dateString = $date->toDateString();
        
        // Get all active modules
        $modules = Module::active()->pluck('slug');
        
        foreach ($modules as $moduleSlug) {
            $this->aggregateModuleStats($moduleSlug, $date);
        }
    }


    /**
     * Aggregate statistics for a specific module on a specific date
     * 
     * @param string $moduleSlug
     * @param Carbon $date
     * @return ModuleUsageStat
     */
    protected function aggregateModuleStats(string $moduleSlug, Carbon $date): ModuleUsageStat
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();
        
        // Count installs for the day (enabled_at within the day)
        $installs = UserModule::forModule($moduleSlug)
            ->whereBetween('enabled_at', [$startOfDay, $endOfDay])
            ->count();
        
        // Count uninstalls for the day (disabled_at within the day)
        $uninstalls = UserModule::forModule($moduleSlug)
            ->whereBetween('disabled_at', [$startOfDay, $endOfDay])
            ->count();
        
        // Count active users (used the module on that day)
        $activeUsers = UserModule::forModule($moduleSlug)
            ->enabled()
            ->whereBetween('last_used_at', [$startOfDay, $endOfDay])
            ->count();
        
        // Count purchases and revenue for the day
        $purchaseStats = ModulePurchase::forModule($moduleSlug)
            ->completed()
            ->whereBetween('purchased_at', [$startOfDay, $endOfDay])
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(price), 0) as revenue')
            ->first();
        
        // Update or create the stat record
        return ModuleUsageStat::updateOrCreate(
            [
                'module_slug' => $moduleSlug,
                'date' => $date->toDateString(),
            ],
            [
                'installs' => $installs,
                'uninstalls' => $uninstalls,
                'active_users' => $activeUsers,
                'purchases' => (int) $purchaseStats->count,
                'revenue' => (float) $purchaseStats->revenue,
            ]
        );
    }

    /**
     * Get statistics summary for dashboard widget
     * 
     * @return array
     */
    public function getDashboardStats(): array
    {
        $overview = $this->getOverviewStats();
        $topModules = $this->getTopModules(5);
        $topByRevenue = $this->getTopModulesByRevenue(5, Carbon::now()->startOfMonth(), Carbon::now());
        
        return [
            'overview' => $overview,
            'top_by_installs' => $topModules,
            'top_by_revenue' => $topByRevenue,
        ];
    }

    /**
     * Get chart data for all modules combined
     * 
     * @param Carbon $from
     * @param Carbon $to
     * @return array
     */
    public function getOverallChartData(Carbon $from, Carbon $to): array
    {
        return ModuleUsageStat::forDateRange($from, $to)
            ->selectRaw('date, SUM(installs) as installs, SUM(uninstalls) as uninstalls, SUM(active_users) as active_users, SUM(purchases) as purchases, SUM(revenue) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($stat) => [
                'date' => Carbon::parse($stat->date)->format('Y-m-d'),
                'installs' => (int) $stat->installs,
                'uninstalls' => (int) $stat->uninstalls,
                'active_users' => (int) $stat->active_users,
                'purchases' => (int) $stat->purchases,
                'revenue' => (float) $stat->revenue,
            ])
            ->toArray();
    }

    /**
     * Get modules comparison data
     * 
     * @param array $moduleSlugs
     * @param Carbon|null $from
     * @param Carbon|null $to
     * @return Collection
     */
    public function compareModules(array $moduleSlugs, ?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $from = $from ?? Carbon::now()->subDays(30);
        $to = $to ?? Carbon::now();
        
        return collect($moduleSlugs)->map(function ($slug) use ($from, $to) {
            return $this->getModuleStats($slug, $from, $to);
        })->filter();
    }
}
