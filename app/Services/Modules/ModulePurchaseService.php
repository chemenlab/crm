<?php

namespace App\Services\Modules;

use App\Models\Module;
use App\Models\ModulePurchase;
use App\Models\User;
use App\Services\Modules\Exceptions\ModulePurchaseException;
use App\Services\Payment\PaymentService;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use YooKassa\Model\Payment\PaymentStatus;

/**
 * Service for handling module purchases through YooKassa
 */
class ModulePurchaseService
{
    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly ModuleRegistry $registry,
        private readonly UserModuleService $userModuleService,
    ) {}

    /**
     * Create a purchase for a module
     * 
     * @throws ModulePurchaseException
     */
    public function createPurchase(
        User $user,
        string $moduleSlug,
        ?string $subscriptionPeriod = null
    ): ModulePurchase {
        // Check if payment service is configured
        if (!$this->paymentService->isConfigured()) {
            throw ModulePurchaseException::paymentServiceNotConfigured();
        }

        // Get module from registry
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            throw ModulePurchaseException::moduleNotFound($moduleSlug);
        }

        // Get module from database for pricing
        $module = Module::where('slug', $moduleSlug)->first();
        if ($module === null) {
            throw ModulePurchaseException::moduleNotFound($moduleSlug);
        }

        // Check if module is free
        if ($module->isFree()) {
            throw ModulePurchaseException::moduleIsFree($moduleSlug);
        }

        // Check if user already has active purchase
        if ($this->hasActivePurchase($user, $moduleSlug)) {
            throw ModulePurchaseException::alreadyPurchased($moduleSlug);
        }

        return DB::transaction(function () use ($user, $module, $subscriptionPeriod) {
            // Determine pricing
            $pricingType = $module->pricing_type;
            $price = $module->price;
            $expiresAt = null;

            // For subscriptions, calculate expiration
            if ($pricingType === 'subscription') {
                $period = $subscriptionPeriod ?? $module->subscription_period ?? 'monthly';
                $expiresAt = $this->calculateExpirationDate($period);
                
                // Adjust price for yearly subscription (discount)
                if ($period === 'yearly') {
                    $price = $price * 10; // 10 months price for yearly (2 months free)
                }
            }

            // Create purchase record
            $purchase = ModulePurchase::create([
                'user_id' => $user->id,
                'module_slug' => $module->slug,
                'price' => $price,
                'currency' => 'RUB',
                'pricing_type' => $pricingType,
                'status' => 'pending',
                'expires_at' => $expiresAt,
                'auto_renew' => $pricingType === 'subscription',
            ]);

            // Create YooKassa payment
            try {
                $yookassaPayment = $this->createYookassaPayment($user, $purchase, $module);
                
                $purchase->update([
                    'yookassa_payment_id' => $yookassaPayment->getId(),
                ]);

                // Store confirmation URL in metadata or return it
                Log::info('Module purchase created', [
                    'purchase_id' => $purchase->id,
                    'user_id' => $user->id,
                    'module_slug' => $module->slug,
                    'yookassa_payment_id' => $yookassaPayment->getId(),
                ]);

            } catch (\Exception $e) {
                Log::error('Failed to create YooKassa payment for module', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);
                
                $purchase->markAsFailed();
                throw ModulePurchaseException::paymentFailed($module->slug, $e->getMessage());
            }

            return $purchase;
        });
    }


    /**
     * Handle webhook from YooKassa
     */
    public function handlePaymentWebhook(array $payload): bool
    {
        try {
            $paymentId = $payload['object']['id'] ?? null;
            $status = $payload['object']['status'] ?? null;

            if (!$paymentId) {
                Log::warning('Module purchase webhook: missing payment ID', $payload);
                return false;
            }

            // Find purchase by YooKassa payment ID
            $purchase = ModulePurchase::where('yookassa_payment_id', $paymentId)->first();

            if (!$purchase) {
                Log::warning('Module purchase webhook: purchase not found', [
                    'yookassa_payment_id' => $paymentId,
                ]);
                return false;
            }

            // Handle based on status
            switch ($status) {
                case PaymentStatus::SUCCEEDED:
                    $this->handleSucceededPayment($purchase, $payload);
                    break;

                case PaymentStatus::CANCELED:
                    $this->handleCanceledPayment($purchase);
                    break;

                case PaymentStatus::WAITING_FOR_CAPTURE:
                    // Auto-capture is enabled, this shouldn't happen
                    Log::info('Module purchase waiting for capture', [
                        'purchase_id' => $purchase->id,
                    ]);
                    break;

                default:
                    Log::info('Module purchase webhook: unhandled status', [
                        'purchase_id' => $purchase->id,
                        'status' => $status,
                    ]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Module purchase webhook error', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);
            return false;
        }
    }

    /**
     * Handle successful payment
     */
    protected function handleSucceededPayment(ModulePurchase $purchase, array $payload): void
    {
        DB::transaction(function () use ($purchase, $payload) {
            // Mark purchase as completed
            $purchase->markAsCompleted();

            // Save payment method ID for recurring payments
            $paymentMethodId = $payload['object']['payment_method']['id'] ?? null;
            $paymentMethodSaved = $payload['object']['payment_method']['saved'] ?? false;

            if ($paymentMethodId && $paymentMethodSaved) {
                // Store for auto-renewal
                $purchase->update([
                    'yookassa_payment_id' => $paymentMethodId, // Reuse field for saved method
                ]);
            }

            // Auto-enable the module for the user
            try {
                $this->userModuleService->enable($purchase->user, $purchase->module_slug);
            } catch (\Exception $e) {
                Log::error('Failed to auto-enable module after purchase', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Module purchase completed', [
                'purchase_id' => $purchase->id,
                'user_id' => $purchase->user_id,
                'module_slug' => $purchase->module_slug,
            ]);

            // TODO: Send notification to user about successful purchase
        });
    }

    /**
     * Handle canceled payment
     */
    protected function handleCanceledPayment(ModulePurchase $purchase): void
    {
        $purchase->markAsFailed();

        Log::info('Module purchase payment canceled', [
            'purchase_id' => $purchase->id,
            'user_id' => $purchase->user_id,
            'module_slug' => $purchase->module_slug,
        ]);
    }

    /**
     * Check if user has active purchase for module
     */
    public function hasActivePurchase(User $user, string $moduleSlug): bool
    {
        return ModulePurchase::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->active()
            ->exists();
    }

    /**
     * Cancel subscription for a module
     * 
     * @throws ModulePurchaseException
     */
    public function cancelSubscription(User $user, string $moduleSlug): bool
    {
        $purchase = ModulePurchase::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->where('pricing_type', 'subscription')
            ->active()
            ->first();

        if (!$purchase) {
            throw ModulePurchaseException::cannotCancel($moduleSlug, 'активная подписка не найдена');
        }

        // Disable auto-renewal but keep access until expiration
        $purchase->cancelAutoRenew();

        Log::info('Module subscription auto-renewal cancelled', [
            'purchase_id' => $purchase->id,
            'user_id' => $user->id,
            'module_slug' => $moduleSlug,
            'expires_at' => $purchase->expires_at,
        ]);

        return true;
    }

    /**
     * Refund a purchase
     * 
     * @throws ModulePurchaseException
     */
    public function refund(ModulePurchase $purchase, string $reason): bool
    {
        if (!$purchase->isCompleted()) {
            throw ModulePurchaseException::cannotRefund(
                $purchase->module_slug,
                'покупка не завершена'
            );
        }

        // Check if refund is within allowed period (e.g., 14 days)
        $refundPeriodDays = 14;
        if ($purchase->purchased_at && $purchase->purchased_at->diffInDays(now()) > $refundPeriodDays) {
            throw ModulePurchaseException::cannotRefund(
                $purchase->module_slug,
                "срок возврата ({$refundPeriodDays} дней) истёк"
            );
        }

        // TODO: Implement actual refund through YooKassa
        // For now, just mark as refunded
        
        DB::transaction(function () use ($purchase, $reason) {
            $purchase->markAsRefunded($reason);

            // Disable the module for the user
            try {
                $this->userModuleService->disable($purchase->user, $purchase->module_slug);
            } catch (\Exception $e) {
                Log::warning('Failed to disable module after refund', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });

        Log::info('Module purchase refunded', [
            'purchase_id' => $purchase->id,
            'user_id' => $purchase->user_id,
            'module_slug' => $purchase->module_slug,
            'reason' => $reason,
        ]);

        return true;
    }

    /**
     * Get purchase history for a user
     */
    public function getPurchaseHistory(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return ModulePurchase::where('user_id', $user->id)
            ->with('module')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get all purchases for a user (collection)
     */
    public function getUserPurchases(User $user): Collection
    {
        return ModulePurchase::where('user_id', $user->id)
            ->with('module')
            ->orderByDesc('created_at')
            ->get();
    }


    /**
     * Renew subscription (for auto-renewal)
     * 
     * @throws ModulePurchaseException
     */
    public function renewSubscription(ModulePurchase $purchase): bool
    {
        if ($purchase->pricing_type !== 'subscription') {
            throw ModulePurchaseException::renewalFailed(
                $purchase->module_slug,
                'это не подписка'
            );
        }

        if (!$purchase->auto_renew) {
            throw ModulePurchaseException::renewalFailed(
                $purchase->module_slug,
                'автопродление отключено'
            );
        }

        if (!$this->paymentService->isConfigured()) {
            throw ModulePurchaseException::paymentServiceNotConfigured();
        }

        // Get module for current price
        $module = Module::where('slug', $purchase->module_slug)->first();
        if (!$module) {
            throw ModulePurchaseException::moduleNotFound($purchase->module_slug);
        }

        try {
            // Create recurring payment using saved payment method
            $paymentMethodId = $purchase->yookassa_payment_id;
            
            if (!$paymentMethodId) {
                throw ModulePurchaseException::renewalFailed(
                    $purchase->module_slug,
                    'нет сохранённого метода оплаты'
                );
            }

            $idempotenceKey = uniqid('module_renewal_', true);
            
            // Create payment through YooKassa
            $yookassaPayment = $this->createRecurringPayment(
                $purchase->user,
                $module,
                $paymentMethodId,
                $idempotenceKey
            );

            // If payment succeeded immediately
            if ($yookassaPayment->getStatus() === PaymentStatus::SUCCEEDED) {
                $this->extendSubscription($purchase, $module);
                
                Log::info('Module subscription renewed', [
                    'purchase_id' => $purchase->id,
                    'user_id' => $purchase->user_id,
                    'module_slug' => $purchase->module_slug,
                    'new_expires_at' => $purchase->expires_at,
                ]);

                return true;
            }

            // Payment is pending or failed
            Log::warning('Module subscription renewal payment not succeeded', [
                'purchase_id' => $purchase->id,
                'status' => $yookassaPayment->getStatus(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Module subscription renewal failed', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage(),
            ]);

            throw ModulePurchaseException::renewalFailed(
                $purchase->module_slug,
                $e->getMessage()
            );
        }
    }

    /**
     * Extend subscription expiration
     */
    protected function extendSubscription(ModulePurchase $purchase, Module $module): void
    {
        $period = $module->subscription_period ?? 'monthly';
        $newExpiresAt = $this->calculateExpirationDate($period, $purchase->expires_at);

        $purchase->update([
            'expires_at' => $newExpiresAt,
            'status' => 'completed',
        ]);
    }

    /**
     * Calculate expiration date based on period
     */
    protected function calculateExpirationDate(string $period, ?Carbon $from = null): Carbon
    {
        $from = $from ?? now();

        return match ($period) {
            'yearly' => $from->copy()->addYear(),
            'monthly' => $from->copy()->addMonth(),
            default => $from->copy()->addMonth(),
        };
    }

    /**
     * Create YooKassa payment for module purchase
     */
    protected function createYookassaPayment(User $user, ModulePurchase $purchase, Module $module): object
    {
        $idempotenceKey = uniqid('module_purchase_', true);

        $paymentData = [
            'amount' => [
                'value' => number_format($purchase->price, 2, '.', ''),
                'currency' => 'RUB',
            ],
            'confirmation' => [
                'type' => 'redirect',
                'return_url' => $this->getReturnUrl($purchase),
            ],
            'capture' => true,
            'description' => "Покупка модуля: {$module->name}",
            'metadata' => [
                'user_id' => $user->id,
                'module_slug' => $module->slug,
                'purchase_id' => $purchase->id,
                'type' => 'module_purchase',
            ],
        ];

        // Save payment method for subscriptions
        if ($purchase->pricing_type === 'subscription') {
            $paymentData['save_payment_method'] = true;
        }

        // Use reflection to access the protected client
        $reflection = new \ReflectionClass($this->paymentService);
        $clientProperty = $reflection->getProperty('client');
        $clientProperty->setAccessible(true);
        $client = $clientProperty->getValue($this->paymentService);

        return $client->createPayment($paymentData, $idempotenceKey);
    }

    /**
     * Create recurring payment for subscription renewal
     */
    protected function createRecurringPayment(
        User $user,
        Module $module,
        string $paymentMethodId,
        string $idempotenceKey
    ): object {
        $paymentData = [
            'amount' => [
                'value' => number_format($module->price, 2, '.', ''),
                'currency' => 'RUB',
            ],
            'capture' => true,
            'payment_method_id' => $paymentMethodId,
            'description' => "Продление подписки на модуль: {$module->name}",
            'metadata' => [
                'user_id' => $user->id,
                'module_slug' => $module->slug,
                'type' => 'module_renewal',
            ],
        ];

        // Use reflection to access the protected client
        $reflection = new \ReflectionClass($this->paymentService);
        $clientProperty = $reflection->getProperty('client');
        $clientProperty->setAccessible(true);
        $client = $clientProperty->getValue($this->paymentService);

        return $client->createPayment($paymentData, $idempotenceKey);
    }

    /**
     * Get return URL after payment
     */
    protected function getReturnUrl(ModulePurchase $purchase): string
    {
        return config('app.url') . '/app/modules/purchase/success?purchase_id=' . $purchase->id;
    }

    /**
     * Get confirmation URL for a purchase
     */
    public function getConfirmationUrl(ModulePurchase $purchase): ?string
    {
        if (!$purchase->yookassa_payment_id || !$purchase->isPending()) {
            return null;
        }

        try {
            $paymentInfo = $this->paymentService->getPaymentInfo($purchase->yookassa_payment_id);
            
            if ($paymentInfo && $paymentInfo->getConfirmation()) {
                return $paymentInfo->getConfirmation()->getConfirmationUrl();
            }
        } catch (\Exception $e) {
            Log::error('Failed to get confirmation URL', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Get subscriptions expiring soon (for notifications)
     */
    public function getExpiringSubscriptions(int $daysAhead = 3): Collection
    {
        return ModulePurchase::where('pricing_type', 'subscription')
            ->where('status', 'completed')
            ->where('auto_renew', true)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [now(), now()->addDays($daysAhead)])
            ->with(['user', 'module'])
            ->get();
    }

    /**
     * Get expired subscriptions that need to be disabled
     */
    public function getExpiredSubscriptions(): Collection
    {
        return ModulePurchase::expired()
            ->with(['user', 'module'])
            ->get();
    }

    /**
     * Process expired subscriptions (disable modules)
     */
    public function processExpiredSubscriptions(): array
    {
        $processed = [];
        $expiredPurchases = $this->getExpiredSubscriptions();

        foreach ($expiredPurchases as $purchase) {
            // Try to renew if auto-renew is enabled
            if ($purchase->auto_renew) {
                try {
                    $renewed = $this->renewSubscription($purchase);
                    if ($renewed) {
                        $processed[] = [
                            'purchase_id' => $purchase->id,
                            'action' => 'renewed',
                        ];
                        continue;
                    }
                } catch (\Exception $e) {
                    Log::warning('Auto-renewal failed', [
                        'purchase_id' => $purchase->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Disable the module
            try {
                $this->userModuleService->disable($purchase->user, $purchase->module_slug);
                $processed[] = [
                    'purchase_id' => $purchase->id,
                    'action' => 'disabled',
                    'user_id' => $purchase->user_id,
                    'module_slug' => $purchase->module_slug,
                ];
            } catch (\Exception $e) {
                Log::error('Failed to disable expired module', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $processed;
    }
}
