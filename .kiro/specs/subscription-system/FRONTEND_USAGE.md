# Использование компонентов системы подписок на фронтенде

## Установка

Все компоненты уже созданы и скомпилированы. Для использования импортируйте их в ваши React компоненты.

## Хук useFeatureAccess

Основной хук для проверки доступа к функциям и ресурсам.

```tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MyComponent() {
  const {
    hasFeature,
    canAccessResource,
    getResourceUsage,
    hasActiveSubscription,
    isInTrial,
    getTrialDaysRemaining,
    getCurrentPlan,
  } = useFeatureAccess();

  // Проверка доступа к функции
  const hasAnalytics = hasFeature('analytics');
  
  // Проверка доступа к ресурсу
  const canCreateAppointment = canAccessResource('appointments');
  
  // Получение информации об использовании ресурса
  const appointmentsUsage = getResourceUsage('appointments');
  // { can_access, limit, current_usage, remaining, percentage, unlimited }
  
  // Проверка активной подписки
  const isActive = hasActiveSubscription();
  
  // Проверка триала
  const inTrial = isInTrial();
  const daysLeft = getTrialDaysRemaining();
  
  // Текущий план
  const plan = getCurrentPlan();
  // { name, slug, price }
}
```

## Компонент FeatureGuard

Скрывает контент, если функция недоступна. Показывает модалку с предложением апгрейда.

```tsx
import { FeatureGuard } from '@/components/subscription';

function AnalyticsPage() {
  return (
    <FeatureGuard feature="analytics">
      <div>
        {/* Контент доступен только с функцией analytics */}
        <h1>Аналитика</h1>
        <AnalyticsCharts />
      </div>
    </FeatureGuard>
  );
}

// С кастомным fallback
function PortfolioSection() {
  return (
    <FeatureGuard 
      feature="portfolio"
      fallback={<div>Портфолио доступно на платных тарифах</div>}
    >
      <Portfolio />
    </FeatureGuard>
  );
}

// Без модалки апгрейда (просто скрывает)
function CustomBranding() {
  return (
    <FeatureGuard feature="custom_branding" showUpgradeModal={false}>
      <BrandingSettings />
    </FeatureGuard>
  );
}
```

## Компонент LockedFeature

Показывает заблокированный контент с иконкой замка и кнопкой "Узнать больше".

```tsx
import { LockedFeature } from '@/components/subscription';

function AnalyticsSection() {
  const { hasFeature } = useFeatureAccess();
  
  if (!hasFeature('analytics')) {
    return <LockedFeature feature="analytics" />;
  }
  
  return <AnalyticsCharts />;
}

// С кастомными заголовком и описанием
function CustomSection() {
  return (
    <LockedFeature 
      feature="custom_branding"
      title="Кастомный дизайн"
      description="Настройте внешний вид под ваш бренд и выделитесь среди конкурентов"
    />
  );
}
```

## Компонент DisabledButton

Кнопка с блокировкой по функции или лимиту ресурса.

```tsx
import { DisabledButton } from '@/components/subscription';

function CreateServiceButton() {
  return (
    <DisabledButton 
      resource="services"
      lockedMessage="Достигнут лимит услуг"
    >
      Создать услугу
    </DisabledButton>
  );
}

// Блокировка по функции
function AnalyticsButton() {
  return (
    <DisabledButton 
      feature="analytics"
      lockedMessage="Доступно на платных тарифах"
    >
      Открыть аналитику
    </DisabledButton>
  );
}

// Обычная кнопка, если доступ есть
function CreateClientButton() {
  return (
    <DisabledButton resource="clients">
      Добавить клиента
    </DisabledButton>
  );
}
```

## Примеры интеграции

### 1. Страница с портфолио

```tsx
import { FeatureGuard } from '@/components/subscription';

export default function PortfolioPage() {
  return (
    <AppPageLayout>
      <FeatureGuard feature="portfolio">
        <div className="space-y-6">
          <h1>Портфолио</h1>
          <PortfolioGallery />
          <DisabledButton resource="portfolio_images">
            Добавить фото
          </DisabledButton>
        </div>
      </FeatureGuard>
    </AppPageLayout>
  );
}
```

### 2. Кнопка создания записи с проверкой лимита

```tsx
import { DisabledButton } from '@/components/subscription';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default function CalendarPage() {
  const { getResourceUsage } = useFeatureAccess();
  const usage = getResourceUsage('appointments');
  
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Календарь</h1>
        <div className="flex items-center gap-4">
          {usage && !usage.unlimited && (
            <span className="text-sm text-muted-foreground">
              {usage.current_usage} / {usage.limit} записей
            </span>
          )}
          <DisabledButton resource="appointments">
            Создать запись
          </DisabledButton>
        </div>
      </div>
      <Calendar />
    </div>
  );
}
```

### 3. Условный рендеринг с проверкой триала

```tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const { isInTrial, getTrialDaysRemaining } = useFeatureAccess();
  const daysLeft = getTrialDaysRemaining();
  
  return (
    <div>
      {isInTrial() && daysLeft !== null && (
        <Alert className="mb-6">
          <AlertDescription>
            У вас активен триальный период. Осталось дней: <strong>{daysLeft}</strong>
            <a href="/app/subscriptions" className="ml-2 underline">
              Выбрать тариф
            </a>
          </AlertDescription>
        </Alert>
      )}
      
      <DashboardContent />
    </div>
  );
}
```

### 4. Публичная страница с скрытием портфолио

```tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default function PublicBookingPage({ user }) {
  // Проверяем доступ к портфолио у владельца страницы
  // Примечание: на публичной странице нужно передавать данные с сервера
  const showPortfolio = user.has_portfolio_access;
  
  return (
    <div>
      <UserInfo user={user} />
      <Services services={user.services} />
      
      {showPortfolio && (
        <section>
          <h2>Портфолио</h2>
          <PortfolioGallery items={user.portfolio} />
        </section>
      )}
      
      <BookingForm />
    </div>
  );
}
```

## Доступные функции (features)

- `analytics` - Аналитика и отчеты
- `priority_support` - Приоритетная поддержка
- `custom_branding` - Кастомный брендинг
- `portfolio` - Портфолио
- `online_booking` - Онлайн-бронирование
- `notifications` - Уведомления
- `calendar` - Календарь

## Доступные ресурсы (resources)

- `appointments` - Записи
- `clients` - Клиенты
- `services` - Услуги
- `portfolio_images` - Фото в портфолио
- `tags` - Теги
- `notifications_per_month` - Уведомления в месяц

## API эндпоинты

- `GET /api/feature-access` - Получить все статусы доступа
- `GET /api/feature-access/features/{feature}` - Проверить конкретную функцию
- `GET /api/feature-access/resources/{resource}` - Проверить конкретный ресурс
- `GET /api/feature-access/upgrade-suggestion/{feature}` - Получить рекомендацию по апгрейду

## Визуальное отключение функционала

Все компоненты автоматически применяют визуальное отключение:

1. **FeatureGuard** - Показывает затемненный контент с замком и кнопкой
2. **LockedFeature** - Полностью блокирует секцию с объяснением
3. **DisabledButton** - Делает кнопку неактивной с иконкой замка и тултипом

При клике на заблокированный элемент открывается модалка с:
- Описанием функции
- Информацией о текущем тарифе
- Информацией о триале (если активен)
- Кнопкой перехода на страницу тарифов

## Скрытие на публичной странице

Для публичных страниц нужно проверять доступ на бэкенде и передавать флаги в props:

```php
// В контроллере публичной страницы
public function show($slug)
{
    $user = User::where('slug', $slug)->firstOrFail();
    $featureAccess = app(FeatureAccessService::class);
    
    return Inertia::render('Public/Booking', [
        'user' => $user,
        'hasPortfolio' => $featureAccess->hasAccess($user, 'portfolio'),
        'portfolio' => $featureAccess->hasAccess($user, 'portfolio') 
            ? $user->portfolio 
            : [],
    ]);
}
```

Затем на фронтенде:

```tsx
export default function PublicBooking({ user, hasPortfolio, portfolio }) {
  return (
    <div>
      {hasPortfolio && portfolio.length > 0 && (
        <PortfolioSection items={portfolio} />
      )}
    </div>
  );
}
```
