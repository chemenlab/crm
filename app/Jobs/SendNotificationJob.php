<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Services\VK\VKService;
use App\Services\Telegram\TelegramBotService;
use App\Services\SMS\SMSRuProvider;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Notification $notification
    ) {
        // Set queue priority based on urgency
        $this->onQueue($this->determineQueue());
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $result = match ($this->notification->channel) {
                'vk' => $this->sendVK(),
                'telegram' => $this->sendTelegram(),
                'sms' => $this->sendSMS(),
                'email' => $this->sendEmail(),
                default => throw new \Exception("Unknown channel: {$this->notification->channel}"),
            };

            if ($result['success']) {
                $this->notification->markAsSent();
                
                // Mark as delivered immediately for some channels
                if (in_array($this->notification->channel, ['telegram', 'sms'])) {
                    $this->notification->markAsDelivered();
                }
            } else {
                throw new \Exception($result['error'] ?? 'Unknown error');
            }
        } catch (\Exception $e) {
            Log::error('Notification Send Failed', [
                'notification_id' => $this->notification->id,
                'channel' => $this->notification->channel,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $this->notification->markAsFailed($e->getMessage());
            } else {
                throw $e; // Retry
            }
        }
    }

    /**
     * Send via VK
     */
    protected function sendVK(): array
    {
        $vkService = app(VKService::class);
        $integration = $this->notification->user->vkIntegration;

        if (!$integration || !$integration->is_active) {
            return [
                'success' => false,
                'error' => 'VK integration not active',
            ];
        }

        return $vkService->sendMessage(
            $this->notification->recipient,
            $this->notification->body,
            $integration
        );
    }

    /**
     * Send via Telegram
     */
    protected function sendTelegram(): array
    {
        try {
            $telegramService = app(TelegramBotService::class);
            $telegramService->sendMessage(
                $this->notification->user,
                $this->notification->body
            );

            return ['success' => true];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send via SMS
     */
    protected function sendSMS(): array
    {
        $smsService = app(SMSRuProvider::class);
        $success = $smsService->send(
            $this->notification->recipient,
            $this->notification->body
        );

        return [
            'success' => $success,
            'error' => $success ? null : 'SMS send failed',
        ];
    }

    /**
     * Send via Email
     */
    protected function sendEmail(): array
    {
        // TODO: Implement email sending
        Log::info('Email notification (not implemented)', [
            'recipient' => $this->notification->recipient,
            'subject' => $this->notification->subject,
        ]);

        return ['success' => true];
    }

    /**
     * Determine queue based on urgency
     */
    protected function determineQueue(): string
    {
        // Urgent notifications (< 2 hours) go to high priority queue
        if ($this->notification->appointment) {
            $hoursUntil = now()->diffInHours($this->notification->appointment->start_time, false);
            
            if ($hoursUntil < 2 && $hoursUntil > 0) {
                return 'notifications';
            }
        }

        return 'notifications-low';
    }
}
