<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\PromoCode;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PromoCodeManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = PromoCode::orderBy('created_at', 'desc');

        // Фильтры
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('code', 'like', "%{$request->search}%");
        }

        $promoCodes = $query->paginate(20);
        $plans = SubscriptionPlan::all();

        return Inertia::render('Admin/PromoCodes/Index', [
            'promoCodes' => $promoCodes,
            'plans' => $plans,
            'filters' => $request->only(['is_active', 'type', 'search']),
        ]);
    }

    public function create()
    {
        $plans = SubscriptionPlan::all();

        return Inertia::render('Admin/PromoCodes/Create', [
            'plans' => $plans,
        ]);
    }

    public function store(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:promo_codes,code',
            'type' => 'required|in:percentage,fixed,trial_extension',
            'value' => 'required|numeric|min:0',
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'first_payment_only' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['is_active'] = true;
        $validated['used_count'] = 0;

        $promoCode = PromoCode::create($validated);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'create_promo_code',
            'PromoCode',
            $promoCode->id,
            $validated,
            "Создан промокод: {$promoCode->code}"
        );

        return redirect()->route('admin.promo-codes.index')
            ->with('success', 'Промокод успешно создан.');
    }

    public function edit(PromoCode $promoCode)
    {
        $plans = SubscriptionPlan::all();

        return Inertia::render('Admin/PromoCodes/Edit', [
            'promoCode' => $promoCode,
            'plans' => $plans,
        ]);
    }

    public function update(Request $request, PromoCode $promoCode)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:promo_codes,code,' . $promoCode->id,
            'type' => 'required|in:percentage,fixed,trial_extension',
            'value' => 'required|numeric|min:0',
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'first_payment_only' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $oldData = $promoCode->toArray();
        $promoCode->update($validated);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'update_promo_code',
            'PromoCode',
            $promoCode->id,
            [
                'old' => $oldData,
                'new' => $validated,
            ],
            "Обновлен промокод: {$promoCode->code}"
        );

        return redirect()->route('admin.promo-codes.index')
            ->with('success', 'Промокод успешно обновлен.');
    }

    public function destroy(PromoCode $promoCode)
    {
        $admin = Auth::guard('admin')->user();

        $promoCode->update(['is_active' => false]);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'deactivate_promo_code',
            'PromoCode',
            $promoCode->id,
            null,
            "Деактивирован промокод: {$promoCode->code}"
        );

        return back()->with('success', 'Промокод деактивирован.');
    }

    public function show(PromoCode $promoCode)
    {
        $promoCode->load(['usages.user', 'usages.subscription']);

        return Inertia::render('Admin/PromoCodes/Show', [
            'promoCode' => $promoCode,
        ]);
    }
}
