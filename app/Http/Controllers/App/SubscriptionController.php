<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Services\Payment\PaymentService;
use App\Services\Subscription\PromoCodeService;
use App\Services\Subscription\SubscriptionService;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected PaymentService $paymentService,
        protected PromoCodeService $promoCodeService,
        protected UsageLimitService $usageLimitService
    ) {}

    /**
     * Show subscription plans
     */
    public function index()
    {
        $user = auth()->user();
        $plans = SubscriptionPlan::active()->ordered()->get();
        $currentSubscription = $user->currentSubscription()->with('plan')->first();
        
        // Получаем статистику использования только если есть план
        $usageStats = [];
        if ($user->getCurrentPlan()) {
            $usageStats = $this->usageLimitService->getAllUsageStats($user);
        }

        return Inertia::render('App/Subscriptions/Index', [
            'plans' => $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'formatted_price' => $plan->formatted_price,
                    'billing_period' => $plan->billing_period,
                    'billing_period_label' => $plan->billing_period_label,
                    'features' => $plan->features,
                    'is_active' => $plan->is_active,
                    'sort_order' => $plan->sort_order,
                ];
            }),
            'currentSubscription' => $currentSubscription ? [
                'id' => $currentSubscription->id,
                'status' => $currentSubscription->status,
                'trial_ends_at' => $currentSubscription->trial_ends_at?->toISOString(),
                'current_period_start' => $currentSubscription->current_period_start?->toISOString(),
                'current_period_end' => $currentSubscription->current_period_end?->toISOString(),
                'auto_renew' => $currentSubscription->auto_renew,
                'plan' => $currentSubscription->plan ? [
                    'id' => $currentSubscription->plan->id,
                    'name' => $currentSubscription->plan->name,
                    'slug' => $currentSubscription->plan->slug,
                    'price' => $currentSubscription->plan->price,
                    'formatted_price' => $currentSubscription->plan->formatted_price,
                ] : null,
            ] : null,
            'usageStats' => $usageStats,
        ]);
    }

    /**
     * Show subscription checkout page
     */
    public function checkout(SubscriptionPlan $plan)
    {
        $user = auth()->user();

        return Inertia::render('App/Subscriptions/Checkout', [
            'plan' => $plan,
            'currentSubscription' => $user->currentSubscription?->load('plan'),
        ]);
    }

    /**
     * Create subscription and payment
     */
    public function store(Request $request, SubscriptionPlan $plan)
    {
        $request->validate([
            'promo_code' => 'nullable|string',
        ]);

        $user = auth()->user();
        $promoCode = null;

        // Валидация промокода
        if ($request->promo_code) {
            $validation = $this->promoCodeService->validate($request->promo_code, $user, $plan);

            if (!$validation['valid']) {
                return back()->withErrors(['promo_code' => $validation['error']]);
            }

            $promoCode = $validation['promo_code'];
        }

        // Создаем подписку
        $subscription = $this->subscriptionService->create($user, $plan, $promoCode);

        // Если план бесплатный или триальный, редиректим на страницу успеха
        if ($plan->isFree() || $subscription->onTrial()) {
            return redirect()->route('subscriptions.success')
                ->with('success', 'Подписка успешно активирована!');
        }

        // Рассчитываем сумму к оплате
        $amount = $this->subscriptionService->calculatePrice($plan, $promoCode);

        // Создаем платеж
        $payment = $this->paymentService->createPayment(
            $user,
            $subscription,
            $amount,
            "Подписка {$plan->name}",
            true // Сохраняем метод оплаты для рекуррентных платежей
        );

        // Редиректим на страницу оплаты YooKassa
        $confirmationUrl = $this->paymentService->getConfirmationUrl($payment);

        return redirect($confirmationUrl);
    }

    /**
     * Payment success page
     */
    public function success()
    {
        $user = auth()->user();
        $subscription = $user->currentSubscription?->load('plan');

        return Inertia::render('App/Subscriptions/Success', [
            'subscription' => $subscription,
        ]);
    }

    /**
     * Upgrade subscription
     */
    public function upgrade(Request $request, SubscriptionPlan $plan)
    {
        $user = auth()->user();
        $currentSubscription = $user->currentSubscription;

        if (!$currentSubscription) {
            return back()->withErrors(['error' => 'У вас нет активной подписки']);
        }

        // Проверяем, что новый план выше текущего
        if ($plan->price <= $currentSubscription->plan->price) {
            return back()->withErrors(['error' => 'Выберите тариф выше текущего']);
        }

        // Обновляем подписку
        $newSubscription = $this->subscriptionService->upgrade($currentSubscription, $plan);

        // Создаем платеж
        $amount = $plan->price;
        $payment = $this->paymentService->createPayment(
            $user,
            $newSubscription,
            $amount,
            "Повышение тарифа до {$plan->name}",
            true
        );

        $confirmationUrl = $this->paymentService->getConfirmationUrl($payment);

        return redirect($confirmationUrl);
    }

    /**
     * Downgrade subscription
     */
    public function downgrade(Request $request, SubscriptionPlan $plan)
    {
        $user = auth()->user();
        $currentSubscription = $user->currentSubscription;

        if (!$currentSubscription) {
            return back()->withErrors(['error' => 'У вас нет активной подписки']);
        }

        // Проверяем, что новый план ниже текущего
        if ($plan->price >= $currentSubscription->plan->price) {
            return back()->withErrors(['error' => 'Выберите тариф ниже текущего']);
        }

        // Обновляем подписку
        $this->subscriptionService->downgrade($currentSubscription, $plan);

        return redirect()->route('subscriptions.index')
            ->with('success', 'Тариф успешно понижен. Изменения вступят в силу с начала следующего периода.');
    }

    /**
     * Cancel subscription
     */
    public function cancel()
    {
        $user = auth()->user();
        $subscription = $user->currentSubscription;

        if (!$subscription) {
            return back()->withErrors(['error' => 'У вас нет активной подписки']);
        }

        $this->subscriptionService->cancel($subscription);

        return back()->with('success', 'Подписка отменена. Доступ сохранится до конца оплаченного периода.');
    }

    /**
     * Resume subscription
     */
    public function resume()
    {
        $user = auth()->user();
        $subscription = $user->currentSubscription;

        if (!$subscription || !$subscription->isCancelled()) {
            return back()->withErrors(['error' => 'Невозможно возобновить подписку']);
        }

        $this->subscriptionService->resume($subscription);

        return back()->with('success', 'Подписка возобновлена!');
    }

    /**
     * Validate promo code
     */
    public function validatePromoCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $user = auth()->user();
        $plan = SubscriptionPlan::findOrFail($request->plan_id);

        $validation = $this->promoCodeService->validate($request->code, $user, $plan);

        if (!$validation['valid']) {
            return response()->json([
                'valid' => false,
                'error' => $validation['error'],
            ], 422);
        }

        $promoCode = $validation['promo_code'];
        $result = $this->promoCodeService->apply($promoCode, $plan);

        return response()->json([
            'valid' => true,
            'promo_code' => $promoCode,
            'original_price' => $result['original_price'],
            'discount' => $result['discount'],
            'final_price' => $result['final_price'],
            'trial_extension' => $result['trial_extension'],
        ]);
    }

    /**
     * Show usage statistics
     */
    public function usage()
    {
        $user = auth()->user();
        $usageStats = $this->usageLimitService->getAllUsageStats($user);
        $subscription = $user->currentSubscription?->load('plan');

        return Inertia::render('App/Subscriptions/Usage', [
            'subscription' => $subscription,
            'usageStats' => $usageStats,
        ]);
    }
}
