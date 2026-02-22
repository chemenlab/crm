# Design Document: Система уведомлений

## Overview

Система уведомлений - это многоканальная платформа для коммуникации между мастерами и клиентами. Поддерживает VK для клиентов, Telegram для мастеров, с возможностью расширения на SMS и Email.

## Architecture

### High-Level Flow

```
Appointment Event → Notification Service → Template Rendering
  ↓
Channel Selection (VK/Telegram/SMS/Email)
  ↓
Queue Job → API Call → Delivery Status
  ↓
Notification Log → Webhook Callback → Status Update
```

### Components

1. **NotificationService** - центральный сервис управления уведомлениями
2. **TemplateService** - рендеринг шаблонов с переменными
3. **VKService** - интеграция с VK API
4. **TelegramBotService** - Telegram бот для мастеров
5. **SMSService** - интерфейс для SMS провайдеров (будущее)
6. **NotificationQueue** - система очередей
7. **WebhookControllers** - обработка webhook от VK/Telegram

## Components and Interfaces

### 1. NotificationService

**Responsibilities:**
- Создание и отправка уведомлений
- Выбор канала связи
- Управление очередью
- Логирование

**Methods:**
```php
class NotificationService
{
    public function send(
        User $master,
        Client $client,
        string $type,
        array $data,
        ?string $preferredChannel = null
    ): Notification
    // Отправляет уведомление клиенту
    
    public function sendToMaster(
        User $master,
        string $type,
        array $data
    ): Notification
    // Отправляет уведомление мастеру в Telegram
    
    public function getAvailableChannels(Client $client): array
    // Возвращает доступные каналы для клиента
    
    public function selectChannel(Client $client, ?string $preferred = null): string
    // Выбирает оптимальный канал
    
    public function retry(Notification $notification): void
    // Повторная отправка неудачного уведомления
}
```

### 2. TemplateService

**Responsibilities:**
- Управление шаблонами
- Рендеринг с переменными
- Валидация шаблонов

**Methods:**
```php
class TemplateService
{
    public function render(
        NotificationTemplate $template,
        array $variables
    ): string
    // Рендерит шаблон с подстановкой переменных
    
    public function getAvailableVariables(string $type): array
    // Возвращает доступные переменные для типа
    
    public function validate(string $body, array $requiredVars): bool
    // Проверяет наличие обязательных переменных
    
    public function getSystemTemplates(): Collection
    // Возвращает системные шаблоны
    
    public function createCustomTemplate(
        User $master,
        string $type,
        string $channel,
        string $body
    ): NotificationTemplate
    // Создает кастомный шаблон
}
```

### 3. VKService

**Responsibilities:**
- Отправка сообщений через VK API
- Обработка webhook
- Управление интеграцией

**Methods:**
```php
class VKService
{
    public function sendMessage(
        string $vkId,
        string $message
    ): array
    // Отправляет сообщение пользователю VK
    
    public function verifyIntegration(VKIntegration $integration): bool
    // Проверяет валидность токена
    
    public function handleWebhook(array $data): void
    // Обрабатывает webhook от VK
    
    public function getConfirmationCode(VKIntegration $integration): string
    // Возвращает код подтверждения для Callback API
    
    public function verifySignature(string $secret, array $data): bool
    // Проверяет подпись webhook
}
```

### 4. TelegramBotService

**Responsibilities:**
- Обработка команд бота
- Отправка уведомлений мастерам
- Управление привязкой аккаунтов

**Methods:**
```php
class TelegramBotService
{
    public function generateLinkingCode(User $master): string
    // Генерирует код для привязки (6 цифр, 10 минут)
    
    public function linkAccount(string $code, int $telegramId, string $chatId): bool
    // Привязывает Telegram к аккаунту
    
    public function sendMessage(User $master, string $message): void
    // Отправляет сообщение мастеру
    
    public function handleCommand(string $command, int $telegramId): string
    // Обрабатывает команду бота
    
    public function getTodayAppointments(User $master): string
    // Форматирует список записей на сегодня
    
    public function getTomorrowAppointments(User $master): string
    // Форматирует список записей на завтра
    
    public function getStats(User $master): string
    // Форматирует статистику
    
    public function sendDailySummary(User $master): void
    // Отправляет ежедневную сводку
}
```

### 5. SMSService (Interface)

**Responsibilities:**
- Интерфейс для SMS провайдеров
- Заглушка для будущей реализации

**Methods:**
```php
interface SMSServiceInterface
{
    public function send(string $phone, string $message): bool;
    public function getBalance(): float;
    public function getStatus(string $messageId): string;
}

class SMSRuProvider implements SMSServiceInterface
{
    // Заглушка - только логирование
}
```

## Data Models

### NotificationTemplate

```php
Schema::create('notification_templates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
    $table->string('type', 50); // appointment_created, reminder_24h, etc.
    $table->string('channel', 20); // vk, telegram, sms, email
    $table->string('subject')->nullable(); // для email
    $table->text('body');
    $table->json('variables')->nullable(); // доступные переменные
    $table->boolean('is_active')->default(true);
    $table->boolean('is_system')->default(false);
    $table->timestamps();
    
    $table->index(['user_id', 'type']);
});
```

### Notification (Log)

```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
    $table->foreignId('appointment_id')->nullable()->constrained()->onDelete('set null');
    $table->string('type', 50);
    $table->string('channel', 20);
    $table->string('recipient'); // email, phone, vk_id, telegram_id
    $table->string('subject')->nullable();
    $table->text('body');
    $table->string('status', 20); // pending, sent, failed, delivered
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->text('error_message')->nullable();
    $table->json('metadata')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'status']);
    $table->index('appointment_id');
});
```

### VKIntegration

```php
Schema::create('vk_integrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
    $table->string('group_id', 50);
    $table->text('access_token'); // encrypted
    $table->string('confirmation_code', 50)->nullable();
    $table->string('secret_key', 100)->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_sync_at')->nullable();
    $table->timestamps();
});
```

### TelegramIntegration

```php
Schema::create('telegram_integrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
    $table->string('telegram_id', 50)->unique();
    $table->string('username', 100)->nullable();
    $table->string('first_name', 100)->nullable();
    $table->string('chat_id', 50);
    $table->boolean('is_active')->default(true);
    $table->timestamp('linked_at');
    $table->timestamp('last_activity_at')->nullable();
    $table->timestamps();
});
```

### Client Updates

```php
Schema::table('clients', function (Blueprint $table) {
    $table->string('vk_id', 50)->nullable()->after('phone');
    $table->string('telegram_id', 50)->nullable()->after('vk_id');
    $table->string('preferred_channel', 20)->default('phone')->after('telegram_id');
    
    $table->index('vk_id');
    $table->index('telegram_id');
});
```

## Notification Flow

### 1. Создание записи

```
1. Appointment created
   ↓
2. AppointmentCreated event fired
   ↓
3. SendAppointmentNotification listener
   ↓
4. NotificationService::send()
   ↓
5. Select channel (VK/SMS/Email)
   ↓
6. Render template with variables
   ↓
7. Dispatch SendNotificationJob to queue
   ↓
8. Job executes → API call
   ↓
9. Log notification with status
   ↓
10. Webhook callback → Update status
```

### 2. Напоминания

```
1. Scheduled command runs (hourly/30min)
   ↓
2. Find appointments in time window
   ↓
3. For each appointment:
   - Check if reminder already sent
   - Check notification settings
   - Send notification
   ↓
4. Mark reminder as sent
```

### 3. Telegram команды

```
1. User sends /today to bot
   ↓
2. Telegram webhook → TelegramWebhookController
   ↓
3. TelegramBotService::handleCommand()
   ↓
4. Find user by telegram_id
   ↓
5. Get today's appointments
   ↓
6. Format message
   ↓
7. Send via Telegram API
```

## Queue Architecture

### Queues

1. **notifications** (high priority)
   - Срочные уведомления (< 2 часа до записи)
   - Отмены записей
   - Подтверждения

2. **notifications-low** (low priority)
   - Напоминания за 24 часа
   - Ежедневные сводки
   - Статистика

### Jobs

```php
class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $tries = 3;
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min
    
    public function handle(NotificationService $service)
    {
        // Send notification
        // Update status
        // Handle failures
    }
}
```

## Scheduled Tasks

```php
// app/Console/Kernel.php

// Напоминания за 24 часа
$schedule->command('notifications:send-reminders 24h')
    ->hourly()
    ->withoutOverlapping();

// Напоминания за 2 часа
$schedule->command('notifications:send-reminders 2h')
    ->everyThirtyMinutes()
    ->withoutOverlapping();

// Ежедневная сводка для мастеров
$schedule->command('telegram:send-daily-summary')
    ->dailyAt('08:00')
    ->timezone('Europe/Moscow');

// Очистка старых логов (90 дней)
$schedule->command('notifications:cleanup')
    ->daily();
```

## Template Variables

### Доступные переменные

```php
[
    'client_name' => 'Имя клиента',
    'client_phone' => 'Телефон клиента',
    'service_name' => 'Название услуги',
    'appointment_date' => 'Дата записи (дд.мм.гггг)',
    'appointment_time' => 'Время записи (чч:мм)',
    'appointment_datetime' => 'Дата и время',
    'master_name' => 'Имя мастера',
    'master_phone' => 'Телефон мастера',
    'price' => 'Стоимость',
    'duration' => 'Длительность',
    'address' => 'Адрес',
    'city' => 'Город',
]
```

### Системные шаблоны

**appointment_created:**
```
Здравствуйте, {client_name}!

Вы записаны на {service_name}
📅 {appointment_date} в {appointment_time}

Мастер: {master_name}
📍 {address}
💰 {price} руб.

До встречи!
```

**reminder_24h:**
```
Напоминаем, {client_name}!

Завтра у вас запись:
{service_name}
⏰ {appointment_time}

Мастер: {master_name}
📞 {master_phone}
```

**reminder_2h:**
```
{client_name}, через 2 часа у вас запись!

{service_name}
⏰ {appointment_time}
📍 {address}

Ждем вас!
```

## Webhook Handling

### VK Webhook

```php
// POST /webhooks/vk

{
    "type": "confirmation",
    "group_id": 123456
}
// Response: confirmation_code

{
    "type": "message_new",
    "object": {
        "message": {
            "from_id": 123,
            "text": "Привет"
        }
    }
}
// Response: "ok"
```

### Telegram Webhook

```php
// POST /webhooks/telegram

{
    "update_id": 123,
    "message": {
        "message_id": 456,
        "from": {
            "id": 789,
            "first_name": "Иван"
        },
        "chat": {
            "id": 789
        },
        "text": "/today"
    }
}
// Response: 200 OK
```

## Error Handling

### VK Errors

| Error Code | Description | Action |
|------------|-------------|--------|
| 5 | Invalid access token | Deactivate integration, notify master |
| 7 | Permission denied | Check token permissions |
| 100 | Invalid user_id | Mark notification as failed |
| 901 | User blocked bot | Mark client as unreachable via VK |

### Telegram Errors

| Error Code | Description | Action |
|------------|-------------|--------|
| 403 | Bot blocked by user | Deactivate integration |
| 400 | Bad request | Log error, don't retry |
| 429 | Too many requests | Retry with backoff |

## Security

### Token Storage

```php
// Шифрование токенов
$integration->access_token = encrypt($token);

// Расшифровка
$token = decrypt($integration->access_token);
```

### Webhook Verification

**VK:**
```php
$sign = md5(
    implode('', $data) . $secret_key
);

if ($sign !== $request->header('X-VK-Signature')) {
    abort(403);
}
```

**Telegram:**
```php
$hash = hash_hmac(
    'sha256',
    $data,
    hash('sha256', $bot_token, true)
);

if ($hash !== $request->input('hash')) {
    abort(403);
}
```

## Performance Optimization

### Caching

```php
// Кэш шаблонов
Cache::remember("template:{$type}:{$channel}", 3600, function() {
    return NotificationTemplate::where(...)->first();
});

// Кэш интеграций
Cache::remember("vk_integration:{$userId}", 3600, function() {
    return VKIntegration::where('user_id', $userId)->first();
});
```

### Database Indexes

```sql
-- Notifications
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Templates
CREATE INDEX idx_templates_user_type ON notification_templates(user_id, type);

-- Clients
CREATE INDEX idx_clients_vk_id ON clients(vk_id);
CREATE INDEX idx_clients_telegram_id ON clients(telegram_id);
```

## Testing Strategy

### Unit Tests

1. **TemplateService**
   - Рендеринг с переменными
   - Валидация шаблонов
   - Обработка отсутствующих переменных

2. **NotificationService**
   - Выбор канала
   - Fallback логика
   - Retry механизм

3. **VKService**
   - Отправка сообщений (mock API)
   - Webhook обработка
   - Signature verification

4. **TelegramBotService**
   - Обработка команд
   - Генерация кодов привязки
   - Форматирование сообщений

### Integration Tests

1. **Notification Flow**
   - Создание записи → отправка уведомления
   - Webhook callback → обновление статуса
   - Failed notification → retry

2. **Telegram Bot**
   - Привязка аккаунта
   - Команды бота
   - Отправка уведомлений

3. **VK Integration**
   - Подключение группы
   - Отправка сообщений
   - Обработка ошибок

## Future Enhancements

1. **SMS интеграция**
   - SMS.ru provider
   - Twilio provider
   - Тарификация через подписки

2. **Email уведомления**
   - HTML шаблоны
   - Вложения (календарь)

3. **WhatsApp Business API**
   - Интеграция с WhatsApp
   - Шаблоны сообщений

4. **Push уведомления**
   - Web push
   - Mobile app push

5. **A/B тестирование шаблонов**
   - Варианты шаблонов
   - Статистика открытий/кликов
