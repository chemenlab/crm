<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Subscription::with(['user', 'plan'])
            ->orderBy('created_at', 'desc');

        // Фильтры
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('plan_id')) {
            $query->where('subscription_plan_id', $request->plan_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $subscriptions = $query->paginate(20);
        $plans = SubscriptionPlan::all();

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'plans' => $plans,
            'filters' => $request->only(['status', 'plan_id', 'search']),
        ]);
    }

    public function show(Subscription $subscription)
    {
        $subscription->load(['user', 'plan', 'payments', 'promoCode']);

        // Статистика использования
        $usageStats = [];
        if ($subscription->user && $subscription->current_period_start) {
            $usageStats = $subscription->user->usageTracking()
                ->where('period_start', '>=', $subscription->current_period_start)
                ->get()
                ->groupBy('resource_type');
        }

        return Inertia::render('Admin/Subscriptions/Show', [
            'subscription' => $subscription,
            'usageStats' => $usageStats,
        ]);
    }

    public function cancel(Request $request, Subscription $subscription)
    {
        $admin = Auth::guard('admin')->user();

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $oldStatus = $subscription->status;
        $subscription->cancel();

        $userEmail = $subscription->user?->email ?? 'Unknown';

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'cancel_subscription',
            'Subscription',
            $subscription->id,
            [
                'old_status' => $oldStatus,
                'new_status' => $subscription->status,
                'reason' => $request->reason,
            ],
            "Отменена подписка пользователя {$userEmail}"
        );

        return back()->with('success', 'Подписка успешно отменена.');
    }

    public function extend(Request $request, Subscription $subscription)
    {
        $admin = Auth::guard('admin')->user();

        $request->validate([
            'days' => 'required|integer|min:1|max:365',
            'reason' => 'nullable|string|max:500',
        ]);

        $oldEndDate = $subscription->current_period_end;
        $subscription->current_period_end = $subscription->current_period_end->addDays($request->days);
        $subscription->save();

        $userEmail = $subscription->user?->email ?? 'Unknown';

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'extend_subscription',
            'Subscription',
            $subscription->id,
            [
                'old_end_date' => $oldEndDate,
                'new_end_date' => $subscription->current_period_end,
                'days_added' => $request->days,
                'reason' => $request->reason,
            ],
            "Продлена подписка пользователя {$userEmail} на {$request->days} дней"
        );

        return back()->with('success', "Подписка продлена на {$request->days} дней.");
    }

    public function changePlan(Request $request, Subscription $subscription)
    {
        $admin = Auth::guard('admin')->user();

        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $oldPlan = $subscription->plan;
        $newPlan = SubscriptionPlan::findOrFail($request->plan_id);

        $subscription->subscription_plan_id = $newPlan->id;
        $subscription->save();

        $userEmail = $subscription->user?->email ?? 'Unknown';

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'change_subscription_plan',
            'Subscription',
            $subscription->id,
            [
                'old_plan' => $oldPlan->name,
                'new_plan' => $newPlan->name,
                'reason' => $request->reason,
            ],
            "Изменен тариф подписки пользователя {$userEmail} с '{$oldPlan->name}' на '{$newPlan->name}'"
        );

        return back()->with('success', 'Тарифный план успешно изменен.');
    }

    public function create()
    {
        $plans = SubscriptionPlan::all();

        // Получаем всех пользователей для выбора
        $users = User::orderBy('name')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'has_active_subscription' => $user->hasActiveSubscription(),
            ];
        });

        return Inertia::render('Admin/Subscriptions/Create', [
            'plans' => $plans,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        // Валидация с условием для trial_days
        $rules = [
            'user_id' => 'required|exists:users,id',
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'status' => 'required|in:active,trial',
            'auto_renew' => 'boolean',
        ];

        // Добавляем валидацию trial_days только если статус trial
        if ($request->status === 'trial') {
            $rules['trial_days'] = 'required|integer|min:1|max:30';
        }

        $validated = $request->validate($rules);

        $user = User::findOrFail($validated['user_id']);
        $plan = SubscriptionPlan::findOrFail($validated['subscription_plan_id']);

        // Проверяем, нет ли уже активной подписки
        if ($user->hasActiveSubscription()) {
            return back()->withErrors(['user_id' => 'У пользователя уже есть активная подписка.']);
        }

        $startDate = now();
        $trialDays = $validated['status'] === 'trial' ? (int) ($validated['trial_days'] ?? 7) : 0;

        // Создаем подписку
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'status' => $validated['status'],
            'trial_ends_at' => $trialDays > 0 ? $startDate->copy()->addDays($trialDays) : null,
            'current_period_start' => $startDate,
            'current_period_end' => $startDate->copy()->addDays(30),
            'auto_renew' => $validated['auto_renew'] ?? true,
        ]);

        // Обновляем current_subscription_id пользователя
        $user->current_subscription_id = $subscription->id;
        $user->save();

        // Инициализируем отслеживание использования
        app(\App\Services\Subscription\UsageLimitService::class)->initializeUsageTracking($user, $plan);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'create_subscription',
            'Subscription',
            $subscription->id,
            $validated,
            "Создана подписка для пользователя {$user->email} на тариф '{$plan->name}'"
        );

        return redirect()->route('admin.subscriptions.show', $subscription->id)
            ->with('success', 'Подписка успешно создана.');
    }

    public function edit(Subscription $subscription)
    {
        $plans = SubscriptionPlan::all();
        $subscription->load(['user', 'plan']);

        return Inertia::render('Admin/Subscriptions/Edit', [
            'subscription' => $subscription,
            'plans' => $plans,
        ]);
    }

    public function update(Request $request, Subscription $subscription)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'status' => 'required|in:active,trial,cancelled,expired',
            'extend_days' => 'nullable|integer|min:0|max:365',
            'auto_renew' => 'boolean',
        ]);

        $oldData = $subscription->toArray();

        // Обновляем тариф
        if ($subscription->subscription_plan_id != $validated['subscription_plan_id']) {
            $oldPlan = $subscription->plan->name;
            $subscription->subscription_plan_id = $validated['subscription_plan_id'];
            $newPlan = SubscriptionPlan::find($validated['subscription_plan_id']);

            // Обновляем лимиты использования для нового тарифа
            app(\App\Services\Subscription\UsageLimitService::class)
                ->updateLimitsForPlanChange($subscription->user, $newPlan);
        }

        // Обновляем статус
        $subscription->status = $validated['status'];

        // Продлеваем подписку если указано
        if (!empty($validated['extend_days']) && $validated['extend_days'] > 0) {
            $subscription->current_period_end = $subscription->current_period_end->addDays((int) $validated['extend_days']);
        }

        // Обновляем автопродление
        $subscription->auto_renew = $validated['auto_renew'] ?? $subscription->auto_renew;

        $subscription->save();

        $userEmail = $subscription->user?->email ?? 'Unknown';

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'update_subscription',
            'Subscription',
            $subscription->id,
            [
                'old' => $oldData,
                'new' => $validated,
            ],
            "Обновлена подписка пользователя {$userEmail}"
        );

        return redirect()->route('admin.subscriptions.show', $subscription->id)
            ->with('success', 'Подписка успешно обновлена.');
    }
}
