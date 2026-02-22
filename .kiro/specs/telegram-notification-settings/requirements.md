# Requirements Document: Telegram Notification Settings

## Introduction

Система настроек Telegram уведомлений позволяет пользователям гибко управлять типами и параметрами уведомлений, которые они получают через Telegram бота. Пользователи могут включать/выключать различные типы уведомлений, настраивать время напоминаний, устанавливать тихий режим и выбирать формат сообщений.

## Glossary

- **System**: Система управления настройками Telegram уведомлений
- **User**: Пользователь CRM системы с подключенным Telegram аккаунтом
- **Notification_Type**: Тип уведомления (новые записи, изменения, тикеты, напоминания)
- **Reminder_Time**: Время до события, за которое отправляется напоминание
- **Quiet_Mode**: Режим "не беспокоить" в определенные часы
- **Notification_Format**: Формат уведомления (краткий или подробный)
- **Telegram_Bot**: Бот для отправки уведомлений пользователям

## Requirements

### Requirement 1: Управление типами уведомлений

**User Story:** As a user, I want to enable or disable specific notification types, so that I only receive notifications that are relevant to me.

#### Acceptance Criteria

1. WHEN a user accesses notification settings THEN the System SHALL display all available notification types with toggle switches
2. WHEN a user toggles a notification type THEN the System SHALL save the preference immediately
3. THE System SHALL support the following notification types:
   - New appointments (новые записи клиентов)
   - Appointment changes (изменения в записях)
   - Support ticket replies (ответы на тикеты поддержки)
   - Appointment reminders (напоминания о предстоящих записях)
4. WHEN a notification type is disabled THEN the System SHALL not send notifications of that type to the user
5. WHEN a user has not configured settings THEN the System SHALL use default values (all types enabled)

### Requirement 2: Настройка времени напоминаний

**User Story:** As a user, I want to configure when I receive appointment reminders, so that I get notified at the most convenient time for me.

#### Acceptance Criteria

1. WHEN a user accesses reminder settings THEN the System SHALL display available reminder time options
2. THE System SHALL support the following reminder times:
   - 15 minutes before appointment
   - 30 minutes before appointment
   - 1 hour before appointment
   - 3 hours before appointment
   - 1 day before appointment
3. WHEN a user selects a reminder time THEN the System SHALL save the preference
4. WHEN an appointment is scheduled THEN the System SHALL calculate the reminder send time based on user preference
5. WHEN the reminder time arrives THEN the Telegram_Bot SHALL send a reminder notification to the user
6. WHEN a user has not configured reminder time THEN the System SHALL use default value (1 hour before)

### Requirement 3: Тихий режим (Quiet Mode)

**User Story:** As a user, I want to set quiet hours when I don't want to receive notifications, so that I'm not disturbed during sleep or work hours.

#### Acceptance Criteria

1. WHEN a user accesses quiet mode settings THEN the System SHALL display options to enable quiet mode
2. WHEN quiet mode is enabled THEN the System SHALL allow user to set start time and end time
3. WHEN current time is within quiet hours THEN the System SHALL not send any notifications to the user
4. WHEN a notification is scheduled during quiet hours THEN the System SHALL queue it and send after quiet hours end
5. WHEN quiet mode is disabled THEN the System SHALL send notifications at any time
6. THE System SHALL validate that start time is before end time
7. WHEN quiet hours span midnight THEN the System SHALL handle the time range correctly

### Requirement 4: Формат уведомлений

**User Story:** As a user, I want to choose between brief and detailed notification formats, so that I can control how much information I receive.

#### Acceptance Criteria

1. WHEN a user accesses format settings THEN the System SHALL display two format options: brief and detailed
2. WHEN brief format is selected THEN the System SHALL send notifications with minimal information (title, time, client name)
3. WHEN detailed format is selected THEN the System SHALL send notifications with full information (title, time, client name, service, notes, price)
4. WHEN a user changes format preference THEN the System SHALL apply it to all future notifications
5. WHEN a user has not configured format THEN the System SHALL use default value (detailed format)

### Requirement 5: Сохранение и загрузка настроек

**User Story:** As a user, I want my notification settings to be saved automatically, so that I don't have to reconfigure them every time.

#### Acceptance Criteria

1. WHEN a user changes any setting THEN the System SHALL save it to the database immediately
2. WHEN a user loads the settings page THEN the System SHALL display their current saved preferences
3. WHEN a user has never configured settings THEN the System SHALL create default settings on first access
4. WHEN settings are saved THEN the System SHALL validate all values before storing
5. WHEN validation fails THEN the System SHALL display an error message and not save invalid data

### Requirement 6: UI для настроек

**User Story:** As a user, I want an intuitive interface for managing notification settings, so that I can easily configure my preferences.

#### Acceptance Criteria

1. WHEN a user opens notification settings THEN the System SHALL display settings grouped by category
2. THE System SHALL use toggle switches for boolean settings (notification types, quiet mode)
3. THE System SHALL use dropdown or radio buttons for selection settings (reminder time, format)
4. THE System SHALL use time pickers for time settings (quiet hours)
5. WHEN a user changes a setting THEN the System SHALL provide visual feedback (loading state, success message)
6. WHEN an error occurs THEN the System SHALL display a clear error message
7. THE System SHALL display current setting values clearly

### Requirement 7: Интеграция с существующей системой уведомлений

**User Story:** As a developer, I want notification settings to integrate with the existing notification service, so that settings are respected when sending notifications.

#### Acceptance Criteria

1. WHEN the notification service sends a notification THEN the System SHALL check user's notification settings first
2. WHEN a notification type is disabled THEN the notification service SHALL not send that notification
3. WHEN quiet mode is active THEN the notification service SHALL queue the notification
4. WHEN sending a notification THEN the System SHALL use the user's preferred format
5. WHEN calculating reminder time THEN the System SHALL use the user's reminder preference
6. THE System SHALL provide a method to check if a notification should be sent
7. THE System SHALL provide a method to get the formatted notification text

### Requirement 8: Настройки по умолчанию

**User Story:** As a system administrator, I want sensible default settings for new users, so that they have a good experience without configuration.

#### Acceptance Criteria

1. WHEN a user connects Telegram for the first time THEN the System SHALL create default settings
2. THE System SHALL set the following defaults:
   - All notification types: enabled
   - Reminder time: 1 hour before
   - Quiet mode: disabled
   - Notification format: detailed
3. WHEN default settings are created THEN the System SHALL store them in the database
4. WHEN a user modifies defaults THEN the System SHALL only affect that user's settings

### Requirement 9: Валидация настроек

**User Story:** As a system, I want to validate all settings before saving, so that invalid data doesn't cause errors.

#### Acceptance Criteria

1. WHEN a user submits settings THEN the System SHALL validate all fields
2. WHEN reminder time is invalid THEN the System SHALL reject the value and show an error
3. WHEN quiet mode times are invalid THEN the System SHALL reject the values and show an error
4. WHEN notification format is invalid THEN the System SHALL reject the value and show an error
5. WHEN validation passes THEN the System SHALL save the settings
6. THE System SHALL validate that boolean values are true or false
7. THE System SHALL validate that time values are in valid format (HH:MM)

### Requirement 10: Команда бота для настроек

**User Story:** As a user, I want to access my notification settings directly from Telegram, so that I can quickly adjust preferences without opening the web interface.

#### Acceptance Criteria

1. WHEN a user sends /settings command to the bot THEN the Telegram_Bot SHALL display current notification settings
2. THE Telegram_Bot SHALL show which notification types are enabled/disabled
3. THE Telegram_Bot SHALL show current reminder time
4. THE Telegram_Bot SHALL show quiet mode status and hours if enabled
5. THE Telegram_Bot SHALL show current notification format
6. THE Telegram_Bot SHALL provide a link to the web interface for detailed configuration
7. WHEN settings are displayed THEN the Telegram_Bot SHALL use clear formatting with emojis

## Technical Notes

- Использовать существующую таблицу `telegram_notification_settings` для хранения настроек
- Интегрироваться с `TelegramNotificationService` для проверки настроек перед отправкой
- UI компонент должен быть добавлен в существующий `TelegramIntegration.tsx` или создан отдельно
- Использовать shadcn/ui компоненты для всех UI элементов
- Настройки должны сохраняться через API endpoints в `ProfileController`
