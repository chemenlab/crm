# Design Document: Onboarding System Improvements

## Overview

Данный документ описывает дизайн улучшений системы онбординга MasterPlan CRM. Основная цель - добавить контекстные подсказки на все страницы, автоматическое отслеживание прогресса и базу знаний для пользователей.

Базовая система онбординга уже реализована (60% готовности):
- ✅ Backend API для прогресса
- ✅ Интерактивный тур (driver.js)
- ✅ Компонент Hint для подсказок
- ✅ Прогресс-бар и приветственная модалка

Необходимо доработать:
- Добавить подсказки на все страницы
- Автоматическое отслеживание прогресса
- База знаний (опционально)

## Architecture

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Pages:                                                      │
│  - Dashboard (с подсказкой)                                  │
│  - Calendar (с подсказкой)                                   │
│  - Services (с подсказкой) ✅                                │
│  - Clients (с подсказкой) ✅                                 │
│  - Portfolio (с подсказкой) ✅                               │
│  - Finance (с подсказкой)                                    │
│  - Settings/Profile (с подсказкой)                           │
│  - Settings/Schedule (с подсказкой) ✅                       │
│  - Settings/Notifications (с подсказкой)                     │
│  - Help/Index (база знаний)                                  │
│  - Help/Article (статья)                                     │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                 │
│  - Hint ✅ (контекстная подсказка)                           │
│  - ProgressBar ✅ (прогресс онбординга)                      │
│  - OnboardingTour ✅ (интерактивный тур)                     │
│  - WelcomeModal ✅ (приветствие)                             │
│  - AchievementToast (уведомление о достижении)               │
│  - KnowledgeBaseSearch (поиск по базе знаний)                │
│  - ArticleRenderer (рендеринг Markdown)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Laravel)                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers:                                                │
│  - OnboardingController ✅                                   │
│    - getProgress() ✅                                        │
│    - completeStep() ✅                                       │
│    - completeTour() ✅                                       │
│    - resetProgress() ✅                                      │
│    - markHintViewed() ✅                                     │
│    - getViewedHints() ✅                                     │
│  - HelpController (база знаний)                              │
│    - index()                                                 │
│    - show($slug)                                             │
│    - search($query)                                          │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│  - OnboardingProgressService                                 │
│    - trackStepCompletion($user, $step)                       │
│    - checkAllStepsCompleted($user)                           │
│    - sendAchievementNotification($user, $step)               │
│  - HintService                                               │
│    - shouldShowHint($user, $hintId)                          │
│    - markHintAsViewed($user, $hintId)                        │
│  - KnowledgeBaseService                                      │
│    - getArticles($category)                                  │
│    - searchArticles($query)                                  │
│    - renderMarkdown($content)                                │
├─────────────────────────────────────────────────────────────┤
│  Models:                                                     │
│  - UserOnboardingProgress ✅                                 │
│  - UserHintViewed ✅                                         │
│  - HelpArticle (опционально)                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database (MySQL)                         │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - user_onboarding_progress ✅                               │
│  - user_hints_viewed ✅                                      │
│  - help_articles (опционально)                               │
│  - help_categories (опционально)                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### Hint Component (уже реализован ✅)

```typescript
interface HintProps {
  id: string;                    // Уникальный ID подсказки
  title?: string;                // Заголовок
  message: string;               // Текст подсказки
  type?: 'info' | 'tip' | 'warning';  // Тип подсказки
  dismissible?: boolean;         // Можно ли закрыть
  autoHide?: boolean;            // Автоматически скрыть
  autoHideDelay?: number;        // Задержка перед скрытием (мс)
}
```

**Логика работы:**
1. При монтировании проверяет список просмотренных подсказок через API
2. Если подсказка уже просмотрена - не отображается
3. При закрытии отправляет запрос на сервер для сохранения
4. Поддерживает автоматическое скрытие через заданное время

#### AchievementToast Component (новый)

```typescript
interface AchievementToastProps {
  step: string;                  // Название шага
  message: string;               // Сообщение
  isLastStep?: boolean;          // Последний ли это шаг
}

// Использование
showAchievementToast({
  step: 'first_service',
  message: 'Отлично! Вы создали первую услугу',
  isLastStep: false
});
```

**Логика работы:**
1. Отображается в правом верхнем углу
2. Автоматически скрывается через 5 секунд
3. Для последнего шага показывает поздравительную модалку
4. Использует shadcn/ui toast компонент

#### KnowledgeBaseSearch Component (новый)

```typescript
interface KnowledgeBaseSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}
```

**Логика работы:**
1. Debounce поиска (300ms)
2. Отправка запроса на сервер
3. Отображение результатов в реальном времени
4. Подсветка найденных фрагментов

### 2. Backend Services

#### OnboardingProgressService (новый)

```php
class OnboardingProgressService
{
    /**
     * Отследить выполнение шага
     */
    public function trackStepCompletion(User $user, string $step): void
    {
        $progress = UserOnboardingProgress::firstOrCreate(
            ['user_id' => $user->id],
            ['completed_steps' => [], 'is_completed' => false]
        );
        
        if (!$progress->isStepCompleted($step)) {
            $progress->completeStep($step);
            
            // Проверяем, все ли шаги выполнены
            if ($this->checkAllStepsCompleted($progress)) {
                $progress->is_completed = true;
                $progress->completed_at = now();
                $progress->save();
                
                // Отправляем уведомление о завершении
                $this->sendCompletionNotification($user);
            }
        }
    }
    
    /**
     * Проверить, все ли шаги выполнены
     */
    private function checkAllStepsCompleted(UserOnboardingProgress $progress): bool
    {
        $allSteps = [
            'profile_setup',
            'first_service',
            'first_client',
            'schedule_setup',
            'first_appointment',
            'public_page_setup',
            'notification_setup',
        ];
        
        $completedSteps = $progress->completed_steps ?? [];
        return count(array_diff($allSteps, $completedSteps)) === 0;
    }
    
    /**
     * Отправить уведомление о завершении
     */
    private function sendCompletionNotification(User $user): void
    {
        // Можно отправить email или push уведомление
        // Пока просто логируем
        Log::info("User {$user->id} completed onboarding");
    }
}
```

#### HintService (новый)

```php
class HintService
{
    /**
     * Проверить, нужно ли показывать подсказку
     */
    public function shouldShowHint(User $user, string $hintId): bool
    {
        // Проверяем, не просмотрена ли подсказка
        $viewed = UserHintViewed::where('user_id', $user->id)
            ->where('hint_id', $hintId)
            ->exists();
            
        if ($viewed) {
            return false;
        }
        
        // Проверяем условия отображения в зависимости от типа подсказки
        return $this->checkHintConditions($user, $hintId);
    }
    
    /**
     * Проверить условия отображения подсказки
     */
    private function checkHintConditions(User $user, string $hintId): bool
    {
        return match($hintId) {
            'services-empty-state' => $user->services()->count() === 0,
            'clients-empty-state' => $user->clients()->count() === 0,
            'portfolio-empty-state' => $user->portfolioItems()->count() === 0,
            'calendar-empty-state' => $user->appointments()->count() === 0,
            'finance-empty-state' => $user->transactions()->count() === 0,
            'profile-no-avatar' => empty($user->avatar),
            'schedule-not-configured' => $user->schedules()->where('is_working', true)->count() === 0,
            default => true,
        };
    }
    
    /**
     * Отметить подсказку как просмотренную
     */
    public function markHintAsViewed(User $user, string $hintId): void
    {
        UserHintViewed::firstOrCreate([
            'user_id' => $user->id,
            'hint_id' => $hintId,
        ]);
    }
}
```

### 3. Integration Points

#### Интеграция в контроллеры

**ServiceController:**
```php
public function store(Request $request)
{
    // ... создание услуги ...
    
    // Отслеживаем прогресс
    app(OnboardingProgressService::class)
        ->trackStepCompletion($request->user(), 'first_service');
    
    return response()->json($service);
}
```

**ClientController:**
```php
public function store(Request $request)
{
    // ... создание клиента ...
    
    // Отслеживаем прогресс
    app(OnboardingProgressService::class)
        ->trackStepCompletion($request->user(), 'first_client');
    
    return response()->json($client);
}
```

**AppointmentController:**
```php
public function store(Request $request)
{
    // ... создание записи ...
    
    // Отслеживаем прогресс
    app(OnboardingProgressService::class)
        ->trackStepCompletion($request->user(), 'first_appointment');
    
    return response()->json($appointment);
}
```

## Data Models

### UserOnboardingProgress (уже реализована ✅)

```php
class UserOnboardingProgress extends Model
{
    protected $fillable = [
        'user_id',
        'completed_steps',
        'current_step',
        'is_completed',
        'completed_at',
    ];
    
    protected $casts = [
        'completed_steps' => 'array',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];
    
    public function isStepCompleted(string $step): bool
    {
        return in_array($step, $this->completed_steps ?? []);
    }
    
    public function completeStep(string $step): void
    {
        $steps = $this->completed_steps ?? [];
        if (!in_array($step, $steps)) {
            $steps[] = $step;
            $this->completed_steps = $steps;
            $this->current_step = $step;
            $this->save();
        }
    }
    
    public function getProgressPercentage(): int
    {
        $totalSteps = 7;
        $completedCount = count($this->completed_steps ?? []);
        return (int) (($completedCount / $totalSteps) * 100);
    }
}
```

### HelpArticle (новая, опционально)

```php
class HelpArticle extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'content',
        'excerpt',
        'video_url',
        'tags',
        'views_count',
        'is_published',
        'published_at',
    ];
    
    protected $casts = [
        'tags' => 'array',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];
    
    public function category()
    {
        return $this->belongsTo(HelpCategory::class);
    }
    
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }
}
```

## Correctness Properties

*Свойство корректности - это характеристика или поведение, которое должно выполняться для всех допустимых выполнений системы. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*

### Property 1: Подсказка скрывается после просмотра

*For any* пользователя и любой подсказки, если пользователь закрывает подсказку, то при повторном посещении страницы эта подсказка не должна отображаться.

**Validates: Requirements 1.6, 1.7**

### Property 2: Шаг отмечается только один раз

*For any* пользователя и любого шага онбординга, если шаг уже отмечен как выполненный, то повторное выполнение действия не должно дублировать шаг в списке completed_steps.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 3: Все шаги завершены = онбординг завершен

*For any* пользователя, если все 7 шагов онбординга отмечены как выполненные, то флаг is_completed должен быть установлен в true.

**Validates: Requirements 2.8**

### Property 4: Подсказка отображается только при выполнении условий

*For any* пользователя и любой подсказки, подсказка должна отображаться только если выполнены её условия отображения (например, нет услуг для подсказки "Создайте первую услугу").

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

### Property 5: Прогресс-бар отображает корректный процент

*For any* пользователя, процент выполнения онбординга должен быть равен (количество выполненных шагов / 7) * 100.

**Validates: Requirements 7.1**

### Property 6: Toast уведомление отображается при выполнении шага

*For any* пользователя, при выполнении любого шага онбординга должно отображаться toast уведомление.

**Validates: Requirements 8.1**

### Property 7: Поиск по базе знаний возвращает релевантные результаты

*For any* поискового запроса, результаты поиска должны содержать только статьи, в которых встречается поисковый запрос (в заголовке, содержимом или тегах).

**Validates: Requirements 4.3**

## Error Handling

### Frontend Error Handling

1. **Ошибка загрузки просмотренных подсказок:**
   - Логировать ошибку в консоль
   - Показывать подсказку (fail-safe подход)
   - Не блокировать работу страницы

2. **Ошибка отметки подсказки как просмотренной:**
   - Логировать ошибку
   - Скрыть подсказку локально
   - Повторить запрос при следующем посещении

3. **Ошибка отслеживания прогресса:**
   - Логировать ошибку
   - Не показывать ошибку пользователю
   - Продолжить работу приложения

### Backend Error Handling

1. **Ошибка при сохранении прогресса:**
   - Логировать ошибку с контекстом
   - Не прерывать основной процесс (создание услуги/клиента)
   - Вернуть успешный ответ для основного действия

2. **Ошибка при проверке условий подсказки:**
   - Логировать ошибку
   - Вернуть false (не показывать подсказку)
   - Не блокировать работу API

3. **Ошибка при поиске в базе знаний:**
   - Логировать ошибку
   - Вернуть пустой массив результатов
   - Показать сообщение "Ничего не найдено"

## Testing Strategy

### Unit Tests

1. **HintService:**
   - Тест проверки условий отображения подсказок
   - Тест отметки подсказки как просмотренной
   - Тест shouldShowHint для разных сценариев

2. **OnboardingProgressService:**
   - Тест отслеживания выполнения шага
   - Тест проверки завершения всех шагов
   - Тест предотвращения дублирования шагов

3. **Hint Component:**
   - Тест отображения разных типов подсказок
   - Тест закрытия подсказки
   - Тест автоматического скрытия

### Property-Based Tests

Минимум 100 итераций для каждого теста.

**Property Test 1: Подсказка скрывается после просмотра**
```typescript
// Feature: onboarding-improvements, Property 1: Подсказка скрывается после просмотра
test('hint is hidden after being viewed', async () => {
  // Генерируем случайного пользователя и подсказку
  const user = generateRandomUser();
  const hintId = generateRandomHintId();
  
  // Отмечаем подсказку как просмотренную
  await markHintAsViewed(user.id, hintId);
  
  // Проверяем, что подсказка не отображается
  const shouldShow = await shouldShowHint(user.id, hintId);
  expect(shouldShow).toBe(false);
});
```

**Property Test 2: Шаг отмечается только один раз**
```php
// Feature: onboarding-improvements, Property 2: Шаг отмечается только один раз
test('step is marked only once', function () {
    $user = User::factory()->create();
    $step = 'first_service';
    
    // Отмечаем шаг дважды
    $service = new OnboardingProgressService();
    $service->trackStepCompletion($user, $step);
    $service->trackStepCompletion($user, $step);
    
    // Проверяем, что шаг присутствует только один раз
    $progress = UserOnboardingProgress::where('user_id', $user->id)->first();
    $count = collect($progress->completed_steps)->filter(fn($s) => $s === $step)->count();
    expect($count)->toBe(1);
})->repeat(100);
```

**Property Test 3: Все шаги завершены = онбординг завершен**
```php
// Feature: onboarding-improvements, Property 3: Все шаги завершены = онбординг завершен
test('all steps completed means onboarding is complete', function () {
    $user = User::factory()->create();
    $service = new OnboardingProgressService();
    
    $allSteps = [
        'profile_setup',
        'first_service',
        'first_client',
        'schedule_setup',
        'first_appointment',
        'public_page_setup',
        'notification_setup',
    ];
    
    // Отмечаем все шаги
    foreach ($allSteps as $step) {
        $service->trackStepCompletion($user, $step);
    }
    
    // Проверяем, что онбординг завершен
    $progress = UserOnboardingProgress::where('user_id', $user->id)->first();
    expect($progress->is_completed)->toBeTrue();
    expect($progress->completed_at)->not->toBeNull();
})->repeat(100);
```

### Integration Tests

1. **Полный flow онбординга:**
   - Создание пользователя
   - Выполнение всех шагов
   - Проверка завершения онбординга
   - Проверка скрытия прогресс-бара

2. **Интеграция с контроллерами:**
   - Создание услуги → проверка отметки шага
   - Создание клиента → проверка отметки шага
   - Создание записи → проверка отметки шага

3. **База знаний:**
   - Поиск статей
   - Отображение статьи
   - Рендеринг Markdown
   - Встраивание видео

## Implementation Notes

### Приоритеты реализации

1. **Высокий приоритет (критично для запуска):**
   - Добавить подсказки на Calendar и Finance
   - Автоматическое отслеживание прогресса в контроллерах
   - Toast уведомления о достижениях

2. **Средний приоритет (желательно):**
   - Добавить подсказки на Settings страницы
   - Улучшить прогресс-бар с детальной информацией
   - Статистика онбординга для администратора

3. **Низкий приоритет (можно отложить):**
   - База знаний
   - Экспорт статей
   - Видео-инструкции

### Технические ограничения

1. **Производительность:**
   - Проверка условий подсказок не должна замедлять загрузку страницы
   - Использовать кэширование для списка просмотренных подсказок
   - Debounce для поиска по базе знаний

2. **Совместимость:**
   - Компонент Hint уже использует React 19
   - Toast компонент из shadcn/ui совместим с React 19
   - driver.js уже установлен и работает

3. **Безопасность:**
   - Валидация hint_id на сервере
   - Защита от XSS в Markdown рендеринге
   - Rate limiting для API endpoints

### Зависимости

- `driver.js` - уже установлен ✅
- `axios` - уже установлен ✅
- `lucide-react` - уже установлен ✅
- `react-markdown` - нужно установить для базы знаний
- `remark-gfm` - нужно установить для GitHub Flavored Markdown

## Next Steps

1. Создать tasks.md с детальным планом реализации
2. Добавить подсказки на оставшиеся страницы (Calendar, Finance, Settings)
3. Интегрировать автоматическое отслеживание в контроллеры
4. Создать компонент AchievementToast
5. Добавить property-based тесты
6. (Опционально) Реализовать базу знаний
