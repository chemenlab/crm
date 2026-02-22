<?php

namespace App\Services\VK;

use App\Models\VKIntegration;
use VK\Client\VKApiClient;
use VK\Exceptions\VKApiException;
use VK\Exceptions\VKClientException;
use Illuminate\Support\Facades\Log;

class VKService
{
    protected VKApiClient $vk;

    public function __construct()
    {
        $this->vk = new VKApiClient();
    }

    /**
     * Send message to VK user
     */
    public function sendMessage(string $vkId, string $message, VKIntegration $integration): array
    {
        try {
            $accessToken = $integration->access_token;
            
            $response = $this->vk->messages()->send($accessToken, [
                'user_id' => $vkId,
                'message' => $message,
                'random_id' => random_int(1, PHP_INT_MAX),
            ]);

            return [
                'success' => true,
                'message_id' => $response,
            ];
        } catch (VKApiException $e) {
            Log::error('VK API Error', [
                'error_code' => $e->getCode(),
                'error_msg' => $e->getMessage(),
                'vk_id' => $vkId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ];
        } catch (VKClientException $e) {
            Log::error('VK Client Error', [
                'error' => $e->getMessage(),
                'vk_id' => $vkId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify integration token validity
     */
    public function verifyIntegration(VKIntegration $integration): bool
    {
        try {
            $accessToken = $integration->access_token;
            
            // Try to get group info
            $response = $this->vk->groups()->getById($accessToken, [
                'group_id' => $integration->group_id,
            ]);

            return !empty($response);
        } catch (\Exception $e) {
            Log::error('VK Integration Verification Failed', [
                'error' => $e->getMessage(),
                'group_id' => $integration->group_id,
            ]);

            return false;
        }
    }

    /**
     * Handle VK webhook callback
     */
    public function handleWebhook(array $data, VKIntegration $integration): array
    {
        $type = $data['type'] ?? null;

        return match ($type) {
            'confirmation' => $this->handleConfirmation($integration),
            'message_new' => $this->handleMessageNew($data),
            'message_reply' => $this->handleMessageReply($data),
            default => ['ok'],
        };
    }

    /**
     * Get confirmation code for Callback API
     */
    public function getConfirmationCode(VKIntegration $integration): string
    {
        return $integration->confirmation_code ?? '';
    }

    /**
     * Verify webhook signature
     */
    public function verifySignature(string $secret, array $data, string $signature): bool
    {
        $dataString = '';
        foreach ($data as $key => $value) {
            if ($key !== 'secret') {
                $dataString .= is_array($value) ? json_encode($value) : $value;
            }
        }
        
        $calculatedSignature = md5($dataString . $secret);
        
        return hash_equals($calculatedSignature, $signature);
    }

    /**
     * Handle confirmation request
     */
    protected function handleConfirmation(VKIntegration $integration): array
    {
        return [
            'response' => $integration->confirmation_code,
        ];
    }

    /**
     * Handle new message from user
     */
    protected function handleMessageNew(array $data): array
    {
        // Log incoming message for future processing
        Log::info('VK Message Received', [
            'from_id' => $data['object']['message']['from_id'] ?? null,
            'text' => $data['object']['message']['text'] ?? null,
        ]);

        return ['ok'];
    }

    /**
     * Handle message reply (delivery confirmation)
     */
    protected function handleMessageReply(array $data): array
    {
        // Update notification status to delivered
        Log::info('VK Message Delivered', [
            'peer_id' => $data['object']['peer_id'] ?? null,
            'message_id' => $data['object']['id'] ?? null,
        ]);

        return ['ok'];
    }
}
