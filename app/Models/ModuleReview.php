<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_slug',
        'rating',
        'comment',
        'is_verified',
        'is_approved',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified' => 'boolean',
        'is_approved' => 'boolean',
    ];

    /**
     * Get the user who wrote the review
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module being reviewed
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
    }

    /**
     * Scope for approved reviews
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope for verified purchases
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope by module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope by rating
     */
    public function scopeWithRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Get formatted date
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->format('d.m.Y');
    }

    /**
     * Get author name (for display)
     */
    public function getAuthorNameAttribute(): string
    {
        return $this->user->name ?? 'Пользователь';
    }

    /**
     * Get author initials
     */
    public function getAuthorInitialsAttribute(): string
    {
        $name = $this->author_name;
        $parts = explode(' ', $name);

        if (count($parts) >= 2) {
            return mb_strtoupper(mb_substr($parts[0], 0, 1) . mb_substr($parts[1], 0, 1));
        }

        return mb_strtoupper(mb_substr($name, 0, 2));
    }
}
