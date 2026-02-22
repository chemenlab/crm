<?php

namespace App\Services\Modules;

use App\Models\ModuleSetting;
use App\Models\User;
use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\Exceptions\ModuleSettingsException;
use Illuminate\Support\Facades\Log;

/**
 * Service for managing module settings
 * Handles saving, reading, and validating settings against manifest schema
 */
class ModuleSettingsService
{
    public function __construct(
        private readonly ModuleRegistry $registry,
    ) {}

    /**
     * Get a single setting value for a user and module
     */
    public function get(User $user, string $moduleSlug, string $key, mixed $default = null): mixed
    {
        $manifest = $this->registry->get($moduleSlug);
        
        // If no manifest or no settings schema, just return from DB or default
        if ($manifest === null || empty($manifest->settings)) {
            return ModuleSetting::getSettingValue($user->id, $moduleSlug, $key, $default);
        }

        // Get value from DB
        $value = ModuleSetting::getSettingValue($user->id, $moduleSlug, $key);
        
        // If no value in DB, return schema default or provided default
        if ($value === null) {
            return $this->getSchemaDefault($manifest, $key) ?? $default;
        }

        return $value;
    }

    /**
     * Get all settings for a user and module
     * Merges stored values with schema defaults
     */
    public function getAll(User $user, string $moduleSlug): array
    {
        $manifest = $this->registry->get($moduleSlug);
        $storedSettings = ModuleSetting::getAllSettings($user->id, $moduleSlug);

        // If no manifest or no settings schema, just return stored settings
        if ($manifest === null || empty($manifest->settings)) {
            return $storedSettings;
        }

        // Merge schema defaults with stored values
        $result = [];
        foreach ($manifest->settings as $key => $schema) {
            if (array_key_exists($key, $storedSettings)) {
                $result[$key] = $storedSettings[$key];
            } elseif (isset($schema['default'])) {
                $result[$key] = $schema['default'];
            }
        }

        return $result;
    }

    /**
     * Set a single setting value
     * 
     * @throws ModuleSettingsException If validation fails
     */
    public function set(User $user, string $moduleSlug, string $key, mixed $value): void
    {
        $manifest = $this->registry->get($moduleSlug);

        // Validate against schema if available
        if ($manifest !== null && !empty($manifest->settings)) {
            $this->validateSetting($manifest, $key, $value);
        }

        ModuleSetting::setSettingValue($user->id, $moduleSlug, $key, $value);

        Log::debug("Module setting saved", [
            'user_id' => $user->id,
            'module' => $moduleSlug,
            'key' => $key,
        ]);
    }

    /**
     * Set multiple settings at once
     * 
     * @throws ModuleSettingsException If validation fails
     */
    public function setMany(User $user, string $moduleSlug, array $settings): void
    {
        $manifest = $this->registry->get($moduleSlug);

        // Validate all settings first
        if ($manifest !== null && !empty($manifest->settings)) {
            $errors = [];
            foreach ($settings as $key => $value) {
                try {
                    $this->validateSetting($manifest, $key, $value);
                } catch (ModuleSettingsException $e) {
                    $errors[$key] = $e->getMessage();
                }
            }

            if (!empty($errors)) {
                throw ModuleSettingsException::multipleValidationErrors($moduleSlug, $errors);
            }
        }

        // Save all settings
        foreach ($settings as $key => $value) {
            ModuleSetting::setSettingValue($user->id, $moduleSlug, $key, $value);
        }

        Log::debug("Module settings saved", [
            'user_id' => $user->id,
            'module' => $moduleSlug,
            'keys' => array_keys($settings),
        ]);
    }

    /**
     * Delete a single setting
     */
    public function delete(User $user, string $moduleSlug, string $key): bool
    {
        $deleted = ModuleSetting::forUser($user->id)
            ->forModule($moduleSlug)
            ->forKey($key)
            ->delete();

        if ($deleted > 0) {
            Log::debug("Module setting deleted", [
                'user_id' => $user->id,
                'module' => $moduleSlug,
                'key' => $key,
            ]);
        }

        return $deleted > 0;
    }

    /**
     * Delete all settings for a user and module
     */
    public function deleteAll(User $user, string $moduleSlug): int
    {
        $deleted = ModuleSetting::forUser($user->id)
            ->forModule($moduleSlug)
            ->delete();

        if ($deleted > 0) {
            Log::debug("All module settings deleted", [
                'user_id' => $user->id,
                'module' => $moduleSlug,
                'count' => $deleted,
            ]);
        }

        return $deleted;
    }

    /**
     * Reset settings to defaults from schema
     */
    public function resetToDefaults(User $user, string $moduleSlug): array
    {
        $manifest = $this->registry->get($moduleSlug);

        if ($manifest === null || empty($manifest->settings)) {
            // No schema, just delete all settings
            $this->deleteAll($user, $moduleSlug);
            return [];
        }

        // Delete existing settings
        $this->deleteAll($user, $moduleSlug);

        // Get defaults from schema
        $defaults = [];
        foreach ($manifest->settings as $key => $schema) {
            if (isset($schema['default'])) {
                $defaults[$key] = $schema['default'];
            }
        }

        return $defaults;
    }

    /**
     * Get the settings schema for a module
     */
    public function getSchema(string $moduleSlug): array
    {
        $manifest = $this->registry->get($moduleSlug);

        if ($manifest === null) {
            return [];
        }

        return $manifest->settings;
    }

    /**
     * Check if a setting key exists in the schema
     */
    public function hasSchemaKey(string $moduleSlug, string $key): bool
    {
        $manifest = $this->registry->get($moduleSlug);

        if ($manifest === null || empty($manifest->settings)) {
            return false;
        }

        return array_key_exists($key, $manifest->settings);
    }

    /**
     * Validate a single setting against the schema
     * 
     * @throws ModuleSettingsException If validation fails
     */
    private function validateSetting(ModuleManifest $manifest, string $key, mixed $value): void
    {
        // If key not in schema, allow it (for flexibility)
        if (!isset($manifest->settings[$key])) {
            return;
        }

        $schema = $manifest->settings[$key];
        $type = $schema['type'] ?? 'string';

        // Validate type
        $this->validateType($key, $value, $type, $schema);

        // Validate constraints
        $this->validateConstraints($key, $value, $schema);
    }

    /**
     * Validate value type
     * 
     * @throws ModuleSettingsException If type validation fails
     */
    private function validateType(string $key, mixed $value, string $type, array $schema): void
    {
        $valid = match ($type) {
            'string', 'textarea' => is_string($value) || is_null($value),
            'number' => is_numeric($value) || is_null($value),
            'boolean' => is_bool($value) || $value === 0 || $value === 1 || is_null($value),
            'select' => $this->validateSelectValue($value, $schema),
            default => true, // Unknown types pass validation
        };

        if (!$valid) {
            throw ModuleSettingsException::invalidType($key, $type, gettype($value));
        }
    }

    /**
     * Validate select value against options
     */
    private function validateSelectValue(mixed $value, array $schema): bool
    {
        if ($value === null) {
            return true;
        }

        if (!isset($schema['options']) || !is_array($schema['options'])) {
            return true;
        }

        return in_array($value, $schema['options'], true);
    }

    /**
     * Validate additional constraints
     * 
     * @throws ModuleSettingsException If constraint validation fails
     */
    private function validateConstraints(string $key, mixed $value, array $schema): void
    {
        if ($value === null) {
            // Check if required
            if (isset($schema['required']) && $schema['required'] === true) {
                throw ModuleSettingsException::required($key);
            }
            return;
        }

        // Min/max for numbers
        if (is_numeric($value)) {
            if (isset($schema['min']) && $value < $schema['min']) {
                throw ModuleSettingsException::belowMinimum($key, $schema['min'], $value);
            }
            if (isset($schema['max']) && $value > $schema['max']) {
                throw ModuleSettingsException::aboveMaximum($key, $schema['max'], $value);
            }
        }

        // Min/max length for strings
        if (is_string($value)) {
            $length = mb_strlen($value);
            if (isset($schema['minLength']) && $length < $schema['minLength']) {
                throw ModuleSettingsException::tooShort($key, $schema['minLength'], $length);
            }
            if (isset($schema['maxLength']) && $length > $schema['maxLength']) {
                throw ModuleSettingsException::tooLong($key, $schema['maxLength'], $length);
            }
        }
    }

    /**
     * Get default value from schema
     */
    private function getSchemaDefault(ModuleManifest $manifest, string $key): mixed
    {
        if (!isset($manifest->settings[$key])) {
            return null;
        }

        return $manifest->settings[$key]['default'] ?? null;
    }
}
