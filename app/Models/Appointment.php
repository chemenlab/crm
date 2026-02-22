<?php

namespace App\Models;

use App\Observers\AppointmentObserver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy([AppointmentObserver::class])]
class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'client_id',
        'service_id',
        'start_time',
        'end_time',
        'status',
        'payment_method',
        'price',
        'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'price' => 'decimal:2',
    ];

    /**
     * Get start_time in user's timezone
     */
    public function getLocalStartTimeAttribute(): Carbon
    {
        $timezone = $this->user?->timezone ?? 'UTC';
        return $this->start_time->copy()->setTimezone($timezone);
    }

    /**
     * Get end_time in user's timezone
     */
    public function getLocalEndTimeAttribute(): Carbon
    {
        $timezone = $this->user?->timezone ?? 'UTC';
        return $this->end_time->copy()->setTimezone($timezone);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    public function options()
    {
        return $this->belongsToMany(ServiceOption::class, 'appointment_service_options')
                    ->withPivot(['price_change', 'duration_change'])
                    ->withTimestamps();
    }
    public function meta()
    {
        return $this->hasMany(AppointmentMeta::class);
    }
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
