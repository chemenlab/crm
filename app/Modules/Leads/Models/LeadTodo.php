<?php

namespace App\Modules\Leads\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTodo extends Model
{
    protected $table = 'lead_todos';

    protected $fillable = [
        'lead_id',
        'title',
        'is_completed',
        'due_date',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the lead that owns the todo
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Scope for completed todos
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope for incomplete todos
     */
    public function scopeIncomplete($query)
    {
        return $query->where('is_completed', false);
    }

    /**
     * Scope for overdue todos
     */
    public function scopeOverdue($query)
    {
        return $query->where('is_completed', false)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString());
    }

    /**
     * Toggle the completion status
     */
    public function toggle(): bool
    {
        $this->is_completed = !$this->is_completed;
        $this->completed_at = $this->is_completed ? now() : null;
        return $this->save();
    }

    /**
     * Mark as completed
     */
    public function markCompleted(): bool
    {
        $this->is_completed = true;
        $this->completed_at = now();
        return $this->save();
    }

    /**
     * Mark as incomplete
     */
    public function markIncomplete(): bool
    {
        $this->is_completed = false;
        $this->completed_at = null;
        return $this->save();
    }

    /**
     * Check if todo is overdue
     */
    public function isOverdue(): bool
    {
        return !$this->is_completed 
            && $this->due_date !== null 
            && $this->due_date->isPast();
    }
}
