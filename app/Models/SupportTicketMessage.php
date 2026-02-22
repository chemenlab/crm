<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SupportTicketMessage extends Model
{
    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'author_type',
        'author_id',
        'message',
        'is_internal_note',
    ];

    protected $casts = [
        'is_internal_note' => 'boolean',
    ];

    /**
     * Связь с тикетом
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    /**
     * Полиморфная связь с автором (User или Administrator)
     */
    public function author(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Связь с пользователем (автор сообщения) - для обратной совместимости
     * @deprecated Используйте author() вместо этого
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Прикрепленные файлы
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(SupportTicketAttachment::class);
    }

    /**
     * Получить имя автора
     */
    public function getAuthorNameAttribute(): string
    {
        return $this->author?->name ?? 'Неизвестный автор';
    }

    /**
     * Проверить, является ли автор администратором
     */
    public function isFromAdmin(): bool
    {
        return $this->author_type === Administrator::class;
    }
}

