<?php

namespace App\Services\Modules\Exceptions;

use Exception;

class ModuleAdminException extends Exception
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

    /**
     * Module not found
     */
    public static function moduleNotFound(string $moduleSlug): self
    {
        return new self(
            "Модуль '{$moduleSlug}' не найден",
            $moduleSlug,
            'MODULE_NOT_FOUND'
        );
    }

    /**
     * Invalid pricing type
     */
    public static function invalidPricingType(string $pricingType): self
    {
        return new self(
            "Недопустимый тип монетизации: '{$pricingType}'. Допустимые значения: free, subscription, one_time",
            null,
            'INVALID_PRICING_TYPE'
        );
    }

    /**
     * Invalid subscription period
     */
    public static function invalidSubscriptionPeriod(string $period): self
    {
        return new self(
            "Недопустимый период подписки: '{$period}'. Допустимые значения: monthly, yearly",
            null,
            'INVALID_SUBSCRIPTION_PERIOD'
        );
    }

    /**
     * Grant already exists
     */
    public static function grantAlreadyExists(string $moduleSlug, int $userId): self
    {
        return new self(
            "Пользователь уже имеет бесплатный доступ к модулю '{$moduleSlug}'",
            $moduleSlug,
            'GRANT_ALREADY_EXISTS'
        );
    }

    /**
     * Grant not found
     */
    public static function grantNotFound(string $moduleSlug, int $userId): self
    {
        return new self(
            "Бесплатный доступ к модулю '{$moduleSlug}' для пользователя не найден",
            $moduleSlug,
            'GRANT_NOT_FOUND'
        );
    }

    /**
     * Cannot disable module with active users
     */
    public static function cannotDisableWithActiveUsers(string $moduleSlug, int $activeCount): self
    {
        return new self(
            "Невозможно отключить модуль '{$moduleSlug}': {$activeCount} активных пользователей",
            $moduleSlug,
            'CANNOT_DISABLE_WITH_ACTIVE_USERS'
        );
    }

    /**
     * Invalid module data
     */
    public static function invalidModuleData(string $moduleSlug, string $reason): self
    {
        return new self(
            "Некорректные данные модуля '{$moduleSlug}': {$reason}",
            $moduleSlug,
            'INVALID_MODULE_DATA'
        );
    }
}
