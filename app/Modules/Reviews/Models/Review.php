<?php

namespace App\Modules\Reviews\Models;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $table = 'module_reviews';

    protected $fillable = [
        'user_id',
        'client_id',
        'appointment_id',
        'author_name',
        'author_email',
        'author_phone',
        'rating',
        'text',
        'response',
        'response_at',
        'status',
        'is_verified',
        'is_featured',
        'source',
        'meta',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified' => 'boolean',
        'is_featured' => 'boolean',
        'response_at' => 'datetime',
        'meta' => 'array',
    ];

    /**
     * Status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /**
     * Source constants
     */
    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_AUTO_REQUEST = 'auto_request';
    public const SOURCE_PUBLIC_PAGE = 'public_page';

    /**
     * Get the user (master) that owns the review
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the client that wrote the review
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the appointment associated with the review
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Scope for approved reviews
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope for pending reviews
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for a specific user (master)
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for minimum rating
     */
    public function scopeMinRating($query, int $minRating)
    {
        return $query->where('rating', '>=', $minRating);
    }

    /**
     * Scope for featured reviews
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Check if review is approved
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if review is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if review has a response
     */
    public function hasResponse(): bool
    {
        return !empty($this->response);
    }

    /**
     * Approve the review
     */
    public function approve(): bool
    {
        $this->status = self::STATUS_APPROVED;
        return $this->save();
    }

    /**
     * Reject the review
     */
    public function reject(): bool
    {
        $this->status = self::STATUS_REJECTED;
        return $this->save();
    }

    /**
     * Add response to the review
     */
    public function addResponse(string $response): bool
    {
        $this->response = $response;
        $this->response_at = now();
        return $this->save();
    }

    /**
     * Get formatted rating (stars)
     */
    public function getStarsAttribute(): string
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating);
    }

    /**
     * Get author display name (masked if needed)
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->is_verified && $this->client) {
            return $this->client->name;
        }
        return $this->author_name;
    }
}
