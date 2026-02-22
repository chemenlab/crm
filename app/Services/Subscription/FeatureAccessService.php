<?php

namespace App\Services\Subscription;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class FeatureAccessService
{
    /**
     * Check if user has access to a feature
     */
    public function hasAccess(User $user, string $feature): bool
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return false;
        }

        // Проверяем статус подписки
        $subscription = $user->currentSubscription;
        
        if (!$subscription) {
            return false;
        }

        // Если подписка истекла или отменена - доступа нет
        if (in_array($subscription->status, ['expired', 'cancelled', 'past_due'])) {
            return false;
        }

        // Проверяем наличие функции в плане
        return $plan->hasFeature($feature);
    }

    /**
     * Check if user can access resource (with limit check)
     */
    public function canAccessResource(User $user, string $resource): bool
    {
        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return false;
        }

        $subscription = $user->currentSubscription;
        
        if (!$subscription) {
            return false;
        }

        // Если подписка истекла - доступа нет
        if (in_array($subscription->status, ['expired', 'cancelled', 'past_due'])) {
            return false;
        }

        // Проверяем лимит через UsageLimitService
        $usageLimitService = app(UsageLimitService::class);
        return $usageLimitService->checkLimit($user, $resource);
    }

    /**
     * Get feature access status with details
     */
    public function getFeatureStatus(User $user, string $feature): array
    {
        $hasAccess = $this->hasAccess($user, $feature);
        $plan = $user->getCurrentPlan();
        $subscription = $user->currentSubscription;

        return [
            'has_access' => $hasAccess,
            'plan_name' => $plan?->name,
            'plan_slug' => $plan?->slug,
            'subscription_status' => $subscription?->status,
            'is_trial' => $subscription?->status === 'trial',
            'trial_ends_at' => $subscription?->trial_ends_at?->format('Y-m-d H:i:s'),
            'reason' => $this->getAccessDeniedReason($user, $feature),
        ];
    }

    /**
     * Get resource access status with usage details
     */
    public function getResourceStatus(User $user, string $resource): array
    {
        $canAccess = $this->canAccessResource($user, $resource);
        $plan = $user->getCurrentPlan();
        $subscription = $user->currentSubscription;
        $usageLimitService = app(UsageLimitService::class);

        $status = [
            'can_access' => $canAccess,
            'plan_name' => $plan?->name,
            'plan_slug' => $plan?->slug,
            'subscription_status' => $subscription?->status,
        ];

        if ($plan) {
            $limit = $plan->getLimit($resource);
            $current = $usageLimitService->getCurrentUsage($user, $resource);
            $remaining = $usageLimitService->getRemainingUsage($user, $resource);
            $unlimited = $plan->isUnlimited($resource);

            $status['limit'] = $limit;
            $status['current_usage'] = $current;
            $status['remaining'] = $remaining;
            $status['unlimited'] = $unlimited;
            $status['percentage'] = ($limit > 0 && !$unlimited) ? round(($current / $limit) * 100, 2) : 0;
        } else {
            $status['limit'] = 0;
            $status['current_usage'] = 0;
            $status['remaining'] = 0;
            $status['unlimited'] = false;
            $status['percentage'] = 0;
        }

        return $status;
    }

    /**
     * Get all features access status
     */
    public function getAllFeaturesStatus(User $user): array
    {
        $features = [
            'analytics',
            'priority_support',
            'custom_branding',
            'portfolio',
            'online_booking',
            'notifications',
            'calendar',
        ];

        $status = [];

        foreach ($features as $feature) {
            $status[$feature] = $this->hasAccess($user, $feature);
        }

        return $status;
    }

    /**
     * Get all resources access status
     */
    public function getAllResourcesStatus(User $user): array
    {
        $resources = [
            'appointments',
            'clients',
            'services',
            'portfolio_images',
            'tags',
            'notifications_per_month',
        ];

        $status = [];

        foreach ($resources as $resource) {
            $status[$resource] = $this->getResourceStatus($user, $resource);
        }

        return $status;
    }

    /**
     * Check if subscription is active
     */
    public function hasActiveSubscription(User $user): bool
    {
        $subscription = $user->currentSubscription;

        if (!$subscription) {
            return false;
        }

        return in_array($subscription->status, ['active', 'trial']);
    }

    /**
     * Check if subscription is in trial
     */
    public function isInTrial(User $user): bool
    {
        $subscription = $user->currentSubscription;

        if (!$subscription) {
            return false;
        }

        return $subscription->status === 'trial';
    }

    /**
     * Get days remaining in trial
     */
    public function getTrialDaysRemaining(User $user): ?int
    {
        if (!$this->isInTrial($user)) {
            return null;
        }

        $subscription = $user->currentSubscription;
        
        if (!$subscription->trial_ends_at) {
            return null;
        }

        return max(0, now()->diffInDays($subscription->trial_ends_at, false));
    }

    /**
     * Get reason for access denial
     */
    protected function getAccessDeniedReason(User $user, string $feature): ?string
    {
        $subscription = $user->currentSubscription;

        if (!$subscription) {
            return 'no_subscription';
        }

        if (in_array($subscription->status, ['expired', 'cancelled'])) {
            return 'subscription_expired';
        }

        if ($subscription->status === 'past_due') {
            return 'payment_failed';
        }

        $plan = $user->getCurrentPlan();

        if (!$plan) {
            return 'no_plan';
        }

        if (!$plan->hasFeature($feature)) {
            return 'feature_not_in_plan';
        }

        return null;
    }

    /**
     * Get upgrade suggestion for feature
     */
    public function getUpgradeSuggestion(User $user, string $feature): ?array
    {
        $currentPlan = $user->getCurrentPlan();

        if (!$currentPlan) {
            return null;
        }

        // Если функция уже доступна - не нужен апгрейд
        if ($this->hasAccess($user, $feature)) {
            return null;
        }

        // Находим минимальный план с этой функцией
        $plans = \App\Models\SubscriptionPlan::active()
            ->ordered()
            ->get()
            ->filter(fn($plan) => $plan->hasFeature($feature))
            ->first();

        if (!$plans) {
            return null;
        }

        return [
            'plan_name' => $plans->name,
            'plan_slug' => $plans->slug,
            'price' => $plans->price,
            'formatted_price' => $plans->formatted_price,
        ];
    }

    /**
     * Log feature access attempt
     */
    public function logAccessAttempt(User $user, string $feature, bool $granted): void
    {
        Log::info('Feature access attempt', [
            'user_id' => $user->id,
            'feature' => $feature,
            'granted' => $granted,
            'plan' => $user->getCurrentPlan()?->slug,
            'subscription_status' => $user->currentSubscription?->status,
        ]);
    }
}
