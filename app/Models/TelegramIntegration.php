<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramIntegration extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'telegram_id',
        'username',
        'first_name',
        'chat_id',
        'is_active',
        'linked_at',
        'last_activity_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'linked_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    /**
     * Relationship: integration belongs to user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if integration is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Update last activity timestamp
     */
    public function updateActivity(): void
    {
        $this->update([
            'last_activity_at' => now(),
        ]);
    }
}
