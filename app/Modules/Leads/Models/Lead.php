<?php

namespace App\Modules\Leads\Models;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Service;
use App\Models\User;
use App\Modules\Leads\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $table = 'leads';

    protected $fillable = [
        'user_id',
        'client_id',
        'service_id',
        'name',
        'phone',
        'message',
        'status',
        'priority',
        'tags',
        'reminder_at',
        'reminder_note',
        'position',
        'custom_fields',
        'converted_appointment_id',
    ];

    protected $casts = [
        'status' => LeadStatus::class,
        'custom_fields' => 'array',
        'tags' => 'array',
        'position' => 'integer',
        'reminder_at' => 'datetime',
    ];

    /**
     * Get the user (master) that owns the lead
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the client associated with the lead
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the service associated with the lead
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the todos for the lead
     */
    public function todos(): HasMany
    {
        return $this->hasMany(LeadTodo::class);
    }

    /**
     * Get the comments for the lead
     */
    public function comments(): HasMany
    {
        return $this->hasMany(LeadComment::class);
    }

    /**
     * Get the appointment this lead was converted to
     */
    public function convertedAppointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'converted_appointment_id');
    }

    /**
     * Scope for a specific user (master)
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for a specific status
     */
    public function scopeWithStatus($query, LeadStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope ordered by position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }

    /**
     * Check if lead is converted to appointment
     */
    public function isConverted(): bool
    {
        return $this->converted_appointment_id !== null;
    }

    /**
     * Check if lead has specific status
     */
    public function hasStatus(LeadStatus $status): bool
    {
        return $this->status === $status;
    }
}
