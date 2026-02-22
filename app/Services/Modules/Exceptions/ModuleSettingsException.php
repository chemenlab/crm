<?php

namespace App\Services\Modules\Exceptions;

use Exception;

/**
 * Exception for module settings validation errors
 */
class ModuleSettingsException extends Exception
{
    /**
     * The setting key that caused the error
     */
    private ?string $settingKey;

    /**
     * Multiple validation errors (key => message)
     */
    private array $errors;

    public function __construct(
        string $message,
        ?string $settingKey = null,
        array $errors = [],
        int $code = 0,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->settingKey = $settingKey;
        $this->errors = $errors;
    }

    /**
     * Get the setting key that caused the error
     */
    public function getSettingKey(): ?string
    {
        return $this->settingKey;
    }

    /**
     * Get all validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Invalid type error
     */
    public static function invalidType(string $key, string $expectedType, string $actualType): self
    {
        return new self(
            "Setting '{$key}' must be of type '{$expectedType}', got '{$actualType}'",
            $key
        );
    }

    /**
     * Required field error
     */
    public static function required(string $key): self
    {
        return new self(
            "Setting '{$key}' is required",
            $key
        );
    }

    /**
     * Value below minimum error
     */
    public static function belowMinimum(string $key, mixed $min, mixed $value): self
    {
        return new self(
            "Setting '{$key}' must be at least {$min}, got {$value}",
            $key
        );
    }

    /**
     * Value above maximum error
     */
    public static function aboveMaximum(string $key, mixed $max, mixed $value): self
    {
        return new self(
            "Setting '{$key}' must be at most {$max}, got {$value}",
            $key
        );
    }

    /**
     * String too short error
     */
    public static function tooShort(string $key, int $minLength, int $actualLength): self
    {
        return new self(
            "Setting '{$key}' must be at least {$minLength} characters, got {$actualLength}",
            $key
        );
    }

    /**
     * String too long error
     */
    public static function tooLong(string $key, int $maxLength, int $actualLength): self
    {
        return new self(
            "Setting '{$key}' must be at most {$maxLength} characters, got {$actualLength}",
            $key
        );
    }

    /**
     * Invalid select option error
     */
    public static function invalidOption(string $key, mixed $value, array $validOptions): self
    {
        $optionsStr = implode(', ', $validOptions);
        return new self(
            "Setting '{$key}' has invalid value '{$value}'. Valid options: {$optionsStr}",
            $key
        );
    }

    /**
     * Multiple validation errors
     */
    public static function multipleValidationErrors(string $moduleSlug, array $errors): self
    {
        $count = count($errors);
        return new self(
            "Module '{$moduleSlug}' has {$count} validation error(s)",
            null,
            $errors
        );
    }

    /**
     * Module not found error
     */
    public static function moduleNotFound(string $moduleSlug): self
    {
        return new self(
            "Module '{$moduleSlug}' not found"
        );
    }
}
