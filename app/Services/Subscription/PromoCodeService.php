<?php

namespace App\Services\Subscription;

use App\Models\PromoCode;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PromoCodeService
{
    /**
     * Validate promo code
     */
    public function validate(string $code, User $user, ?SubscriptionPlan $plan = null): array
    {
        $promoCode = PromoCode::where('code', $code)->first();

        if (!$promoCode) {
            return [
                'valid' => false,
                'error' => 'Промокод не найден',
            ];
        }

        if (!$promoCode->isValid()) {
            return [
                'valid' => false,
                'error' => 'Промокод недействителен или истек',
            ];
        }

        if (!$promoCode->canBeUsedBy($user)) {
            return [
                'valid' => false,
                'error' => 'Вы уже использовали этот промокод максимальное количество раз',
            ];
        }

        if ($plan && !$promoCode->isApplicableToPlan($plan->id)) {
            return [
                'valid' => false,
                'error' => 'Промокод не применим к выбранному тарифу',
            ];
        }

        // Проверка для first_payment_only
        if ($promoCode->first_payment_only) {
            $hasPayments = $user->payments()->succeeded()->exists();
            
            if ($hasPayments) {
                return [
                    'valid' => false,
                    'error' => 'Промокод действует только для первого платежа',
                ];
            }
        }

        return [
            'valid' => true,
            'promo_code' => $promoCode,
        ];
    }

    /**
     * Apply promo code to plan price
     */
    public function apply(PromoCode $promoCode, SubscriptionPlan $plan): array
    {
        $originalPrice = $plan->price;
        $discount = 0;
        $finalPrice = $originalPrice;
        $trialExtension = 0;

        switch ($promoCode->type) {
            case 'percentage':
                $discount = $originalPrice * ($promoCode->value / 100);
                $finalPrice = $originalPrice - $discount;
                break;

            case 'fixed':
                $discount = min($promoCode->value, $originalPrice);
                $finalPrice = $originalPrice - $discount;
                break;

            case 'trial_extension':
                $trialExtension = $promoCode->getTrialExtensionDays();
                break;
        }

        return [
            'original_price' => $originalPrice,
            'discount' => $discount,
            'final_price' => max(0, $finalPrice),
            'trial_extension' => $trialExtension,
            'promo_code' => $promoCode,
        ];
    }

    /**
     * Calculate discount amount
     */
    public function calculateDiscount(PromoCode $promoCode, float $amount): float
    {
        return $promoCode->calculateDiscount($amount);
    }

    /**
     * Get promo code by code string
     */
    public function getByCode(string $code): ?PromoCode
    {
        return PromoCode::where('code', $code)->first();
    }

    /**
     * Create promo code
     */
    public function create(array $data): PromoCode
    {
        $promoCode = PromoCode::create([
            'code' => strtoupper($data['code']),
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'value' => $data['value'],
            'max_uses' => $data['max_uses'] ?? null,
            'max_uses_per_user' => $data['max_uses_per_user'] ?? 1,
            'applicable_plans' => $data['applicable_plans'] ?? null,
            'first_payment_only' => $data['first_payment_only'] ?? false,
            'valid_from' => $data['valid_from'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        Log::info('Promo code created', [
            'code' => $promoCode->code,
            'type' => $promoCode->type,
        ]);

        return $promoCode;
    }

    /**
     * Update promo code
     */
    public function update(PromoCode $promoCode, array $data): PromoCode
    {
        $promoCode->update([
            'description' => $data['description'] ?? $promoCode->description,
            'value' => $data['value'] ?? $promoCode->value,
            'max_uses' => $data['max_uses'] ?? $promoCode->max_uses,
            'max_uses_per_user' => $data['max_uses_per_user'] ?? $promoCode->max_uses_per_user,
            'applicable_plans' => $data['applicable_plans'] ?? $promoCode->applicable_plans,
            'first_payment_only' => $data['first_payment_only'] ?? $promoCode->first_payment_only,
            'valid_from' => $data['valid_from'] ?? $promoCode->valid_from,
            'valid_until' => $data['valid_until'] ?? $promoCode->valid_until,
            'is_active' => $data['is_active'] ?? $promoCode->is_active,
        ]);

        Log::info('Promo code updated', [
            'code' => $promoCode->code,
        ]);

        return $promoCode;
    }

    /**
     * Deactivate promo code
     */
    public function deactivate(PromoCode $promoCode): void
    {
        $promoCode->update(['is_active' => false]);

        Log::info('Promo code deactivated', [
            'code' => $promoCode->code,
        ]);
    }

    /**
     * Get active promo codes
     */
    public function getActive(): \Illuminate\Database\Eloquent\Collection
    {
        return PromoCode::active()->get();
    }

    /**
     * Get promo code usage stats
     */
    public function getUsageStats(PromoCode $promoCode): array
    {
        $usages = $promoCode->usages()->with('user', 'subscription')->get();

        return [
            'total_uses' => $promoCode->uses_count,
            'max_uses' => $promoCode->max_uses,
            'remaining_uses' => $promoCode->max_uses ? ($promoCode->max_uses - $promoCode->uses_count) : null,
            'total_discount' => $usages->sum('discount_amount'),
            'unique_users' => $usages->unique('user_id')->count(),
            'recent_usages' => $usages->sortByDesc('created_at')->take(10)->values(),
        ];
    }
}
