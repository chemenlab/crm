<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Client extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'vk_id',
        'telegram_id',
        'preferred_channel',
        'notes',
        'total_visits',
        'total_spent',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function tags()
    {
        return $this->belongsToMany(ClientTag::class);
    }

    /**
     * Get available notification channels for this client
     */
    public function getAvailableChannels(): array
    {
        $channels = [];

        if ($this->vk_id) {
            $channels[] = 'vk';
        }

        if ($this->telegram_id) {
            $channels[] = 'telegram';
        }

        if ($this->phone) {
            $channels[] = 'sms';
        }

        if ($this->email) {
            $channels[] = 'email';
        }

        return $channels;
    }

    /**
     * Get preferred notification channel
     */
    public function getPreferredChannel(): ?string
    {
        $available = $this->getAvailableChannels();

        if (empty($available)) {
            return null;
        }

        // If preferred channel is available, use it
        if ($this->preferred_channel && in_array($this->preferred_channel, $available)) {
            return $this->preferred_channel;
        }

        // Otherwise, return first available channel
        return $available[0];
    }
}
