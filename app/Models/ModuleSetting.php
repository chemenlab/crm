<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_slug',
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
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
     * Set the value (wrap in array if not already)
     */
    public function setValue(mixed $value): void
    {
        $this->update(['value' => $value]);
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope for specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for specific key
     */
    public function scopeForKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    /**
     * Get setting value for user and module
     */
    public static function getSettingValue(int $userId, string $moduleSlug, string $key, mixed $default = null): mixed
    {
        $setting = static::forUser($userId)
            ->forModule($moduleSlug)
            ->forKey($key)
            ->first();

        return $setting ? $setting->getValue() : $default;
    }

    /**
     * Set setting value for user and module
     */
    public static function setSettingValue(int $userId, string $moduleSlug, string $key, mixed $value): static
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'module_slug' => $moduleSlug,
                'key' => $key,
            ],
            ['value' => $value]
        );
    }

    /**
     * Get all settings for user and module as key-value array
     */
    public static function getAllSettings(int $userId, string $moduleSlug): array
    {
        return static::forUser($userId)
            ->forModule($moduleSlug)
            ->get()
            ->mapWithKeys(fn ($setting) => [$setting->key => $setting->getValue()])
            ->toArray();
    }
}
