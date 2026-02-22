<?php

namespace App\Services\Telegram;

use App\Models\TelegramNotificationSetting;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Laravel\Facades\Telegram;

class TelegramNotificationService
{
    /**
     * Проверить, должно ли быть отправлено уведомление
     */
    public function shouldSendNotification($user, string $eventType): bool
    {
        // Проверяем, подключен ли Telegram
        if (!$user->telegram_id) {
            return false;
        }

        // Проверяем, включен ли этот тип уведомлений
        if (!TelegramNotificationSetting::isEnabled($user, 'telegram', $eventType)) {
            return false;
        }

        // Получаем настройки пользователя
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);

        // Проверяем тихий режим
        if ($settings->isQuietTime()) {
            return false; // Будет поставлено в очередь
        }

        return true;
    }

    /**
     * Форматировать уведомление согласно настройкам пользователя
     */
    public function formatNotification(array $data, string $format): string
    {
        if ($format === 'brief') {
            return $this->formatBriefNotification($data);
        }

        return $this->formatDetailedNotification($data);
    }

    /**
     * Форматировать краткое уведомление
     */
    protected function formatBriefNotification(array $data): string
    {
        $message = "{$data['icon']} <b>{$data['title']}</b>\n\n";
        
        if (isset($data['time'])) {
            $message .= "⏰ {$data['time']}\n";
        }
        
        if (isset($data['client'])) {
            $message .= "👤 {$data['client']}\n";
        }

        return $message;
    }

    /**
     * Форматировать подробное уведомление
     */
    protected function formatDetailedNotification(array $data): string
    {
        $message = "{$data['icon']} <b>{$data['title']}</b>\n\n";
        
        foreach ($data['details'] as $key => $value) {
            $message .= "{$key}: {$value}\n";
        }

        if (isset($data['link'])) {
            $message .= "\n{$data['link']}";
        }

        return $message;
    }

    /**
     * Поставить уведомление в очередь для отправки после тихих часов
     */
    public function queueNotification($user, string $message): void
    {
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);
        
        // Рассчитываем время отправки (после окончания тихих часов)
        $sendAt = now()->setTimeFromTimeString($settings->quiet_mode_end);
        
        // Если время уже прошло сегодня, отправляем завтра
        if ($sendAt->isPast()) {
            $sendAt->addDay();
        }

        // Создаем job для отложенной отправки
        \App\Jobs\SendQueuedTelegramNotification::dispatch($user, $message)
            ->delay($sendAt);
    }

    /**
     * Рассчитать время отправки напоминания
     */
    public function calculateReminderTime($appointment, $user): \Carbon\Carbon
    {
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);
        $reminderMinutes = $settings->getReminderMinutes();
        
        return $appointment->start_time->copy()->subMinutes($reminderMinutes);
    }

    /**
     * Отправить уведомление пользователю
     */
    public function sendNotification(string $telegramId, string $message): bool
    {
        try {
            Telegram::sendMessage([
                'chat_id' => $telegramId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Telegram Notification Error', [
                'telegram_id' => $telegramId,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
    
    /**
     * Отправить уведомление о новой записи клиенту
     */
    public function sendAppointmentCreatedNotification($appointment): bool
    {
        $user = $appointment->user;
        
        // Get local time for display
        $localStartTime = $appointment->local_start_time;

        // Проверяем, должно ли быть отправлено уведомление
        if (!$this->shouldSendNotification($user, 'appointment_created')) {
            // Если тихий режим, ставим в очередь
            $settings = TelegramNotificationSetting::getOrCreateSettings($user);
            if ($settings->isQuietTime()) {
                $data = [
                    'icon' => '📅',
                    'title' => 'Новая запись',
                    'time' => $localStartTime->format('d.m.Y H:i'),
                    'client' => $appointment->client->name ?? 'Клиент',
                    'details' => [
                        '📋 Услуга' => $appointment->service->name,
                        '📅 Дата' => $localStartTime->format('d.m.Y'),
                        '⏰ Время' => $localStartTime->format('H:i'),
                    ],
                ];

                if ($appointment->price) {
                    $data['details']['💰 Цена'] = number_format($appointment->price, 0, ',', ' ') . ' ₽';
                }

                $data['details']['👤 Клиент'] = $appointment->client->name ?? 'Клиент';
                
                if ($appointment->client->phone) {
                    $data['details']['📱 Телефон'] = $appointment->client->phone;
                }

                if ($appointment->notes) {
                    $data['details']['📝 Заметки'] = $appointment->notes;
                }

                $statusLabels = [
                    'scheduled' => 'Запланирована',
                    'pending' => 'Ожидает',
                    'confirmed' => 'Подтверждена',
                    'completed' => 'Завершена',
                    'cancelled' => 'Отменена',
                    'no_show' => 'Не пришел',
                ];
                $data['details']['📊 Статус'] = $statusLabels[$appointment->status] ?? $appointment->status;

                $reminderTime = $this->calculateReminderTime($appointment, $user);
                $data['details']['⏰ Напоминание'] = "за " . $settings->getReminderMinutes() . " мин до записи";

                $message = $this->formatNotification($data, $settings->getFormat());
                $this->queueNotification($user, $message);
            }
            return false;
        }

        // Получаем настройки для форматирования
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);

        $data = [
            'icon' => '📅',
            'title' => 'Новая запись',
            'time' => $localStartTime->format('d.m.Y H:i'),
            'client' => $appointment->client->name ?? 'Клиент',
            'details' => [
                '📋 Услуга' => $appointment->service->name,
                '📅 Дата' => $localStartTime->format('d.m.Y'),
                '⏰ Время' => $localStartTime->format('H:i'),
            ],
        ];

        // Добавляем цену если есть
        if ($appointment->price) {
            $data['details']['💰 Цена'] = number_format($appointment->price, 0, ',', ' ') . ' ₽';
        }

        // Добавляем клиента
        $data['details']['👤 Клиент'] = $appointment->client->name ?? 'Клиент';
        
        // Добавляем телефон клиента если есть
        if ($appointment->client->phone) {
            $data['details']['📱 Телефон'] = $appointment->client->phone;
        }

        // Добавляем заметки если есть
        if ($appointment->notes) {
            $data['details']['📝 Заметки'] = $appointment->notes;
        }

        // Добавляем статус
        $statusLabels = [
            'scheduled' => 'Запланирована',
            'pending' => 'Ожидает',
            'confirmed' => 'Подтверждена',
            'completed' => 'Завершена',
            'cancelled' => 'Отменена',
            'no_show' => 'Не пришел',
        ];
        $data['details']['📊 Статус'] = $statusLabels[$appointment->status] ?? $appointment->status;

        $reminderTime = $this->calculateReminderTime($appointment, $user);
        $data['details']['⏰ Напоминание'] = "за " . $settings->getReminderMinutes() . " мин до записи";

        $message = $this->formatNotification($data, $settings->getFormat());
        
        return $this->sendNotification($user->telegram_id, $message);
    }
    
    /**
     * Отправить уведомление об ответе на тикет клиенту
     */
    public function sendTicketReplyNotification($ticket, $replyMessage): bool
    {
        $user = $ticket->user;

        // Проверяем, должно ли быть отправлено уведомление
        if (!$this->shouldSendNotification($user, 'ticket_reply')) {
            // Если тихий режим, ставим в очередь
            $settings = TelegramNotificationSetting::getOrCreateSettings($user);
            if ($settings->isQuietTime()) {
                $data = [
                    'icon' => '💬',
                    'title' => "Новый ответ в тикете #{$ticket->ticket_number}",
                    'client' => $ticket->user->name,
                    'details' => [
                        'Тема' => $ticket->subject,
                        'Статус' => $this->getStatusLabel($ticket->status),
                    ],
                    'link' => "Посмотреть: " . url("/app/support/{$ticket->id}"),
                ];

                $message = $this->formatNotification($data, $settings->getFormat());
                $this->queueNotification($user, $message);
            }
            return false;
        }

        // Получаем настройки для форматирования
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);

        $data = [
            'icon' => '💬',
            'title' => "Новый ответ в тикете #{$ticket->ticket_number}",
            'client' => $ticket->user->name,
            'details' => [
                'Тема' => $ticket->subject,
                'Статус' => $this->getStatusLabel($ticket->status),
            ],
            'link' => "Посмотреть: " . url("/app/support/{$ticket->id}"),
        ];

        $message = $this->formatNotification($data, $settings->getFormat());
        
        return $this->sendNotification($user->telegram_id, $message);
    }
    
    /**
     * Отправить уведомление о новом тикете администратору
     */
    public function sendNewTicketNotificationToAdmin($ticket, $admin): bool
    {
        if (!$admin->telegram_id) {
            return false;
        }
        
        // Проверяем настройки уведомлений
        if (!TelegramNotificationSetting::isEnabled($admin, 'telegram', 'ticket_created')) {
            return false;
        }
        
        $text = "🎫 <b>Новый тикет поддержки</b>\n\n";
        $text .= "От: {$ticket->user->name}\n";
        $text .= "Тема: {$ticket->subject}\n";
        $text .= "Приоритет: " . $this->getPriorityLabel($ticket->priority) . "\n\n";
        $text .= "Посмотреть: " . url("/" . config('app.admin_panel_path', 'admin') . "/support/{$ticket->id}");
        
        return $this->sendNotification($admin->telegram_id, $text);
    }
    
    /**
     * Отправить уведомление о новом сообщении в тикете администратору
     */
    public function sendTicketMessageNotificationToAdmin($ticket, $admin): bool
    {
        if (!$admin->telegram_id) {
            return false;
        }
        
        // Проверяем настройки уведомлений
        if (!TelegramNotificationSetting::isEnabled($admin, 'telegram', 'ticket_message')) {
            return false;
        }
        
        $text = "💬 <b>Новое сообщение в тикете #{$ticket->ticket_number}</b>\n\n";
        $text .= "От: {$ticket->user->name}\n";
        $text .= "Тема: {$ticket->subject}\n\n";
        $text .= "Клиент ответил на тикет.\n";
        $text .= "Посмотреть: " . url("/" . config('app.admin_panel_path', 'admin') . "/support/{$ticket->id}");
        
        return $this->sendNotification($admin->telegram_id, $text);
    }
    
    /**
     * Получить метку статуса
     */
    protected function getStatusLabel(string $status): string
    {
        return match($status) {
            'open' => 'Открыт',
            'in_progress' => 'В работе',
            'waiting_for_customer' => 'Ожидает ответа',
            'resolved' => 'Решен',
            'closed' => 'Закрыт',
            default => $status,
        };
    }
    
    /**
     * Получить метку приоритета
     */
    protected function getPriorityLabel(string $priority): string
    {
        return match($priority) {
            'low' => 'Низкий',
            'medium' => 'Средний',
            'high' => 'Высокий',
            'urgent' => 'Срочный',
            default => $priority,
        };
    }
}
