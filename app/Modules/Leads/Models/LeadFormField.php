<?php

namespace App\Modules\Leads\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFormField extends Model
{
    protected $table = 'lead_form_fields';

    protected $fillable = [
        'user_id',
        'label',
        'type',
        'options',
        'is_required',
        'is_active',
        'position',
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    /**
     * Available field types
     */
    public const TYPE_TEXT = 'text';
    public const TYPE_TEXTAREA = 'textarea';
    public const TYPE_SELECT = 'select';
    public const TYPE_CHECKBOX = 'checkbox';
    public const TYPE_EMAIL = 'email';
    public const TYPE_URL = 'url';

    /**
     * Get the user that owns the form field
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for active fields
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope ordered by position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }

    /**
     * Get available field types with labels
     */
    public static function getFieldTypes(): array
    {
        return [
            self::TYPE_TEXT => 'Текст',
            self::TYPE_TEXTAREA => 'Многострочный текст',
            self::TYPE_SELECT => 'Выпадающий список',
            self::TYPE_CHECKBOX => 'Чекбокс',
            self::TYPE_EMAIL => 'Email',
            self::TYPE_URL => 'URL',
        ];
    }

    /**
     * Check if field requires options (select type)
     */
    public function requiresOptions(): bool
    {
        return $this->type === self::TYPE_SELECT;
    }
}
