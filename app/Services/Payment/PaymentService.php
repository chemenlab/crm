<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use YooKassa\Client;
use YooKassa\Model\Payment\PaymentStatus;
use YooKassa\Model\Notification\NotificationSucceeded;
use YooKassa\Model\Notification\NotificationWaitingForCapture;
use YooKassa\Model\Notification\NotificationCanceled;
use App\Services\Subscription\SubscriptionService;

class PaymentService
{
    protected ?Client $client = null;
    protected bool $isConfigured = false;

    public function __construct()
    {
        $shopId = config('services.yookassa.shop_id');
        $secretKey = config('services.yookassa.secret_key');

        // Graceful degradation: don't throw if not configured
        if (!$shopId || !$secretKey || $shopId === 'your_shop_id_here' || $secretKey === 'your_secret_key_here') {
            Log::warning('YooKassa credentials are not configured. Payment features will be disabled.');
            return;
        }

        try {
            $this->client = new Client();
            $this->client->setAuth($shopId, $secretKey);
            $this->isConfigured = true;
        } catch (\Exception $e) {
            Log::error('Failed to initialize YooKassa client', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Check if payment service is configured
     */
    public function isConfigured(): bool
    {
        return $this->isConfigured && $this->client !== null;
    }

    /**
     * Ensure service is configured before operations
     */
    protected function ensureConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException(
                'YooKassa is not configured. Please set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY in your .env file.'
            );
        }
    }

    /**
     * Create payment for subscription
     */
    public function createPayment(
        User $user,
        Subscription $subscription,
        float $amount,
        string $description,
        bool $savePaymentMethod = true
    ): Payment {
        $this->ensureConfigured();

        try {
            $idempotenceKey = uniqid('', true);

            $paymentData = [
                'amount' => [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency' => 'RUB',
                ],
                'confirmation' => [
                    'type' => 'redirect',
                    'return_url' => config('services.yookassa.return_url'),
                ],
                'capture' => true,
                'description' => $description,
                'metadata' => [
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                ],
            ];

            // Сохранение платежного метода для рекуррентных платежей
            if ($savePaymentMethod) {
                $paymentData['save_payment_method'] = true;
            }

            $yookassaPayment = $this->client->createPayment($paymentData, $idempotenceKey);

            // Создаем запись в БД
            $payment = Payment::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'yookassa_payment_id' => $yookassaPayment->getId(),
                'status' => $yookassaPayment->getStatus(),
                'amount' => $amount,
                'currency' => 'RUB',
                'description' => $description,
                'metadata' => [
                    'confirmation_url' => $yookassaPayment->getConfirmation()->getConfirmationUrl(),
                ],
                'expires_at' => $yookassaPayment->getExpiresAt(),
            ]);

            return $payment;
        } catch (\Exception $e) {
            Log::error('YooKassa Create Payment Error', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
            ]);

            throw $e;
        }
    }

    /**
     * Create recurring payment
     */
    public function createRecurringPayment(
        User $user,
        Subscription $subscription,
        string $paymentMethodId,
        float $amount,
        string $description
    ): Payment {
        $this->ensureConfigured();

        try {
            $idempotenceKey = uniqid('', true);

            $paymentData = [
                'amount' => [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency' => 'RUB',
                ],
                'capture' => true,
                'payment_method_id' => $paymentMethodId,
                'description' => $description,
                'metadata' => [
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'recurring' => true,
                ],
            ];

            $yookassaPayment = $this->client->createPayment($paymentData, $idempotenceKey);

            $payment = Payment::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'yookassa_payment_id' => $yookassaPayment->getId(),
                'status' => $yookassaPayment->getStatus(),
                'amount' => $amount,
                'currency' => 'RUB',
                'payment_method' => 'recurring',
                'description' => $description,
                'metadata' => [
                    'payment_method_id' => $paymentMethodId,
                    'recurring' => true,
                ],
            ]);

            return $payment;
        } catch (\Exception $e) {
            Log::error('YooKassa Create Recurring Payment Error', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
            ]);

            throw $e;
        }
    }

    /**
     * Get payment info from YooKassa
     */
    public function getPaymentInfo(string $paymentId): ?\YooKassa\Request\Payments\PaymentResponse
    {
        try {
            return $this->client->getPaymentInfo($paymentId);
        } catch (\Exception $e) {
            Log::error('YooKassa Get Payment Info Error', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId,
            ]);

            return null;
        }
    }

    /**
     * Cancel payment
     */
    public function cancelPayment(Payment $payment): bool
    {
        try {
            $idempotenceKey = uniqid('', true);

            $this->client->cancelPayment(
                $payment->yookassa_payment_id,
                $idempotenceKey
            );

            $payment->markAsCancelled();

            return true;
        } catch (\Exception $e) {
            Log::error('YooKassa Cancel Payment Error', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
            ]);

            return false;
        }
    }

    /**
     * Handle webhook notification
     */
    public function handleWebhook(array $requestData): bool
    {
        try {
            $notification = $this->parseNotification($requestData);

            if (!$notification) {
                return false;
            }

            $yookassaPayment = $notification->getObject();
            $payment = Payment::where('yookassa_payment_id', $yookassaPayment->getId())->first();

            if (!$payment) {
                Log::warning('Payment not found for webhook', [
                    'yookassa_payment_id' => $yookassaPayment->getId(),
                ]);
                return false;
            }

            // Обновляем статус платежа
            $payment->update([
                'status' => $yookassaPayment->getStatus(),
                'payment_method' => $yookassaPayment->getPaymentMethod()?->getType(),
            ]);

            // Обрабатываем в зависимости от статуса
            switch ($yookassaPayment->getStatus()) {
                case PaymentStatus::SUCCEEDED:
                    $this->handleSucceededPayment($payment, $yookassaPayment);
                    break;

                case PaymentStatus::CANCELED:
                    $this->handleCanceledPayment($payment);
                    break;

                case PaymentStatus::WAITING_FOR_CAPTURE:
                    // Автоматически подтверждаем платеж
                    $this->capturePayment($payment);
                    break;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('YooKassa Webhook Error', [
                'error' => $e->getMessage(),
                'request_data' => $requestData,
            ]);

            return false;
        }
    }

    /**
     * Parse notification from webhook
     */
    protected function parseNotification(array $requestData)
    {
        try {
            $notificationFactory = new \YooKassa\Model\Notification\NotificationFactory();
            return $notificationFactory->factory($requestData);
        } catch (\Exception $e) {
            Log::error('Failed to parse YooKassa notification', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Handle succeeded payment
     */
    protected function handleSucceededPayment(Payment $payment, $yookassaPayment): void
    {
        $payment->markAsSucceeded();

        // Сохраняем payment_method_id для рекуррентных платежей
        if ($yookassaPayment->getPaymentMethod() && $yookassaPayment->getPaymentMethod()->getSaved()) {
            $metadata = $payment->metadata ?? [];
            $metadata['payment_method_id'] = $yookassaPayment->getPaymentMethod()->getId();
            $payment->update(['metadata' => $metadata]);
        }

        // Активируем подписку через SubscriptionService
        if ($payment->subscription) {
            app(SubscriptionService::class)->activateSubscription($payment->subscription, $payment);
        }
    }

    /**
     * Handle canceled payment
     */
    protected function handleCanceledPayment(Payment $payment): void
    {
        $payment->markAsCancelled();

        // Можно отправить уведомление пользователю
        Log::info('Payment cancelled', [
            'payment_id' => $payment->id,
            'user_id' => $payment->user_id,
        ]);
    }

    /**
     * Capture payment (confirm)
     */
    protected function capturePayment(Payment $payment): bool
    {
        try {
            $idempotenceKey = uniqid('', true);

            $this->client->capturePayment(
                [
                    'amount' => [
                        'value' => number_format((float) $payment->amount, 2, '.', ''),
                        'currency' => $payment->currency,
                    ],
                ],
                $payment->yookassa_payment_id,
                $idempotenceKey
            );

            return true;
        } catch (\Exception $e) {
            Log::error('YooKassa Capture Payment Error', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
            ]);

            return false;
        }
    }

    /**
     * Get confirmation URL for payment
     */
    public function getConfirmationUrl(Payment $payment): ?string
    {
        return $payment->metadata['confirmation_url'] ?? null;
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $requestBody, string $signature): bool
    {
        $webhookSecret = config('services.yookassa.webhook_secret');

        if (!$webhookSecret) {
            Log::warning('YooKassa webhook secret is not configured. Rejecting webhook request.');
            return false;
        }

        if (!$signature) {
            Log::warning('YooKassa webhook signature is missing.');
            return false;
        }

        $calculatedSignature = hash_hmac('sha256', $requestBody, $webhookSecret);

        return hash_equals($calculatedSignature, $signature);
    }
}
