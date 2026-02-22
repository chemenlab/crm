<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UsageTracking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UsageLimitService
{
    protected array $resources = [
        'appointments',
        'clients',
        'services',
        'portfolio_images',
        'tags',
        'notifications_per_month',
    ];

    /**
     * Initialize usage tracking for user
     */
    public function initializeUsageTracking(User $user, SubscriptionPlan $plan): void
    {
        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();

        foreach ($this->resources as $resource) {
            $limit = $plan->getLimit($resource);

            UsageTracking::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'resource_type' => $resource,
                    'period_start' => $periodStart,
                ],
                [
                    'limit_value' => $limit,
                    'period_end' => $periodEnd,
                    'current_usage' => 0,
                    'warning_sent' => false,
                    'limit_reached' => false,
                ]
            );
        }

        Log::info('Usage tracking initialized', [
            'user_id' => $user->id,
            'plan' => $plan->slug,
        ]);
    }

    /**
     * Check if user can use resource
     */
    public function checkLimit(User $user, string $resource): bool
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return false;
        }

        // Безлимит
        if ($plan->isUnlimited($resource)) {
            return true;
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);

        return !$tracking->isLimitReached();
    }

    /**
     * Track resource usage
     */
    public function trackUsage(User $user, string $resource, int $amount = 1): void
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return;
        }

        // Безлимит - не отслеживаем
        if ($plan->isUnlimited($resource)) {
            return;
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);
        $tracking->incrementUsage($amount);

        // Проверяем порог предупреждения (80%)
        if ($tracking->isWarningThresholdReached() && !$tracking->warning_sent) {
            $this->sendWarningNotification($user, $resource, $tracking);
            $tracking->update(['warning_sent' => true]);
        }

        // Проверяем достижение лимита
        if ($tracking->isLimitReached()) {
            $this->sendLimitReachedNotification($user, $resource);
        }

        Log::debug('Usage tracked', [
            'user_id' => $user->id,
            'resource' => $resource,
            'current_usage' => $tracking->current_usage,
            'limit' => $tracking->limit_value,
        ]);
    }

    /**
     * Decrease resource usage
     */
    public function decreaseUsage(User $user, string $resource, int $amount = 1): void
    {
        $plan = $user->getCurrentPlan();

        if (!$plan || $plan->isUnlimited($resource)) {
            return;
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);
        $tracking->decrementUsage($amount);

        Log::debug('Usage decreased', [
            'user_id' => $user->id,
            'resource' => $resource,
            'current_usage' => $tracking->current_usage,
        ]);
    }

    /**
     * Get current usage for resource
     */
    public function getCurrentUsage(User $user, string $resource): int
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return 0;
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);

        return $tracking->current_usage;
    }

    /**
     * Get remaining usage for resource
     */
    public function getRemainingUsage(User $user, string $resource): int
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return 0;
        }

        if ($plan->isUnlimited($resource)) {
            return -1; // Безлимит
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);

        return $tracking->getRemainingUsage();
    }

    /**
     * Get usage percentage for resource
     */
    public function getUsagePercentage(User $user, string $resource): float
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return 0;
        }

        if ($plan->isUnlimited($resource)) {
            return 0;
        }

        $tracking = $this->getOrCreateTracking($user, $resource, $plan);

        return $tracking->getUsagePercentage();
    }

    /**
     * Get all usage stats for user
     */
    public function getAllUsageStats(User $user): array
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            $stats = [];
            foreach ($this->resources as $resource) {
                $stats[$resource] = [
                    'current' => 0,
                    'limit' => 0,
                    'remaining' => 0,
                    'percentage' => 0,
                    'unlimited' => false,
                    'limit_reached' => true,
                ];
            }
            return $stats;
        }

        // Получаем реальные количества из БД для кумулятивных ресурсов
        $actualCounts = $this->getActualResourceCounts($user);

        $stats = [];

        foreach ($this->resources as $resource) {
            $tracking = $this->getOrCreateTracking($user, $resource, $plan);
            $limit = $tracking->limit_value ?? 0;
            $unlimited = $limit === -1;

            // Для кумулятивных ресурсов используем реальные данные из БД
            // Для месячных (appointments, notifications_per_month) — данные из трекинга
            $current = isset($actualCounts[$resource])
                ? $actualCounts[$resource]
                : ($tracking->current_usage ?? 0);

            // Синхронизируем трекинг с реальными данными
            if (isset($actualCounts[$resource]) && $tracking->current_usage !== $current) {
                $tracking->update(['current_usage' => $current]);
            }

            $percentage = (!$unlimited && $limit > 0) ? round(($current / $limit) * 100, 1) : 0;
            $remaining = $unlimited ? -1 : max(0, $limit - $current);
            $limitReached = !$unlimited && $limit > 0 && $current >= $limit;

            $stats[$resource] = [
                'current' => $current,
                'limit' => $limit,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'unlimited' => $unlimited,
                'limit_reached' => $limitReached,
            ];
        }

        return $stats;
    }

    /**
     * Get actual resource counts from database
     */
    protected function getActualResourceCounts(User $user): array
    {
        return [
            'clients' => $user->clients()->count(),
            'services' => $user->services()->count(),
            'portfolio_images' => $user->portfolioItems()->count(),
            'tags' => $user->clientTags()->count(),
        ];
    }

    /**
     * Reset monthly usage for user
     */
    public function resetMonthlyUsage(User $user): void
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return;
        }

        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();

        $trackings = UsageTracking::where('user_id', $user->id)
            ->currentPeriod()
            ->get();

        foreach ($trackings as $tracking) {
            $tracking->resetForNewPeriod($periodStart, $periodEnd);
        }

        Log::info('Monthly usage reset', [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Get or create tracking record
     */
    protected function getOrCreateTracking(User $user, string $resource, SubscriptionPlan $plan): UsageTracking
    {
        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();

        return UsageTracking::firstOrCreate(
            [
                'user_id' => $user->id,
                'resource_type' => $resource,
                'period_start' => $periodStart,
            ],
            [
                'limit_value' => $plan->getLimit($resource),
                'period_end' => $periodEnd,
                'current_usage' => 0,
                'warning_sent' => false,
                'limit_reached' => false,
            ]
        );
    }

    /**
     * Send warning notification (80% threshold)
     */
    protected function sendWarningNotification(User $user, string $resource, UsageTracking $tracking): void
    {
        $resourceNames = [
            'appointments' => 'записей',
            'clients' => 'клиентов',
            'services' => 'услуг',
            'portfolio_images' => 'изображений портфолио',
            'tags' => 'тегов',
            'notifications_per_month' => 'уведомлений в месяц',
        ];

        $resourceName = $resourceNames[$resource] ?? $resource;
        $percentage = round($tracking->getUsagePercentage());

        // Create in-app notification
        $user->notifications()->create([
            'id' => Str::uuid()->toString(),
            'type' => 'usage_warning',
            'data' => [
                'title' => 'Приближение к лимиту',
                'message' => "Вы использовали {$percentage}% лимита {$resourceName}. Рассмотрите возможность перехода на более высокий тариф.",
                'resource' => $resource,
                'current_usage' => $tracking->current_usage,
                'limit' => $tracking->limit_value,
                'percentage' => $percentage,
            ],
        ]);

        Log::info('Usage warning threshold reached', [
            'user_id' => $user->id,
            'resource' => $resource,
            'usage' => $tracking->current_usage,
            'limit' => $tracking->limit_value,
            'percentage' => $percentage,
        ]);
    }

    /**
     * Send limit reached notification
     */
    protected function sendLimitReachedNotification(User $user, string $resource): void
    {
        $resourceNames = [
            'appointments' => 'записей',
            'clients' => 'клиентов',
            'services' => 'услуг',
            'portfolio_images' => 'изображений портфолио',
            'tags' => 'тегов',
            'notifications_per_month' => 'уведомлений в месяц',
        ];

        $resourceName = $resourceNames[$resource] ?? $resource;

        // Create in-app notification
        $user->notifications()->create([
            'id' => Str::uuid()->toString(),
            'type' => 'usage_limit_reached',
            'data' => [
                'title' => 'Лимит достигнут',
                'message' => "Вы достигли лимита {$resourceName}. Перейдите на более высокий тариф, чтобы продолжить добавления.",
                'resource' => $resource,
                'action_url' => '/app/subscriptions',
                'action_text' => 'Улучшить тариф',
            ],
        ]);

        Log::warning('Usage limit reached', [
            'user_id' => $user->id,
            'resource' => $resource,
        ]);
    }

    /**
     * Check limits for all resources
     */
    public function checkAllLimits(User $user): array
    {
        $results = [];

        foreach ($this->resources as $resource) {
            $results[$resource] = $this->checkLimit($user, $resource);
        }

        return $results;
    }

    /**
     * Update usage limits when subscription plan changes
     */
    public function updateLimitsForPlanChange(User $user, SubscriptionPlan $newPlan): void
    {
        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();

        foreach ($this->resources as $resource) {
            $newLimit = $newPlan->getLimit($resource);

            $tracking = UsageTracking::where('user_id', $user->id)
                ->where('resource_type', $resource)
                ->where('period_start', $periodStart)
                ->first();

            if ($tracking) {
                // Обновляем лимит, сохраняя текущее использование
                $tracking->update([
                    'limit_value' => $newLimit,
                    'limit_reached' => $newLimit !== -1 && $tracking->current_usage >= $newLimit,
                ]);
            } else {
                // Создаем новую запись если её нет
                UsageTracking::create([
                    'user_id' => $user->id,
                    'resource_type' => $resource,
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'limit_value' => $newLimit,
                    'current_usage' => 0,
                    'warning_sent' => false,
                    'limit_reached' => false,
                ]);
            }
        }

        Log::info('Usage limits updated for plan change', [
            'user_id' => $user->id,
            'new_plan' => $newPlan->slug,
        ]);
    }
}
