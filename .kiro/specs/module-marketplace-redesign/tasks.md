# Tasks: Module Marketplace Redesign

## Overview
Редизайн магазина приложений в стиле App Store / Google Play с разделением страницы модуля на магазин и настройки.

## Task 1: Обновить страницу Show.tsx (Редизайн)
- [x] Добавить галерею скриншотов с горизонтальным скроллом (ScreenshotGallery)
- [x] Улучшить header с иконкой, названием, рейтингом, установками
- [x] Обновить sidebar с правильными кнопками действий:
  - Бесплатный, не установлен → "Установить бесплатно"
  - Платный, не куплен → "Купить за X ₽" → переход на checkout
  - Установлен → "Настройки" → переход на страницу настроек
- [x] Добавить секцию отзывов (уже есть базовая)
- [x] Добавить блок информации о модуле
- [x] Добавить ModuleStatusBadge

**Files:**
- `resources/js/Pages/App/Modules/Show.tsx` ✅
- `resources/js/Components/Modules/ScreenshotGallery.tsx` ✅

## Task 2: Создать страницу Checkout.tsx
- [x] Создать страницу выбора периода подписки
- [x] Показать цены: месяц и год
- [x] Показать скидку при годовой подписке
- [x] Кнопка "Оплатить" → редирект на платёжный шлюз
- [x] Добавить backend метод checkout()

**Files:**
- `resources/js/Pages/App/Modules/Checkout.tsx` ✅
- `app/Http/Controllers/App/ModulePurchaseController.php` ✅
- `routes/web.php` ✅

## Task 3: Обновить страницу Settings.tsx
- [x] Проверить что страница доступна только для установленных модулей
- [x] Добавить информацию о подписке для платных модулей
- [x] Добавить кнопку "Отключить модуль" с подтверждением
- [x] Добавить ссылку "Назад в магазин"

**Files:**
- `resources/js/Pages/App/Modules/Settings.tsx` ✅

## Task 4: Обновить Catalog.tsx
- [x] Добавить фильтр по статусу (все / установленные / доступные)
- [x] Обновить карточки с бейджами статуса
- [x] Улучшить UI каталога

**Files:**
- `resources/js/Pages/App/Modules/Catalog.tsx` ✅

## Task 5: Создать компонент ModuleStatusBadge
- [x] Создать компонент для отображения статуса модуля
- [x] Статусы: "Не установлен", "Установлен", "Требует оплаты", "Подписка истекает"
- [x] Предупреждение если подписка истекает в течение 7 дней

**Files:**
- `resources/js/Components/Modules/ModuleStatusBadge.tsx` ✅

## Task 6: Backend - добавить метод checkout
- [x] Добавить GET /app/modules/{slug}/checkout
- [x] Добавить POST /app/modules/{slug}/checkout для обработки
- [x] Обновить роуты

**Files:**
- `app/Http/Controllers/App/ModulePurchaseController.php` ✅
- `routes/web.php` ✅

## Task 7: Обновить ModuleCard.tsx
- [x] Обновить кнопки действий согласно новой логике
- [x] Добавить ModuleStatusBadge
- [x] Установленные модули → кнопка "Настройки"

**Files:**
- `resources/js/Components/Modules/ModuleCard.tsx` ✅

## Task 8: Обновить экспорты компонентов
- [x] Добавить ModuleStatusBadge в index.ts
- [x] Добавить ScreenshotGallery в index.ts

**Files:**
- `resources/js/Components/Modules/index.ts` ✅

## Implementation Status: COMPLETE ✅

## Acceptance Criteria
- [x] Кнопка действия соответствует статусу модуля
- [x] Checkout страница показывает выбор периода с ценами
- [x] Годовая скидка отображается корректно
- [x] Настройки доступны только для установленных модулей
- [x] Статус модуля чётко виден на всех страницах
