# Design Document: Leads Module

## Overview

Бесплатный модуль "Заявки" (Leads) позволяет мастерам создавать услуги без привязки к календарю. Клиенты могут оставлять заявки на такие услуги, а мастера - управлять ими через Kanban-доску с drag-and-drop, добавлять комментарии и todo-задачи.

## Architecture

```
app/Modules/Leads/
├── module.json                 # Манифест модуля
├── LeadsServiceProvider.php    # Service Provider
├── Controllers/
│   ├── LeadController.php      # CRUD для заявок
│   ├── LeadCommentController.php # Комментарии
│   └── PublicLeadController.php # Публичная форма
├── Models/
│   ├── Lead.php                # Модель заявки
│   ├── LeadTodo.php            # Модель задачи
│   ├── LeadComment.php         # Модель комментария
│   └── LeadFormField.php       # Настраиваемые поля
├── Database/
│   └── Migrations/
│       ├── create_leads_table.php
│       ├── create_lead_todos_table.php
│       ├── create_lead_comments_table.php
│       └── create_lead_form_fields_table.php
├── Routes/
│   ├── web.php                 # Маршруты дашборда
│   └── api.php                 # API маршруты
└── Hooks/
    └── ServiceHook.php         # Интеграция с услугами
```

## Components and Interfaces

### 1. Database Schema

#### services table (modification)
```sql
ALTER TABLE services ADD COLUMN booking_type ENUM('appointment', 'lead') DEFAULT 'appointment';
```

#### leads table
```sql
CREATE TABLE leads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,           -- Мастер
    client_id BIGINT NULL,             -- Клиент (если есть)
    service_id BIGINT NOT NULL,        -- Услуга
    name VARCHAR(255) NOT NULL,        -- Имя клиента
    phone VARCHAR(50) NOT NULL,        -- Телефон
    message TEXT NULL,                 -- Сообщение
    status ENUM('new', 'in_progress', 'completed', 'cancelled') DEFAULT 'new',
    position INT DEFAULT 0,            -- Позиция в колонке (для drag-and-drop)
    custom_fields JSON NULL,           -- Значения кастомных полей
    converted_appointment_id BIGINT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (converted_appointment_id) REFERENCES appointments(id)
);
```

#### lead_todos table
```sql
CREATE TABLE lead_todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

#### lead_comments table
```sql
CREATE TABLE lead_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,           -- Автор комментария
    content TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### lead_form_fields table (настраиваемые поля формы)
```sql
CREATE TABLE lead_form_fields (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    label VARCHAR(255) NOT NULL,       -- Название поля
    type ENUM('text', 'textarea', 'select', 'checkbox', 'email', 'url') DEFAULT 'text',
    options JSON NULL,                 -- Опции для select
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    position INT DEFAULT 0,            -- Порядок отображения
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. API Endpoints

#### Dashboard Routes (authenticated)
```
GET    /app/leads                    - Список заявок (Kanban view)
GET    /app/leads/{id}               - Детали заявки
PATCH  /app/leads/{id}/status        - Изменить статус
PATCH  /app/leads/{id}/position      - Изменить позицию (drag-and-drop)
POST   /app/leads/{id}/convert       - Конвертировать в запись
DELETE /app/leads/{id}               - Удалить заявку

POST   /app/leads/{id}/todos         - Добавить задачу
PATCH  /app/leads/{id}/todos/{tid}   - Обновить задачу
DELETE /app/leads/{id}/todos/{tid}   - Удалить задачу

POST   /app/leads/{id}/comments      - Добавить комментарий
DELETE /app/leads/{id}/comments/{cid} - Удалить комментарий

GET    /app/leads/settings/fields    - Список полей формы
POST   /app/leads/settings/fields    - Создать поле
PATCH  /app/leads/settings/fields/{id} - Обновить поле
DELETE /app/leads/settings/fields/{id} - Удалить поле
PATCH  /app/leads/settings/fields/reorder - Изменить порядок полей
```

#### Public Routes
```
POST /book/{slug}/lead - Создать заявку
```

### 3. Module Manifest

```json
{
    "slug": "leads",
    "name": "Заявки",
    "description": "Сбор заявок на услуги без привязки к дате. Kanban-доска, комментарии, todo-листы.",
    "version": "1.0.0",
    "author": "MasterPlan",
    "category": "crm",
    "icon": "clipboard-list",
    "pricing": {
        "type": "free"
    },
    "hooks": {
        "sidebar.menu": true,
        "service.form.fields": true,
        "public.booking.form": true,
        "settings.sections": true
    },
    "routes": {
        "web": "Routes/web.php",
        "api": null
    },
    "migrations": "Database/Migrations",
    "permissions": [],
    "settings": {
        "default_status": {
            "type": "select",
            "default": "new",
            "options": ["new", "in_progress"],
            "label": "Статус по умолчанию для новых заявок"
        },
        "notify_on_new_lead": {
            "type": "boolean",
            "default": true,
            "label": "Уведомлять о новых заявках"
        }
    }
}
```

### 4. Frontend Components (shadcn/ui + адаптив)

#### LeadsKanban.tsx - Главная страница
```tsx
// Kanban-доска с 4 колонками: Новые, В работе, Завершены, Отменены
// Drag-and-drop между колонками (используем @dnd-kit/core)
// Адаптив: на мобильных - табы вместо колонок
// Компоненты: Card, Badge, ScrollArea
```

#### LeadCard.tsx - Карточка заявки
```tsx
// Компактная карточка в колонке Kanban
// Показывает: имя, услуга, телефон, дата
// Клик открывает Sheet с деталями
```

#### LeadDetailSheet.tsx - Детали заявки (Sheet справа)
```tsx
// Sheet компонент (выезжает справа)
// Секции:
// - Информация о клиенте
// - Кастомные поля
// - Комментарии (с формой добавления)
// - Todo-лист (с чекбоксами)
// - Кнопки: Изменить статус, Конвертировать в запись
```

#### LeadFormFieldsSettings.tsx - Настройка полей формы
```tsx
// Страница настроек модуля
// Список полей с drag-and-drop для сортировки
// Форма добавления/редактирования поля
// Компоненты: Table, Dialog, Switch, Select
```

#### PublicLeadForm.tsx - Публичная форма
```tsx
// Интегрируется в публичную страницу бронирования
// Показывается вместо выбора даты для услуг с booking_type="lead"
// Динамически рендерит кастомные поля
```

## Data Models

### Lead Model
```php
class Lead extends Model
{
    protected $fillable = [
        'user_id', 'client_id', 'service_id',
        'name', 'phone', 'message', 'status',
        'position', 'custom_fields', 'converted_appointment_id'
    ];
    
    protected $casts = [
        'status' => LeadStatus::class,
        'custom_fields' => 'array',
        'position' => 'integer',
    ];
    
    public function user(): BelongsTo;
    public function client(): BelongsTo;
    public function service(): BelongsTo;
    public function todos(): HasMany;
    public function comments(): HasMany;
    public function convertedAppointment(): BelongsTo;
}
```

### LeadComment Model
```php
class LeadComment extends Model
{
    protected $fillable = ['lead_id', 'user_id', 'content'];
    
    public function lead(): BelongsTo;
    public function user(): BelongsTo;
}
```

### LeadFormField Model
```php
class LeadFormField extends Model
{
    protected $fillable = [
        'user_id', 'label', 'type', 'options',
        'is_required', 'is_active', 'position'
    ];
    
    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];
}
```

### LeadStatus Enum
```php
enum LeadStatus: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    
    public function label(): string
    {
        return match($this) {
            self::New => 'Новая',
            self::InProgress => 'В работе',
            self::Completed => 'Завершена',
            self::Cancelled => 'Отменена',
        };
    }
    
    public function color(): string
    {
        return match($this) {
            self::New => 'blue',
            self::InProgress => 'yellow',
            self::Completed => 'green',
            self::Cancelled => 'gray',
        };
    }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Service booking_type validation
*For any* service, the booking_type field SHALL only accept values "appointment" or "lead"
**Validates: Requirements 1.1**

### Property 2: Lead form validation
*For any* lead submission, the name and phone fields SHALL be required and non-empty
**Validates: Requirements 2.2**

### Property 3: Lead creation persistence
*For any* valid lead form submission, a Lead record SHALL be created in the database with matching data including custom fields
**Validates: Requirements 2.3**

### Property 4: Lead list completeness
*For any* lead in the system, the list response SHALL include client name, phone, service name, status, position, and created date
**Validates: Requirements 3.2**

### Property 5: Lead status transitions
*For any* lead, the status SHALL only be one of: new, in_progress, completed, cancelled
**Validates: Requirements 3.3, 3.4**

### Property 6: Lead position ordering
*For any* status column, leads SHALL be ordered by position field for drag-and-drop support
**Validates: Requirements 3.3 (Kanban)**

### Property 7: Todo item management
*For any* todo item, it SHALL have a title, completed status, and toggling SHALL update the completed status and completed_at timestamp
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Lead todos association
*For any* lead, all associated todo items SHALL be returned when fetching lead details
**Validates: Requirements 4.4**

### Property 9: Lead comments persistence
*For any* comment added to a lead, it SHALL be persisted with content, author, and timestamp
**Validates: Requirements (comments)**

### Property 10: Custom form fields
*For any* active custom field, it SHALL appear in the public lead form and values SHALL be stored in lead.custom_fields
**Validates: Requirements (custom fields)**

### Property 11: Lead to appointment conversion
*For any* lead converted to appointment, the lead status SHALL be set to "completed" and the appointment SHALL reference the lead_id
**Validates: Requirements 5.3, 5.4**

### Property 12: Module disabled fallback
*For any* service with booking_type="lead" when module is disabled, the service SHALL behave as a regular appointment service
**Validates: Requirements 6.5**

## Error Handling

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Lead not found | 404 | Заявка не найдена |
| Invalid status | 422 | Недопустимый статус |
| Service not lead type | 422 | Эта услуга не поддерживает заявки |
| Module not active | 403 | Модуль заявок не активен |

## Testing Strategy

### Unit Tests
- Lead model validation
- LeadStatus enum values
- Todo completion logic

### Property-Based Tests
- Lead creation with random valid data
- Status transitions
- Todo item CRUD operations

### Integration Tests
- Public lead submission flow
- Lead to appointment conversion
- Module enable/disable behavior

**Testing Framework**: PHPUnit with Laravel testing helpers
**Minimum iterations for property tests**: 100
