<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PlanManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = SubscriptionPlan::query();

        // Фильтр по активности
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Фильтр по периоду оплаты
        if ($request->filled('billing_period')) {
            $query->where('billing_period', $request->billing_period);
        }

        // Поиск по названию
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $plans = $query->ordered()->paginate(20);

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
            'filters' => $request->only(['is_active', 'billing_period', 'search']),
        ]);
    }

    public function show(SubscriptionPlan $plan)
    {
        $plan->load(['subscriptions' => function ($query) {
            $query->with('user')->latest()->take(10);
        }]);

        // Статистика по тарифу
        $stats = [
            'total_subscriptions' => $plan->subscriptions()->count(),
            'active_subscriptions' => $plan->subscriptions()->where('status', 'active')->count(),
            'trial_subscriptions' => $plan->subscriptions()->where('status', 'trial')->count(),
            'total_revenue' => $plan->subscriptions()
                ->whereIn('status', ['active', 'trial'])
                ->count() * $plan->price,
        ];

        // Преобразуем JSON структуру в старый формат для админки
        $planData = $plan->toArray();
        $planData['max_appointments'] = $plan->getLimit('appointments');
        $planData['max_clients'] = $plan->getLimit('clients');
        $planData['max_services'] = $plan->getLimit('services');
        $planData['max_portfolio_images'] = $plan->getLimit('portfolio_images');
        $planData['max_tags'] = $plan->getLimit('tags');
        $planData['max_notifications_per_month'] = $plan->getLimit('notifications_per_month');
        $planData['has_analytics'] = $plan->hasFeature('analytics');
        $planData['has_priority_support'] = $plan->hasFeature('priority_support');
        $planData['has_custom_branding'] = $plan->hasFeature('custom_branding');
        
        // Фильтруем подписки, у которых есть пользователь
        $planData['subscriptions'] = $plan->subscriptions->filter(function ($subscription) {
            return $subscription->user !== null;
        })->values()->toArray();

        return Inertia::render('Admin/Plans/Show', [
            'plan' => $planData,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Plans/Create');
    }

    public function store(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_period' => 'required|in:monthly,yearly',
            'trial_days' => 'nullable|integer|min:0|max:365',
            'max_appointments' => 'required|integer|min:-1',
            'max_clients' => 'required|integer|min:-1',
            'max_services' => 'required|integer|min:-1',
            'max_portfolio_images' => 'required|integer|min:-1',
            'max_tags' => 'required|integer|min:-1',
            'max_notifications_per_month' => 'required|integer|min:-1',
            'has_analytics' => 'boolean',
            'has_priority_support' => 'boolean',
            'has_custom_branding' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Генерируем slug из названия
        $slug = Str::slug($validated['name']);
        
        // Проверяем уникальность slug
        $counter = 1;
        $originalSlug = $slug;
        while (SubscriptionPlan::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        // Преобразуем старый формат в JSON структуру
        $features = [
            'trial_days' => (int)($validated['trial_days'] ?? 0),
            'limits' => [
                'appointments' => (int)$validated['max_appointments'],
                'clients' => (int)$validated['max_clients'],
                'services' => (int)$validated['max_services'],
                'portfolio_images' => (int)$validated['max_portfolio_images'],
                'tags' => (int)$validated['max_tags'],
                'notifications_per_month' => (int)$validated['max_notifications_per_month'],
            ],
            'features' => [
                'analytics' => $validated['has_analytics'] ?? false,
                'priority_support' => $validated['has_priority_support'] ?? false,
                'custom_branding' => $validated['has_custom_branding'] ?? false,
                'portfolio' => (int)$validated['max_portfolio_images'] > 0,
                'online_booking' => true,
                'notifications' => true,
                'calendar' => true,
            ],
        ];

        $plan = SubscriptionPlan::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'],
            'price' => $validated['price'],
            'billing_period' => $validated['billing_period'],
            'features' => $features,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'create_plan',
            'SubscriptionPlan',
            $plan->id,
            $validated,
            "Создан тарифный план: {$plan->name}"
        );

        return redirect()->route('admin.plans.index')
            ->with('success', 'Тарифный план успешно создан.');
    }

    public function edit(SubscriptionPlan $plan)
    {
        // Преобразуем JSON структуру в старый формат для админки
        $planData = $plan->toArray();
        $planData['max_appointments'] = $plan->getLimit('appointments');
        $planData['max_clients'] = $plan->getLimit('clients');
        $planData['max_services'] = $plan->getLimit('services');
        $planData['max_portfolio_images'] = $plan->getLimit('portfolio_images');
        $planData['max_tags'] = $plan->getLimit('tags');
        $planData['max_notifications_per_month'] = $plan->getLimit('notifications_per_month');
        $planData['has_analytics'] = $plan->hasFeature('analytics');
        $planData['has_priority_support'] = $plan->hasFeature('priority_support');
        $planData['has_custom_branding'] = $plan->hasFeature('custom_branding');
        $planData['trial_days'] = $plan->features['trial_days'] ?? 0;
        
        return Inertia::render('Admin/Plans/Edit', [
            'plan' => $planData,
        ]);
    }

    public function update(Request $request, SubscriptionPlan $plan)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_period' => 'required|in:monthly,yearly',
            'trial_days' => 'nullable|integer|min:0|max:365',
            'max_appointments' => 'required|integer|min:-1',
            'max_clients' => 'required|integer|min:-1',
            'max_services' => 'required|integer|min:-1',
            'max_portfolio_images' => 'required|integer|min:-1',
            'max_tags' => 'required|integer|min:-1',
            'max_notifications_per_month' => 'required|integer|min:-1',
            'has_analytics' => 'boolean',
            'has_priority_support' => 'boolean',
            'has_custom_branding' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Обновляем slug только если изменилось название
        if ($validated['name'] !== $plan->name) {
            $validated['slug'] = Str::slug($validated['name']);
            
            // Проверяем уникальность slug
            $counter = 1;
            $originalSlug = $validated['slug'];
            while (SubscriptionPlan::where('slug', $validated['slug'])->where('id', '!=', $plan->id)->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        // Преобразуем старый формат в JSON структуру
        $features = [
            'trial_days' => (int)($validated['trial_days'] ?? 0),
            'limits' => [
                'appointments' => (int)$validated['max_appointments'],
                'clients' => (int)$validated['max_clients'],
                'services' => (int)$validated['max_services'],
                'portfolio_images' => (int)$validated['max_portfolio_images'],
                'tags' => (int)$validated['max_tags'],
                'notifications_per_month' => (int)$validated['max_notifications_per_month'],
            ],
            'features' => [
                'analytics' => $validated['has_analytics'] ?? false,
                'priority_support' => $validated['has_priority_support'] ?? false,
                'custom_branding' => $validated['has_custom_branding'] ?? false,
                'portfolio' => (int)$validated['max_portfolio_images'] > 0,
                'online_booking' => true,
                'notifications' => true,
                'calendar' => true,
            ],
        ];

        $updateData = [
            'name' => $validated['name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'billing_period' => $validated['billing_period'],
            'features' => $features,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? $plan->sort_order,
        ];

        if (isset($validated['slug'])) {
            $updateData['slug'] = $validated['slug'];
        }

        $oldData = $plan->toArray();
        $plan->update($updateData);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'update_plan',
            'SubscriptionPlan',
            $plan->id,
            [
                'old' => $oldData,
                'new' => $updateData,
            ],
            "Обновлен тарифный план: {$plan->name}"
        );

        return redirect()->route('admin.plans.index')
            ->with('success', 'Тарифный план успешно обновлен.');
    }

    public function destroy(SubscriptionPlan $plan)
    {
        $admin = Auth::guard('admin')->user();

        // Проверяем, есть ли активные подписки на этот тариф
        $activeSubscriptions = $plan->subscriptions()
            ->whereIn('status', ['active', 'trial'])
            ->count();

        if ($activeSubscriptions > 0) {
            return back()->with('error', "Невозможно удалить тариф. У него есть {$activeSubscriptions} активных подписок. Сначала деактивируйте тариф.");
        }

        // Деактивируем вместо удаления
        $plan->update(['is_active' => false]);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'deactivate_plan',
            'SubscriptionPlan',
            $plan->id,
            null,
            "Деактивирован тарифный план: {$plan->name}"
        );

        return back()->with('success', 'Тарифный план деактивирован.');
    }
}
