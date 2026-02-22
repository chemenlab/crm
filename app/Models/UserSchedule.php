<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSchedule extends Model
{
    protected $fillable = [
        'user_id',
        'day_of_week',
        'is_working',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
    ];

    protected $casts = [
        'is_working' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
