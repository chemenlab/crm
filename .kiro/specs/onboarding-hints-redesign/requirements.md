# Requirements Document: Redesign Onboarding Hints System

## Introduction

Переработка системы подсказок (hints) для новых пользователей с использованием shadcn/ui компонентов и расширением функционала на все страницы приложения.

## Glossary

- **Hint**: Подсказка для пользователя о функционале страницы
- **OnboardingWizard**: Мастер первоначальной настройки при регистрации
- **shadcn/ui**: Библиотека UI компонентов
- **Page_Context**: Контекст конкретной страницы приложения

## Requirements

### Requirement 1: Использование shadcn/ui компонентов

**User Story:** Как разработчик, я хочу использовать shadcn/ui для всех компонентов подсказок, чтобы обеспечить единообразный дизайн.

#### Acceptance Criteria

1. THE Hint component SHALL use shadcn/ui Alert component
2. THE OnboardingWizard SHALL use shadcn/ui Dialog, Card, and other components
3. THE initial welcome banner SHALL use shadcn/ui Alert or Card component
4. ALL custom styling SHALL be replaced with shadcn/ui variants

### Requirement 2: Расширение подсказок на все страницы

**User Story:** Как новый пользователь, я хочу видеть подсказки на всех страницах приложения, чтобы понять весь функционал системы.

#### Acceptance Criteria

1. WHEN a user visits Dashboard THEN THE system SHALL show hints about dashboard features
2. WHEN a user visits Calendar THEN THE system SHALL show hints about calendar usage
3. WHEN a user visits Clients THEN THE system SHALL show hints about client management
4. WHEN a user visits Services THEN THE system SHALL show hints about service creation
5. WHEN a user visits Portfolio THEN THE system SHALL show hints about portfolio management
6. WHEN a user visits Finance THEN THE system SHALL show hints about finance tracking
7. WHEN a user visits Settings THEN THE system SHALL show hints about settings configuration
8. WHEN a user visits Notifications THEN THE system SHALL show hints about notification setup
9. WHEN a user visits Integrations THEN THE system SHALL show hints about integrations
10. WHEN a user visits Subscriptions THEN THE system SHALL show hints about subscription management

### Requirement 3: Контекстные подсказки

**User Story:** Как пользователь, я хочу видеть подсказки, релевантные текущей странице, чтобы быстро освоить функционал.

#### Acceptance Criteria

1. WHEN a page has empty state THEN THE system SHALL show hints about first actions
2. WHEN a page has data THEN THE system SHALL show hints about advanced features
3. WHEN a user completes an action THEN THE system SHALL show next step hints
4. THE system SHALL track which hints were viewed per page

### Requirement 4: Улучшенный дизайн подсказок

**User Story:** Как пользователь, я хочу видеть красивые и понятные подсказки, чтобы приятно было изучать систему.

#### Acceptance Criteria

1. THE Hint component SHALL have variants: info, tip, success, warning
2. THE Hint component SHALL support icons from lucide-react
3. THE Hint component SHALL have smooth animations
4. THE Hint component SHALL be dismissible with animation
5. THE Hint component SHALL support action buttons

### Requirement 5: Прогресс изучения

**User Story:** Как пользователь, я хочу видеть свой прогресс в изучении системы, чтобы понимать, что еще осталось узнать.

#### Acceptance Criteria

1. THE system SHALL track total hints viewed
2. THE system SHALL show progress indicator
3. THE system SHALL show achievement when all hints viewed
4. THE system SHALL store progress in database

### Requirement 6: Управление подсказками

**User Story:** Как пользователь, я хочу управлять отображением подсказок, чтобы скрыть их когда освоюсь.

#### Acceptance Criteria

1. THE user SHALL be able to dismiss individual hints
2. THE user SHALL be able to hide all hints
3. THE user SHALL be able to reset hints progress
4. THE system SHALL remember user preferences

### Requirement 7: Начальная плашка

**User Story:** Как новый пользователь, я хочу видеть приветственную плашку с кратким обзором, чтобы понять с чего начать.

#### Acceptance Criteria

1. WHEN a user first logs in THEN THE system SHALL show welcome banner
2. THE welcome banner SHALL use shadcn/ui Alert component
3. THE welcome banner SHALL show quick start guide
4. THE welcome banner SHALL be dismissible
5. THE welcome banner SHALL not show after dismissal

### Requirement 8: Интеграция с OnboardingWizard

**User Story:** Как новый пользователь, я хочу пройти мастер настройки, а затем видеть подсказки по функционалу.

#### Acceptance Criteria

1. WHEN OnboardingWizard completes THEN THE system SHALL show first page hints
2. THE OnboardingWizard SHALL use shadcn/ui components
3. THE OnboardingWizard SHALL have improved visual design
4. THE OnboardingWizard SHALL save progress

## Hint Categories by Page

### Dashboard
- Обзор статистики
- Быстрые действия
- Календарь занятости
- Последние записи

### Calendar
- Создание записи
- Навигация по календарю
- Фильтры и поиск
- Экспорт календаря

### Clients
- Добавление клиента
- Импорт клиентов
- Теги и группы
- История взаимодействий

### Services
- Создание услуги
- Настройка цен
- Длительность услуг
- Категории услуг

### Portfolio
- Загрузка фото
- Организация галереи
- Публикация портфолио
- Настройка отображения

### Finance
- Добавление транзакций
- Категории доходов/расходов
- Отчеты и аналитика
- Экспорт данных

### Settings
- Профиль мастера
- График работы
- Уведомления
- Интеграции

### Notifications
- Шаблоны уведомлений
- Настройка каналов
- Автоматические уведомления
- История отправки

### Integrations
- Подключение Telegram
- Подключение VK
- Настройка виджетов
- API доступ

### Subscriptions
- Выбор тарифа
- Управление подпиской
- Лимиты и использование
- Оплата и счета
