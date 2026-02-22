<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleGlobalSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_slug',
        'key',
        'value',
        'updated_by',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get the module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
    }

    /**
     * Get the user who last updated this setting
     */
    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the raw value (unwrapped from array if single value)
     */
    public function getValue(): mixed
    {
        $value = $this->value;

        // If value is an array with single element, return that element
        if (is_array($value) && count($value) === 1 && array_key_exists(0, $value)) {
            return $value[0];
        }

        return $value;
    }

    /**
     * Set the value
     */
    public function setValue(mixed $value, ?int $updatedBy = null): void
    {
        $this->update([
            'value' => $value,
            'updated_by' => $updatedBy,
        ]);
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope for specific key
     */
    public function scopeForKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    /**
     * Get global setting value for module
     */
    public static function getSettingValue(string $moduleSlug, string $key, mixed $default = null): mixed
    {
        $setting = static::forModule($moduleSlug)
            ->forKey($key)
            ->first();

        return $setting ? $setting->getValue() : $default;
    }

    /**
     * Set global setting value for module
     */
    public static function setSettingValue(string $moduleSlug, string $key, mixed $value, ?int $updatedBy = null): static
    {
        return static::updateOrCreate(
            [
                'module_slug' => $moduleSlug,
                'key' => $key,
            ],
            [
                'value' => $value,
                'updated_by' => $updatedBy,
            ]
        );
    }

    /**
     * Get all global settings for module as key-value array
     */
    public static function getAllSettings(string $moduleSlug): array
    {
        return static::forModule($moduleSlug)
            ->get()
            ->mapWithKeys(fn ($setting) => [$setting->key => $setting->getValue()])
            ->toArray();
    }
}
