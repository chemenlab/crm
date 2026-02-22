# Requirements Document

## Introduction

Редизайн магазина приложений (модулей) для создания качественного пользовательского опыта, аналогичного App Store / Google Play. Разделение страницы модуля на две части: страница магазина (для просмотра и покупки) и страница настроек (после установки).

## Glossary

- **Module_Marketplace**: Каталог всех доступных модулей системы
- **Module_Detail_Page**: Страница детального просмотра модуля в магазине
- **Module_Settings_Page**: Страница настроек установленного модуля
- **Purchase_Flow**: Процесс покупки платного модуля
- **Module_Status**: Статус модуля для пользователя (не установлен, установлен, куплен, требует оплаты)

## Requirements

### Requirement 1: Страница каталога модулей

**User Story:** Как пользователь, я хочу видеть красивый каталог модулей с категориями и поиском, чтобы легко находить нужные расширения.

#### Acceptance Criteria

1. THE Module_Marketplace SHALL display modules as cards with icon, name, short description, rating, and price
2. WHEN a user searches for a module, THE Module_Marketplace SHALL filter modules by name and description in real-time
3. THE Module_Marketplace SHALL group modules by categories with tabs for filtering
4. WHEN a module is installed, THE Module_Marketplace SHALL show "Установлен" badge on the card
5. THE Module_Marketplace SHALL highlight featured modules with a special badge

### Requirement 2: Страница детального просмотра модуля (Магазин)

**User Story:** Как пользователь, я хочу видеть полную информацию о модуле перед установкой, включая скриншоты, описание, рейтинг и отзывы.

#### Acceptance Criteria

1. THE Module_Detail_Page SHALL display module header with icon, name, author, version, rating, and install count
2. THE Module_Detail_Page SHALL show a gallery of screenshots with horizontal scroll or carousel
3. THE Module_Detail_Page SHALL display full description with features list
4. THE Module_Detail_Page SHALL show reviews section with user ratings and comments
5. THE Module_Detail_Page SHALL display sidebar with pricing info and action button
6. WHEN module is free and not installed, THE Module_Detail_Page SHALL show "Установить бесплатно" button
7. WHEN module is paid and not purchased, THE Module_Detail_Page SHALL show price and "Купить" button
8. WHEN module is installed, THE Module_Detail_Page SHALL show "Настройки" button that navigates to settings page
9. THE Module_Detail_Page SHALL display module information block (version, author, category, min plan, last update)

### Requirement 3: Процесс покупки платного модуля

**User Story:** Как пользователь, я хочу выбрать период подписки и оплатить модуль, чтобы получить к нему доступ.

#### Acceptance Criteria

1. WHEN user clicks "Купить" on a paid module, THE Purchase_Flow SHALL navigate to checkout page
2. THE Purchase_Flow SHALL display subscription period options (monthly, yearly) with prices
3. THE Purchase_Flow SHALL show yearly discount percentage if applicable
4. WHEN user selects a period and clicks "Оплатить", THE Purchase_Flow SHALL redirect to payment gateway
5. WHEN payment is successful, THE Purchase_Flow SHALL redirect to success page and enable the module
6. IF payment fails, THEN THE Purchase_Flow SHALL show error message and allow retry

### Requirement 4: Страница настроек модуля (после установки)

**User Story:** Как пользователь с установленным модулем, я хочу иметь отдельную страницу настроек для управления модулем.

#### Acceptance Criteria

1. THE Module_Settings_Page SHALL only be accessible for installed modules
2. THE Module_Settings_Page SHALL display module-specific settings defined by the module
3. THE Module_Settings_Page SHALL show module statistics if available (e.g., leads count, conversion rate)
4. THE Module_Settings_Page SHALL provide "Отключить модуль" button
5. WHEN user disables module, THE Module_Settings_Page SHALL show confirmation dialog
6. THE Module_Settings_Page SHALL display subscription info for paid modules (expiry date, auto-renew status)

### Requirement 5: Навигация между страницами

**User Story:** Как пользователь, я хочу легко переключаться между магазином и настройками модуля.

#### Acceptance Criteria

1. WHEN viewing module in marketplace and it's installed, THE Module_Detail_Page SHALL show "Настройки" button
2. WHEN in module settings, THE Module_Settings_Page SHALL show "Назад в магазин" link
3. THE sidebar menu SHALL show installed modules with direct links to their main functionality
4. THE Module_Marketplace SHALL have "Мои приложения" tab showing only installed modules

### Requirement 6: Статусы и состояния модуля

**User Story:** Как пользователь, я хочу чётко видеть статус каждого модуля (установлен, требует оплаты, истекает подписка).

#### Acceptance Criteria

1. THE Module_Status SHALL clearly indicate if module is "Не установлен", "Установлен", "Требует оплаты", or "Подписка истекает"
2. WHEN subscription is expiring within 7 days, THE Module_Status SHALL show warning badge
3. WHEN module requires higher subscription plan, THE Module_Status SHALL show "Требуется тариф X" message
4. THE Module_Marketplace SHALL allow filtering by status (all, installed, available)
