# Design Document: Редизайн публичной страницы мастера

## Overview

Редизайн публичной страницы мастера представляет собой полное обновление UI/UX с использованием современного glass morphism дизайна, добавлением системы портфолио и улучшенным процессом онлайн-записи. Дизайн основан на референсе из `.desingmasterlink/masterlink` и адаптирован под существующую архитектуру Laravel + React + Inertia.js.

Ключевые улучшения:
- Современный glass morphism дизайн с полупрозрачными элементами
- Система портфолио с drag & drop управлением
- Многошаговая форма записи с прогресс-баром
- Расширенные настройки публичной страницы
- SEO оптимизация и микроразметка
- Полная адаптивность и высокая производительность

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Public Page (React + TypeScript + Inertia.js)      │   │
│  │  - FloatingHeader                                     │   │
│  │  - ProfileCard                                        │   │
│  │  - BioSection                                         │   │
│  │  - SocialLinks                                        │   │
│  │  - ServicesList                                       │   │
│  │  - PortfolioGrid                                      │   │
│  │  - FloatingBookingBar                                 │   │
│  │  - BookingModal (multi-step)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Laravel Backend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers                                          │   │
│  │  - BookingController (existing)                      │   │
│  │  - PortfolioController (new)                         │   │
│  │  - SettingsController (updated)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                             │   │
│  │  - PortfolioService (image processing)               │   │
│  │  - UsageLimitService (portfolio limits)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Models                                               │   │
│  │  - User (extended)                                    │   │
│  │  - PortfolioItem (new)                                │   │
│  │  - Service (existing)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MySQL Database                          │
│  - users (extended with new fields)                         │
│  - portfolio_items (new table)                              │
│  - services (existing)                                       │
│  - appointments (existing)                                   │
│  - clients (existing)                                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
PublicBookingPage
├── FloatingHeader
│   ├── Avatar
│   └── ShareButton
├── ProfileCard
│   ├── Avatar (large)
│   ├── SparklesIcon
│   ├── Name
│   ├── Role
│   └── Location
├── BioSection
│   └── BioText
├── SocialLinks
│   ├── TelegramIcon
│   ├── InstagramIcon
│   ├── VKIcon
│   └── WhatsAppIcon
├── PhoneCard
│   ├── PhoneIcon
│   └── PhoneNumber
├── ServicesSection
│   └── ServiceCard[]
│       ├── ServiceName
│       ├── Duration
│       ├── Price
│       └── ChevronIcon
├── PortfolioSection
│   └── PortfolioGrid
│       └── PortfolioCard[]
│           └── Image
├── FloatingBookingBar
│   ├── BookNowButton
│   └── CallButton
└── BookingModal
    ├── ProgressBar
    ├── ServiceStep
    ├── DateStep
    ├── TimeStep
    ├── ContactStep
    └── SuccessStep
```

## Components and Interfaces

### Frontend Components

#### 1. FloatingHeader Component

```typescript
interface FloatingHeaderProps {
  masterName: string;
  masterAvatar: string | null;
  pageUrl: string;
}

// Функционал:
// - Фиксированный header вверху страницы
// - Аватар мастера (32x32px)
// - Имя мастера
// - Кнопка "Поделиться" с Web Share API
// - Glass morphism стиль
```

#### 2. ProfileCard Component

```typescript
interface ProfileCardProps {
  name: string;
  role: string;
  location: string;
  avatar: string | null;
}

// Функционал:
// - Большой аватар (128x128px) со скругленными углами
// - Иконка Sparkles в правом нижнем углу
// - Имя крупным шрифтом
// - Роль заглавными буквами
// - Локация с иконкой MapPin
// - Анимация плавающего движения
```

#### 3. BioSection Component

```typescript
interface BioSectionProps {
  bio: string | null;
}

// Функционал:
// - Отображение биографии мастера
// - Скрытие секции если bio пустая
// - Glass morphism карточка
```

#### 4. SocialLinks Component

```typescript
interface SocialLinksProps {
  instagram?: string;
  vk?: string;
  telegram?: string;
  whatsapp?: string;
}

// Функционал:
// - Сетка 4 колонки с иконками соцсетей
// - Скрытие иконок для незаполненных соцсетей
// - Hover эффекты (масштабирование и поворот)
// - Открытие профилей в новой вкладке
```

#### 5. ServiceCard Component

```typescript
interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  onSelect: (service: Service) => void;
}

// Функционал:
// - Отображение названия, длительности, цены
// - Hover эффект с изменением фона
// - Клик открывает модальное окно записи
// - Иконка ChevronRight справа
```

#### 6. PortfolioGrid Component

```typescript
interface PortfolioGridProps {
  items: PortfolioItem[];
}

interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
}

// Функционал:
// - Сетка 2 колонки
// - Соотношение сторон 4:5
// - Hover эффект с масштабированием изображения
// - Отображение названия при hover
// - Lazy loading изображений
```

#### 7. BookingModal Component

```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: Service;
  masterSlug: string;
}

interface BookingData {
  service?: Service;
  date?: Date;
  timeSlot?: string;
  customerName?: string;
  customerPhone?: string;
}

type BookingStep = 'service' | 'date' | 'time' | 'contact' | 'success';

// Функционал:
// - Многошаговая форма с 5 шагами
// - Прогресс-бар вверху
// - Плавные анимации между шагами
// - Сохранение данных между шагами
// - Возможность вернуться назад
// - Интеграция с существующим API
```

### Backend Components

#### 1. PortfolioController

```php
namespace App\Http\Controllers\App;

class PortfolioController extends Controller
{
    // GET /api/portfolio
    public function index(Request $request): JsonResponse
    {
        // Получить список портфолио текущего пользователя
        // Сортировка по sort_order
        // Пагинация
    }
    
    // POST /api/portfolio
    public function store(PortfolioRequest $request): JsonResponse
    {
        // Проверка лимита по тарифу
        // Загрузка и обработка изображения
        // Создание thumbnail
        // Сохранение в БД
    }
    
    // PUT /api/portfolio/{id}
    public function update(PortfolioRequest $request, PortfolioItem $item): JsonResponse
    {
        // Обновление названия, описания, видимости
    }
    
    // DELETE /api/portfolio/{id}
    public function destroy(PortfolioItem $item): JsonResponse
    {
        // Удаление файлов
        // Удаление записи из БД
    }
    
    // POST /api/portfolio/reorder
    public function reorder(Request $request): JsonResponse
    {
        // Обновление sort_order для множественных элементов
    }
}
```

#### 2. PortfolioService

```php
namespace App\Services;

class PortfolioService
{
    public function processImage(UploadedFile $file, User $user): array
    {
        // 1. Валидация файла (тип, размер)
        // 2. Генерация уникального имени
        // 3. Создание оригинала (макс 2000x2000px)
        // 4. Создание thumbnail (400x500px)
        // 5. Оптимизация качества
        // 6. Сохранение в storage/app/public/portfolio/{user_id}/
        // 7. Возврат путей к файлам
        
        return [
            'original_path' => 'portfolio/123/original_abc123.jpg',
            'thumbnail_path' => 'portfolio/123/thumb_abc123.jpg',
        ];
    }
    
    public function deleteImage(PortfolioItem $item): void
    {
        // Удаление оригинала и thumbnail из storage
    }
    
    public function checkLimit(User $user): bool
    {
        // Проверка лимита портфолио по тарифу
        $plan = $user->currentSubscription->plan;
        $limit = $plan->features['limits']['portfolio_images'] ?? 0;
        
        if ($limit === 0) {
            return true; // безлимит
        }
        
        $current = $user->portfolioItems()->count();
        return $current < $limit;
    }
}
```

#### 3. Updated BookingController

```php
namespace App\Http\Controllers\Public;

class BookingController extends Controller
{
    // GET /m/{slug}
    public function show(string $slug): Response
    {
        $user = User::where('slug', $slug)->firstOrFail();
        
        return Inertia::render('Public/Booking/Show', [
            'master' => [
                'name' => $user->name,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'phone' => $user->phone,
                'niche' => $user->niche,
                'site_title' => $user->site_title ?? $user->name,
                'site_description' => $user->site_description,
                'site_bio' => $user->site_bio,
                'site_location' => $user->site_location,
                'theme_color' => $user->theme_color ?? '#000000',
                'gradient_from' => $user->site_gradient_from,
                'gradient_to' => $user->site_gradient_to,
                'socials' => [
                    'instagram' => $user->instagram,
                    'vk' => $user->vk,
                    'telegram' => $user->telegram,
                    'whatsapp' => $user->whatsapp,
                ],
            ],
            'services' => $user->services()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(),
            'portfolio' => $user->portfolioItems()
                ->where('is_visible', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'imageUrl' => asset('storage/' . $item->image_path),
                    'thumbnailUrl' => asset('storage/' . $item->thumbnail_path),
                ]),
            'slug' => $slug,
        ])->withViewData([
            'meta' => [
                'title' => $user->site_title . ' - Онлайн-запись',
                'description' => $user->site_description,
                'og:image' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'og:type' => 'profile',
                'og:url' => route('public.booking.show', $slug),
            ],
        ]);
    }
    
    // Существующие методы slots() и store() остаются без изменений
}
```

## Data Models

### Extended User Model

```php
// Новые поля в таблице users
Schema::table('users', function (Blueprint $table) {
    $table->text('site_bio')->nullable()->after('site_description');
    $table->string('site_location')->nullable()->after('site_bio');
    $table->string('instagram', 100)->nullable()->after('site_location');
    $table->string('vk', 100)->nullable()->after('instagram');
    $table->string('telegram', 100)->nullable()->after('vk');
    $table->string('whatsapp', 20)->nullable()->after('telegram');
    $table->string('site_gradient_from', 7)->nullable()->after('theme_color');
    $table->string('site_gradient_to', 7)->nullable()->after('site_gradient_from');
    $table->text('site_custom_css')->nullable()->after('site_gradient_to');
});

// Relationship
public function portfolioItems()
{
    return $this->hasMany(PortfolioItem::class);
}
```

### New PortfolioItem Model

```php
namespace App\Models;

class PortfolioItem extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'image_path',
        'thumbnail_path',
        'tag',
        'sort_order',
        'is_visible',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
        'views_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function getImageUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }
    
    public function getThumbnailUrlAttribute(): string
    {
        return asset('storage/' . $this->thumbnail_path);
    }
}
```

### Database Schema

```sql
-- Расширение таблицы users
ALTER TABLE users
    ADD COLUMN site_bio TEXT NULL AFTER site_description,
    ADD COLUMN site_location VARCHAR(255) NULL AFTER site_bio,
    ADD COLUMN instagram VARCHAR(100) NULL AFTER site_location,
    ADD COLUMN vk VARCHAR(100) NULL AFTER instagram,
    ADD COLUMN telegram VARCHAR(100) NULL AFTER vk,
    ADD COLUMN whatsapp VARCHAR(20) NULL AFTER telegram,
    ADD COLUMN site_gradient_from VARCHAR(7) NULL AFTER theme_color,
    ADD COLUMN site_gradient_to VARCHAR(7) NULL AFTER site_gradient_from,
    ADD COLUMN site_custom_css TEXT NULL AFTER site_gradient_to;

-- Новая таблица portfolio_items
CREATE TABLE portfolio_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    image_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NULL,
    tag VARCHAR(50) NULL,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_visible (user_id, is_visible),
    INDEX idx_sort (sort_order),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Portfolio limit enforcement
*For any* user and their subscription plan, the number of visible portfolio items should never exceed the plan's portfolio_images limit (unless limit is 0 for unlimited).
**Validates: Requirements 7.8**

### Property 2: Image processing consistency
*For any* uploaded image, the system should create both an original (max 2000x2000px) and a thumbnail (400x500px), and both files should exist in storage.
**Validates: Requirements 7.2**

### Property 3: Portfolio sort order uniqueness
*For any* user's portfolio items, each item should have a unique sort_order value within that user's portfolio.
**Validates: Requirements 5.5**

### Property 4: Social links visibility
*For any* social network field, if the field is null or empty, the corresponding icon should not be rendered on the public page.
**Validates: Requirements 3.3**

### Property 5: Service selection flow
*For any* booking initiated from a service card, the booking modal should skip the service selection step and start directly at the date selection step.
**Validates: Requirements 6.4**

### Property 6: Booking data persistence
*For any* booking in progress, navigating between steps (forward or backward) should preserve all previously entered data.
**Validates: Requirements 6.7**

### Property 7: SEO metadata completeness
*For any* public page, the system should generate all required meta tags (title, description, og:image, og:type, og:url) based on the master's settings.
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 8: Responsive image loading
*For any* portfolio image, the system should use lazy loading and load the thumbnail first, then the full image on demand.
**Validates: Requirements 10.3**

### Property 9: Glass morphism styling consistency
*For any* card component on the public page, it should have the glass-card class with backdrop-filter blur effect.
**Validates: Requirements 1.1**

### Property 10: Share functionality fallback
*For any* browser, if Web Share API is not supported, clicking the share button should copy the URL to clipboard and show a notification.
**Validates: Requirements 11.3**

## Error Handling

### Portfolio Upload Errors

```typescript
// Frontend
try {
  const response = await uploadPortfolio(file);
  toast.success('Работа добавлена в портфолио');
} catch (error) {
  if (error.response?.status === 403) {
    // Достигнут лимит
    toast.error('Достигнут лимит портфолио. Обновите тариф для загрузки большего количества работ.');
    showUpgradeModal();
  } else if (error.response?.status === 422) {
    // Ошибка валидации
    toast.error(error.response.data.message);
  } else {
    toast.error('Ошибка загрузки изображения');
  }
}
```

### Booking Errors

```typescript
// Frontend
try {
  const response = await createBooking(bookingData);
  setStep('success');
} catch (error) {
  if (error.response?.status === 409) {
    // Слот уже занят
    toast.error('Это время уже занято. Выберите другое время.');
    setStep('time');
  } else if (error.response?.status === 422) {
    // Ошибка валидации
    toast.error(error.response.data.message);
  } else {
    toast.error('Ошибка создания записи');
  }
}
```

### Image Processing Errors

```php
// Backend
try {
    $paths = $this->portfolioService->processImage($file, $user);
} catch (InvalidImageException $e) {
    return response()->json([
        'message' => 'Неверный формат изображения. Поддерживаются: JPG, PNG, WebP'
    ], 422);
} catch (ImageTooLargeException $e) {
    return response()->json([
        'message' => 'Размер файла превышает 10 МБ'
    ], 422);
} catch (\Exception $e) {
    Log::error('Portfolio image processing failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage()
    ]);
    return response()->json([
        'message' => 'Ошибка обработки изображения'
    ], 500);
}
```

## Testing Strategy

### Unit Tests

**Portfolio Service Tests:**
- Image resizing to correct dimensions
- Thumbnail generation
- File naming uniqueness
- Storage path generation
- Limit checking logic

**Validation Tests:**
- Portfolio upload validation rules
- Settings update validation rules
- Social links format validation

### Property-Based Tests

**Property 1: Portfolio limit enforcement**
```typescript
// Test: Generate random users with random plans and portfolio items
// Verify: count(visible_items) <= plan.limits.portfolio_images (unless 0)
// Tag: Feature: public-page-redesign, Property 1: Portfolio limit enforcement
```

**Property 2: Image processing consistency**
```typescript
// Test: Upload random valid images
// Verify: Both original and thumbnail files exist in storage
// Tag: Feature: public-page-redesign, Property 2: Image processing consistency
```

**Property 3: Portfolio sort order uniqueness**
```typescript
// Test: Create random portfolio items for a user
// Verify: All sort_order values are unique within user's portfolio
// Tag: Feature: public-page-redesign, Property 3: Portfolio sort order uniqueness
```

### Integration Tests

**Public Page Rendering:**
- Test complete page render with all sections
- Test with missing optional data (bio, socials, portfolio)
- Test SEO meta tags generation
- Test JSON-LD microdata

**Booking Flow:**
- Test complete booking flow from service selection to success
- Test booking with pre-selected service
- Test navigation between steps
- Test data persistence across steps

**Portfolio Management:**
- Test upload with limit check
- Test reordering
- Test visibility toggle
- Test deletion with file cleanup

### E2E Tests

**User Journey:**
1. Client opens public page
2. Views portfolio
3. Clicks on service
4. Completes booking
5. Receives success confirmation

**Master Journey:**
1. Master logs in
2. Uploads portfolio images
3. Configures public page settings
4. Views live preview
5. Saves changes

### Visual Regression Tests

- Screenshot comparison for glass morphism effects
- Responsive layout testing (320px, 768px, 1024px, 1920px)
- Animation testing
- Hover states testing

## Performance Considerations

### Image Optimization

```php
// Use Intervention Image for optimization
$image = Image::make($file)
    ->resize(2000, 2000, function ($constraint) {
        $constraint->aspectRatio();
        $constraint->upsize();
    })
    ->encode('jpg', 85); // 85% quality for good balance

$thumbnail = Image::make($file)
    ->fit(400, 500)
    ->encode('jpg', 80);
```

### Caching Strategy

```php
// Cache public page for 5 minutes
Route::get('/m/{slug}', [BookingController::class, 'show'])
    ->middleware('cache.headers:public;max_age=300');

// Cache portfolio items
$portfolio = Cache::remember("portfolio:{$userId}", 300, function () use ($user) {
    return $user->portfolioItems()
        ->where('is_visible', true)
        ->orderBy('sort_order')
        ->get();
});
```

### Lazy Loading

```typescript
// Frontend - lazy load portfolio images
<img 
  src={item.thumbnailUrl} 
  loading="lazy"
  onLoad={() => setImageLoaded(true)}
  alt={item.title}
/>
```

### Database Indexing

```sql
-- Indexes for performance
CREATE INDEX idx_user_visible ON portfolio_items(user_id, is_visible);
CREATE INDEX idx_sort ON portfolio_items(sort_order);
CREATE INDEX idx_slug ON users(slug);
```

## Security Considerations

### File Upload Security

```php
// Validation rules
'image' => [
    'required',
    'image',
    'mimes:jpeg,png,webp',
    'max:10240', // 10MB
    'dimensions:min_width=400,min_height=500',
]

// Sanitize filename
$filename = Str::random(40) . '.' . $file->extension();

// Store outside public directory
Storage::disk('local')->put("portfolio/{$userId}/{$filename}", $file);
```

### XSS Protection

```typescript
// Frontend - sanitize user input
import DOMPurify from 'dompurify';

const sanitizedBio = DOMPurify.sanitize(master.site_bio);
```

### Rate Limiting

```php
// Limit portfolio uploads
Route::post('/api/portfolio', [PortfolioController::class, 'store'])
    ->middleware('throttle:10,1'); // 10 uploads per minute
```

## Migration Strategy

### Phase 1: Database Migration
1. Run migration to add new fields to users table
2. Create portfolio_items table
3. Add indexes

### Phase 2: Backend Implementation
1. Create PortfolioItem model
2. Implement PortfolioController
3. Implement PortfolioService
4. Update BookingController
5. Add routes

### Phase 3: Frontend Implementation
1. Create new public page components
2. Implement BookingModal with multi-step form
3. Create portfolio management page
4. Create settings page for public page

### Phase 4: Testing & Deployment
1. Run all tests
2. Deploy to staging
3. User acceptance testing
4. Deploy to production
5. Monitor performance

## Future Enhancements

1. **Video Portfolio**: Support for video uploads in portfolio
2. **Reviews System**: Client reviews on public page
3. **Custom Domain**: Allow masters to use custom domains
4. **Analytics**: Track views, clicks, bookings from public page
5. **A/B Testing**: Test different layouts for conversion optimization
6. **PWA**: Make public page installable as PWA
7. **Dark Mode**: Add dark mode support
8. **Multi-language**: Support for multiple languages

