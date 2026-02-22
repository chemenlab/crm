<?php

namespace App\Services\SMS;

interface SMSServiceInterface
{
    /**
     * Send SMS message
     */
    public function send(string $phone, string $message): bool;

    /**
     * Get account balance
     */
    public function getBalance(): float;

    /**
     * Get message delivery status
     */
    public function getStatus(string $messageId): string;
}
