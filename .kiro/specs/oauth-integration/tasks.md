# Implementation Plan: OAuth Integration

## Overview

Реализация OAuth аутентификации через Google и Yandex с использованием Laravel Socialite. Включает backend логику, UI компоненты и интеграцию с существующей системой аутентификации.

## Tasks

- [ ] 1. Установка и настройка Laravel Socialite
  - Установить пакет `laravel/socialite` через Composer
  - Установить провайдер для Yandex `socialiteproviders/yandex`
  - Добавить конфигурацию в `config/services.php`
  - Обновить `.env.example` с OAuth переменными
  - _Requirements: 1.1, 2.1, 8.1_

- [ ] 2. Создание OAuthService
  - [ ] 2.1 Создать `app/Services/OAuthService.php`
    - Реализовать метод `handleCallback()`
    - Реализовать метод `findOrCreateUser()`
    - Реализовать метод `linkAccount()`
    - Реализовать метод `unlinkAccount()`
    - Реализовать метод `canUnlinkProvider()`
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 3.4, 3.5_

  - [ ]* 2.2 Написать unit тесты для OAuthService
    - Тест создания нового пользователя
    - Тест связывания с существующим пользователем
    - Тест отвязки OAuth аккаунта
    - Тест валидации последнего метода аутентификации
    - _Requirements: 1.3, 1.4, 3.5_

- [ ] 3. Создание OAuthController
  - [ ] 3.1 Создать `app/Http/Controllers/Auth/OAuthController.php`
    - Реализовать метод `redirect()` для перенаправления на OAuth провайдера
    - Реализовать метод `callback()` для обработки ответа от провайдера
    - Реализовать метод `link()` для связывания аккаунта из настроек
    - Реализовать метод `unlink()` для отвязки аккаунта
    - Добавить обработку ошибок с русскими сообщениями
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.5, 3.3, 3.4, 6.1-6.5_

  - [ ]* 3.2 Написать integration тесты для OAuthController
    - Тест Google OAuth flow с mock данными
    - Тест Yandex OAuth flow с mock данными
    - Тест обработки ошибок
    - _Requirements: 1.1-1.6, 2.1-2.6_

- [ ] 4. Обновление User модели
  - [ ] 4.1 Добавить методы в `app/Models/User.php`
    - Добавить метод `hasOAuthProvider()`
    - Добавить метод `getOAuthProvider()`
    - Добавить метод `hasPassword()`
    - Добавить метод `canRemoveOAuthProvider()`
    - _Requirements: 3.5, 3.6_

  - [ ]* 4.2 Написать unit тесты для User модели
    - Тест `hasOAuthProvider()`
    - Тест `canRemoveOAuthProvider()` с разными сценариями
    - _Requirements: 3.5, 3.6_

- [ ] 5. Добавление роутов
  - Добавить роуты в `routes/web.php`:
    - `GET /auth/{provider}/redirect` - перенаправление на OAuth
    - `GET /auth/{provider}/callback` - callback от OAuth
    - `POST /auth/{provider}/link` - связывание аккаунта (auth middleware)
    - `DELETE /auth/{provider}/unlink` - отвязка аккаунта (auth middleware)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.3, 3.4_

- [ ] 6. Создание OAuth UI компонентов
  - [ ] 6.1 Создать `resources/js/Components/Auth/OAuthButtons.tsx`
    - Кнопка "Войти через Google" с логотипом
    - Кнопка "Войти через Yandex" с логотипом
    - Разделитель "или"
    - Обработка loading состояния
    - Отображение ошибок
    - Адаптивная верстка
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 6.2 Создать иконки провайдеров
    - Создать `resources/js/Components/Auth/GoogleIcon.tsx`
    - Создать `resources/js/Components/Auth/YandexIcon.tsx`
    - _Requirements: 7.1, 7.2_

  - [ ]* 6.3 Написать тесты для OAuth компонентов
    - Тест рендеринга кнопок
    - Тест обработки кликов
    - Тест отображения ошибок
    - _Requirements: 7.1-7.6_

- [ ] 7. Интеграция OAuth кнопок в Login/Register
  - [ ] 7.1 Обновить `resources/js/Pages/Auth/Login.tsx`
    - Добавить компонент OAuthButtons
    - Добавить обработку OAuth ошибок из query параметров
    - _Requirements: 1.1, 2.1, 7.1, 7.2_

  - [ ] 7.2 Обновить `resources/js/Pages/Auth/Register.tsx`
    - Добавить компонент OAuthButtons
    - Добавить обработку OAuth ошибок из query параметров
    - _Requirements: 1.1, 2.1, 7.1, 7.2_

- [ ] 8. Создание страницы управления OAuth в настройках
  - [ ] 8.1 Создать `resources/js/Components/Settings/ConnectedAccounts.tsx`
    - Отображение подключенных OAuth аккаунтов
    - Кнопки "Подключить" для неподключенных провайдеров
    - Кнопки "Отключить" для подключенных провайдеров
    - Валидация перед отключением последнего метода аутентификации
    - Диалог подтверждения отключения
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 8.2 Обновить `resources/js/Pages/App/Settings/Index.tsx`
    - Добавить секцию "Подключенные аккаунты"
    - Интегрировать компонент ConnectedAccounts
    - _Requirements: 3.1_

  - [ ]* 8.3 Написать тесты для ConnectedAccounts
    - Тест отображения подключенных аккаунтов
    - Тест валидации отключения последнего метода
    - _Requirements: 3.1-3.6_

- [ ] 9. Обновление HandleInertiaRequests middleware
  - Добавить OAuth провайдеры в shared data
  - Передавать информацию о подключенных аккаунтах
  - _Requirements: 3.1_

- [ ] 10. Property-based тесты
  - [ ]* 10.1 Написать property тест для OAuth Account Uniqueness
    - **Property 1: OAuth Account Uniqueness**
    - Генерировать случайные комбинации provider + provider_user_id
    - Проверять, что дубликаты не создаются
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 10.2 Написать property тест для Email Auto-Verification
    - **Property 2: Email Auto-Verification**
    - Генерировать случайных OAuth пользователей
    - Проверять, что email_verified_at всегда установлен
    - **Validates: Requirements 4.1**

  - [ ]* 10.3 Написать property тест для Account Linking Safety
    - **Property 3: Account Linking Safety**
    - Генерировать пользователей с разными комбинациями auth методов
    - Проверять, что всегда остается хотя бы один метод аутентификации
    - **Validates: Requirements 3.5**

  - [ ]* 10.4 Написать property тест для OAuth Data Security
    - **Property 4: OAuth Data Security**
    - Генерировать случайные OAuth токены
    - Проверять, что токены никогда не возвращаются в API
    - **Validates: Requirements 5.5**

- [ ] 11. Checkpoint - Тестирование OAuth flow
  - Протестировать Google OAuth на dev окружении
  - Протестировать Yandex OAuth на dev окружении
  - Проверить создание новых пользователей
  - Проверить связывание с существующими пользователями
  - Проверить обработку ошибок
  - Убедиться, что все тесты проходят

- [ ] 12. Документация
  - [ ] 12.1 Создать инструкцию по настройке Google OAuth
    - Как создать проект в Google Cloud Console
    - Как получить Client ID и Client Secret
    - Как настроить Redirect URI
    - _Requirements: 1.1_

  - [ ] 12.2 Создать инструкцию по настройке Yandex OAuth
    - Как создать приложение в Yandex OAuth
    - Как получить Client ID и Client Secret
    - Как настроить Callback URL
    - _Requirements: 2.1_

  - [ ] 12.3 Обновить README с инструкциями по OAuth
    - Добавить секцию "OAuth Configuration"
    - Добавить примеры .env переменных
    - Добавить troubleshooting секцию

- [ ] 13. Final checkpoint - Полное тестирование
  - Протестировать все OAuth сценарии
  - Проверить UI на разных устройствах
  - Проверить обработку всех типов ошибок
  - Убедиться, что документация актуальна
  - Запросить обратную связь от пользователя

## Notes

- Задачи, отмеченные `*`, являются опциональными (тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property тесты валидируют универсальные свойства корректности
- Unit тесты валидируют конкретные примеры и edge cases
- Для production необходимо настроить реальные OAuth приложения у Google и Yandex
