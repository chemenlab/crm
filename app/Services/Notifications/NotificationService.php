<?php

namespace App\Services\Notifications;

use App\Models\Client;
use App\Models\Notification;
use App\Models\User;
use App\Jobs\SendNotificationJob;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function __construct(
        protected TemplateService $templateService
    ) {}

    /**
     * Send notification to client
     */
    public function send(
        User $master,
        Client $client,
        string $type,
        array $data,
        ?string $preferredChannel = null
    ): Notification {
        // Select channel
        $channel = $this->selectChannel($client, $preferredChannel);
        
        if (!$channel) {
            throw new \Exception('No available notification channels for client');
        }

        // Get template
        $template = $this->templateService->getTemplate($master, $type, $channel);
        
        if (!$template) {
            throw new \Exception("Template not found for type: {$type}, channel: {$channel}");
        }

        // Render template
        $body = $this->templateService->render($template, $data);
        $subject = $template->subject ? $this->templateService->render($template, $data) : null;

        // Get recipient
        $recipient = $this->getRecipient($client, $channel);

        // Create notification log
        $notification = Notification::create([
            'user_id' => $master->id,
            'client_id' => $client->id,
            'appointment_id' => $data['appointment_id'] ?? null,
            'type' => $type,
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'body' => $body,
            'status' => 'pending',
            'metadata' => [
                'template_id' => $template->id,
                'data' => $data,
            ],
        ]);

        // Dispatch job to queue
        SendNotificationJob::dispatch($notification);

        return $notification;
    }

    /**
     * Send notification to master (Telegram)
     */
    public function sendToMaster(
        User $master,
        string $type,
        array $data
    ): Notification {
        $channel = 'telegram';
        
        // Get template
        $template = $this->templateService->getTemplate($master, $type, $channel);
        
        if (!$template) {
            throw new \Exception("Template not found for type: {$type}, channel: {$channel}");
        }

        // Render template
        $body = $this->templateService->render($template, $data);

        // Create notification log
        $notification = Notification::create([
            'user_id' => $master->id,
            'type' => $type,
            'channel' => $channel,
            'recipient' => $master->id,
            'body' => $body,
            'status' => 'pending',
            'metadata' => [
                'template_id' => $template->id,
                'data' => $data,
            ],
        ]);

        // Dispatch job to queue
        SendNotificationJob::dispatch($notification);

        return $notification;
    }

    /**
     * Get available channels for client
     */
    public function getAvailableChannels(Client $client): array
    {
        return $client->getAvailableChannels();
    }

    /**
     * Select optimal channel for client
     */
    public function selectChannel(Client $client, ?string $preferred = null): ?string
    {
        $available = $this->getAvailableChannels($client);

        if (empty($available)) {
            return null;
        }

        // If preferred channel is specified and available, use it
        if ($preferred && in_array($preferred, $available)) {
            return $preferred;
        }

        // Use client's preferred channel if available
        $clientPreferred = $client->getPreferredChannel();
        if ($clientPreferred && in_array($clientPreferred, $available)) {
            return $clientPreferred;
        }

        // Fallback order: VK → SMS → Email
        $fallbackOrder = ['vk', 'sms', 'email', 'telegram'];
        
        foreach ($fallbackOrder as $channel) {
            if (in_array($channel, $available)) {
                return $channel;
            }
        }

        return $available[0];
    }

    /**
     * Retry failed notification
     */
    public function retry(Notification $notification): void
    {
        $notification->update([
            'status' => 'pending',
            'error_message' => null,
        ]);

        SendNotificationJob::dispatch($notification);
    }

    /**
     * Get recipient identifier for channel
     */
    protected function getRecipient(Client $client, string $channel): string
    {
        return match ($channel) {
            'vk' => $client->vk_id,
            'telegram' => $client->telegram_id,
            'sms' => $client->phone,
            'email' => $client->email,
            default => throw new \Exception("Unknown channel: {$channel}"),
        };
    }
}
