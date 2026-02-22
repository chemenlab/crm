# Implementation Plan: Система уведомлений

## Overview

Реализация многоканальной системы уведомлений с поддержкой VK для клиентов, Telegram для мастеров, и заглушкой для SMS. Включает систему шаблонов, очереди, webhook обработку и журналирование.

## Tasks

- [ ] 1. Создание миграций базы данных
  - Создать миграцию `notification_templates`
  - Создать миграцию `notifications` (журнал)
  - Создать миграцию `vk_integrations`
  - Создать миграцию `telegram_integrations`
  - Создать миграцию для обновления `clients` (vk_id, telegram_id, preferred_channel)
  - Применить миграции
  - _Requirements: 1.1, 2.1, 3.1, 8.1_

- [ ] 2. Создание моделей
  - [ ] 2.1 Создать `app/Models/NotificationTemplate.php`
    - Relationships: user
    - Scopes: system, custom, byType, byChannel
    - Methods: render(), getVariables()
    - _Requirements: 1.1, 1.3_

  - [ ] 2.2 Создать `app/Models/Notification.php`
    - Relationships: user, client, appointment
    - Scopes: byStatus, byChannel, recent
    - Methods: markAsSent(), markAsDelivered(), markAsFailed()
    - _Requirements: 6.1, 6.6_

  - [ ] 2.3 Создать `app/Models/VKIntegration.php`
    - Relationship: user
    - Casts: access_token (encrypted)
    - Methods: isActive(), verify()
    - _Requirements: 2.1, 2.2_

  - [ ] 2.4 Создать `app/Models/TelegramIntegration.php`
    - Relationship: user
    - Methods: isActive(), updateActivity()
    - _Requirements: 3.1, 3.2_

  - [ ] 2.5 Обновить `app/Models/Client.php`
    - Добавить fillable: vk_id, telegram_id, preferred_channel
    - Добавить метод getAvailableChannels()
    - _Requirements: 8.1, 8.2_

- [ ] 3. Создание сервисов
  - [ ] 3.1 Создать `app/Services/Notifications/TemplateService.php`
    - Реализовать render() - рендеринг с переменными
    - Реализовать getAvailableVariables()
    - Реализовать validate()
    - Реализовать getSystemTemplates()
    - Реализовать createCustomTemplate()
    - _Requirements: 1.3, 1.4, 1.7_

  - [ ] 3.2 Создать `app/Services/Notifications/NotificationService.php`
    - Реализовать send() - отправка клиенту
    - Реализовать sendToMaster() - отправка мастеру
    - Реализовать getAvailableChannels()
    - Реализовать selectChannel() - выбор канала с fallback
    - Реализовать retry()
    - _Requirements: 4.1-4.7, 8.3-8.5_

  - [ ] 3.3 Создать `app/Services/VK/VKService.php`
    - Установить пакет `vkcom/vk-php-sdk`
    - Реализовать sendMessage()
    - Реализовать verifyIntegration()
    - Реализовать getConfirmationCode()
    - Реализовать verifySignature()
    - _Requirements: 2.3, 2.4, 9.1-9.6_

  - [ ] 3.4 Создать `app/Services/Telegram/TelegramBotService.php`
    - Установить пакет `telegram-bot-sdk/telegram-bot-sdk`
    - Реализовать generateLinkingCode()
    - Реализовать linkAccount()
    - Реализовать sendMessage()
    - Реализовать handleCommand()
    - Реализовать getTodayAppointments()
    - Реализовать getTomorrowAppointments()
    - Реализовать getStats()
    - Реализовать sendDailySummary()
    - _Requirements: 3.1-3.9, 10.1-10.6_

  - [ ] 3.5 Создать `app/Services/SMS/SMSServiceInterface.php`
    - Определить интерфейс: send(), getBalance(), getStatus()
    - _Requirements: 8.5_

  - [ ] 3.6 Создать `app/Services/SMS/SMSRuProvider.php`
    - Реализовать заглушку (только логирование)
    - Подготовить для будущей интеграции
    - _Requirements: 8.5_

- [ ] 4. Создание Jobs для очередей
  - [ ] 4.1 Создать `app/Jobs/SendNotificationJob.php`
    - Реализовать handle() - отправка через выбранный канал
    - Настроить retry: 3 попытки с backoff
    - Обработка ошибок и логирование
    - _Requirements: 2.5, 2.6, 7.3, 7.4_

  - [ ] 4.2 Создать `app/Jobs/SendTelegramNotificationJob.php`
    - Реализовать handle() - отправка в Telegram
    - Обработка ошибок Telegram API
    - _Requirements: 3.3, 3.4_

  - [ ] 4.3 Создать `app/Jobs/SendVKNotificationJob.php`
    - Реализовать handle() - отправка в VK
    - Обработка ошибок VK API
    - _Requirements: 2.3, 2.4_

- [ ] 5. Создание контроллеров
  - [ ] 5.1 Создать `app/Http/Controllers/App/NotificationTemplateController.php`
    - Реализовать index() - список шаблонов
    - Реализовать show() - просмотр шаблона
    - Реализовать store() - создание кастомного шаблона
    - Реализовать update() - обновление шаблона
    - Реализовать destroy() - удаление (только кастомные)
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [ ] 5.2 Создать `app/Http/Controllers/App/NotificationLogController.php`
    - Реализовать index() - журнал уведомлений с фильтрами
    - Реализовать show() - детали уведомления
    - _Requirements: 6.1-6.7_

  - [ ] 5.3 Создать `app/Http/Controllers/App/VKIntegrationController.php`
    - Реализовать store() - подключение VK группы
    - Реализовать show() - статус интеграции
    - Реализовать destroy() - отключение
    - _Requirements: 2.1, 2.2, 2.8_

  - [ ] 5.4 Создать `app/Http/Controllers/App/TelegramIntegrationController.php`
    - Реализовать generateCode() - генерация кода привязки
    - Реализовать show() - статус интеграции
    - Реализовать destroy() - отключение
    - _Requirements: 3.1, 3.2_

  - [ ] 5.5 Создать `app/Http/Controllers/Webhooks/VKWebhookController.php`
    - Реализовать handle() - обработка VK webhook
    - Обработка confirmation
    - Обработка message_new
    - Обработка message_reply
    - Верификация signature
    - _Requirements: 9.1-9.6_

  - [ ] 5.6 Создать `app/Http/Controllers/Webhooks/TelegramWebhookController.php`
    - Реализовать handle() - обработка Telegram webhook
    - Обработка команд (/start, /link, /today, /tomorrow, /stats, /help)
    - Верификация signature
    - _Requirements: 10.1-10.6_

- [ ] 6. Создание Events и Listeners
  - [ ] 6.1 Создать события
    - `app/Events/AppointmentCreated.php`
    - `app/Events/AppointmentUpdated.php`
    - `app/Events/AppointmentCancelled.php`
    - _Requirements: 4.1, 4.5, 4.6_

  - [ ] 6.2 Создать `app/Listeners/SendAppointmentNotification.php`
    - Обработка AppointmentCreated
    - Обработка AppointmentUpdated
    - Обработка AppointmentCancelled
    - Проверка настроек уведомлений
    - Dispatch SendNotificationJob
    - _Requirements: 4.1-4.6, 5.7_

- [ ] 7. Создание Console Commands
  - [ ] 7.1 Создать `app/Console/Commands/SendRemindersCommand.php`
    - Параметр: time window (24h, 2h)
    - Поиск записей в окне времени
    - Проверка, что напоминание не отправлено
    - Отправка напоминаний
    - _Requirements: 4.2, 4.3_

  - [ ] 7.2 Создать `app/Console/Commands/SendDailySummaryCommand.php`
    - Поиск мастеров с Telegram
    - Формирование сводки
    - Отправка через TelegramBotService
    - _Requirements: 3.8_

  - [ ] 7.3 Создать `app/Console/Commands/CleanupNotificationsCommand.php`
    - Удаление логов старше 90 дней
    - Оптимизация таблицы
    - _Requirements: 6.1_

  - [ ] 7.4 Зарегистрировать команды в `app/Console/Kernel.php`
    - Schedule: send-reminders 24h (hourly)
    - Schedule: send-reminders 2h (every 30 min)
    - Schedule: send-daily-summary (daily at 08:00)
    - Schedule: cleanup (daily)
    - _Requirements: 4.2, 4.3, 3.8_

- [ ] 8. Создание Seeders
  - [ ] 8.1 Создать `database/seeders/NotificationTemplateSeeder.php`
    - Системный шаблон: appointment_created
    - Системный шаблон: reminder_24h
    - Системный шаблон: reminder_2h
    - Системный шаблон: appointment_confirmed
    - Системный шаблон: appointment_cancelled
    - Системный шаблон: appointment_rescheduled
    - Для каждого: VK, Telegram, SMS, Email варианты
    - _Requirements: 1.1_

  - [ ] 8.2 Запустить seeder
    - `php artisan db:seed --class=NotificationTemplateSeeder`
    - _Requirements: 1.1_

- [ ] 9. Добавление роутов
  - Добавить роуты в `routes/web.php`:
    - `GET /app/notifications/templates` - список шаблонов
    - `GET /app/notifications/templates/{id}` - просмотр шаблона
    - `POST /app/notifications/templates` - создание шаблона
    - `PUT /app/notifications/templates/{id}` - обновление шаблона
    - `DELETE /app/notifications/templates/{id}` - удаление шаблона
    - `GET /app/notifications/log` - журнал уведомлений
    - `GET /app/notifications/log/{id}` - детали уведомления
    - `POST /app/integrations/vk` - подключение VK
    - `GET /app/integrations/vk` - статус VK
    - `DELETE /app/integrations/vk` - отключение VK
    - `POST /app/integrations/telegram/generate-code` - генерация кода
    - `GET /app/integrations/telegram` - статус Telegram
    - `DELETE /app/integrations/telegram` - отключение Telegram
    - `POST /webhooks/vk` - VK webhook (без auth)
    - `POST /webhooks/telegram` - Telegram webhook (без auth)
  - _Requirements: 1.2, 2.1, 3.1, 6.2, 9.1, 10.1_

- [ ] 10. Создание UI компонентов
  - [ ] 10.1 Создать `resources/js/Pages/App/Notifications/Templates.tsx`
    - Список шаблонов (системные + кастомные)
    - Фильтр по типу и каналу
    - Кнопка создания кастомного шаблона
    - Кнопка редактирования
    - Превью шаблона
    - _Requirements: 1.2_

  - [ ] 10.2 Создать `resources/js/Pages/App/Notifications/TemplateEditor.tsx`
    - Форма редактирования шаблона
    - Выбор типа и канала
    - Текстовое поле с подсветкой переменных
    - Кнопки вставки переменных
    - Live preview
    - Валидация
    - _Requirements: 1.3, 1.4_

  - [ ] 10.3 Создать `resources/js/Components/Notifications/VariableSelector.tsx`
    - Список доступных переменных
    - Кнопки вставки
    - Описание каждой переменной
    - _Requirements: 1.3_

  - [ ] 10.4 Создать `resources/js/Pages/App/Notifications/Log.tsx`
    - Таблица уведомлений
    - Фильтры: статус, канал, клиент, дата
    - Пагинация
    - Детали уведомления (модальное окно)
    - Статус badges
    - _Requirements: 6.2-6.7_

  - [ ] 10.5 Создать `resources/js/Pages/App/Integrations/VK.tsx`
    - Форма подключения VK группы
    - Инструкции по настройке
    - Статус интеграции
    - Кнопка отключения
    - Тестовая отправка
    - _Requirements: 2.1, 2.2, 2.8_

  - [ ] 10.6 Создать `resources/js/Pages/App/Integrations/Telegram.tsx`
    - Инструкции по привязке
    - Генерация кода привязки
    - QR код для быстрой привязки
    - Статус интеграции
    - Кнопка отключения
    - Тестовая отправка
    - _Requirements: 3.1, 3.2_

  - [ ] 10.7 Обновить `resources/js/Pages/App/Settings/Index.tsx`
    - Добавить секцию "Уведомления"
    - Переключатели для каждого типа уведомлений
    - Ссылки на шаблоны и интеграции
    - _Requirements: 5.1-5.5_

- [ ] 11. Обновление существующих компонентов
  - [ ] 11.1 Обновить `app/Http/Controllers/App/AppointmentController.php`
    - Добавить dispatch AppointmentCreated event
    - Добавить dispatch AppointmentUpdated event
    - Добавить dispatch AppointmentCancelled event
    - _Requirements: 4.1, 4.5, 4.6_

  - [ ] 11.2 Обновить `app/Http/Controllers/App/ClientController.php`
    - Добавить поля vk_id, telegram_id, preferred_channel в формы
    - Валидация новых полей
    - _Requirements: 8.1, 8.2_

  - [ ] 11.3 Обновить `resources/js/Pages/App/Clients/Index.tsx`
    - Отображение preferred_channel в таблице
    - Иконки каналов связи
    - _Requirements: 8.2_

  - [ ] 11.4 Обновить `resources/js/Components/ClientForm.tsx`
    - Добавить поля VK ID, Telegram ID
    - Добавить выбор предпочитаемого канала
    - _Requirements: 8.1, 8.2_

- [ ] 12. Конфигурация
  - [ ] 12.1 Создать `config/notifications.php`
    - Настройки каналов
    - Настройки очередей
    - Настройки retry
    - Настройки шаблонов
    - _Requirements: 7.1-7.6_

  - [ ] 12.2 Обновить `.env.example`
    - VK_GROUP_ID, VK_ACCESS_TOKEN, VK_SECRET_KEY
    - TELEGRAM_BOT_TOKEN
    - SMS_PROVIDER, SMSRU_API_ID
    - QUEUE_CONNECTION=redis
    - _Requirements: 2.1, 3.1_

  - [ ] 12.3 Обновить `config/services.php`
    - Добавить конфигурацию VK
    - Добавить конфигурацию Telegram
    - Добавить конфигурацию SMS
    - _Requirements: 2.1, 3.1_

- [ ] 13. Настройка очередей
  - [ ] 13.1 Настроить Redis для очередей
    - Установить Redis (если не установлен)
    - Настроить connection в `config/queue.php`
    - _Requirements: 7.1, 7.2_

  - [ ] 13.2 Создать `config/horizon.php` (опционально)
    - Настроить очереди: notifications, notifications-low
    - Настроить workers
    - Настроить balance strategy
    - _Requirements: 7.1, 7.2_

- [ ] 14. Тестирование
  - [ ]* 14.1 Unit тесты для TemplateService
    - Тест рендеринга с переменными
    - Тест валидации шаблонов
    - Тест обработки отсутствующих переменных
    - _Requirements: 1.3, 1.4, 1.7_

  - [ ]* 14.2 Unit тесты для NotificationService
    - Тест выбора канала
    - Тест fallback логики
    - Тест retry механизма
    - _Requirements: 8.3-8.5, 7.3, 7.4_

  - [ ]* 14.3 Unit тесты для VKService
    - Тест отправки сообщений (mock API)
    - Тест webhook обработки
    - Тест signature verification
    - _Requirements: 2.3, 2.4, 9.5, 9.6_

  - [ ]* 14.4 Unit тесты для TelegramBotService
    - Тест обработки команд
    - Тест генерации кодов привязки
    - Тест форматирования сообщений
    - _Requirements: 3.1-3.7, 10.3-10.5_

  - [ ]* 14.5 Integration тесты
    - Тест полного flow: создание записи → уведомление
    - Тест webhook callback → обновление статуса
    - Тест failed notification → retry
    - Тест Telegram bot команд
    - _Requirements: 4.1-4.6, 9.1-9.6, 10.1-10.6_

- [ ] 15. Checkpoint - Базовая функциональность
  - Протестировать создание и рендеринг шаблонов
  - Протестировать отправку уведомлений (с mock API)
  - Протестировать очереди
  - Протестировать журнал уведомлений
  - Убедиться, что все миграции применены
  - Убедиться, что seeders работают

- [ ] 16. Checkpoint - VK интеграция
  - Протестировать подключение VK группы
  - Протестировать отправку сообщений в VK
  - Протестировать VK webhook
  - Протестировать обработку ошибок VK API
  - Протестировать fallback на другие каналы

- [ ] 17. Checkpoint - Telegram интеграция
  - Протестировать привязку Telegram аккаунта
  - Протестировать команды бота (/start, /today, /tomorrow, /stats)
  - Протестировать отправку уведомлений мастеру
  - Протестировать ежедневную сводку
  - Протестировать Telegram webhook

- [ ] 18. Документация
  - [ ] 18.1 Создать инструкцию для мастеров
    - Как подключить VK группу
    - Как настроить Telegram бота
    - Как создавать кастомные шаблоны
    - Как просматривать журнал уведомлений
    - _Requirements: 1.2, 2.1, 3.1, 6.2_

  - [ ] 18.2 Создать техническую документацию
    - Архитектура системы
    - API endpoints
    - Webhook endpoints
    - Конфигурация
    - Troubleshooting

  - [ ] 18.3 Обновить README
    - Добавить секцию "Notifications"
    - Добавить инструкции по настройке
    - Добавить примеры использования

- [ ] 19. Final checkpoint - Полное тестирование
  - Протестировать все типы уведомлений
  - Протестировать все каналы (VK, Telegram)
  - Протестировать scheduled tasks
  - Протестировать retry механизм
  - Протестировать UI на разных устройствах
  - Проверить производительность (100+ уведомлений)
  - Убедиться, что документация актуальна
  - Запросить обратную связь от пользователя

## Notes

- Задачи, отмеченные `*`, являются опциональными (тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- VK и Telegram интеграции можно разрабатывать параллельно
- SMS интеграция - только заглушка, реальная реализация позже
- Система уведомлений критична для бизнеса - тщательное тестирование обязательно
- Рекомендуется использовать Laravel Horizon для мониторинга очередей
