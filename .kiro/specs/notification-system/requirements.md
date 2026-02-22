# Requirements Document: Система уведомлений

## Introduction

Система уведомлений обеспечивает многоканальную коммуникацию между мастерами и клиентами. Клиенты получают уведомления о записях через VK (в будущем SMS), мастера получают уведомления и могут управлять записями через Telegram бота.

## Glossary

- **Notification_System**: Система уведомлений
- **Master**: Мастер (владелец аккаунта MasterPlan)
- **Client**: Клиент мастера
- **VK_Bot**: Бот ВКонтакте для отправки уведомлений клиентам
- **Telegram_Bot**: Telegram бот для мастеров
- **Notification_Template**: Шаблон уведомления с переменными
- **Notification_Channel**: Канал отправки (VK, Telegram, SMS, Email)
- **Appointment**: Запись на услугу
- **Notification_Log**: Журнал отправленных уведомлений

## Requirements

### Requirement 1: Шаблоны уведомлений

**User Story:** As a master, I want to customize notification templates, so that I can personalize communication with clients.

#### Acceptance Criteria

1. THE Notification_System SHALL provide 6 system templates (created, reminder_24h, reminder_2h, confirmed, cancelled, rescheduled)
2. WHEN a master views templates, THE Notification_System SHALL display all available templates with preview
3. WHEN a master edits a template, THE Notification_System SHALL allow inserting variables (client_name, service_name, appointment_date, appointment_time, master_name, master_phone, price, address)
4. WHEN a master saves a template, THE Notification_System SHALL validate that all required variables are present
5. THE Notification_System SHALL not allow deleting system templates
6. WHEN a master creates a custom template, THE Notification_System SHALL save it for that master only
7. WHEN rendering a template, THE Notification_System SHALL replace all variables with actual values

### Requirement 2: VK интеграция для клиентов

**User Story:** As a master, I want to send notifications to clients via VK, so that clients receive timely updates about appointments.

#### Acceptance Criteria

1. WHEN a master connects VK group, THE Notification_System SHALL request group_id and access_token
2. WHEN VK integration is active, THE Notification_System SHALL verify token validity
3. WHEN a client has vk_id, THE Notification_System SHALL send notifications via VK
4. WHEN VK message is sent, THE Notification_System SHALL log the notification with status
5. WHEN VK API returns error, THE Notification_System SHALL retry up to 3 times
6. WHEN all retries fail, THE Notification_System SHALL mark notification as failed and log error
7. THE Notification_System SHALL handle VK webhook callbacks for message delivery status
8. WHEN a master disconnects VK, THE Notification_System SHALL deactivate integration

### Requirement 3: Telegram бот для мастеров

**User Story:** As a master, I want to receive notifications and manage appointments via Telegram, so that I can stay updated on the go.

#### Acceptance Criteria

1. WHEN a master starts Telegram bot, THE Telegram_Bot SHALL generate a unique linking code
2. WHEN a master enters linking code, THE Telegram_Bot SHALL link Telegram account to MasterPlan account
3. WHEN a new appointment is created, THE Telegram_Bot SHALL send notification to master
4. WHEN an appointment is cancelled, THE Telegram_Bot SHALL send notification to master
5. WHEN a master sends /today command, THE Telegram_Bot SHALL display today's appointments
6. WHEN a master sends /tomorrow command, THE Telegram_Bot SHALL display tomorrow's appointments
7. WHEN a master sends /stats command, THE Telegram_Bot SHALL display brief statistics
8. THE Telegram_Bot SHALL send daily summary at 8:00 AM
9. THE Telegram_Bot SHALL send reminder 30 minutes before appointment

### Requirement 4: Автоматические уведомления

**User Story:** As a master, I want automatic notifications to be sent to clients, so that I don't have to manually remind them.

#### Acceptance Criteria

1. WHEN an appointment is created, THE Notification_System SHALL send confirmation notification to client
2. WHEN 24 hours before appointment, THE Notification_System SHALL send reminder to client
3. WHEN 2 hours before appointment, THE Notification_System SHALL send reminder to client
4. WHEN an appointment is confirmed, THE Notification_System SHALL send confirmation notification to client
5. WHEN an appointment is cancelled, THE Notification_System SHALL send cancellation notification to client
6. WHEN an appointment is rescheduled, THE Notification_System SHALL send update notification to client
7. THE Notification_System SHALL check notification settings before sending

### Requirement 5: Настройки уведомлений

**User Story:** As a master, I want to configure which notifications to send, so that I can control communication frequency.

#### Acceptance Criteria

1. WHEN a master views notification settings, THE Notification_System SHALL display all notification types with toggle switches
2. WHEN a master disables a notification type, THE Notification_System SHALL not send that type of notification
3. WHEN a master enables a notification type, THE Notification_System SHALL resume sending that type
4. THE Notification_System SHALL save notification preferences per master
5. THE Notification_System SHALL provide default settings for new masters (all enabled)

### Requirement 6: Журнал уведомлений

**User Story:** As a master, I want to see notification history, so that I can track communication with clients.

#### Acceptance Criteria

1. WHEN a notification is sent, THE Notification_System SHALL log it with timestamp, recipient, channel, status
2. WHEN a master views notification log, THE Notification_System SHALL display recent notifications with filters
3. WHEN a master filters by status, THE Notification_System SHALL show only notifications with that status
4. WHEN a master filters by client, THE Notification_System SHALL show only notifications for that client
5. WHEN a master filters by date range, THE Notification_System SHALL show notifications within that range
6. THE Notification_System SHALL display delivery status (pending, sent, delivered, failed)
7. WHEN a notification fails, THE Notification_System SHALL display error message

### Requirement 7: Приоритеты и очереди

**User Story:** As a system administrator, I want notifications to be queued and prioritized, so that the system handles load efficiently.

#### Acceptance Criteria

1. THE Notification_System SHALL use queue for all notifications
2. THE Notification_System SHALL prioritize urgent notifications (appointment in < 2 hours)
3. WHEN a notification fails, THE Notification_System SHALL retry up to 3 times with exponential backoff
4. WHEN all retries fail, THE Notification_System SHALL mark notification as failed
5. THE Notification_System SHALL process notifications in order of priority
6. THE Notification_System SHALL handle at least 100 notifications per minute

### Requirement 8: Каналы связи клиентов

**User Story:** As a master, I want to specify preferred communication channel for each client, so that notifications are sent via their preferred method.

#### Acceptance Criteria

1. WHEN a master adds a client, THE Notification_System SHALL allow specifying vk_id, telegram_id, phone
2. WHEN a master sets preferred channel, THE Notification_System SHALL save it for that client
3. WHEN sending notification, THE Notification_System SHALL use preferred channel first
4. WHEN preferred channel fails, THE Notification_System SHALL fallback to alternative channel
5. THE Notification_System SHALL support fallback order: VK → SMS → Email
6. WHEN no channels are available, THE Notification_System SHALL mark notification as failed

### Requirement 9: VK Webhook обработка

**User Story:** As a system administrator, I want to handle VK webhooks, so that the system can receive delivery confirmations.

#### Acceptance Criteria

1. THE Notification_System SHALL provide webhook endpoint for VK callbacks
2. WHEN VK sends confirmation request, THE Notification_System SHALL respond with confirmation code
3. WHEN VK sends message_new event, THE Notification_System SHALL process incoming message
4. WHEN VK sends message_reply event, THE Notification_System SHALL update notification status
5. THE Notification_System SHALL verify VK secret key for security
6. WHEN webhook receives invalid signature, THE Notification_System SHALL reject request

### Requirement 10: Telegram Webhook обработка

**User Story:** As a system administrator, I want to handle Telegram webhooks, so that the bot can respond to commands.

#### Acceptance Criteria

1. THE Notification_System SHALL provide webhook endpoint for Telegram callbacks
2. WHEN Telegram sends update, THE Notification_System SHALL process command or message
3. WHEN user sends /start, THE Telegram_Bot SHALL respond with linking instructions
4. WHEN user sends /link {code}, THE Telegram_Bot SHALL verify code and link account
5. WHEN user sends unknown command, THE Telegram_Bot SHALL respond with help message
6. THE Notification_System SHALL verify Telegram webhook signature

## Non-Functional Requirements

### Performance
- Notification queue should process 100+ notifications per minute
- Template rendering should complete within 50ms
- Webhook responses should complete within 200ms
- Database queries should be optimized with indexes

### Reliability
- Failed notifications should retry automatically (3 attempts)
- System should handle VK/Telegram API downtime gracefully
- Notification logs should be retained for 90 days
- Queue workers should auto-restart on failure

### Security
- VK access tokens must be encrypted at rest
- Telegram bot token must be encrypted at rest
- Webhook endpoints must verify signatures
- Rate limiting on webhook endpoints (100 req/min per IP)

### Scalability
- System should handle 10,000+ notifications per day
- Queue should support horizontal scaling
- Database should support partitioning for notification logs

### Usability
- Template editor should have live preview
- Variable insertion should be point-and-click
- Notification log should have intuitive filters
- Error messages should be clear in Russian

### Compatibility
- VK API version 5.131+
- Telegram Bot API 6.0+
- Laravel Queue (Redis/Database driver)
- Support for future SMS providers
