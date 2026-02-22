# Implementation Plan: Two-Factor Authentication (2FA)

## Overview

Реализация двухфакторной аутентификации с использованием TOTP (Time-based One-Time Password). Включает настройку 2FA, генерацию QR кодов, recovery коды и интеграцию в процесс входа.

## Tasks

- [ ] 1. Установка библиотек для 2FA
  - Установить `pragmarx/google2fa-laravel` для TOTP
  - Установить `bacon/bacon-qr-code` для генерации QR кодов
  - Опубликовать конфигурацию
  - _Requirements: 8.1_

- [ ] 2. Создание TwoFactorService
  - [ ] 2.1 Создать `app/Services/TwoFactorService.php`
    - Реализовать `generateSecret()` - генерация секретного ключа
    - Реализовать `generateQrCode()` - генерация QR кода
    - Реализовать `verifyCode()` - проверка TOTP кода
    - Реализовать `generateRecoveryCodes()` - генерация 8 recovery кодов
    - Реализовать `enable()` - включение 2FA
    - Реализовать `disable()` - отключение 2FA
    - Реализовать `verifyRecoveryCode()` - проверка recovery кода
    - Реализовать `regenerateRecoveryCodes()` - регенерация кодов
    - _Requirements: 1.2, 1.3, 1.4, 1.7, 4.1, 4.4, 4.7_

  - [ ]* 2.2 Написать unit тесты для TwoFactorService
    - Тест генерации секрета
    - Тест верификации TOTP кода
    - Тест генерации recovery кодов
    - Тест использования recovery кода
    - _Requirements: 1.2, 1.6, 4.4, 4.5_

- [ ] 3. Обновление TwoFactorAuth модели
  - [ ] 3.1 Обновить `app/Models/TwoFactorAuth.php`
    - Добавить методы для работы с recovery кодами
    - Добавить `hasUnusedRecoveryCodes()`
    - Добавить `getUnusedRecoveryCodesCount()`
    - Добавить `markRecoveryCodeAsUsed()`
    - Настроить шифрование для secret
    - _Requirements: 4.1, 4.5, 4.6, 8.4, 8.5_

  - [ ]* 3.2 Написать unit тесты для TwoFactorAuth модели
    - Тест подсчета неиспользованных кодов
    - Тест пометки кода как использованного
    - _Requirements: 4.5, 4.6_

- [ ] 4. Обновление User модели
  - Добавить метод `hasTwoFactorEnabled()`
  - Добавить метод `getTwoFactorSecret()`
  - Убедиться, что relationship `twoFactorAuth()` работает
  - _Requirements: 6.1, 6.2_

- [ ] 5. Создание TwoFactorController
  - [ ] 5.1 Создать `app/Http/Controllers/Auth/TwoFactorController.php`
    - Реализовать `show()` - отображение настроек 2FA
    - Реализовать `enable()` - начало процесса включения
    - Реализовать `confirm()` - подтверждение включения через TOTP
    - Реализовать `disable()` - отключение 2FA
    - Реализовать `regenerateRecoveryCodes()` - регенерация кодов
    - Добавить валидацию и обработку ошибок
    - _Requirements: 1.1-1.8, 2.1-2.5, 10.1-10.5_

  - [ ]* 5.2 Написать integration тесты для TwoFactorController
    - Тест полного flow включения 2FA
    - Тест отключения 2FA
    - Тест регенерации recovery кодов
    - _Requirements: 1.1-1.8, 2.1-2.5, 10.1-10.5_

- [ ] 6. Создание TwoFactorChallengeController
  - [ ] 6.1 Создать `app/Http/Controllers/Auth/TwoFactorChallengeController.php`
    - Реализовать `show()` - отображение страницы ввода кода
    - Реализовать `verify()` - проверка TOTP кода
    - Реализовать `useRecoveryCode()` - использование recovery кода
    - Добавить rate limiting (5 попыток за 15 минут)
    - Добавить обработку ошибок
    - _Requirements: 3.1-3.6, 4.3-4.5, 8.6_

  - [ ]* 6.2 Написать integration тесты для TwoFactorChallengeController
    - Тест успешной верификации TOTP
    - Тест использования recovery кода
    - Тест rate limiting
    - _Requirements: 3.1-3.6, 4.3-4.5_

- [ ] 7. Обновление LoginController
  - Добавить проверку 2FA после успешной аутентификации
  - Перенаправлять на 2FA challenge если 2FA включен
  - Сохранять user_id в сессии для 2FA challenge
  - _Requirements: 3.1, 7.3_

- [ ] 8. Создание middleware для 2FA
  - [ ] 8.1 Создать `app/Http/Middleware/RequireTwoFactor.php`
    - Проверять, завершен ли 2FA challenge
    - Перенаправлять на challenge если не завершен
    - _Requirements: 3.1_

  - [ ] 8.2 Зарегистрировать middleware в `bootstrap/app.php`
    - Добавить alias 'two-factor'
    - _Requirements: 3.1_

- [ ] 9. Добавление роутов
  - Добавить роуты в `routes/web.php`:
    - `GET /two-factor/setup` - настройка 2FA
    - `POST /two-factor/enable` - начало включения
    - `POST /two-factor/confirm` - подтверждение включения
    - `DELETE /two-factor/disable` - отключение
    - `POST /two-factor/recovery-codes` - регенерация кодов
    - `GET /two-factor-challenge` - страница ввода кода
    - `POST /two-factor-challenge` - проверка кода
    - `POST /two-factor-challenge/recovery` - использование recovery кода
  - _Requirements: 1.1, 2.1, 3.1, 4.3, 10.1_

- [ ] 10. Создание UI компонентов
  - [ ] 10.1 Создать `resources/js/Components/Settings/TwoFactorSettings.tsx`
    - Отображение статуса 2FA (включен/выключен)
    - Кнопка "Включить 2FA"
    - Кнопка "Отключить 2FA"
    - Кнопка "Регенерировать коды восстановления"
    - Отображение даты включения
    - Отображение количества неиспользованных кодов
    - _Requirements: 6.1-6.5, 10.1_

  - [ ] 10.2 Создать `resources/js/Components/Settings/TwoFactorSetupModal.tsx`
    - Шаг 1: Отображение QR кода
    - Отображение секретного ключа для ручного ввода
    - Список совместимых приложений
    - Шаг 2: Ввод TOTP кода для подтверждения
    - Шаг 3: Отображение recovery кодов
    - Кнопка скачивания recovery кодов
    - _Requirements: 1.2-1.8, 4.2, 9.1-9.3_

  - [ ] 10.3 Создать `resources/js/Pages/Auth/TwoFactorChallenge.tsx`
    - Ввод 6-значного TOTP кода
    - Ссылка "Использовать код восстановления"
    - Отображение количества оставшихся попыток
    - Обработка ошибок
    - _Requirements: 3.2-3.6, 9.4_

  - [ ] 10.4 Создать `resources/js/Components/Auth/RecoveryCodeInput.tsx`
    - Ввод recovery кода
    - Валидация формата
    - _Requirements: 4.3, 4.4_

  - [ ]* 10.5 Написать тесты для UI компонентов
    - Тест рендеринга компонентов
    - Тест взаимодействия с формами
    - _Requirements: 9.1-9.5_

- [ ] 11. Интеграция в Settings
  - [ ] 11.1 Обновить `resources/js/Pages/App/Settings/Index.tsx`
    - Добавить секцию "Безопасность"
    - Интегрировать TwoFactorSettings компонент
    - _Requirements: 1.1, 6.1_

  - [ ] 11.2 Обновить `app/Http/Controllers/App/SettingsController.php`
    - Передавать 2FA статус в props
    - Передавать количество неиспользованных кодов
    - _Requirements: 6.1, 6.5_

- [ ] 12. Обновление HandleInertiaRequests
  - Добавить 2FA статус в shared data
  - Передавать информацию о необходимости 2FA challenge
  - _Requirements: 3.1_

- [ ] 13. Property-based тесты
  - [ ]* 13.1 Написать property тест для TOTP Time Window
    - **Property 1: TOTP Code Validity Window**
    - Генерировать случайные секреты и времена
    - Проверять, что коды принимаются в течение 60 секунд
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 13.2 Написать property тест для Recovery Code Single Use
    - **Property 2: Recovery Code Single Use**
    - Генерировать случайные recovery коды
    - Использовать каждый код один раз
    - Проверять, что повторное использование не работает
    - **Validates: Requirements 4.5**

  - [ ]* 13.3 Написать property тест для Secret Encryption
    - **Property 3: Secret Key Encryption**
    - Генерировать случайные секреты
    - Сохранять в БД
    - Проверять, что никогда не хранятся в открытом виде
    - **Validates: Requirements 8.4**

  - [ ]* 13.4 Написать property тест для Rate Limiting
    - **Property 4: Rate Limiting**
    - Генерировать случайных пользователей
    - Симулировать 5+ неудачных попыток
    - Проверять, что блокировка срабатывает
    - **Validates: Requirements 3.5, 8.6**

- [ ] 14. Checkpoint - Тестирование 2FA flow
  - Протестировать включение 2FA
  - Протестировать вход с 2FA
  - Протестировать использование recovery кодов
  - Протестировать отключение 2FA
  - Протестировать регенерацию кодов
  - Проверить rate limiting
  - Убедиться, что все тесты проходят

- [ ] 15. Документация
  - [ ] 15.1 Создать инструкцию для пользователей
    - Как включить 2FA
    - Какие приложения использовать
    - Как использовать recovery коды
    - Что делать при потере устройства
    - _Requirements: 9.1-9.3_

  - [ ] 15.2 Обновить README
    - Добавить секцию "Two-Factor Authentication"
    - Добавить troubleshooting
    - Добавить security best practices

- [ ] 16. Final checkpoint - Полное тестирование
  - Протестировать все 2FA сценарии
  - Проверить UI на разных устройствах
  - Проверить совместимость с разными authenticator apps
  - Проверить обработку всех типов ошибок
  - Убедиться, что документация актуальна
  - Запросить обратную связь от пользователя

## Notes

- Задачи, отмеченные `*`, являются опциональными (тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property тесты валидируют универсальные свойства корректности
- Unit тесты валидируют конкретные примеры и edge cases
- 2FA должен быть полностью протестирован перед production
- Recovery коды критически важны - пользователи должны их сохранить
