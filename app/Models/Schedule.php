<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'user_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_day_off',
    ];

    protected $casts = [
        'is_day_off' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
