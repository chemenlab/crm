<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class TelegramNotificationSetting extends Model
{
    protected $fillable = [
        'notifiable_type',
        'notifiable_id',
        'channel',
        'event_type',
        'enabled',
        'reminder_time',
        'quiet_mode_enabled',
        'quiet_mode_start',
        'quiet_mode_end',
        'notification_format',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'quiet_mode_enabled' => 'boolean',
        'reminder_time' => 'integer',
    ];

    /**
     * Получить владельца настройки (User или Administrator)
     */
    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Проверить, включено ли уведомление для пользователя
     */
    public static function isEnabled($notifiable, string $channel, string $eventType): bool
    {
        $setting = static::where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->where('channel', $channel)
            ->where('event_type', $eventType)
            ->first();

        // Если настройка не найдена, по умолчанию включено
        return $setting ? $setting->enabled : true;
    }

    /**
     * Установить настройку уведомления
     */
    public static function setSetting($notifiable, string $channel, string $eventType, bool $enabled): void
    {
        static::updateOrCreate(
            [
                'notifiable_type' => get_class($notifiable),
                'notifiable_id' => $notifiable->id,
                'channel' => $channel,
                'event_type' => $eventType,
            ],
            [
                'enabled' => $enabled,
            ]
        );
    }

    /**
     * Проверить, находится ли текущее время в тихом режиме
     */
    public function isQuietTime(): bool
    {
        if (!$this->quiet_mode_enabled) {
            return false;
        }

        if (!$this->quiet_mode_start || !$this->quiet_mode_end) {
            return false;
        }

        $now = now()->format('H:i:s');
        $start = $this->quiet_mode_start;
        $end = $this->quiet_mode_end;

        // Если тихие часы пересекают полночь (например, 22:00 - 06:00)
        if ($start > $end) {
            return $now >= $start || $now < $end;
        }

        // Обычный случай (например, 22:00 - 23:00)
        return $now >= $start && $now < $end;
    }

    /**
     * Получить время напоминания в минутах
     */
    public function getReminderMinutes(): int
    {
        return $this->reminder_time ?? 60;
    }

    /**
     * Получить формат уведомлений
     */
    public function getFormat(): string
    {
        return $this->notification_format ?? 'detailed';
    }

    /**
     * Получить или создать настройки для пользователя
     */
    public static function getOrCreateSettings($notifiable): self
    {
        // Ищем существующую запись настроек (любой event_type)
        $setting = static::where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->where('channel', 'telegram')
            ->first();

        // Если настройки не найдены, создаем с defaults
        if (!$setting) {
            $setting = static::create([
                'notifiable_type' => get_class($notifiable),
                'notifiable_id' => $notifiable->id,
                'channel' => 'telegram',
                'event_type' => 'general', // Общие настройки
                'enabled' => true,
                'reminder_time' => 60,
                'quiet_mode_enabled' => false,
                'quiet_mode_start' => null,
                'quiet_mode_end' => null,
                'notification_format' => 'detailed',
            ]);
        }

        return $setting;
    }

    /**
     * Обновить настройки пользователя
     */
    public static function updateSettings($notifiable, array $data): self
    {
        $setting = static::getOrCreateSettings($notifiable);

        // Обновляем общие настройки
        $setting->update([
            'reminder_time' => $data['reminder_time'] ?? $setting->reminder_time,
            'quiet_mode_enabled' => $data['quiet_mode_enabled'] ?? $setting->quiet_mode_enabled,
            'quiet_mode_start' => $data['quiet_mode_start'] ?? $setting->quiet_mode_start,
            'quiet_mode_end' => $data['quiet_mode_end'] ?? $setting->quiet_mode_end,
            'notification_format' => $data['notification_format'] ?? $setting->notification_format,
        ]);

        // Обновляем настройки для каждого типа уведомлений
        $eventTypes = [
            'appointment_created',
            'appointment_updated',
            'ticket_reply',
            'appointment_reminder',
        ];

        foreach ($eventTypes as $eventType) {
            if (isset($data[$eventType])) {
                static::setSetting($notifiable, 'telegram', $eventType, $data[$eventType]);
            }
        }

        return $setting->fresh();
    }
}
