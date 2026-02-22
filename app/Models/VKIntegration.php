<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VKIntegration extends Model
{
    use HasFactory;

    protected $table = 'vk_integrations';

    protected $fillable = [
        'user_id',
        'group_id',
        'access_token',
        'confirmation_code',
        'secret_key',
        'is_active',
        'last_sync_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_sync_at' => 'datetime',
    ];

    /**
     * Relationship: integration belongs to user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get decrypted access token
     */
    public function getAccessTokenAttribute($value): string
    {
        return decrypt($value);
    }

    /**
     * Set encrypted access token
     */
    public function setAccessTokenAttribute($value): void
    {
        $this->attributes['access_token'] = encrypt($value);
    }

    /**
     * Check if integration is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Verify integration (placeholder for VK API check)
     */
    public function verify(): bool
    {
        // Will be implemented in VKService
        return $this->is_active;
    }
}
