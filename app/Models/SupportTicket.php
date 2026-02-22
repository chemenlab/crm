<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'assigned_admin_id',
        'ticket_number',
        'subject',
        'category',
        'priority',
        'status',
        'resolution_summary',
        'rating',
        'rating_comment',
        'last_viewed_by_user_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'last_viewed_by_user_at' => 'datetime',
    ];

    /**
     * Связь с пользователем, создавшим тикет
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с назначенным администратором
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(Administrator::class, 'assigned_admin_id');
    }

    /**
     * Все сообщения тикета
     */
    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class);
    }

    /**
     * Только публичные сообщения (не внутренние заметки)
     */
    public function publicMessages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class)
            ->where('is_internal_note', false);
    }

    /**
     * Только внутренние заметки
     */
    public function internalNotes(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class)
            ->where('is_internal_note', true);
    }

    /**
     * Проверить, есть ли новые сообщения с момента последнего просмотра
     */
    public function hasUnreadMessages(): bool
    {
        if (!$this->last_viewed_by_user_at) {
            // Если пользователь никогда не просматривал тикет,
            // проверяем есть ли сообщения от админа
            return $this->publicMessages()
                ->where('author_type', '!=', User::class)
                ->exists();
        }

        // Проверяем есть ли сообщения после последнего просмотра
        return $this->publicMessages()
            ->where('created_at', '>', $this->last_viewed_by_user_at)
            ->where('author_type', '!=', User::class)
            ->exists();
    }
}

