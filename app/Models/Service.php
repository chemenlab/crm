<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'price',
        'duration',
        'color',
        'is_active',
        'booking_type',
        'custom_slot_step',
        'custom_buffer_time',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'custom_slot_step' => 'integer',
        'custom_buffer_time' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
    
    public function options()
    {
        return $this->hasMany(ServiceOption::class);
    }
}
