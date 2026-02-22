<?php

namespace App\Services\Subscription;

use App\Models\Payment;
use App\Models\PromoCode;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Create new subscription for user
     */
    public function create(
        User $user,
        SubscriptionPlan $plan,
        ?PromoCode $promoCode = null
    ): Subscription {
        return DB::transaction(function () use ($user, $plan, $promoCode) {
            // Отменяем текущую подписку если есть
            if ($user->currentSubscription) {
                $this->cancel($user->currentSubscription);
            }

            $now = now();
            $trialEndsAt = null;
            $status = 'active';

            // Определяем триальный период (используем 14 дней по умолчанию)
            $trialDays = $plan->features['trial_days'] ?? 0;
            if ($trialDays > 0 && !$user->subscriptions()->where('subscription_plan_id', $plan->id)->exists()) {
                $trialEndsAt = $now->copy()->addDays($trialDays);
                
                // Применяем промокод для продления триала
                if ($promoCode && $promoCode->type === 'trial_extension') {
                    $trialEndsAt->addDays($promoCode->getTrialExtensionDays());
                }
                
                $status = 'trial';
            }

            // Рассчитываем скидку
            $discountAmount = 0;
            if ($promoCode && $promoCode->type !== 'trial_extension') {
                $discountAmount = $promoCode->calculateDiscount($plan->price);
            }

            // Создаем подписку
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => $status,
                'trial_ends_at' => $trialEndsAt,
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addMonth(),
                'promo_code_id' => $promoCode?->id,
                'discount_amount' => $discountAmount,
                'auto_renew' => true,
            ]);

            // Обновляем текущую подписку пользователя
            $user->update([
                'current_subscription_id' => $subscription->id,
                'trial_ends_at' => $trialEndsAt,
            ]);

            // Инициализируем отслеживание лимитов
            $usageLimitService = app(UsageLimitService::class);
            $usageLimitService->initializeUsageTracking($user, $plan);

            // Записываем использование промокода
            if ($promoCode) {
                $promoCode->usages()->create([
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'discount_amount' => $discountAmount,
                ]);
                $promoCode->incrementUsage();
            }

            Log::info('Subscription created', [
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'plan' => $plan->slug,
                'status' => $status,
            ]);

            return $subscription;
        });
    }

    /**
     * Activate subscription after successful payment
     */
    public function activateSubscription(Subscription $subscription, Payment $payment): void
    {
        DB::transaction(function () use ($subscription, $payment) {
            $now = now();

            $subscription->update([
                'status' => 'active',
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addMonth(),
            ]);

            // Сохраняем payment_method_id для рекуррентных платежей
            if (isset($payment->metadata['payment_method_id'])) {
                $subscription->update([
                    'yookassa_subscription_id' => $payment->metadata['payment_method_id'],
                ]);
            }

            Log::info('Subscription activated', [
                'subscription_id' => $subscription->id,
                'payment_id' => $payment->id,
            ]);
        });
    }

    /**
     * Upgrade subscription to higher plan
     */
    public function upgrade(Subscription $subscription, SubscriptionPlan $newPlan): Subscription
    {
        return DB::transaction(function () use ($subscription, $newPlan) {
            // Отменяем текущую подписку
            $this->cancel($subscription);

            // Создаем новую подписку
            return $this->create($subscription->user, $newPlan);
        });
    }

    /**
     * Downgrade subscription to lower plan
     */
    public function downgrade(Subscription $subscription, SubscriptionPlan $newPlan): Subscription
    {
        return DB::transaction(function () use ($subscription, $newPlan) {
            // Отменяем текущую подписку
            $this->cancel($subscription);

            // Создаем новую подписку
            return $this->create($subscription->user, $newPlan);
        });
    }

    /**
     * Cancel subscription
     */
    public function cancel(Subscription $subscription): void
    {
        $subscription->cancel();

        Log::info('Subscription cancelled', [
            'subscription_id' => $subscription->id,
            'user_id' => $subscription->user_id,
        ]);
    }

    /**
     * Resume cancelled subscription
     */
    public function resume(Subscription $subscription): void
    {
        $subscription->resume();

        Log::info('Subscription resumed', [
            'subscription_id' => $subscription->id,
            'user_id' => $subscription->user_id,
        ]);
    }

    /**
     * Renew subscription (for recurring payments)
     */
    public function renew(Subscription $subscription): bool
    {
        try {
            $plan = $subscription->plan;
            $amount = $plan->price - $subscription->discount_amount;

            // Если есть сохраненный метод оплаты, создаем рекуррентный платеж
            if ($subscription->yookassa_subscription_id) {
                $payment = $this->paymentService->createRecurringPayment(
                    $subscription->user,
                    $subscription,
                    $subscription->yookassa_subscription_id,
                    $amount,
                    "Продление подписки {$plan->name}"
                );

                // Если платеж успешен, продлеваем подписку
                if ($payment->isSucceeded()) {
                    $subscription->update([
                        'current_period_start' => now(),
                        'current_period_end' => now()->addMonth(),
                        'status' => 'active',
                    ]);

                    // Сбрасываем месячные лимиты
                    app(UsageLimitService::class)->resetMonthlyUsage($subscription->user);

                    return true;
                }

                // Если платеж не прошел, помечаем подписку как просроченную
                $subscription->update(['status' => 'past_due']);
                return false;
            }

            // Если нет сохраненного метода оплаты, помечаем как просроченную
            $subscription->update(['status' => 'past_due']);
            return false;
        } catch (\Exception $e) {
            Log::error('Subscription renewal failed', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            $subscription->update(['status' => 'past_due']);
            return false;
        }
    }

    /**
     * Check and expire subscriptions
     */
    public function checkExpiredSubscriptions(): void
    {
        $expiredSubscriptions = Subscription::where('status', 'active')
            ->where('current_period_end', '<', now())
            ->get();

        foreach ($expiredSubscriptions as $subscription) {
            if ($subscription->auto_renew) {
                // Пытаемся продлить
                $renewed = $this->renew($subscription);
                
                if (!$renewed) {
                    Log::warning('Failed to renew subscription', [
                        'subscription_id' => $subscription->id,
                    ]);
                }
            } else {
                // Помечаем как истекшую
                $subscription->markAsExpired();
                
                Log::info('Subscription expired', [
                    'subscription_id' => $subscription->id,
                ]);
            }
        }

        // Проверяем триальные подписки
        $expiredTrials = Subscription::where('status', 'trial')
            ->where('trial_ends_at', '<', now())
            ->get();

        foreach ($expiredTrials as $subscription) {
            $subscription->markAsExpired();
            
            Log::info('Trial subscription expired', [
                'subscription_id' => $subscription->id,
            ]);
        }
    }

    /**
     * Get subscription with payment method
     */
    public function hasPaymentMethod(Subscription $subscription): bool
    {
        return !empty($subscription->yookassa_subscription_id);
    }

    /**
     * Calculate price with promo code
     */
    public function calculatePrice(SubscriptionPlan $plan, ?PromoCode $promoCode = null): float
    {
        $price = $plan->price;

        if ($promoCode && $promoCode->type !== 'trial_extension') {
            $discount = $promoCode->calculateDiscount($price);
            $price = max(0, $price - $discount);
        }

        return $price;
    }

    /**
     * Activate trial subscription for new user
     */
    public function activateTrial(User $user): Subscription
    {
        // Находим план "Максимальная" с fallback на первый доступный план
        $maximumPlan = SubscriptionPlan::where('slug', 'maximum')->first();
        
        if (!$maximumPlan) {
            // Fallback: берём план с максимальной ценой или первый доступный
            $maximumPlan = SubscriptionPlan::where('is_active', true)
                ->orderByDesc('price')
                ->first();
        }
        
        if (!$maximumPlan) {
            throw new \RuntimeException('No subscription plans available for trial activation');
        }

        return DB::transaction(function () use ($user, $maximumPlan) {
            $now = now();
            $trialEndsAt = $now->copy()->addDays(14); // 14 дней триала

            // Создаем триальную подписку
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $maximumPlan->id,
                'status' => 'trial',
                'trial_ends_at' => $trialEndsAt,
                'current_period_start' => $now,
                'current_period_end' => $trialEndsAt,
                'auto_renew' => false, // Триал не продлевается автоматически
            ]);

            // Обновляем пользователя
            $user->update([
                'current_subscription_id' => $subscription->id,
                'trial_ends_at' => $trialEndsAt,
            ]);

            // Инициализируем отслеживание лимитов
            $usageLimitService = app(UsageLimitService::class);
            $usageLimitService->initializeUsageTracking($user, $maximumPlan);

            Log::info('Trial subscription activated', [
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'plan' => $maximumPlan->slug,
                'trial_ends_at' => $trialEndsAt,
            ]);

            return $subscription;
        });
    }
}
