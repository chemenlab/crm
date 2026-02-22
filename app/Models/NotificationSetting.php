<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'email_new_booking',
        'email_cancelled',
        'email_modified',
        'email_payment',
        'client_reminder_24h',
        'client_reminder_1h',
        'client_thank_you',
        'daily_summary',
        'daily_summary_time',
        'weekly_summary',
        'weekly_summary_day',
        'notification_email',
    ];

    protected $casts = [
        'email_new_booking' => 'boolean',
        'email_cancelled' => 'boolean',
        'email_modified' => 'boolean',
        'email_payment' => 'boolean',
        'client_reminder_24h' => 'boolean',
        'client_reminder_1h' => 'boolean',
        'client_thank_you' => 'boolean',
        'daily_summary' => 'boolean',
        'weekly_summary' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
