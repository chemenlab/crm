<?php

namespace App\Services\SMS;

use Illuminate\Support\Facades\Log;

class SMSRuProvider implements SMSServiceInterface
{
    /**
     * Send SMS message (stub - only logging)
     */
    public function send(string $phone, string $message): bool
    {
        Log::info('SMS Send (Stub)', [
            'phone' => $phone,
            'message' => $message,
            'provider' => 'sms.ru',
        ]);

        // TODO: Implement real SMS sending when ready
        // Will be integrated with subscription system
        
        return true;
    }

    /**
     * Get account balance (stub)
     */
    public function getBalance(): float
    {
        return 0.0;
    }

    /**
     * Get message delivery status (stub)
     */
    public function getStatus(string $messageId): string
    {
        return 'pending';
    }
}
