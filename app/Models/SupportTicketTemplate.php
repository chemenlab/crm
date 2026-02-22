<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicketTemplate extends Model
{
    protected $fillable = [
        'name',
        'category',
        'content',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Рендерит шаблон с заменой переменных
     * 
     * Доступные переменные:
     * - {user_name} - имя пользователя
     * - {ticket_number} - номер тикета
     * - {ticket_subject} - тема тикета
     * - {ticket_category} - категория тикета
     */
    public function render(SupportTicket $ticket): string
    {
        $content = $this->content;

        $replacements = [
            '{user_name}' => $ticket->user->name,
            '{ticket_number}' => $ticket->ticket_number,
            '{ticket_subject}' => $ticket->subject,
            '{ticket_category}' => $ticket->category,
        ];

        return str_replace(
            array_keys($replacements),
            array_values($replacements),
            $content
        );
    }

    /**
     * Scope для получения только активных шаблонов
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope для фильтрации по категории
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}

