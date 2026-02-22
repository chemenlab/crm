<?php

namespace App\Telegram\Commands;

use App\Models\User;
use App\Models\Administrator;
use App\Models\TelegramNotificationSetting;
use Telegram\Bot\Commands\Command;

class SettingsCommand extends Command
{
    protected string $name = 'settings';
    protected string $description = 'Настройки уведомлений';

    public function handle()
    {
        $chatId = $this->getUpdate()->getMessage()->getChat()->getId();
        
        // Ищем пользователя или администратора
        $user = User::where('telegram_id', $chatId)->first();
        $admin = Administrator::where('telegram_id', $chatId)->first();
        
        $notifiable = $user ?? $admin;
        
        if (!$notifiable) {
            $this->replyWithMessage([
                'text' => "❌ Ваш аккаунт не связан с Telegram.\n\nИспользуйте команду /start для связывания аккаунта.",
                'parse_mode' => 'HTML',
            ]);
            return;
        }
        
        // Получаем настройки
        $settings = TelegramNotificationSetting::getOrCreateSettings($notifiable);
        
        // Форматируем сообщение
        $message = $this->formatSettingsMessage($settings, $notifiable);
        
        $this->replyWithMessage([
            'text' => $message,
            'parse_mode' => 'HTML',
        ]);
    }
    
    /**
     * Форматировать сообщение с настройками
     */
    protected function formatSettingsMessage($settings, $notifiable): string
    {
        $message = "⚙️ <b>Настройки уведомлений</b>\n\n";
        
        // Типы уведомлений
        $message .= "<b>📬 Типы уведомлений:</b>\n";
        
        $eventTypes = [
            'appointment_created' => '📅 Новые записи',
            'appointment_updated' => '✏️ Изменения в записях',
            'ticket_reply' => '💬 Ответы на тикеты',
            'appointment_reminder' => '⏰ Напоминания',
        ];
        
        foreach ($eventTypes as $eventType => $label) {
            $enabled = TelegramNotificationSetting::isEnabled($notifiable, 'telegram', $eventType);
            $status = $enabled ? '✅' : '❌';
            $message .= "{$status} {$label}\n";
        }
        
        // Время напоминаний
        $message .= "\n<b>⏰ Время напоминаний:</b>\n";
        $reminderTime = $settings->getReminderMinutes();
        $reminderLabel = $this->getReminderTimeLabel($reminderTime);
        $message .= "За {$reminderLabel} до записи\n";
        
        // Тихий режим
        $message .= "\n<b>🌙 Тихий режим:</b>\n";
        if ($settings->quiet_mode_enabled) {
            $start = substr($settings->quiet_mode_start, 0, 5);
            $end = substr($settings->quiet_mode_end, 0, 5);
            $message .= "✅ Включен ({$start} - {$end})\n";
        } else {
            $message .= "❌ Выключен\n";
        }
        
        // Формат уведомлений
        $message .= "\n<b>📄 Формат уведомлений:</b>\n";
        $format = $settings->getFormat();
        $formatLabel = $format === 'brief' ? 'Краткий' : 'Подробный';
        $message .= "{$formatLabel}\n";
        
        // Ссылка на веб-интерфейс
        $message .= "\n<i>Для изменения настроек перейдите в веб-интерфейс:</i>\n";
        $message .= url('/app/settings') . "\n";
        
        return $message;
    }
    
    /**
     * Получить метку времени напоминания
     */
    protected function getReminderTimeLabel(int $minutes): string
    {
        return match($minutes) {
            15 => '15 минут',
            30 => '30 минут',
            60 => '1 час',
            180 => '3 часа',
            1440 => '1 день',
            default => "{$minutes} минут",
        };
    }
}
