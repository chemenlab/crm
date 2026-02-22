<?php

namespace App\Services\Modules;

use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\Exceptions\InvalidManifestException;
use Illuminate\Support\Facades\Log;

/**
 * Validator for module manifest files (module.json)
 */
class ModuleManifestValidator
{
    /**
     * Required fields in manifest
     */
    private const REQUIRED_FIELDS = [
        'slug',
        'name',
        'description',
        'version',
    ];

    /**
     * Valid pricing types
     */
    private const VALID_PRICING_TYPES = ['free', 'subscription', 'one_time'];

    /**
     * Valid subscription periods
     */
    private const VALID_PERIODS = ['monthly', 'yearly'];

    /**
     * Valid categories
     */
    private const VALID_CATEGORIES = [
        'finance',
        'marketing',
        'communication',
        'analytics',
        'productivity',
        'integration',
        'other',
    ];

    /**
     * Parse and validate manifest from JSON string
     */
    public function parseAndValidate(string $json, ?string $path = null): ModuleManifest
    {
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidManifestException(
                'Invalid JSON: ' . json_last_error_msg(),
                $path
            );
        }

        return $this->validate($data, $path);
    }

    /**
     * Validate manifest data array
     */
    public function validate(array $data, ?string $path = null): ModuleManifest
    {
        $errors = [];

        // Check required fields
        foreach (self::REQUIRED_FIELDS as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        // Validate slug format
        if (isset($data['slug']) && !$this->isValidSlug($data['slug'])) {
            $errors[] = "Invalid slug format. Must be lowercase alphanumeric with hyphens.";
        }

        // Validate version format
        if (isset($data['version']) && !$this->isValidVersion($data['version'])) {
            $errors[] = "Invalid version format. Must be semver (e.g., 1.0.0).";
        }

        // Validate pricing
        if (isset($data['pricing'])) {
            $pricingErrors = $this->validatePricing($data['pricing']);
            $errors = array_merge($errors, $pricingErrors);
        }

        // Validate category
        if (isset($data['category']) && !in_array($data['category'], self::VALID_CATEGORIES)) {
            $errors[] = "Invalid category. Must be one of: " . implode(', ', self::VALID_CATEGORIES);
        }

        // Validate hooks
        if (isset($data['hooks']) && !is_array($data['hooks'])) {
            $errors[] = "Hooks must be an array or object.";
        }

        // Validate dependencies
        if (isset($data['dependencies']) && !is_array($data['dependencies'])) {
            $errors[] = "Dependencies must be an array.";
        }

        // Validate permissions
        if (isset($data['permissions']) && !is_array($data['permissions'])) {
            $errors[] = "Permissions must be an array.";
        }

        // Validate settings
        if (isset($data['settings'])) {
            $settingsErrors = $this->validateSettings($data['settings']);
            $errors = array_merge($errors, $settingsErrors);
        }

        // Validate routes
        if (isset($data['routes'])) {
            $routesErrors = $this->validateRoutes($data['routes']);
            $errors = array_merge($errors, $routesErrors);
        }

        if (!empty($errors)) {
            $this->logValidationErrors($data['slug'] ?? 'unknown', $errors, $path);
            throw new InvalidManifestException(
                'Manifest validation failed: ' . implode('; ', $errors),
                $path,
                $errors
            );
        }

        return ModuleManifest::fromArray($data, $path);
    }


    /**
     * Validate slug format
     */
    private function isValidSlug(string $slug): bool
    {
        return preg_match('/^[a-z][a-z0-9-]*[a-z0-9]$/', $slug) === 1 
            || preg_match('/^[a-z]$/', $slug) === 1;
    }

    /**
     * Validate version format (semver)
     */
    private function isValidVersion(string $version): bool
    {
        return preg_match('/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/', $version) === 1;
    }

    /**
     * Validate pricing configuration
     */
    private function validatePricing(array $pricing): array
    {
        $errors = [];

        if (!isset($pricing['type'])) {
            $errors[] = "Pricing must have a type field.";
            return $errors;
        }

        if (!in_array($pricing['type'], self::VALID_PRICING_TYPES)) {
            $errors[] = "Invalid pricing type. Must be one of: " . implode(', ', self::VALID_PRICING_TYPES);
        }

        // Subscription and one_time require price
        if (in_array($pricing['type'], ['subscription', 'one_time'])) {
            if (!isset($pricing['price']) || !is_numeric($pricing['price']) || $pricing['price'] < 0) {
                $errors[] = "Paid modules must have a valid price.";
            }
        }

        // Subscription requires period
        if ($pricing['type'] === 'subscription') {
            if (isset($pricing['period']) && !in_array($pricing['period'], self::VALID_PERIODS)) {
                $errors[] = "Invalid subscription period. Must be one of: " . implode(', ', self::VALID_PERIODS);
            }
        }

        return $errors;
    }

    /**
     * Validate settings schema
     */
    private function validateSettings(array $settings): array
    {
        $errors = [];
        $validTypes = ['string', 'number', 'boolean', 'select', 'textarea'];

        foreach ($settings as $key => $setting) {
            if (!is_array($setting)) {
                $errors[] = "Setting '{$key}' must be an object.";
                continue;
            }

            if (isset($setting['type']) && !in_array($setting['type'], $validTypes)) {
                $errors[] = "Setting '{$key}' has invalid type. Must be one of: " . implode(', ', $validTypes);
            }

            if ($setting['type'] === 'select' && (!isset($setting['options']) || !is_array($setting['options']))) {
                $errors[] = "Setting '{$key}' of type 'select' must have options array.";
            }
        }

        return $errors;
    }

    /**
     * Validate routes configuration
     */
    private function validateRoutes(array $routes): array
    {
        $errors = [];

        if (isset($routes['web']) && !is_string($routes['web'])) {
            $errors[] = "Routes 'web' must be a string path.";
        }

        if (isset($routes['api']) && !is_string($routes['api'])) {
            $errors[] = "Routes 'api' must be a string path.";
        }

        return $errors;
    }

    /**
     * Log validation errors
     */
    private function logValidationErrors(string $slug, array $errors, ?string $path): void
    {
        Log::warning("Module manifest validation failed", [
            'slug' => $slug,
            'path' => $path,
            'errors' => $errors,
        ]);
    }

    /**
     * Check if manifest file is valid without throwing
     */
    public function isValid(array $data): bool
    {
        try {
            $this->validate($data);
            return true;
        } catch (InvalidManifestException) {
            return false;
        }
    }
}
