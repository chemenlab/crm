# Design Document: Telegram Notification Settings

## Overview

Система настроек Telegram уведомлений предоставляет пользователям гибкий контроль над типами, временем и форматом уведомлений. Система интегрируется с существующим `TelegramNotificationService` и расширяет текущую таблицу `telegram_notification_settings` для хранения дополнительных параметров.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TelegramNotificationSettings.tsx                      │ │
│  │  - Toggle switches для типов уведомлений               │ │
│  │  - Dropdown для времени напоминаний                    │ │
│  │  - Time pickers для тихого режима                      │ │
│  │  - Radio buttons для формата                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProfileController                                     │ │
│  │  - getTelegramSettings()                               │ │
│  │  - updateTelegramSettings()                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TelegramNotificationService                           │ │
│  │  - shouldSendNotification()                            │ │
│  │  - formatNotification()                                │ │
│  │  - queueNotification()                                 │ │
│  │  - calculateReminderTime()                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TelegramNotificationSetting (Model)                   │ │
│  │  - Расширенная модель с новыми полями                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Database: telegram_notification_settings              │ │
│  │  + reminder_time (integer, minutes)                    │ │
│  │  + quiet_mode_enabled (boolean)                        │ │
│  │  + quiet_mode_start (time)                             │ │
│  │  + quiet_mode_end (time)                               │ │
│  │  + notification_format (enum: brief, detailed)         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SettingsCommand                                       │ │
│  │  - Отображение текущих настроек                        │ │
│  │  - Ссылка на веб-интерфейс                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema Extension

Расширяем существующую таблицу `telegram_notification_settings`:

```sql
ALTER TABLE telegram_notification_settings ADD COLUMN:
- reminder_time INT DEFAULT 60 -- минуты до события
- quiet_mode_enabled BOOLEAN DEFAULT false
- quiet_mode_start TIME NULL
- quiet_mode_end TIME NULL
- notification_format ENUM('brief', 'detailed') DEFAULT 'detailed'
```

### 2. Model: TelegramNotificationSetting

Расширяем существующую модель:

```php
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

    // Новые методы
    public function isQuietTime(): bool
    public function getReminderMinutes(): int
    public function getFormat(): string
    public static function getOrCreateSettings($notifiable): self
    public static function updateSettings($notifiable, array $data): self
}
```

### 3. Service: TelegramNotificationService

Расширяем существующий сервис:

```php
class TelegramNotificationService
{
    // Новые методы
    public function shouldSendNotification($user, string $eventType): bool
    public function formatNotification($data, string $format): string
    public function queueNotification($user, string $message): void
    public function calculateReminderTime($appointment, $user): Carbon
    
    // Обновленные методы
    public function sendAppointmentCreatedNotification($appointment): bool
    public function sendTicketReplyNotification($ticket, $message): bool
    public function sendAppointmentReminderNotification($appointment): bool
}
```

### 4. Controller: ProfileController

Добавляем новые методы:

```php
class ProfileController extends Controller
{
    public function getTelegramSettings(Request $request): JsonResponse
    {
        $settings = TelegramNotificationSetting::getOrCreateSettings($request->user());
        return response()->json($settings);
    }
    
    public function updateTelegramSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_created' => 'boolean',
            'appointment_updated' => 'boolean',
            'ticket_reply' => 'boolean',
            'appointment_reminder' => 'boolean',
            'reminder_time' => 'integer|in:15,30,60,180,1440',
            'quiet_mode_enabled' => 'boolean',
            'quiet_mode_start' => 'nullable|date_format:H:i',
            'quiet_mode_end' => 'nullable|date_format:H:i',
            'notification_format' => 'string|in:brief,detailed',
        ]);
        
        TelegramNotificationSetting::updateSettings($request->user(), $validated);
        
        return back()->with('success', 'Настройки сохранены');
    }
}
```

### 5. Frontend Component: TelegramNotificationSettings.tsx

Новый React компонент:

```typescript
interface TelegramNotificationSettingsProps {
    settings: {
        appointment_created: boolean;
        appointment_updated: boolean;
        ticket_reply: boolean;
        appointment_reminder: boolean;
        reminder_time: number;
        quiet_mode_enabled: boolean;
        quiet_mode_start: string | null;
        quiet_mode_end: string | null;
        notification_format: 'brief' | 'detailed';
    };
}

export default function TelegramNotificationSettings({ settings }: Props) {
    // State management
    // Toggle handlers
    // Time picker handlers
    // Save handler with API call
    // UI rendering with shadcn/ui components
}
```

### 6. Telegram Bot Command: SettingsCommand

Новая команда для бота:

```php
class SettingsCommand extends Command
{
    protected string $name = 'settings';
    protected string $description = 'Просмотр настроек уведомлений';

    public function handle()
    {
        $chatId = $this->getUpdate()->getMessage()->getChat()->getId();
        
        // Найти пользователя по telegram_id
        $user = User::where('telegram_id', $chatId)->first();
        
        if (!$user) {
            $this->replyWithMessage([
                'text' => '❌ Аккаунт не связан',
                'parse_mode' => 'HTML',
            ]);
            return;
        }
        
        // Получить настройки
        $settings = TelegramNotificationSetting::getOrCreateSettings($user);
        
        // Форматировать и отправить
        $message = $this->formatSettingsMessage($settings);
        
        $this->replyWithMessage([
            'text' => $message,
            'parse_mode' => 'HTML',
        ]);
    }
    
    protected function formatSettingsMessage($settings): string
    {
        // Форматирование сообщения с текущими настройками
    }
}
```

## Data Models

### TelegramNotificationSetting

```php
{
    id: integer,
    notifiable_type: string,        // App\Models\User или App\Models\Administrator
    notifiable_id: integer,          // ID пользователя
    channel: string,                 // 'telegram'
    event_type: string,              // 'appointment_created', 'appointment_updated', etc.
    enabled: boolean,                // Включено ли уведомление
    reminder_time: integer,          // Минуты до события (15, 30, 60, 180, 1440)
    quiet_mode_enabled: boolean,     // Включен ли тихий режим
    quiet_mode_start: time,          // Начало тихого режима (HH:MM)
    quiet_mode_end: time,            // Конец тихого режима (HH:MM)
    notification_format: enum,       // 'brief' или 'detailed'
    created_at: timestamp,
    updated_at: timestamp
}
```

### Event Types

```php
const EVENT_TYPES = [
    'appointment_created' => 'Новые записи',
    'appointment_updated' => 'Изменения в записях',
    'ticket_reply' => 'Ответы на тикеты',
    'appointment_reminder' => 'Напоминания о записях',
];
```

### Reminder Times

```php
const REMINDER_TIMES = [
    15 => '15 минут',
    30 => '30 минут',
    60 => '1 час',
    180 => '3 часа',
    1440 => '1 день',
];
```

### Notification Formats

```php
const FORMATS = [
    'brief' => 'Краткий',
    'detailed' => 'Подробный',
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Settings persistence
*For any* user and any valid settings data, saving settings then loading settings should return the same values
**Validates: Requirements 5.1, 5.2**

### Property 2: Notification filtering
*For any* notification event, if the corresponding notification type is disabled in settings, the notification should not be sent
**Validates: Requirements 1.4, 7.2**

### Property 3: Quiet mode blocking
*For any* notification during quiet hours, if quiet mode is enabled, the notification should be queued and not sent immediately
**Validates: Requirements 3.3, 7.3**

### Property 4: Reminder time calculation
*For any* appointment and reminder time setting, the calculated reminder send time should be exactly (appointment time - reminder minutes)
**Validates: Requirements 2.4, 7.5**

### Property 5: Format application
*For any* notification, the format used should match the user's notification_format setting
**Validates: Requirements 4.3, 7.4**

### Property 6: Default settings creation
*For any* user without existing settings, accessing settings should create default values (all enabled, 60 min reminder, detailed format, quiet mode off)
**Validates: Requirements 5.3, 8.1, 8.2**

### Property 7: Validation rejection
*For any* invalid settings data (invalid reminder time, invalid time format, invalid format value), the system should reject the save and return an error
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 8: Quiet time spanning midnight
*For any* quiet mode with start time after end time (e.g., 22:00 to 06:00), the system should correctly identify times within the range across midnight
**Validates: Requirements 3.7**

## Error Handling

### Validation Errors

```php
// Invalid reminder time
if (!in_array($reminderTime, [15, 30, 60, 180, 1440])) {
    throw new ValidationException('Invalid reminder time');
}

// Invalid time format
if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
    throw new ValidationException('Invalid time format');
}

// Quiet mode without times
if ($quietModeEnabled && (!$quietStart || !$quietEnd)) {
    throw new ValidationException('Quiet mode times required');
}
```

### Notification Errors

```php
try {
    $this->sendNotification($telegramId, $message);
} catch (TelegramException $e) {
    Log::error('Telegram send failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage()
    ]);
    // Не бросаем исключение дальше, просто логируем
}
```

### Database Errors

```php
try {
    TelegramNotificationSetting::updateSettings($user, $data);
} catch (QueryException $e) {
    Log::error('Settings save failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage()
    ]);
    return back()->withErrors(['error' => 'Ошибка сохранения настроек']);
}
```

## Testing Strategy

### Unit Tests

Тесты для конкретных примеров и граничных случаев:

```php
// TelegramNotificationSettingTest.php
test('creates default settings for new user')
test('updates existing settings')
test('validates reminder time values')
test('validates time format')
test('handles quiet mode spanning midnight')

// TelegramNotificationServiceTest.php
test('blocks notification when type disabled')
test('queues notification during quiet hours')
test('sends notification outside quiet hours')
test('formats brief notification correctly')
test('formats detailed notification correctly')
test('calculates reminder time correctly')
```

### Property-Based Tests

Тесты для универсальных свойств:

```php
// Property 1: Settings persistence
test('settings round trip preserves values', function () {
    // Generate random valid settings
    // Save settings
    // Load settings
    // Assert loaded === saved
})->with('random_settings');

// Property 2: Notification filtering
test('disabled notification types are never sent', function () {
    // Generate random user with random disabled types
    // Attempt to send notification of disabled type
    // Assert notification was not sent
})->with('random_users_and_types');

// Property 3: Quiet mode blocking
test('notifications during quiet hours are queued', function () {
    // Generate random quiet hours
    // Generate random time within quiet hours
    // Attempt to send notification
    // Assert notification was queued, not sent
})->with('random_quiet_hours');

// Property 7: Validation rejection
test('invalid settings are always rejected', function () {
    // Generate random invalid settings
    // Attempt to save
    // Assert validation error thrown
})->with('invalid_settings');
```

### Integration Tests

```php
// Full flow tests
test('user can update all settings via UI')
test('settings are applied when sending notifications')
test('bot /settings command shows current settings')
test('quiet mode queue processes after quiet hours end')
```

## Implementation Notes

### Migration Strategy

1. Создать миграцию для добавления новых полей в `telegram_notification_settings`
2. Установить значения по умолчанию для существующих записей
3. Обновить модель `TelegramNotificationSetting`
4. Обновить сервис `TelegramNotificationService`
5. Создать новые методы в `ProfileController`
6. Создать frontend компонент
7. Обновить команду бота `/settings`

### Performance Considerations

- Кэшировать настройки пользователя в памяти при отправке множественных уведомлений
- Использовать индексы для быстрого поиска настроек
- Очередь для отложенных уведомлений (quiet mode) через Laravel Queue

### Security Considerations

- Валидация всех входных данных
- Проверка прав доступа (пользователь может изменять только свои настройки)
- Санитизация времени (предотвращение SQL injection)
- Rate limiting для API endpoints

### Localization

- Все тексты уведомлений на русском языке
- Форматы времени в 24-часовом формате (HH:MM)
- Даты в формате DD.MM.YYYY

### Queue Management

Для тихого режима используем Laravel Queue:

```php
// Создать job для отложенной отправки
class SendQueuedTelegramNotification implements ShouldQueue
{
    public function __construct(
        public User $user,
        public string $message,
        public Carbon $sendAt
    ) {}
    
    public function handle()
    {
        app(TelegramNotificationService::class)
            ->sendNotification($this->user->telegram_id, $this->message);
    }
}

// Использование
if ($settings->isQuietTime()) {
    $sendAt = $settings->getQuietModeEnd();
    SendQueuedTelegramNotification::dispatch($user, $message, $sendAt)
        ->delay($sendAt);
}
```
