<?php

namespace App\Modules\Leads\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadComment extends Model
{
    protected $table = 'lead_comments';

    protected $fillable = [
        'lead_id',
        'user_id',
        'content',
    ];

    /**
     * Get the lead that owns the comment
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get the user (author) of the comment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for a specific lead
     */
    public function scopeForLead($query, int $leadId)
    {
        return $query->where('lead_id', $leadId);
    }

    /**
     * Scope ordered by newest first
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Scope ordered by oldest first
     */
    public function scopeOldest($query)
    {
        return $query->orderBy('created_at', 'asc');
    }
}
