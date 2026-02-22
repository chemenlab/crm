<?php

namespace App\Services\Modules\Exceptions;

use Exception;
use Throwable;

/**
 * Exception thrown when module access is denied
 */
class ModuleAccessException extends Exception
{
    public const REASON_NOT_FOUND = 'not_found';
    public const REASON_GLOBALLY_DISABLED = 'globally_disabled';
    public const REASON_SUBSCRIPTION_REQUIRED = 'subscription_required';
    public const REASON_PLAN_REQUIRED = 'plan_required';
    public const REASON_PURCHASE_REQUIRED = 'purchase_required';
    public const REASON_DEPENDENCIES_MISSING = 'dependencies_missing';

    public function __construct(
        string $message,
        public readonly string $moduleSlug,
        public readonly string $reason,
        public readonly array $context = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * Get the module slug
     */
    public function getModuleSlug(): string
    {
        return $this->moduleSlug;
    }

    /**
     * Get the reason for access denial
     */
    public function getReason(): string
    {
        return $this->reason;
    }

    /**
     * Get additional context
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Create exception for module not found
     */
    public static function notFound(string $moduleSlug): self
    {
        return new self(
            "Module not found: {$moduleSlug}",
            $moduleSlug,
            self::REASON_NOT_FOUND
        );
    }

    /**
     * Create exception for globally disabled module
     */
    public static function globallyDisabled(string $moduleSlug): self
    {
        return new self(
            "Module is globally disabled: {$moduleSlug}",
            $moduleSlug,
            self::REASON_GLOBALLY_DISABLED
        );
    }

    /**
     * Create exception for subscription required
     */
    public static function subscriptionRequired(string $moduleSlug): self
    {
        return new self(
            "Active subscription required for module: {$moduleSlug}",
            $moduleSlug,
            self::REASON_SUBSCRIPTION_REQUIRED
        );
    }

    /**
     * Create exception for plan required
     */
    public static function planRequired(string $moduleSlug, string $requiredPlan, ?string $currentPlan = null): self
    {
        return new self(
            "Module {$moduleSlug} requires plan: {$requiredPlan}",
            $moduleSlug,
            self::REASON_PLAN_REQUIRED,
            [
                'required_plan' => $requiredPlan,
                'current_plan' => $currentPlan,
            ]
        );
    }

    /**
     * Create exception for purchase required
     */
    public static function purchaseRequired(string $moduleSlug, float $price): self
    {
        return new self(
            "Purchase required for module: {$moduleSlug}",
            $moduleSlug,
            self::REASON_PURCHASE_REQUIRED,
            ['price' => $price]
        );
    }

    /**
     * Create exception for missing dependencies
     */
    public static function dependenciesMissing(string $moduleSlug, array $missingDependencies): self
    {
        return new self(
            "Module {$moduleSlug} requires dependencies: " . implode(', ', $missingDependencies),
            $moduleSlug,
            self::REASON_DEPENDENCIES_MISSING,
            ['missing_dependencies' => $missingDependencies]
        );
    }
}
