<?php

namespace App\Services\Modules\Exceptions;

use Exception;

/**
 * Exception for module purchase errors
 */
class ModulePurchaseException extends Exception
{
    public function __construct(
        string $message,
        public readonly ?string $moduleSlug = null,
        public readonly ?string $errorCode = null,
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    public static function moduleNotFound(string $moduleSlug): self
    {
        return new self(
            "Модуль '{$moduleSlug}' не найден",
            $moduleSlug,
            'module_not_found'
        );
    }

    public static function moduleIsFree(string $moduleSlug): self
    {
        return new self(
            "Модуль '{$moduleSlug}' бесплатный и не требует покупки",
            $moduleSlug,
            'module_is_free'
        );
    }

    public static function alreadyPurchased(string $moduleSlug): self
    {
        return new self(
            "Модуль '{$moduleSlug}' уже куплен",
            $moduleSlug,
            'already_purchased'
        );
    }

    public static function paymentFailed(string $moduleSlug, string $reason): self
    {
        return new self(
            "Ошибка оплаты модуля '{$moduleSlug}': {$reason}",
            $moduleSlug,
            'payment_failed'
        );
    }

    public static function purchaseNotFound(int $purchaseId): self
    {
        return new self(
            "Покупка #{$purchaseId} не найдена",
            null,
            'purchase_not_found'
        );
    }

    public static function cannotCancel(string $moduleSlug, string $reason): self
    {
        return new self(
            "Невозможно отменить подписку на модуль '{$moduleSlug}': {$reason}",
            $moduleSlug,
            'cannot_cancel'
        );
    }

    public static function cannotRefund(string $moduleSlug, string $reason): self
    {
        return new self(
            "Невозможно вернуть средства за модуль '{$moduleSlug}': {$reason}",
            $moduleSlug,
            'cannot_refund'
        );
    }

    public static function renewalFailed(string $moduleSlug, string $reason): self
    {
        return new self(
            "Ошибка продления подписки на модуль '{$moduleSlug}': {$reason}",
            $moduleSlug,
            'renewal_failed'
        );
    }

    public static function paymentServiceNotConfigured(): self
    {
        return new self(
            'Платёжная система не настроена',
            null,
            'payment_service_not_configured'
        );
    }
}
