<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleGrant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_slug',
        'granted_by',
        'reason',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user who received the grant
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
     * Get the user who granted access
     */
    public function grantedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Check if grant is active (not expired)
     */
    public function isActive(): bool
    {
        // Null expires_at means permanent grant
        if ($this->expires_at === null) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    /**
     * Check if grant is expired
     */
    public function isExpired(): bool
    {
        return !$this->isActive();
    }

    /**
     * Check if grant is permanent
     */
    public function isPermanent(): bool
    {
        return $this->expires_at === null;
    }

    /**
     * Extend grant expiration
     */
    public function extendTo(\DateTimeInterface $expiresAt): void
    {
        $this->update(['expires_at' => $expiresAt]);
    }

    /**
     * Make grant permanent
     */
    public function makePermanent(): void
    {
        $this->update(['expires_at' => null]);
    }

    /**
     * Scope for active grants
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Scope for expired grants
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
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
     * Check if user has active grant for module
     */
    public static function hasActiveGrant(int $userId, string $moduleSlug): bool
    {
        return static::forUser($userId)
            ->forModule($moduleSlug)
            ->active()
            ->exists();
    }

    /**
     * Create or update grant for user
     */
    public static function grantAccess(
        int $userId,
        string $moduleSlug,
        int $grantedBy,
        ?string $reason = null,
        ?\DateTimeInterface $expiresAt = null
    ): static {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'module_slug' => $moduleSlug,
            ],
            [
                'granted_by' => $grantedBy,
                'reason' => $reason,
                'expires_at' => $expiresAt,
            ]
        );
    }

    /**
     * Revoke grant for user
     */
    public static function revokeAccess(int $userId, string $moduleSlug): bool
    {
        return static::forUser($userId)
            ->forModule($moduleSlug)
            ->delete() > 0;
    }
}
