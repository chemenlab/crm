# Design Document: Modular System

## Overview

Модульная система для MasterPlan позволяет расширять функционал платформы через подключаемые приложения. Архитектура основана на паттерне Plugin Architecture с использованием Service Provider в Laravel и динамической загрузки компонентов в React.

### Ключевые принципы:
- **Изоляция** — каждый модуль работает независимо
- **Расширяемость** — модули добавляют функционал через хуки
- **Обратная совместимость** — отключение модуля не ломает систему
- **Ленивая загрузка** — модули загружаются только когда нужны

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Core System                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Calendar   │  │   Clients   │  │   Finance   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Module Manager                            ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ││
│  │  │ Registry │  │  Loader  │  │  Hooks   │  │  Events  │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Reviews    │    │   Expenses    │    │  Promotions   │
│    Module     │    │    Module     │    │    Module     │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ - Models      │    │ - Models      │    │ - Models      │
│ - Controllers │    │ - Controllers │    │ - Controllers │
│ - Services    │    │ - Services    │    │ - Services    │
│ - Routes      │    │ - Routes      │    │ - Routes      │
│ - Components  │    │ - Components  │    │ - Components  │
│ - Hooks       │    │ - Hooks       │    │ - Hooks       │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. ModuleRegistry (Singleton)
Центральный реестр всех модулей в системе.

```php
interface ModuleRegistryInterface
{
    // Сканирование и регистрация модулей
    public function discover(): void;
    
    // Получение всех зарегистрированных модулей
    public function all(): Collection;
    
    // Получение модуля по slug
    public function get(string $slug): ?ModuleManifest;
    
    // Проверка существования модуля
    public function has(string $slug): bool;
    
    // Получение активных модулей для пользователя
    public function getActiveForUser(User $user): Collection;
}
```

#### 2. ModuleLoader
Загрузчик модулей — выполняет инициализацию активных модулей.

```php
interface ModuleLoaderInterface
{
    // Загрузка модуля (routes, migrations, service provider)
    public function load(ModuleManifest $module): void;
    
    // Выгрузка модуля
    public function unload(string $slug): void;
    
    // Проверка загружен ли модуль
    public function isLoaded(string $slug): bool;
    
    // Выполнение миграций модуля
    public function runMigrations(string $slug): void;
}
```

#### 3. HookManager
Менеджер точек расширения.

```php
interface HookManagerInterface
{
    // Регистрация хука от модуля
    public function register(string $hookPoint, string $moduleSlug, callable $callback, int $priority = 10): void;
    
    // Выполнение всех хуков для точки расширения
    public function execute(string $hookPoint, array $context = []): array;
    
    // Удаление хуков модуля
    public function removeModule(string $moduleSlug): void;
    
    // Получение списка зарегистрированных хуков
    public function getRegistered(string $hookPoint): array;
}
```

#### 4. ModuleEventDispatcher
Диспетчер событий для модулей.

```php
interface ModuleEventDispatcherInterface
{
    // Публикация события
    public function dispatch(string $event, array $payload = []): void;
    
    // Подписка на событие
    public function subscribe(string $event, string $moduleSlug, callable $handler): void;
    
    // Отписка модуля от всех событий
    public function unsubscribeModule(string $moduleSlug): void;
}
```

#### 5. UserModuleService
Сервис управления модулями пользователя.

```php
interface UserModuleServiceInterface
{
    // Включение модуля для пользователя
    public function enable(User $user, string $moduleSlug): bool;
    
    // Отключение модуля
    public function disable(User $user, string $moduleSlug): bool;
    
    // Проверка активности модуля
    public function isEnabled(User $user, string $moduleSlug): bool;
    
    // Получение всех модулей пользователя
    public function getUserModules(User $user): Collection;
    
    // Проверка доступа (подписка, покупка)
    public function canAccess(User $user, string $moduleSlug): bool;
}
```

#### 6. ModulePurchaseService
Сервис покупки модулей через ЮKassa.

```php
interface ModulePurchaseServiceInterface
{
    // Создание платежа для покупки модуля
    public function createPurchase(User $user, string $moduleSlug): ModulePurchase;
    
    // Обработка webhook от ЮKassa
    public function handlePaymentWebhook(array $payload): void;
    
    // Проверка наличия активной покупки
    public function hasActivePurchase(User $user, string $moduleSlug): bool;
    
    // Отмена подписки на модуль
    public function cancelSubscription(User $user, string $moduleSlug): bool;
    
    // Возврат платежа
    public function refund(ModulePurchase $purchase, string $reason): bool;
    
    // Получение истории покупок пользователя
    public function getPurchaseHistory(User $user): Collection;
    
    // Продление подписки (автоматическое)
    public function renewSubscription(ModulePurchase $purchase): bool;
}
```

#### 7. ModuleStatsService
Сервис статистики модулей для админки.

```php
interface ModuleStatsServiceInterface
{
    // Общая статистика по всем модулям
    public function getOverviewStats(): array;
    
    // Статистика конкретного модуля
    public function getModuleStats(string $moduleSlug, ?Carbon $from = null, ?Carbon $to = null): array;
    
    // Топ модулей по установкам
    public function getTopModules(int $limit = 5): Collection;
    
    // Доход по модулям за период
    public function getRevenueByModule(?Carbon $from = null, ?Carbon $to = null): Collection;
    
    // Пользователи модуля
    public function getModuleUsers(string $moduleSlug, int $perPage = 20): LengthAwarePaginator;
    
    // Агрегация статистики (вызывается по cron)
    public function aggregateDailyStats(): void;
}
```

#### 8. ModuleAdminService
Сервис управления модулями в админке.

```php
interface ModuleAdminServiceInterface
{
    // Обновление настроек модуля
    public function updateModule(string $moduleSlug, array $data): Module;
    
    // Глобальное включение/отключение модуля
    public function setGlobalStatus(string $moduleSlug, bool $isActive): void;
    
    // Выдача бесплатного доступа пользователю
    public function grantFreeAccess(User $user, string $moduleSlug, ?Carbon $expiresAt = null, string $reason = ''): ModuleGrant;
    
    // Отзыв бесплатного доступа
    public function revokeGrant(User $user, string $moduleSlug): void;
    
    // Получение логов ошибок модуля
    public function getErrorLogs(string $moduleSlug, int $perPage = 50): LengthAwarePaginator;
    
    // Очистка старых логов
    public function cleanupOldLogs(int $daysToKeep = 30): int;
}
```

### Frontend Components

#### 1. ModuleContext (React Context)
```typescript
interface ModuleContextValue {
  modules: Module[];
  activeModules: string[];
  isModuleActive: (slug: string) => boolean;
  enableModule: (slug: string) => Promise<void>;
  disableModule: (slug: string) => Promise<void>;
  purchaseModule: (slug: string) => Promise<void>;
}

// Хук для использования в компонентах
function useModules(): ModuleContextValue;
```

#### 2. HookRenderer (React Component)
```typescript
interface HookRendererProps {
  hookPoint: string;
  context?: Record<string, any>;
  fallback?: React.ReactNode;
}

// Рендерит все компоненты, зарегистрированные для хука
function HookRenderer({ hookPoint, context, fallback }: HookRendererProps): JSX.Element;
```

#### 3. ModuleRoute (React Component)
```typescript
interface ModuleRouteProps {
  moduleSlug: string;
  children: React.ReactNode;
}

// Обёртка для маршрутов модуля — проверяет активность
function ModuleRoute({ moduleSlug, children }: ModuleRouteProps): JSX.Element | null;
```

#### 4. ModuleCatalog (shadcn Components)
Страница каталога приложений.

```typescript
// Используемые shadcn компоненты:
// - Card, CardHeader, CardContent, CardFooter
// - Badge (для статуса: free, pro, installed)
// - Button
// - Input (поиск)
// - Tabs (категории)
// - Skeleton (загрузка)

interface ModuleCatalogProps {
  modules: Module[];
  categories: Category[];
  userModules: string[];
}
```

#### 5. ModuleCard (shadcn Components)
Карточка модуля в каталоге.

```typescript
// Используемые shadcn компоненты:
// - Card
// - Badge
// - Button
// - Avatar (иконка модуля)

interface ModuleCardProps {
  module: Module;
  isInstalled: boolean;
  isPurchased: boolean;
  onInstall: () => void;
  onPurchase: () => void;
  onUninstall: () => void;
}
```

#### 6. PurchaseDialog (shadcn Components)
Модальное окно покупки модуля.

```typescript
// Используемые shadcn компоненты:
// - Dialog, DialogContent, DialogHeader, DialogFooter
// - Button
// - RadioGroup (выбор периода подписки)
// - Separator
// - Alert (предупреждения)

interface PurchaseDialogProps {
  module: Module;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (period?: 'monthly' | 'yearly') => Promise<void>;
}
```

#### 7. ModuleSettings (shadcn Components)
Страница настроек модуля.

```typescript
// Используемые shadcn компоненты:
// - Card
// - Switch (boolean настройки)
// - Input, Textarea
// - Select
// - Button
// - Form (react-hook-form + zod)
// - Toast (уведомления о сохранении)

interface ModuleSettingsProps {
  module: Module;
  settings: ModuleSettingsSchema;
  values: Record<string, any>;
  onSave: (values: Record<string, any>) => Promise<void>;
}
```

#### 8. PurchaseHistory (shadcn Components)
История покупок модулей.

```typescript
// Используемые shadcn компоненты:
// - Table, TableHeader, TableBody, TableRow, TableCell
// - Badge (статус платежа)
// - Button (отмена подписки)
// - DropdownMenu (действия)

interface PurchaseHistoryProps {
  purchases: ModulePurchase[];
  onCancelSubscription: (purchaseId: number) => Promise<void>;
}
```

### Admin Panel Components (shadcn)

#### 9. AdminModuleStats (shadcn Components)
Страница статистики модулей в админке.

```typescript
// Используемые shadcn компоненты:
// - Card (метрики)
// - Tabs (периоды)
// - Select (фильтры)
// - Table (список модулей)
// - Chart (recharts для графиков)

interface AdminModuleStatsProps {
  overview: ModuleOverviewStats;
  modules: ModuleStats[];
  period: 'day' | 'week' | 'month' | 'year';
}
```

#### 10. AdminModuleList (shadcn Components)
Список модулей в админке с управлением.

```typescript
// Используемые shadcn компоненты:
// - Table
// - Badge
// - Switch (вкл/выкл)
// - Button
// - DropdownMenu (действия)
// - Dialog (редактирование)

interface AdminModuleListProps {
  modules: Module[];
  onEdit: (slug: string) => void;
  onToggle: (slug: string, active: boolean) => void;
}
```

#### 11. AdminModuleEdit (shadcn Components)
Форма редактирования модуля в админке.

```typescript
// Используемые shadcn компоненты:
// - Sheet или Dialog
// - Form
// - Input, Textarea
// - Select (тип монетизации, мин. план)
// - Switch
// - Button
// - Tabs (основное, цены, скриншоты)

interface AdminModuleEditProps {
  module: Module;
  onSave: (data: ModuleUpdateData) => Promise<void>;
  onClose: () => void;
}
```

#### 12. AdminModuleGrant (shadcn Components)
Выдача бесплатного доступа к модулю.

```typescript
// Используемые shadcn компоненты:
// - Dialog
// - Command (поиск пользователя)
// - DatePicker (срок действия)
// - Textarea (причина)
// - Button

interface AdminModuleGrantProps {
  moduleSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGrant: (userId: number, expiresAt?: Date, reason?: string) => Promise<void>;
}
```

#### 13. AdminModuleErrors (shadcn Components)
Логи ошибок модуля.

```typescript
// Используемые shadcn компоненты:
// - Table
// - Badge (тип ошибки)
// - Collapsible (stack trace)
// - Button (очистка)
// - Select (фильтр по типу)

interface AdminModuleErrorsProps {
  errors: ModuleErrorLog[];
  onClear: () => Promise<void>;
}
```

### Hook Points (Точки расширения)

| Hook Point | Описание | Контекст |
|------------|----------|----------|
| `sidebar.menu` | Пункты бокового меню | `{ user }` |
| `sidebar.menu.bottom` | Пункты внизу меню | `{ user }` |
| `dashboard.widgets` | Виджеты на дашборде | `{ user, period }` |
| `dashboard.stats` | Статистика на дашборде | `{ user, period }` |
| `client.card.tabs` | Вкладки в карточке клиента | `{ client }` |
| `client.card.actions` | Действия в карточке клиента | `{ client }` |
| `appointment.form.fields` | Поля в форме записи | `{ appointment }` |
| `appointment.card.info` | Информация в карточке записи | `{ appointment }` |
| `settings.sections` | Разделы в настройках | `{ user }` |
| `public.page.sections` | Секции на публичной странице | `{ master }` |
| `public.page.booking` | Расширение формы записи | `{ master, services }` |

## Data Models

### Database Schema

```sql
-- Таблица зарегистрированных модулей (кэш манифестов)
CREATE TABLE modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    version VARCHAR(20) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(50),
    icon VARCHAR(100),
    screenshots JSON,                    -- массив URL скриншотов
    pricing_type ENUM('free', 'subscription', 'one_time') DEFAULT 'free',
    price DECIMAL(10,2) DEFAULT 0,
    subscription_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
    min_plan VARCHAR(50) DEFAULT NULL,
    dependencies JSON,
    hooks JSON,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,      -- глобальный статус (админ может отключить)
    is_featured BOOLEAN DEFAULT FALSE,   -- показывать в рекомендуемых
    installs_count INT DEFAULT 0,        -- счётчик установок
    rating DECIMAL(2,1) DEFAULT 0,       -- средний рейтинг
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Связь пользователей с модулями
CREATE TABLE user_modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    module_slug VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    settings JSON,
    enabled_at TIMESTAMP,
    disabled_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,         -- для статистики активности
    usage_count INT DEFAULT 0,           -- сколько раз использовался
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_slug)
);

-- Покупки модулей (полная история)
CREATE TABLE module_purchases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    module_slug VARCHAR(100) NOT NULL,
    payment_id BIGINT NULL,
    yookassa_payment_id VARCHAR(100),    -- ID платежа в ЮKassa
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    pricing_type ENUM('subscription', 'one_time') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    purchased_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,           -- для подписок
    auto_renew BOOLEAN DEFAULT TRUE,     -- автопродление
    cancelled_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    refund_reason TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_user_module (user_id, module_slug),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at)
);

-- Настройки модулей (key-value для каждого пользователя)
CREATE TABLE module_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    module_slug VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_setting (user_id, module_slug, key)
);

-- Глобальные настройки модулей (для админки)
CREATE TABLE module_global_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_slug VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSON,
    updated_by BIGINT NULL,              -- кто изменил
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_global_setting (module_slug, key)
);

-- Бесплатные гранты модулей (админ дал бесплатно)
CREATE TABLE module_grants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    module_slug VARCHAR(100) NOT NULL,
    granted_by BIGINT NOT NULL,          -- кто выдал
    reason TEXT,
    expires_at TIMESTAMP NULL,           -- NULL = навсегда
    created_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grant (user_id, module_slug)
);

-- Логи событий модулей
CREATE TABLE module_events_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_slug VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSON,
    user_id BIGINT NULL,
    created_at TIMESTAMP,
    
    INDEX idx_module_event (module_slug, event_name),
    INDEX idx_created (created_at)
);

-- Статистика использования модулей (агрегированная по дням)
CREATE TABLE module_usage_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_slug VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    installs INT DEFAULT 0,              -- новых установок за день
    uninstalls INT DEFAULT 0,            -- отключений за день
    active_users INT DEFAULT 0,          -- активных пользователей
    purchases INT DEFAULT 0,             -- покупок
    revenue DECIMAL(10,2) DEFAULT 0,     -- доход
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE KEY unique_stat (module_slug, date),
    INDEX idx_date (date)
);

-- Логи ошибок модулей (для отладки в админке)
CREATE TABLE module_error_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_slug VARCHAR(100) NOT NULL,
    error_type VARCHAR(50) NOT NULL,     -- hook_error, route_error, migration_error
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id BIGINT NULL,
    context JSON,                        -- дополнительный контекст
    created_at TIMESTAMP,
    
    INDEX idx_module (module_slug),
    INDEX idx_created (created_at)
);
```

### Module Manifest (module.json)

```json
{
  "slug": "reviews",
  "name": "Отзывы клиентов",
  "description": "Сбор и отображение отзывов на публичной странице",
  "version": "1.0.0",
  "author": "MasterPlan",
  "category": "marketing",
  "icon": "star",
  "pricing": {
    "type": "free"
  },
  "minPlan": null,
  "dependencies": [],
  "hooks": {
    "sidebar.menu": true,
    "public.page.sections": true,
    "client.card.tabs": true,
    "settings.sections": true
  },
  "routes": {
    "web": "Routes/web.php",
    "api": "Routes/api.php"
  },
  "migrations": "Database/Migrations",
  "permissions": [
    "reviews.view",
    "reviews.create",
    "reviews.delete",
    "reviews.moderate"
  ],
  "settings": {
    "auto_request": {
      "type": "boolean",
      "default": true,
      "label": "Автоматически запрашивать отзыв после визита"
    },
    "request_delay_hours": {
      "type": "number",
      "default": 24,
      "label": "Через сколько часов запрашивать отзыв"
    }
  }
}
```

### Module Directory Structure

```
app/Modules/Reviews/
├── module.json                 # Манифест модуля
├── ModuleServiceProvider.php   # Service Provider
├── Controllers/
│   ├── ReviewController.php
│   └── Api/
│       └── ReviewApiController.php
├── Models/
│   └── Review.php
├── Services/
│   └── ReviewService.php
├── Database/
│   └── Migrations/
│       └── 2024_01_01_create_reviews_table.php
├── Routes/
│   ├── web.php
│   └── api.php
├── Events/
│   └── ReviewCreated.php
├── Listeners/
│   └── SendReviewNotification.php
└── Hooks/
    ├── SidebarMenuHook.php
    ├── PublicPageHook.php
    └── ClientCardHook.php
```

### Frontend Module Structure

```
resources/js/modules/reviews/
├── index.ts                    # Точка входа, экспорт хуков
├── components/
│   ├── ReviewList.tsx
│   ├── ReviewForm.tsx
│   ├── ReviewCard.tsx
│   └── ReviewWidget.tsx
├── pages/
│   ├── Index.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useSidebarMenu.ts       # Хук для sidebar.menu
│   ├── usePublicPage.ts        # Хук для public.page.sections
│   └── useClientCard.ts        # Хук для client.card.tabs
├── api/
│   └── reviews.ts
└── types/
    └── index.ts
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Module Discovery Completeness
*For any* set of valid modules in the `app/Modules` directory, the Module_Registry SHALL discover and register all of them after system startup.
**Validates: Requirements 1.1, 1.2**

### Property 2: Module Manifest Validation
*For any* module.json file, parsing then serializing back SHALL produce an equivalent manifest, and invalid manifests SHALL be rejected with appropriate error logging.
**Validates: Requirements 1.3, 1.4**

### Property 3: Module Activation Persistence
*For any* user and module, enabling the module SHALL create a User_Module record, and the module SHALL remain enabled across sessions until explicitly disabled.
**Validates: Requirements 2.2, 2.5**

### Property 4: Module Deactivation Data Preservation
*For any* user with module data, disabling the module SHALL NOT delete the user's module data, and re-enabling SHALL restore access to the same data.
**Validates: Requirements 2.3, 6.4**

### Property 5: Hook Execution for Active Modules Only
*For any* hook point and set of registered modules, executing the hook SHALL only invoke callbacks from modules that are currently enabled for the user.
**Validates: Requirements 3.2, 3.3, 7.4**

### Property 6: Route Prefix Consistency
*For any* module with routes, all API routes SHALL have prefix `/api/modules/{slug}` and all web routes SHALL have prefix `/app/modules/{slug}`.
**Validates: Requirements 4.2, 4.3**

### Property 7: Route Access Control
*For any* disabled module, all HTTP requests to its routes SHALL return 404 status code.
**Validates: Requirements 4.4, 5.1**

### Property 8: Permission and Subscription Enforcement
*For any* module with pricing or plan requirements, users without valid subscription or purchase SHALL NOT be able to enable the module.
**Validates: Requirements 5.2, 5.3, 9.3**

### Property 9: Settings Storage Round-Trip
*For any* module settings saved by a user, reading the settings back SHALL return the exact same values.
**Validates: Requirements 6.3**

### Property 10: Event Propagation
*For any* published event, all subscribed modules that are active SHALL receive the event, and inactive modules SHALL NOT receive it.
**Validates: Requirements 10.1, 10.2, 10.4**

### Property 11: Catalog Grouping Consistency
*For any* set of modules with categories, the catalog display SHALL group all modules by their category with no module appearing in multiple groups.
**Validates: Requirements 8.2, 8.3**

### Property 12: Purchase Flow Integrity
*For any* successful payment through YooKassa, the module SHALL be automatically activated for the user, and the purchase record SHALL be created with correct status.
**Validates: Requirements 9.5, 9.6**

### Property 13: Subscription Expiration Enforcement
*For any* module subscription that has expired, the module SHALL be automatically disabled, and the user SHALL be notified.
**Validates: Requirements 9.7, 9.9**

### Property 14: Admin Stats Accuracy
*For any* module, the statistics (installs, active users, revenue) SHALL accurately reflect the actual data in the database.
**Validates: Requirements 10.2, 10.3**

### Property 15: Admin Module Control
*For any* module disabled globally by admin, all users SHALL lose access to the module, and all users with the module SHALL be notified.
**Validates: Requirements 11.3, 11.4**

### Property 16: Free Grant Access
*For any* user granted free access to a paid module, the user SHALL be able to use the module without payment until the grant expires.
**Validates: Requirements 11.5**

## Error Handling

### Module Loading Errors
- **Invalid manifest**: Логируем ошибку, пропускаем модуль, продолжаем загрузку остальных
- **Missing dependencies**: Показываем пользователю список недостающих модулей
- **Migration failure**: Откатываем миграцию, отключаем модуль, уведомляем администратора
- **Route conflict**: Логируем конфликт, приоритет у ранее загруженного модуля

### Runtime Errors
- **Hook exception**: Ловим исключение, логируем, продолжаем выполнение других хуков
- **Event handler exception**: Ловим, логируем, не прерываем обработку других подписчиков
- **Permission denied**: Возвращаем 403 с понятным сообщением

### User-Facing Errors
- Модуль недоступен на вашем тарифе → предложение апгрейда
- Модуль требует другой модуль → кнопка "Включить оба"
- Ошибка загрузки модуля → "Попробуйте позже" + уведомление в поддержку

## Testing Strategy

### Unit Tests
- Валидация module.json schema
- ModuleRegistry.discover() с разными наборами модулей
- HookManager регистрация и выполнение
- UserModuleService enable/disable логика
- Permission checking

### Property-Based Tests (минимум 100 итераций)
- **Property 1**: Генерируем случайные валидные модули, проверяем обнаружение
- **Property 2**: Генерируем манифесты, проверяем round-trip
- **Property 4**: Создаём данные, отключаем модуль, проверяем сохранность
- **Property 5**: Генерируем комбинации активных/неактивных модулей, проверяем вызовы хуков
- **Property 7**: Генерируем запросы к отключённым модулям, проверяем 404
- **Property 9**: Генерируем случайные настройки, проверяем round-trip
- **Property 10**: Генерируем события и подписчиков, проверяем доставку

### Integration Tests
- Полный цикл: регистрация → включение → использование → отключение
- Миграции модуля выполняются корректно
- Хуки рендерятся в правильных местах UI
- События доставляются между модулями

### E2E Tests
- Пользователь включает модуль через UI
- Пункт меню появляется в сайдбаре
- Страница модуля открывается
- Настройки модуля сохраняются
