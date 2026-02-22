# Design Document: Support Ticket System

## Overview

Система тикетов технической поддержки для MasterPlan CRM обеспечивает коммуникацию между пользователями сервиса (мастерами) и администраторами платформы. Пользователи могут создавать обращения с техническими вопросами и проблемами, а администраторы обрабатывают их и помогают решать проблемы.

**Ключевые особенности:**
- Полный цикл обработки тикетов (создание → обработка → решение → закрытие)
- Назначение тикетов конкретным администраторам
- Внутренние заметки для коммуникации между администраторами
- Email уведомления о всех событиях
- Прикрепление файлов (скриншоты, логи)
- Статистика и оценка качества поддержки
- Автоматическое закрытие неактивных тикетов

## Architecture

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Pages (User):                                               │
│  - App/Support/Index.tsx (список тикетов пользователя)       │
│  - App/Support/Create.tsx (создание тикета)                  │
│  - App/Support/Show.tsx (просмотр тикета)                    │
│                                                              │
│  Pages (Admin):                                              │
│  - Admin/Support/Index.tsx (список всех тикетов)             │
│  - Admin/Support/Show.tsx (просмотр и ответ на тикет)        │
│  - Admin/Support/Stats.tsx (статистика)                      │
│  - Admin/Settings/SupportTemplates.tsx (шаблоны ответов)     │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                 │
│  - SupportTicketCard.tsx (карточка тикета)                   │
│  - SupportTicketMessage.tsx (сообщение)                      │
│  - SupportTicketReplyForm.tsx (форма ответа)                 │
│  - SupportTicketStatusBadge.tsx (бейдж статуса)              │
│  - SupportTicketPriorityBadge.tsx (бейдж приоритета)         │
│  - SupportTicketFilters.tsx (фильтры)                        │
│  - SupportTicketAssign.tsx (назначение администратора)       │
│  - SupportTicketRating.tsx (оценка качества)                 │
│  - InternalNoteForm.tsx (внутренняя заметка)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Laravel)                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers:                                                │
│  - SupportTicketController (для пользователей)               │
│    - index() - список тикетов пользователя                   │
│    - store() - создание тикета                               │
│    - show($id) - просмотр тикета                             │
│    - close($id) - закрытие тикета                            │
│    - reopen($id) - переоткрытие тикета                       │
│    - rate($id) - оценка качества                             │
│  - Admin\SupportTicketController (для администраторов)       │
│    - index() - список всех тикетов                           │
│    - show($id) - просмотр тикета                             │
│    - updateStatus($id) - изменение статуса                   │
│    - updatePriority($id) - изменение приоритета              │
│    - assign($id) - назначение администратора                 │
│    - export() - экспорт тикетов                              │
│  - SupportTicketMessageController                            │
│    - store() - добавление сообщения                          │
│    - storeInternal() - добавление внутренней заметки         │
│  - Admin\SupportTemplateController                           │
│    - index() - список шаблонов                               │
│    - store() - создание шаблона                              │
│    - update($id) - обновление шаблона                        │
│    - destroy($id) - удаление шаблона                         │
│  - Admin\SupportStatsController                              │
│    - index() - статистика по тикетам                         │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│  - SupportTicketService                                      │
│    - createTicket($data, $user)                              │
│    - addMessage($ticket, $message, $user, $isInternal)       │
│    - changeStatus($ticket, $status, $admin)                  │
│    - assignTicket($ticket, $admin)                           │
│    - closeTicket($ticket, $user)                             │
│    - reopenTicket($ticket, $user)                            │
│    - rateTicket($ticket, $rating, $comment)                  │
│  - SupportNotificationService                                │
│    - notifyAdminsNewTicket($ticket)                          │
│    - notifyUserNewMessage($ticket, $message)                 │
│    - notifyAdminNewMessage($ticket, $message)                │
│    - notifyUserStatusChange($ticket)                         │
│    - notifyAdminAssigned($ticket, $admin)                    │
│  - SupportStatsService                                       │
│    - getGlobalStats()                                        │
│    - getAdminStats($admin)                                   │
│    - getAverageResponseTime()                                │
│    - getAverageResolutionTime()                              │
│    - getAverageRating()                                      │
│  - SupportExportService                                      │
│    - exportTickets($filters, $format)                        │
├─────────────────────────────────────────────────────────────┤
│  Models:                                                     │
│  - SupportTicket                                             │
│  - SupportTicketMessage                                      │
│  - SupportTicketAttachment                                   │
│  - SupportTemplate                                           │
├─────────────────────────────────────────────────────────────┤
│  Jobs:                                                       │
│  - AutoCloseInactiveSupportTickets (scheduled daily)         │
│  - SendSupportTicketNotification                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database (MySQL)                         │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - support_tickets                                           │
│  - support_ticket_messages                                   │
│  - support_ticket_attachments                                │
│  - support_templates                                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### SupportTicketCard Component

```typescript
interface SupportTicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
  showUser?: boolean;  // Показывать имя пользователя (для админа)
}

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  status: 'new' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'bug' | 'feature_request' | 'billing' | 'other';
  user: {
    id: number;
    name: string;
    email: string;
    subscription_plan?: string;
  };
  assigned_admin?: {
    id: number;
    name: string;
  };
  unread_count: number;
  rating?: number;
  last_message_at: string;
  created_at: string;
}
```

#### InternalNoteForm Component

```typescript
interface InternalNoteFormProps {
  ticketId: number;
  onSuccess: () => void;
}
```

### 2. Backend Services

#### SupportTicketService

```php
class SupportTicketService
{
    /**
     * Создать новый тикет
     */
    public function createTicket(array $data, User $user): SupportTicket
    {
        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'ticket_number' => $this->generateTicketNumber(),
            'subject' => $data['subject'],
            'category' => $data['category'],
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'new',
        ]);
        
        // Создаем первое сообщение
        $this->addMessage(
            $ticket, 
            $data['message'], 
            $user, 
            false,
            $data['attachments'] ?? []
        );
        
        // Отправляем уведомление всем администраторам
        app(SupportNotificationService::class)->notifyAdminsNewTicket($ticket);
        
        return $ticket;
    }
    
    /**
     * Добавить сообщение в тикет
     */
    public function addMessage(
        SupportTicket $ticket, 
        string $message, 
        User $user, 
        bool $isInternal = false,
        array $attachments = []
    ): SupportTicketMessage {
        $ticketMessage = SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $message,
            'is_internal' => $isInternal,
        ]);
        
        // Обрабатываем вложения
        foreach ($attachments as $file) {
            $this->attachFile($ticketMessage, $file);
        }
        
        // Обновляем статус тикета
        if ($ticket->status === 'new' && $user->isAdmin()) {
            $ticket->update([
                'status' => 'in_progress',
                'first_response_at' => now(),
            ]);
        }
        
        if ($ticket->status === 'waiting_for_user' && !$user->isAdmin()) {
            $ticket->update(['status' => 'in_progress']);
        }
        
        // Отправляем уведомление (только если не внутренняя заметка)
        if (!$isInternal) {
            if ($user->isAdmin()) {
                app(SupportNotificationService::class)
                    ->notifyUserNewMessage($ticket, $ticketMessage);
            } else {
                app(SupportNotificationService::class)
                    ->notifyAdminNewMessage($ticket, $ticketMessage);
            }
        }
        
        return $ticketMessage;
    }
    
    /**
     * Назначить тикет администратору
     */
    public function assignTicket(SupportTicket $ticket, User $admin): void
    {
        $ticket->update(['assigned_admin_id' => $admin->id]);
        
        app(SupportNotificationService::class)->notifyAdminAssigned($ticket, $admin);
    }
    
    /**
     * Оценить качество поддержки
     */
    public function rateTicket(
        SupportTicket $ticket, 
        int $rating, 
        ?string $comment = null
    ): void {
        $ticket->update([
            'rating' => $rating,
            'rating_comment' => $comment,
            'rated_at' => now(),
        ]);
    }
    
    /**
     * Генерировать номер тикета
     */
    private function generateTicketNumber(): string
    {
        return 'SUP-' . strtoupper(Str::random(8));
    }
}
```


## Data Models

### SupportTicket Model

```php
class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',              // Пользователь, создавший тикет
        'assigned_admin_id',    // Назначенный администратор
        'ticket_number',        // Уникальный номер тикета
        'subject',              // Тема тикета
        'category',             // Категория
        'priority',             // Приоритет
        'status',               // Статус
        'resolution_summary',   // Резюме решения
        'rating',               // Оценка (1-5)
        'rating_comment',       // Комментарий к оценке
        'first_response_at',    // Время первого ответа
        'resolved_at',          // Время решения
        'closed_at',            // Время закрытия
        'rated_at',             // Время оценки
    ];
    
    protected $casts = [
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'rated_at' => 'datetime',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function assignedAdmin()
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }
    
    public function messages()
    {
        return $this->hasMany(SupportTicketMessage::class);
    }
    
    public function publicMessages()
    {
        return $this->messages()->where('is_internal', false);
    }
    
    public function internalNotes()
    {
        return $this->messages()->where('is_internal', true);
    }
    
    public function getUnreadCountAttribute(): int
    {
        $userId = auth()->id();
        $isAdmin = auth()->user()->isAdmin();
        
        return $this->messages()
            ->where('is_internal', false)
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
    }
}
```

### SupportTicketMessage Model

```php
class SupportTicketMessage extends Model
{
    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'message',
        'is_internal',  // Внутренняя заметка (видна только админам)
        'is_read',
    ];
    
    protected $casts = [
        'is_internal' => 'boolean',
        'is_read' => 'boolean',
    ];
    
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(SupportTicketAttachment::class);
    }
}
```

### SupportTemplate Model

```php
class SupportTemplate extends Model
{
    protected $fillable = [
        'name',
        'content',
        'is_active',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
    
    /**
     * Заменить переменные в шаблоне
     */
    public function render(SupportTicket $ticket): string
    {
        $content = $this->content;
        
        $variables = [
            '{user_name}' => $ticket->user->name,
            '{ticket_number}' => $ticket->ticket_number,
            '{admin_name}' => auth()->user()->name,
        ];
        
        return str_replace(
            array_keys($variables),
            array_values($variables),
            $content
        );
    }
}
```

## Correctness Properties

*Свойство корректности - это характеристика или поведение, которое должно выполняться для всех допустимых выполнений системы.*

### Property 1: Уведомления отправляются при всех событиях

*For any* тикета, при создании, добавлении сообщения или изменении статуса должно отправляться email уведомление соответствующему получателю.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 2: Статус тикета изменяется корректно

*For any* тикета, переходы между статусами должны следовать правилам: new → in_progress → waiting_for_user/resolved → closed, с возможностью reopening.

**Validates: Requirements 4.2, 4.5, 6.6, 7.2**

### Property 3: Внутренние заметки видны только администраторам

*For any* внутренней заметки, она должна быть видна только пользователям с ролью администратора и не должна быть видна обычным пользователям.

**Validates: Requirements 9.3, 9.4**

### Property 4: Файлы валидируются при загрузке

*For any* загружаемого файла, система должна проверить тип файла и размер перед сохранением.

**Validates: Requirements 11.2, 11.3**

### Property 5: Неактивные тикеты автоматически закрываются

*For any* тикета со статусом "resolved", если прошло 30 дней без активности, тикет должен быть автоматически закрыт.

**Validates: Requirements 15.1, 15.2, 15.3**

### Property 6: Шаблоны корректно заменяют переменные

*For any* шаблона ответа, все переменные {user_name}, {ticket_number}, {admin_name} должны быть заменены на соответствующие значения.

**Validates: Requirements 16.6**

### Property 7: Поиск возвращает релевантные результаты

*For any* поискового запроса, результаты должны содержать только тикеты, в которых запрос встречается в теме, описании или сообщениях.

**Validates: Requirements 13.2, 13.3**

### Property 8: Оценка сохраняется корректно

*For any* закрытого тикета, если пользователь оставляет оценку, она должна быть сохранена и отображаться в статистике.

**Validates: Requirements 18.1, 18.2, 18.3**

## Error Handling

### Frontend Error Handling

1. **Ошибка создания тикета:**
   - Показать сообщение об ошибке
   - Сохранить введенные данные в форме
   - Позволить повторить отправку

2. **Ошибка загрузки файла:**
   - Показать сообщение о причине (размер, тип файла)
   - Позволить повторить загрузку
   - Не блокировать отправку сообщения

3. **Ошибка отправки сообщения:**
   - Показать уведомление об ошибке
   - Сохранить текст сообщения
   - Предложить повторить отправку

### Backend Error Handling

1. **Ошибка при отправке email:**
   - Логировать ошибку
   - Не блокировать создание тикета/сообщения
   - Добавить в очередь для повторной отправки

2. **Ошибка при назначении администратора:**
   - Логировать ошибку
   - Вернуть ошибку 400 с сообщением
   - Не изменять текущее назначение

3. **Ошибка при загрузке файла:**
   - Валидировать размер и тип
   - Вернуть понятное сообщение об ошибке
   - Не сохранять невалидные файлы

## Testing Strategy

### Unit Tests

1. **SupportTicketService:**
   - Тест создания тикета
   - Тест добавления сообщения
   - Тест добавления внутренней заметки
   - Тест изменения статуса
   - Тест назначения администратора
   - Тест оценки качества

2. **SupportStatsService:**
   - Тест расчета глобальной статистики
   - Тест расчета статистики по администратору
   - Тест расчета среднего времени ответа
   - Тест расчета средней оценки

3. **SupportTemplate:**
   - Тест замены переменных в шаблоне
   - Тест рендеринга шаблона с разными данными

### Property-Based Tests

Минимум 100 итераций для каждого теста.

**Property Test 1: Уведомления отправляются**
```php
// Feature: support-tickets, Property 1: Уведомления отправляются при всех событиях
test('notifications are sent for all events', function () {
    Notification::fake();
    
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    
    $service = new SupportTicketService();
    
    // Создание тикета
    $ticket = $service->createTicket([
        'subject' => 'Test',
        'message' => 'Test message',
        'category' => 'technical',
    ], $user);
    
    // Проверяем, что уведомление отправлено админам
    Notification::assertSentTo(
        User::where('is_admin', true)->get(),
        NewSupportTicketNotification::class
    );
})->repeat(100);
```

**Property Test 2: Внутренние заметки видны только админам**
```php
// Feature: support-tickets, Property 3: Внутренние заметки видны только администраторам
test('internal notes are visible only to admins', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $ticket = SupportTicket::factory()->create(['user_id' => $user->id]);
    
    $service = new SupportTicketService();
    $service->addMessage($ticket, 'Internal note', $admin, true);
    
    // Проверяем, что обычный пользователь не видит внутреннюю заметку
    $this->actingAs($user);
    $response = $this->get(route('support.show', $ticket));
    $response->assertDontSee('Internal note');
    
    // Проверяем, что админ видит внутреннюю заметку
    $this->actingAs($admin);
    $response = $this->get(route('admin.support.show', $ticket));
    $response->assertSee('Internal note');
})->repeat(100);
```


### Integration Tests

1. **Полный flow создания и обработки тикета:**
   - Пользователь создает тикет
   - Администраторы получают уведомление
   - Администратор назначает себе тикет
   - Администратор отвечает на тикет
   - Пользователь получает уведомление
   - Пользователь отвечает
   - Администратор решает тикет
   - Пользователь оценивает качество
   - Пользователь закрывает тикет

2. **Тестирование внутренних заметок:**
   - Администратор добавляет внутреннюю заметку
   - Проверка видимости для администраторов
   - Проверка невидимости для пользователей
   - Проверка отсутствия уведомлений пользователю

3. **Тестирование автозакрытия:**
   - Создание resolved тикета
   - Ожидание 30 дней (Carbon::setTestNow)
   - Запуск job автозакрытия
   - Проверка статуса и уведомления

## Implementation Notes

### Database Schema

**support_tickets table:**
```sql
CREATE TABLE support_tickets (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    assigned_admin_id BIGINT UNSIGNED NULL,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category ENUM('technical', 'bug', 'feature_request', 'billing', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('new', 'in_progress', 'waiting_for_user', 'resolved', 'closed') DEFAULT 'new',
    resolution_summary TEXT NULL,
    rating TINYINT UNSIGNED NULL,
    rating_comment TEXT NULL,
    first_response_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    rated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_assigned_admin (assigned_admin_id, status),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status_priority (status, priority)
);
```

**support_ticket_messages table:**
```sql
CREATE TABLE support_ticket_messages (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    support_ticket_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (support_ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_internal (support_ticket_id, is_internal),
    INDEX idx_ticket_unread (support_ticket_id, is_read)
);
```

**support_ticket_attachments table:**
```sql
CREATE TABLE support_ticket_attachments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    support_ticket_message_id BIGINT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (support_ticket_message_id) REFERENCES support_ticket_messages(id) ON DELETE CASCADE
);
```

**support_templates table:**
```sql
CREATE TABLE support_templates (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Routes Structure

```php
// User routes
Route::prefix('app/support')->middleware(['auth'])->group(function () {
    Route::get('/', [SupportTicketController::class, 'index'])->name('support.index');
    Route::get('/create', [SupportTicketController::class, 'create'])->name('support.create');
    Route::post('/', [SupportTicketController::class, 'store'])->name('support.store');
    Route::get('/{ticket}', [SupportTicketController::class, 'show'])->name('support.show');
    Route::post('/{ticket}/messages', [SupportTicketMessageController::class, 'store']);
    Route::post('/{ticket}/close', [SupportTicketController::class, 'close']);
    Route::post('/{ticket}/reopen', [SupportTicketController::class, 'reopen']);
    Route::post('/{ticket}/rate', [SupportTicketController::class, 'rate']);
});

// Admin routes
Route::prefix('admin/support')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', [Admin\SupportTicketController::class, 'index'])->name('admin.support.index');
    Route::get('/stats', [Admin\SupportStatsController::class, 'index'])->name('admin.support.stats');
    Route::get('/{ticket}', [Admin\SupportTicketController::class, 'show'])->name('admin.support.show');
    Route::patch('/{ticket}/status', [Admin\SupportTicketController::class, 'updateStatus']);
    Route::patch('/{ticket}/priority', [Admin\SupportTicketController::class, 'updatePriority']);
    Route::post('/{ticket}/assign', [Admin\SupportTicketController::class, 'assign']);
    Route::post('/{ticket}/messages', [SupportTicketMessageController::class, 'store']);
    Route::post('/{ticket}/internal-notes', [SupportTicketMessageController::class, 'storeInternal']);
    Route::get('/export', [Admin\SupportTicketController::class, 'export']);
});

// Admin template routes
Route::prefix('admin/settings/support-templates')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', [Admin\SupportTemplateController::class, 'index']);
    Route::post('/', [Admin\SupportTemplateController::class, 'store']);
    Route::patch('/{template}', [Admin\SupportTemplateController::class, 'update']);
    Route::delete('/{template}', [Admin\SupportTemplateController::class, 'destroy']);
});
```

### Email Notifications

**NewSupportTicketNotification (для администраторов):**
- Тема: "Новый тикет поддержки #{ticket_number}: {subject}"
- Содержание: информация о пользователе, категория, приоритет, первое сообщение
- Кнопка: "Просмотреть тикет"

**NewSupportMessageNotification (для пользователя и администратора):**
- Тема: "Новое сообщение в тикете #{ticket_number}"
- Содержание: текст сообщения, имя отправителя
- Кнопка: "Ответить"

**SupportTicketResolvedNotification (для пользователя):**
- Тема: "Тикет #{ticket_number} решен"
- Содержание: резюме решения
- Кнопки: "Оценить поддержку", "Закрыть тикет"

**SupportTicketAssignedNotification (для администратора):**
- Тема: "Вам назначен тикет #{ticket_number}"
- Содержание: информация о тикете
- Кнопка: "Просмотреть тикет"

**SupportTicketAutoClosedNotification (для пользователя):**
- Тема: "Тикет #{ticket_number} автоматически закрыт"
- Содержание: информация об автозакрытии
- Кнопка: "Переоткрыть тикет"

### Scheduled Jobs

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    // Автозакрытие неактивных тикетов каждый день в 3:00
    $schedule->job(new AutoCloseInactiveSupportTickets)->dailyAt('03:00');
}
```

### Performance Considerations

1. **Индексы базы данных:**
   - Индекс на (user_id, status) для быстрой фильтрации
   - Индекс на (assigned_admin_id, status) для фильтрации по администратору
   - Индекс на ticket_number для поиска
   - Индекс на (support_ticket_id, is_internal) для разделения заметок

2. **Eager Loading:**
   - Загружать user и assignedAdmin при списке тикетов
   - Загружать messages и attachments при просмотре тикета
   - Использовать withCount для unread_count

3. **Кэширование:**
   - Кэшировать статистику на 10 минут
   - Кэшировать шаблоны ответов
   - Инвалидировать кэш при изменениях

4. **Pagination:**
   - 20 тикетов на страницу в списке
   - Бесконечная прокрутка для сообщений в тикете

## Next Steps

1. Создать tasks.md с детальным планом реализации
2. Создать миграции для таблиц
3. Создать модели и связи
4. Реализовать backend сервисы
5. Создать контроллеры и роуты
6. Создать frontend компоненты
7. Настроить email уведомления
8. Добавить scheduled job для автозакрытия
9. Написать тесты
10. Добавить экспорт данных

