# Implementation Plan: Telegram Notification Settings

## Overview

Реализация системы настроек Telegram уведомлений включает расширение базы данных, обновление backend сервисов, создание UI компонентов и интеграцию с Telegram ботом. Все изменения строятся на существующей инфраструктуре.

## Tasks

- [x] 1. Расширить схему базы данных
  - Создать миграцию для добавления новых полей в `telegram_notification_settings`
  - Добавить поля: `reminder_time`, `quiet_mode_enabled`, `quiet_mode_start`, `quiet_mode_end`, `notification_format`
  - Установить значения по умолчанию для существующих записей
  - _Requirements: 5.1, 8.2_

- [x] 2. Обновить модель TelegramNotificationSetting
  - [x] 2.1 Добавить новые поля в fillable и casts
    - Добавить `reminder_time`, `quiet_mode_enabled`, `quiet_mode_start`, `quiet_mode_end`, `notification_format`
    - Настроить casts для boolean и integer полей
    - _Requirements: 5.1_

  - [x] 2.2 Реализовать метод isQuietTime()
    - Проверка текущего времени против quiet_mode_start и quiet_mode_end
    - Обработка случая когда тихие часы пересекают полночь
    - _Requirements: 3.3, 3.7_

  - [x] 2.3 Реализовать метод getOrCreateSettings()
    - Получение существующих настроек или создание с defaults
    - Defaults: все типы enabled, reminder_time=60, format=detailed, quiet_mode=off
    - _Requirements: 5.3, 8.1, 8.2_

  - [x] 2.4 Реализовать метод updateSettings()
    - Массовое обновление настроек для пользователя
    - Валидация данных перед сохранением
    - _Requirements: 5.1, 5.4_

  - [ ]* 2.5 Написать property test для isQuietTime()
    - **Property 8: Quiet time spanning midnight**
    - **Validates: Requirements 3.7**

  - [ ]* 2.6 Написать property test для getOrCreateSettings()
    - **Property 6: Default settings creation**
    - **Validates: Requirements 5.3, 8.1, 8.2**

- [x] 3. Расширить TelegramNotificationService
  - [x] 3.1 Реализовать метод shouldSendNotification()
    - Проверка enabled для типа уведомления
    - Проверка quiet mode
    - Возврат boolean решения
    - _Requirements: 1.4, 3.3, 7.2, 7.3_

  - [x] 3.2 Реализовать метод formatNotification()
    - Форматирование brief: только заголовок, время, имя клиента
    - Форматирование detailed: полная информация
    - Использование HTML разметки для Telegram
    - _Requirements: 4.2, 4.3, 7.4_

  - [x] 3.3 Реализовать метод queueNotification()
    - Создание job для отложенной отправки
    - Расчет времени отправки (после окончания quiet hours)
    - Использование Laravel Queue
    - _Requirements: 3.4, 7.3_

  - [x] 3.4 Реализовать метод calculateReminderTime()
    - Получение reminder_time из настроек пользователя
    - Вычитание минут из времени записи
    - Возврат Carbon timestamp
    - _Requirements: 2.4, 7.5_

  - [x] 3.5 Обновить существующие методы отправки уведомлений
    - Добавить проверку shouldSendNotification() перед отправкой
    - Использовать formatNotification() для форматирования
    - Использовать queueNotification() если quiet mode активен
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.6 Написать property test для shouldSendNotification()
    - **Property 2: Notification filtering**
    - **Validates: Requirements 1.4, 7.2**

  - [ ]* 3.7 Написать property test для queueNotification()
    - **Property 3: Quiet mode blocking**
    - **Validates: Requirements 3.3, 7.3**

  - [ ]* 3.8 Написать property test для calculateReminderTime()
    - **Property 4: Reminder time calculation**
    - **Validates: Requirements 2.4, 7.5**

  - [ ]* 3.9 Написать property test для formatNotification()
    - **Property 5: Format application**
    - **Validates: Requirements 4.3, 7.4**

- [ ] 4. Checkpoint - Убедиться что backend тесты проходят
  - Запустить все property tests
  - Убедиться что все тесты проходят
  - Спросить пользователя если возникли вопросы

- [x] 5. Добавить методы в ProfileController
  - [x] 5.1 Реализовать getTelegramSettings()
    - Получение настроек текущего пользователя
    - Возврат JSON с настройками
    - _Requirements: 5.2_

  - [x] 5.2 Реализовать updateTelegramSettings()
    - Валидация входных данных
    - Обновление настроек через TelegramNotificationSetting::updateSettings()
    - Возврат с success сообщением
    - _Requirements: 5.1, 5.4, 5.5, 9.1-9.7_

  - [x] 5.3 Добавить маршруты в routes/web.php
    - GET /app/settings/telegram/settings
    - POST /app/settings/telegram/settings
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.4 Написать property test для валидации
    - **Property 7: Validation rejection**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 6. Создать frontend компонент TelegramNotificationSettings
  - [x] 6.1 Создать базовую структуру компонента
    - Импорты shadcn/ui компонентов (Card, Switch, Select, Label)
    - TypeScript интерфейсы для props
    - State management с useState
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Реализовать секцию "Типы уведомлений"
    - 4 toggle switches для типов уведомлений
    - Labels с иконками и описаниями
    - Обработчики onChange для каждого toggle
    - _Requirements: 1.1, 1.2, 6.2_

  - [x] 6.3 Реализовать секцию "Время напоминаний"
    - Select dropdown с 5 опциями времени
    - Отображение текущего выбранного значения
    - Обработчик onChange
    - _Requirements: 2.1, 2.3, 6.3_

  - [x] 6.4 Реализовать секцию "Тихий режим"
    - Toggle switch для включения/выключения
    - Два time picker для start и end времени
    - Показывать time pickers только когда quiet mode enabled
    - Валидация что start < end
    - _Requirements: 3.1, 3.2, 3.6, 6.4_

  - [x] 6.5 Реализовать секцию "Формат уведомлений"
    - Radio buttons для brief/detailed
    - Описания для каждого формата
    - Обработчик onChange
    - _Requirements: 4.1, 6.3_

  - [x] 6.6 Реализовать функцию сохранения
    - Сбор всех значений из state
    - POST запрос на /app/settings/telegram/settings
    - Обработка loading state
    - Toast уведомления об успехе/ошибке
    - _Requirements: 5.1, 6.5, 6.6_

  - [x] 6.7 Добавить компонент в страницу настроек
    - Импортировать в Pages/App/Settings/Index.tsx
    - Добавить в секцию "Интеграции" после TelegramIntegration
    - Показывать только если Telegram подключен
    - _Requirements: 6.1_

- [x] 7. Скомпилировать frontend
  - Запустить `npm run build`
  - Проверить отсутствие ошибок компиляции
  - _Requirements: 6.7_

- [ ] 8. Checkpoint - Протестировать UI
  - Открыть настройки в браузере
  - Проверить отображение всех элементов
  - Проверить сохранение настроек
  - Спросить пользователя если возникли вопросы

- [x] 9. Обновить команду бота SettingsCommand
  - [x] 9.1 Реализовать метод handle()
    - Получение chatId из update
    - Поиск пользователя по telegram_id
    - Получение настроек через getOrCreateSettings()
    - Форматирование и отправка сообщения
    - _Requirements: 10.1_

  - [x] 9.2 Реализовать метод formatSettingsMessage()
    - Форматирование с эмодзи и HTML
    - Отображение всех типов уведомлений (✅/❌)
    - Отображение времени напоминаний
    - Отображение quiet mode статуса и времени
    - Отображение формата уведомлений
    - Ссылка на веб-интерфейс для изменений
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.3 Зарегистрировать команду в config/telegram.php
    - Добавить SettingsCommand в список commands
    - _Requirements: 10.1_

- [x] 10. Создать Job для отложенных уведомлений
  - [x] 10.1 Создать SendQueuedTelegramNotification job
    - Implements ShouldQueue
    - Конструктор с user, message, sendAt
    - Метод handle() для отправки через TelegramNotificationService
    - _Requirements: 3.4_

  - [x] 10.2 Настроить queue в .env
    - Убедиться что QUEUE_CONNECTION настроен
    - Документировать необходимость запуска queue worker
    - _Requirements: 3.4_

- [ ] 11. Интегрировать с существующими контроллерами (опционально)
  - [ ] 11.1 Обновить AppointmentController
    - Добавить отправку уведомления при создании записи
    - Использовать обновленный sendAppointmentCreatedNotification()
    - _Requirements: 1.4, 7.2_

  - [ ] 11.2 Создать scheduled task для напоминаний
    - Команда для поиска записей с подходящим временем напоминания
    - Отправка напоминаний через TelegramNotificationService
    - Регистрация в app/Console/Kernel.php
    - _Requirements: 2.5_

  - [ ] 11.3 Обновить SupportTicketController
    - Добавить отправку уведомления при ответе на тикет
    - Использовать обновленный sendTicketReplyNotification()
    - _Requirements: 1.4, 7.2_

- [ ]* 12. Написать integration tests
  - [ ]* 12.1 Тест полного flow настроек
    - Создание пользователя
    - Подключение Telegram
    - Изменение настроек через UI
    - Проверка сохранения в БД
    - Проверка применения при отправке уведомлений

  - [ ]* 12.2 Тест команды /settings бота
    - Отправка команды боту
    - Проверка формата ответа
    - Проверка корректности отображаемых данных

  - [ ]* 12.3 Тест quiet mode queue
    - Создание уведомления во время quiet hours
    - Проверка что уведомление в очереди
    - Симуляция окончания quiet hours
    - Проверка отправки уведомления

- [ ] 13. Final checkpoint - Полное тестирование
  - Убедиться что все тесты проходят
  - Протестировать все функции в браузере
  - Протестировать команду /settings в Telegram
  - Протестировать отправку уведомлений с разными настройками
  - Спросить пользователя о готовности к production

## Notes

- Задачи помечены `*` являются опциональными (тесты) для более быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и граничные случаи
- Integration tests проверяют end-to-end потоки
