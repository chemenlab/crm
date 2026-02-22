<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingSetting extends Model
{
    protected $fillable = [
        'section',
        'key',
        'value',
        'is_active',
        'order',
    ];

    protected $casts = [
        'value' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get settings by section
     */
    public static function getBySection(string $section): array
    {
        return self::where('section', $section)
            ->where('is_active', true)
            ->orderBy('order')
            ->get()
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get all active settings grouped by section
     */
    public static function getAllSettings(): array
    {
        return self::where('is_active', true)
            ->orderBy('section')
            ->orderBy('order')
            ->get()
            ->groupBy('section')
            ->map(function ($items) {
                return $items->pluck('value', 'key')->toArray();
            })
            ->toArray();
    }

    /**
     * Update or create setting
     */
    public static function setSetting(string $section, string $key, array $value, int $order = 0): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'section' => $section,
                'value' => $value,
                'order' => $order,
            ]
        );
    }
}
