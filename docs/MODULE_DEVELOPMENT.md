# Руководство по разработке модулей

Полная документация по созданию модулей для системы бронирования.

## Содержание

1. [Структура модуля](#структура-модуля)
2. [Файлы конфигурации](#файлы-конфигурации)
3. [Service Provider](#service-provider)
4. [Роуты](#роуты)
5. [Контроллеры](#контроллеры)
6. [Модели](#модели)
7. [Миграции](#миграции)
8. [Enums](#enums)
9. [Фронтенд](#фронтенд)
10. [Хуки](#хуки)
11. [Чеклист создания модуля](#чеклист-создания-модуля)

---

## Структура модуля

```
app/Modules/{ModuleName}/
├── module.json                    # Манифест модуля
├── {ModuleName}ServiceProvider.php # Service Provider
├── Controllers/
│   ├── {ModuleName}Controller.php
│   └── {ModuleName}SettingsController.php
├── Models/
│   └── {ModelName}.php
├── Enums/
│   └── {EnumName}.php
├── Database/
│   └── Migrations/
│       └── YYYY_MM_DD_HHMMSS_create_{table}_table.php
├── Routes/
│   └── web.php
└── hooks/
    └── SidebarMenuItem.tsx        # React компонент для меню
```

---

## Файлы конфигурации

### module.json

```json
{
  "name": "Название модуля",
  "slug": "module-slug",
  "description": "Описание модуля",
  "version": "1.0.0",
  "author": "Booking System",
  "category": "CRM",
  "price": "free",
  "icon": "ClipboardList",
  "color": "#3B82F6",
  "hooks": {
    "sidebar.menu": true,
    "service.form.fields": false,
    "public.booking.form": false,
    "settings.sections": false
  },
  "dependencies": [],
  "settings": {
    "default_option": true
  }
}
```

**Обязательные поля:**
- `name` - Название на русском
- `slug` - Уникальный идентификатор (kebab-case)
- `description` - Описание функционала
- `version` - Версия в формате semver
- `hooks` - Объект с поддерживаемыми хуками

**Доступные хуки:**
- `sidebar.menu` - Пункт в боковом меню
- `service.form.fields` - Дополнительные поля в форме услуги
- `public.booking.form` - Интеграция в публичную форму бронирования
- `settings.sections` - Секции в настройках
- `client.card.tabs` - Вкладки в карточке клиента
- `public.page.sections` - Секции на публичной странице

---

## Service Provider

### {ModuleName}ServiceProvider.php

```php
<?php

namespace App\Modules\{ModuleName};

use App\Services\Modules\ModuleServiceProvider;

class {ModuleName}ServiceProvider extends ModuleServiceProvider
{
    protected string $moduleSlug = 'module-slug';

    public function boot(): void
    {
        parent::boot();
        
        // Регистрация хуков
        $this->registerHook('sidebar.menu', [
            'component' => 'Modules/{ModuleName}/hooks/SidebarMenuItem',
            'props' => [
                'url' => '/app/modules/{module-slug}/list',
                'icon' => 'ClipboardList',
                'label' => 'Название',
            ],
        ]);
    }
}
```

**Важно:**
- Наследовать от `ModuleServiceProvider`
- Указать `$moduleSlug` - должен совпадать со slug в module.json
- Регистрировать хуки в методе `boot()`

---

## Роуты

### Routes/web.php

```php
<?php

use App\Modules\{ModuleName}\Controllers\{ModuleName}Controller;
use App\Modules\{ModuleName}\Controllers\{ModuleName}SettingsController;
use Illuminate\Support\Facades\Route;

// Главная страница модуля - доступна без установки (для просмотра и установки)
Route::get('/', [{ModuleName}SettingsController::class, 'index'])->name('index');

// Все остальные роуты требуют установленного модуля
Route::middleware(['module.active:{module-slug}'])->group(function () {
    // Основной функционал
    Route::get('/list', [{ModuleName}Controller::class, 'index'])->name('list');
    
    // CRUD операции
    Route::get('/view/{item}', [{ModuleName}Controller::class, 'show'])->name('show');
    Route::patch('/{item}/status', [{ModuleName}Controller::class, 'updateStatus'])->name('update-status');
    Route::delete('/{item}', [{ModuleName}Controller::class, 'destroy'])->name('destroy');
    
    // Настройки
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [{ModuleName}SettingsController::class, 'index'])->name('index');
        Route::patch('/', [{ModuleName}SettingsController::class, 'update'])->name('update');
    });
});
```

**Правила:**
1. Главная страница (`/`) - БЕЗ middleware `module.active` - для просмотра и установки
2. Все функциональные роуты - С middleware `module.active:{slug}`
3. Использовать именованные роуты с префиксом `modules.{slug}.`

---

## Контроллеры

### SettingsController (обязательный)

```php
<?php

namespace App\Modules\{ModuleName}\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Modules\ModuleSettingsService;
use App\Services\Modules\UserModuleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class {ModuleName}SettingsController extends Controller
{
    public function __construct(
        private readonly ModuleSettingsService $settingsService,
        private readonly UserModuleService $userModuleService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $isEnabled = $this->userModuleService->isEnabled($user, '{module-slug}');

        $moduleInfo = [
            'slug' => '{module-slug}',
            'name' => 'Название',
            'description' => 'Описание модуля',
            'version' => '1.0.0',
            'author' => 'Booking System',
            'category' => 'CRM',
            'price' => 'Бесплатный',
            'is_enabled' => $isEnabled,
            'features' => [
                'Функция 1',
                'Функция 2',
            ],
        ];

        // Статистика и настройки только если модуль включён
        $stats = null;
        $settings = [];
        
        if ($isEnabled) {
            $stats = [/* статистика */];
            $settings = $this->settingsService->getAll($user, '{module-slug}');
        }

        return Inertia::render('Modules/{ModuleName}/Settings/Index', [
            'moduleInfo' => $moduleInfo,
            'stats' => $stats,
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([/* правила */]);
        
        $this->settingsService->setMany($user, '{module-slug}', $validated);
        
        return back()->with('success', 'Настройки сохранены');
    }
}
```

### Основной контроллер

```php
<?php

namespace App\Modules\{ModuleName}\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class {ModuleName}Controller extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Получение данных
        $items = Model::forUser($user->id)->get();
        
        return Inertia::render('Modules/{ModuleName}/Index', [
            'items' => $items,
        ]);
    }

    // Все методы должны возвращать Inertia redirect, НЕ JSON!
    public function updateStatus(Request $request, Model $item)
    {
        $this->authorizeAccess($request->user(), $item);
        
        $validated = $request->validate([/* правила */]);
        $item->update($validated);
        
        return back()->with('success', 'Статус обновлён');
    }

    private function authorizeAccess($user, $item): void
    {
        if ($item->user_id !== $user->id) {
            abort(403, 'Доступ запрещён');
        }
    }
}
```

**Важно:**
- Все методы возвращают `back()->with('success', '...')` или `Inertia::render()`
- НИКОГДА не возвращать JSON для Inertia запросов
- Всегда проверять доступ через `authorizeAccess()`

---

## Модели

```php
<?php

namespace App\Modules\{ModuleName}\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class {ModelName} extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'status',
        // ...
    ];

    protected $casts = [
        'status' => {StatusEnum}::class,
        'custom_fields' => 'array',
    ];

    // Scope для фильтрации по пользователю
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Scope для фильтрации по статусу
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status instanceof \BackedEnum ? $status->value : $status);
    }

    // Связи
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
```

---

## Миграции

### Создание таблицы

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('{table_name}', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('status', ['new', 'in_progress', 'completed', 'cancelled'])->default('new');
            $table->json('custom_fields')->nullable();
            $table->timestamps();

            // Индексы
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('{table_name}');
    }
};
```

### Изменение ENUM

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE {table} MODIFY COLUMN status ENUM('new', 'in_progress', 'completed', 'cancelled', 'archived') DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::table('{table}')->where('status', 'archived')->update(['status' => 'cancelled']);
        DB::statement("ALTER TABLE {table} MODIFY COLUMN status ENUM('new', 'in_progress', 'completed', 'cancelled') DEFAULT 'new'");
    }
};
```

**Запуск миграций модуля:**
```bash
php artisan migrate --path=app/Modules/{ModuleName}/Database/Migrations/
```

---

## Enums

```php
<?php

namespace App\Modules\{ModuleName}\Enums;

enum {StatusName}: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::New => 'Новый',
            self::InProgress => 'В работе',
            self::Completed => 'Завершён',
            self::Cancelled => 'Отменён',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::New => 'blue',
            self::InProgress => 'yellow',
            self::Completed => 'green',
            self::Cancelled => 'red',
        };
    }

    public static function options(): array
    {
        return array_map(
            fn(self $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            self::cases()
        );
    }
}
```

---

## Фронтенд

### Структура файлов

```
resources/js/Pages/Modules/{ModuleName}/
├── Index.tsx                      # Главная страница модуля
├── Settings/
│   └── Index.tsx                  # Страница настроек
├── components/
│   ├── index.ts                   # Экспорт компонентов
│   ├── {Component}Card.tsx
│   └── {Component}DetailSheet.tsx
└── hooks/
    └── SidebarMenuItem.tsx        # Пункт меню
```

### Страница настроек (обязательная)

```tsx
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
// ... импорты

interface Props {
  moduleInfo: {
    slug: string;
    name: string;
    description: string;
    is_enabled: boolean;
    features?: string[];
    // ...
  };
  stats: {...} | null;
  settings: {...};
}

export default function Settings({ moduleInfo, stats, settings }: Props) {
  const handleInstall = () => {
    router.post(`/app/modules/${moduleInfo.slug}/enable`, {}, {
      onSuccess: () => toast.success('Модуль включён'),
    });
  };

  const handleUninstall = () => {
    router.post(`/app/modules/${moduleInfo.slug}/disable`, {}, {
      onSuccess: () => toast.success('Модуль отключён'),
    });
  };

  return (
    // ... UI с кнопками установки/удаления
  );
}
```

### Пункт меню (SidebarMenuItem.tsx)

```tsx
import { Link } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/Components/ui/sidebar';

interface Props {
  url: string;
  icon: string;
  label: string;
}

export default function ModuleSidebarMenuItem({ url, label }: Props) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={url}>
          <ClipboardList className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
```

### Оптимистичные обновления

```tsx
const handleStatusChange = (id: number, newStatus: string) => {
  // 1. Оптимистичное обновление UI
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, status: newStatus } : item
  ));
  
  // 2. Запрос на сервер
  router.patch(`/app/modules/{slug}/${id}/status`, { status: newStatus }, {
    preserveScroll: true,
    preserveState: true,
    onSuccess: () => toast.success('Статус обновлён'),
    onError: () => {
      // 3. Откат при ошибке
      setItems(initialItems);
      toast.error('Ошибка');
    },
  });
};
```

---

## Хуки

### Регистрация хука в ServiceProvider

```php
$this->registerHook('sidebar.menu', [
    'component' => 'Modules/{ModuleName}/hooks/SidebarMenuItem',
    'props' => [
        'url' => '/app/modules/{slug}/list',
        'icon' => 'ClipboardList',
        'label' => 'Название',
    ],
]);
```

### Доступные хуки

| Хук | Описание | Props |
|-----|----------|-------|
| `sidebar.menu` | Пункт в боковом меню | `url`, `icon`, `label` |
| `service.form.fields` | Поля в форме услуги | `serviceId` |
| `public.booking.form` | Публичная форма | `userId`, `serviceId` |
| `settings.sections` | Секции настроек | - |
| `client.card.tabs` | Вкладки клиента | `clientId` |

---

## Чеклист создания модуля

### 1. Структура файлов
- [ ] Создать папку `app/Modules/{ModuleName}/`
- [ ] Создать `module.json` с правильным slug
- [ ] Создать `{ModuleName}ServiceProvider.php`
- [ ] Создать папки: `Controllers/`, `Models/`, `Enums/`, `Database/Migrations/`, `Routes/`

### 2. Бэкенд
- [ ] Создать миграции для таблиц
- [ ] Создать модели с scopes `forUser()`, `withStatus()`
- [ ] Создать Enums с методами `label()`, `color()`, `options()`
- [ ] Создать `{ModuleName}SettingsController` с проверкой `isEnabled`
- [ ] Создать основной контроллер
- [ ] Настроить роуты: `/` без middleware, остальные с `module.active`

### 3. Фронтенд
- [ ] Создать `resources/js/Pages/Modules/{ModuleName}/`
- [ ] Создать `Settings/Index.tsx` с кнопками установки/удаления
- [ ] Создать `Index.tsx` - главная страница
- [ ] Создать компоненты в `components/`
- [ ] Создать `components/index.ts` для экспорта
- [ ] Создать `hooks/SidebarMenuItem.tsx`

### 4. Интеграция
- [ ] Зарегистрировать ServiceProvider в `config/app.php` или автозагрузке
- [ ] Зарегистрировать хуки в ServiceProvider
- [ ] Запустить миграции

### 5. Тестирование
- [ ] Проверить доступ к странице модуля без установки
- [ ] Проверить установку модуля
- [ ] Проверить появление в меню после установки
- [ ] Проверить основной функционал
- [ ] Проверить удаление модуля
- [ ] Проверить что данные сохраняются после удаления

### 6. Частые ошибки
- [ ] Контроллеры возвращают `back()` вместо JSON
- [ ] Главная страница доступна без middleware
- [ ] `is_enabled` передаётся во фронтенд
- [ ] Миграции запущены
- [ ] ENUM в базе соответствует Enum в PHP

---

## Примеры модулей

- **Leads** (`app/Modules/Leads/`) - Заявки на услуги
- **Reviews** (`app/Modules/Reviews/`) - Отзывы клиентов

Используйте их как референс при создании новых модулей.
