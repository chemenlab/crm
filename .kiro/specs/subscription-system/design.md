# Design Document: Subscription System

## Overview

Система подписок для MasterPlan CRM представляет собой полнофункциональную биллинговую систему с тремя тарифными планами, интеграцией с ЮKassa для приема платежей, системой лимитов, промокодами и автоматическим продлением подписок. Система обеспечивает монетизацию платформы и контроль доступа к функциям на основе выбранного тарифа.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Plans Page   │  │ Checkout     │  │ Subscription │      │
│  │              │  │ Page         │  │ Management   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Laravel)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Subscription Service                     │   │
│  │  - Plan Management                                    │   │
│  │  - Subscription Lifecycle                             │   │
│  │  - Usage Tracking                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Payment Service                          │   │
│  │  - YooKassa Integration                               │   │
│  │  - Payment Processing                                 │   │
│  │  - Webhook Handling                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Usage Limit Service                      │   │
│  │  - Limit Checking                                     │   │
│  │  - Usage Increment                                    │   │
│  │  - Period Reset                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   YooKassa   │  │    Email     │  │   Database   │      │
│  │   Payment    │  │   Service    │  │    MySQL     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Subscription Creation Flow:**
```
User → Plans Page → Select Plan → Checkout Page → Payment Service
  → YooKassa → Payment Confirmation → Webhook → Subscription Service
  → Activate Subscription → Email Notification → User Dashboard
```

**Usage Limit Check Flow:**
```
User Action → Controller → Usage Limit Service → Check Current Usage
  → Compare with Plan Limits → Allow/Deny Action → Update Usage Counter
```

**Recurring Payment Flow:**
```
Scheduled Task → Find Expiring Subscriptions → Payment Service
  → Create Recurring Payment → YooKassa → Webhook → Subscription Service
  → Extend Subscription → Email Notification
```

## Components and Interfaces

### 1. SubscriptionService

Центральный сервис для управления подписками.

**Methods:**
```php
class SubscriptionService
{
    // Создание новой подписки
    public function createSubscription(
        User $user, 
        SubscriptionPlan $plan, 
        ?PromoCode $promoCode = null
    ): Subscription;
    
    // Отмена подписки (отключение автопродления)
    public function cancelSubscription(Subscription $subscription): void;
    
    // Возобновление подписки
    public function resumeSubscription(Subscription $subscription): void;
    
    // Апгрейд плана (немедленно)
    public function upgradePlan(
        Subscription $subscription, 
        SubscriptionPlan $newPlan
    ): Subscription;
    
    // Даунгрейд плана (в конце периода)
    public function downgradePlan(
        Subscription $subscription, 
        SubscriptionPlan $newPlan
    ): void;
    
    // Продление подписки
    public function renewSubscription(Subscription $subscription): void;
    
    // Активация триала
    public function activateTrial(User $user): Subscription;
    
    // Проверка активности подписки
    public function isActive(Subscription $subscription): bool;
    
    // Получение текущего плана пользователя
    public function getCurrentPlan(User $user): SubscriptionPlan;
}
```

### 2. PaymentService

Сервис для работы с платежами через ЮKassa.

**Methods:**
```php
class PaymentService
{
    // Создание платежа
    public function createPayment(
        User $user,
        float $amount,
        string $description,
        ?Subscription $subscription = null
    ): Payment;
    
    // Создание рекуррентного платежа
    public function createRecurringPayment(
        Subscription $subscription
    ): Payment;
    
    // Обработка webhook от YooKassa
    public function handleWebhook(array $data): void;
    
    // Проверка статуса платежа
    public function checkPaymentStatus(Payment $payment): string;
    
    // Возврат платежа
    public function refundPayment(Payment $payment, ?float $amount = null): void;
    
    // Сохранение метода оплаты для рекуррентных платежей
    public function savePaymentMethod(Payment $payment, string $paymentMethodId): void;
}
```

### 3. UsageLimitService

Сервис для контроля лимитов использования.

**Methods:**
```php
class UsageLimitService
{
    // Проверка лимита
    public function checkLimit(User $user, string $metric): bool;
    
    // Получение текущего использования
    public function getCurrentUsage(User $user, string $metric): int;
    
    // Получение лимита
    public function getLimit(User $user, string $metric): ?int;
    
    // Инкремент использования
    public function incrementUsage(User $user, string $metric, int $amount = 1): void;
    
    // Декремент использования (при удалении)
    public function decrementUsage(User $user, string $metric, int $amount = 1): void;
    
    // Сброс месячных лимитов
    public function resetMonthlyUsage(User $user): void;
    
    // Получение процента использования
    public function getUsagePercentage(User $user, string $metric): float;
    
    // Проверка, достигнут ли порог предупреждения (80%)
    public function isWarningThreshold(User $user, string $metric): bool;
}
```

### 4. PromoCodeService

Сервис для работы с промокодами.

**Methods:**
```php
class PromoCodeService
{
    // Валидация промокода
    public function validatePromoCode(string $code, ?SubscriptionPlan $plan = null): ?PromoCode;
    
    // Применение промокода
    public function applyPromoCode(PromoCode $promoCode, User $user): void;
    
    // Расчет скидки
    public function calculateDiscount(PromoCode $promoCode, float $amount): float;
    
    // Проверка доступности промокода
    public function isAvailable(PromoCode $promoCode): bool;
    
    // Создание промокода (админ)
    public function createPromoCode(array $data): PromoCode;
}
```

### 5. FeatureAccessService

Сервис для проверки доступа к функциям на основе подписки.

**Methods:**
```php
class FeatureAccessService
{
    // Проверка доступа к функции
    public function hasFeature(User $user, string $feature): bool;
    
    // Получение списка доступных функций
    public function getAvailableFeatures(User $user): array;
    
    // Получение списка недоступных функций
    public function getLockedFeatures(User $user): array;
    
    // Проверка доступа к разделу публичной страницы
    public function canShowPublicPageSection(User $user, string $section): bool;
    
    // Получение конфигурации для фронтенда (какие функции доступны)
    public function getFrontendConfig(User $user): array;
}
```

## Data Models

### SubscriptionPlan

```php
class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_period',
        'features',
        'is_active',
        'sort_order'
    ];
    
    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean'
    ];
    
    // Features structure:
    // {
    //   "limits": {
    //     "appointments_per_month": 30,
    //     "clients_total": 50,
    //     "services_total": 5,
    //     "portfolio_images": 5,
    //     "client_tags": 3,
    //     "vk_notifications_per_month": 0,
    //     "email_notifications_per_month": 50
    //   },
    //   "features": {
    //     "online_booking": true,
    //     "public_page": "basic",
    //     "crm": "basic",
    //     "finance": "basic",
    //     "analytics": false,
    //     "export_data": false,
    //     "custom_templates": false,
    //     "priority_support": false
    //   }
    // }
    
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
    
    public function getLimit(string $metric): ?int
    {
        return $this->features['limits'][$metric] ?? null;
    }
    
    public function hasFeature(string $feature): bool
    {
        return $this->features['features'][$feature] ?? false;
    }
}
```

### Subscription

```php
class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'cancel_at_period_end',
        'cancelled_at'
    ];
    
    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancelled_at' => 'datetime',
        'cancel_at_period_end' => 'boolean'
    ];
    
    // Status: active, cancelled, expired, trial
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }
    
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
    
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               $this->current_period_end->isFuture();
    }
    
    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }
    
    public function daysUntilExpiration(): int
    {
        return now()->diffInDays($this->current_period_end, false);
    }
}
```

### Payment

```php
class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'provider',
        'provider_payment_id',
        'provider_data',
        'paid_at',
        'refunded_at'
    ];
    
    protected $casts = [
        'amount' => 'decimal:2',
        'provider_data' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime'
    ];
    
    // Status: pending, succeeded, failed, refunded
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
    
    public function isSuccessful(): bool
    {
        return $this->status === 'succeeded';
    }
    
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
```

### UsageTracking

```php
class UsageTracking extends Model
{
    protected $fillable = [
        'user_id',
        'metric',
        'count',
        'period_start',
        'period_end'
    ];
    
    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'count' => 'integer'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function scopeCurrentPeriod($query, User $user)
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();
        
        return $query->where('user_id', $user->id)
                     ->where('period_start', '<=', $start)
                     ->where('period_end', '>=', $end);
    }
}
```

### PromoCode

```php
class PromoCode extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'plan_id',
        'max_uses',
        'used_count',
        'valid_from',
        'valid_until',
        'is_active'
    ];
    
    protected $casts = [
        'value' => 'decimal:2',
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean'
    ];
    
    // Type: percent, fixed, trial_extension
    
    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }
    
    public function usages()
    {
        return $this->hasMany(PromoCodeUsage::class);
    }
    
    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        if ($this->valid_from && $this->valid_from->isFuture()) return false;
        if ($this->valid_until && $this->valid_until->isPast()) return false;
        
        return true;
    }
    
    public function calculateDiscount(float $amount): float
    {
        if ($this->type === 'percent') {
            return $amount * ($this->value / 100);
        }
        
        return min($this->value, $amount);
    }
}
```

## Key Workflows

### 1. New User Registration with Trial

```
1. User registers → SubscriptionService::activateTrial()
2. Create Subscription with status='trial', trial_ends_at=now()+14days
3. Set user->current_plan_id to Maximum plan (Максимальная)
4. Send welcome email with trial information
5. Schedule trial reminder emails (7d, 3d, 1d before expiration)
6. On trial expiration: send notification with choice (purchase or free plan)
```

### 2. Subscription Purchase

```
1. User selects plan → Navigate to checkout
2. User enters promo code (optional) → PromoCodeService::validatePromoCode()
3. Calculate final amount with discount
4. User clicks "Pay" → PaymentService::createPayment()
5. Create Payment record with status='pending'
6. Redirect to YooKassa payment page
7. User completes payment on YooKassa
8. YooKassa sends webhook → PaymentService::handleWebhook()
9. Verify webhook signature
10. Update Payment status to 'succeeded'
11. SubscriptionService::createSubscription() or renewSubscription()
12. Update user->current_plan_id
13. Send confirmation email with invoice
14. Redirect user to success page
```

### 3. Recurring Payment

```
1. Scheduled task runs daily → Find subscriptions expiring in 3 days
2. For each subscription with saved payment method:
   a. PaymentService::createRecurringPayment()
   b. Create Payment record with status='pending'
   c. Call YooKassa API with saved payment_method_id
   d. YooKassa processes payment → sends webhook
   e. PaymentService::handleWebhook() updates Payment status
   f. If succeeded: SubscriptionService::renewSubscription()
   g. If failed: Schedule retry in 24 hours, send notification
3. After 3 failed attempts: Cancel subscription, send notification
```

### 4. Usage Limit Check

```
1. User attempts action (create appointment, add client, etc.)
2. Controller calls UsageLimitService::checkLimit($user, $metric)
3. Service gets current plan limits
4. Service gets current usage from UsageTracking
5. Compare usage < limit
6. If limit exceeded:
   a. Return false
   b. Controller returns 403 with upgrade prompt
7. If within limit:
   a. Return true
   b. Controller proceeds with action
   c. UsageLimitService::incrementUsage($user, $metric)
```

### 5. Plan Upgrade

```
1. User selects higher-tier plan
2. Calculate prorated amount (remaining days of current period)
3. Create payment for prorated amount
4. User pays → Payment succeeds
5. SubscriptionService::upgradePlan()
   a. Update subscription->plan_id
   b. Keep current_period_end unchanged
   c. Update user->current_plan_id
6. Send confirmation email
7. User immediately gets new plan features
```

### 6. Plan Downgrade

```
1. User selects lower-tier plan
2. SubscriptionService::downgradePlan()
   a. Set subscription->scheduled_plan_id = new_plan_id
   b. Set subscription->cancel_at_period_end = false
3. Send confirmation email: "Plan will change on [date]"
4. At end of current period:
   a. Scheduled task detects scheduled_plan_id
   b. Update subscription->plan_id
   c. Update user->current_plan_id
   d. Reset scheduled_plan_id
5. Send notification: "Your plan has been changed"
```

## Middleware

### CheckSubscriptionLimit

```php
class CheckSubscriptionLimit
{
    public function handle(Request $request, Closure $next, string $metric)
    {
        $user = $request->user();
        
        if (!$this->usageLimitService->checkLimit($user, $metric)) {
            return response()->json([
                'error' => 'Достигнут лимит для вашего тарифного плана',
                'metric' => $metric,
                'current_usage' => $this->usageLimitService->getCurrentUsage($user, $metric),
                'limit' => $this->usageLimitService->getLimit($user, $metric),
                'upgrade_required' => true,
                'upgrade_url' => route('billing.plans')
            ], 403);
        }
        
        return $next($request);
    }
}
```

Usage:
```php
Route::post('/appointments', [AppointmentController::class, 'store'])
    ->middleware('limit:appointments_per_month');
```

## Frontend Feature Access Components

**ВАЖНО:** Все компоненты используют shadcn/ui библиотеку для единообразного дизайна.

### FeatureGuard Component

React компонент для визуального отключения недоступных функций.

**Usage:**
```tsx
import { FeatureGuard } from '@/Components/Billing/FeatureGuard';

<FeatureGuard feature="analytics" fallback={<LockedFeature feature="analytics" />}>
  <AnalyticsDashboard />
</FeatureGuard>
```

**Props:**
```tsx
interface FeatureGuardProps {
  feature: string;           // Название функции для проверки
  children: React.ReactNode; // Контент, если функция доступна
  fallback?: React.ReactNode; // Контент, если функция недоступна
  showUpgradeModal?: boolean; // Показывать ли модалку апгрейда при клике
}
```

**Implementation:**
```tsx
export function FeatureGuard({ feature, children, fallback, showUpgradeModal = true }: FeatureGuardProps) {
  const { user } = usePage().props.auth;
  const hasAccess = user.subscription?.plan?.features?.features?.[feature];
  
  if (!hasAccess) {
    return fallback || <LockedFeature feature={feature} showUpgradeModal={showUpgradeModal} />;
  }
  
  return <>{children}</>;
}
```

### LockedFeature Component

Компонент для отображения заблокированной функции с использованием shadcn/ui.

**Usage:**
```tsx
<LockedFeature feature="analytics" />
```

**shadcn/ui Components Used:**
- `Tooltip` - для подсказки при наведении
- `Dialog` - для модалки апгрейда
- `Lock` icon from lucide-react

**Visual Styling:**
- Opacity: 0.5
- Grayscale filter
- Lock icon overlay
- Disabled cursor
- Tooltip with upgrade message

**Implementation:**
```tsx
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Dialog } from '@/Components/ui/dialog';

export function LockedFeature({ feature, showUpgradeModal = true }: LockedFeatureProps) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="relative opacity-50 grayscale cursor-not-allowed"
            onClick={() => showUpgradeModal && setShowModal(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="pointer-events-none">
              {/* Placeholder content */}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Эта функция доступна на платных тарифах</p>
        </TooltipContent>
      </Tooltip>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}
    </TooltipProvider>
  );
}
```

### DisabledButton Component

Кнопка с визуальным отключением для недоступных функций, использует shadcn/ui Button.

**Usage:**
```tsx
<DisabledButton 
  feature="export_data" 
  onClick={handleExport}
>
  Экспорт данных
</DisabledButton>
```

**shadcn/ui Components Used:**
- `Button` - базовый компонент кнопки
- `Dialog` - для модалки апгрейда
- `Lock` icon from lucide-react

**Implementation:**
```tsx
import { Lock } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog } from '@/Components/ui/dialog';

export function DisabledButton({ feature, children, onClick, ...props }: DisabledButtonProps) {
  const { user } = usePage().props.auth;
  const hasAccess = user.subscription?.plan?.features?.features?.[feature];
  const [showModal, setShowModal] = useState(false);
  
  if (!hasAccess) {
    return (
      <>
        <Button 
          disabled 
          variant="outline"
          className="opacity-50 cursor-not-allowed"
          onClick={() => setShowModal(true)}
          {...props}
        >
          <Lock className="w-4 h-4 mr-2" />
          {children}
        </Button>
        {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}
      </>
    );
  }
  
  return <Button onClick={onClick} {...props}>{children}</Button>;
}
```

### useFeatureAccess Hook

React hook для проверки доступа к функциям.

**Usage:**
```tsx
const { hasFeature, lockedFeatures, showUpgradeModal } = useFeatureAccess();

if (hasFeature('analytics')) {
  // Показать аналитику
}
```

**Implementation:**
```tsx
export function useFeatureAccess() {
  const { user } = usePage().props.auth;
  const plan = user.subscription?.plan;
  
  const hasFeature = (feature: string): boolean => {
    return plan?.features?.features?.[feature] ?? false;
  };
  
  const hasLimit = (metric: string): boolean => {
    const limit = plan?.features?.limits?.[metric];
    return limit === null || limit === undefined || limit > 0;
  };
  
  const showUpgradeModal = () => {
    // Показать модалку апгрейда
  };
  
  return { hasFeature, hasLimit, showUpgradeModal };
}
```

## Public Page Feature Visibility

### Conditional Rendering Logic

На публичной странице функции должны полностью скрываться, если недоступны.

**Backend Controller:**
```php
public function show(User $user)
{
    $plan = $user->currentPlan;
    
    $sections = [
        'portfolio' => $plan->hasFeature('portfolio'),
        'testimonials' => $plan->hasFeature('testimonials'),
        'gallery' => $plan->hasFeature('gallery'),
        'custom_blocks' => $plan->hasFeature('custom_blocks'),
    ];
    
    return Inertia::render('Public/Profile', [
        'user' => $user,
        'sections' => $sections,
        'template' => $plan->hasFeature('custom_templates') ? 'extended' : 'basic',
    ]);
}
```

**Frontend Component:**
```tsx
export function PublicProfile({ user, sections, template }) {
  return (
    <div className={`template-${template}`}>
      <ProfileHeader user={user} />
      
      {sections.portfolio && <PortfolioSection user={user} />}
      {sections.testimonials && <TestimonialsSection user={user} />}
      {sections.gallery && <GallerySection user={user} />}
      {sections.custom_blocks && <CustomBlocksSection user={user} />}
      
      <ContactSection user={user} />
    </div>
  );
}
```

## Scheduled Tasks

### 1. Check Expiring Subscriptions

```php
// Run daily
Schedule::command('subscriptions:check-expiring')->daily();

// Find subscriptions expiring in 3 days
// Attempt recurring payment
// Send reminder emails
```

### 2. Reset Monthly Usage

```php
// Run on 1st of each month at 00:00
Schedule::command('usage:reset-monthly')->monthlyOn(1, '00:00');

// Reset all monthly usage counters
// Keep historical data for analytics
```

### 3. Send Trial Reminders

```php
// Run daily
Schedule::command('subscriptions:trial-reminders')->daily();

// Find trials expiring in 7, 3, 1 days
// Send reminder emails
```

### 4. Cancel Expired Subscriptions

```php
// Run daily
Schedule::command('subscriptions:cancel-expired')->daily();

// Find subscriptions with current_period_end < now()
// Update status to 'expired'
// Downgrade user to free plan
// Send notification
```

## Error Handling

### Payment Failures

1. **Insufficient Funds:**
   - Status: failed
   - Action: Send email with payment link, retry in 24h

2. **Card Declined:**
   - Status: failed
   - Action: Send email to update payment method

3. **Network Error:**
   - Status: pending
   - Action: Check status via API after 5 minutes

4. **Webhook Not Received:**
   - Fallback: Scheduled task checks pending payments older than 10 minutes
   - Query YooKassa API for status
   - Update accordingly

### Subscription Errors

1. **Duplicate Subscription:**
   - Check if user already has active subscription
   - Cancel old, create new

2. **Invalid Plan:**
   - Validate plan exists and is active
   - Return error if not

3. **Trial Already Used:**
   - Check if user email has used trial before
   - Deny trial, offer paid subscription

## Security

### Payment Security

1. **No Card Storage:**
   - Never store card numbers or CVV
   - Only store YooKassa payment_method_id for recurring

2. **Webhook Verification:**
   - Verify YooKassa signature on all webhooks
   - Reject unsigned requests

3. **HTTPS Only:**
   - All payment pages use HTTPS
   - Redirect HTTP to HTTPS

4. **Data Encryption:**
   - Encrypt payment_method_id in database
   - Encrypt provider_data JSON

### Access Control

1. **Subscription Management:**
   - Users can only manage their own subscriptions
   - Admins can manage all subscriptions

2. **Payment History:**
   - Users can only view their own payments
   - Admins can view all payments

3. **Promo Codes:**
   - Only admins can create/edit promo codes
   - Users can only apply valid codes

## Performance Optimization

### Caching

1. **Plan Data:**
   - Cache plan features for 1 hour
   - Invalidate on plan update

2. **User Subscription:**
   - Cache current subscription for 5 minutes
   - Invalidate on subscription change

3. **Usage Limits:**
   - Cache usage data for 1 minute
   - Update cache on increment

### Database Indexing

```sql
-- Subscriptions
INDEX idx_user_status (user_id, status)
INDEX idx_period_end (current_period_end)

-- Payments
INDEX idx_user (user_id)
INDEX idx_subscription (subscription_id)
INDEX idx_provider_payment (provider_payment_id)
INDEX idx_status (status)

-- Usage Tracking
INDEX idx_user_metric_period (user_id, metric, period_start)

-- Promo Codes
INDEX idx_code (code)
INDEX idx_active (is_active)
```

### Query Optimization

1. **Eager Loading:**
   ```php
   $subscriptions = Subscription::with(['user', 'plan', 'payments'])->get();
   ```

2. **Batch Processing:**
   - Process recurring payments in batches of 100
   - Use queues for email notifications

3. **Pagination:**
   - Paginate payment history (50 per page)
   - Paginate admin subscription list (100 per page)

## Testing Strategy

### Unit Tests

1. **SubscriptionService:**
   - Test subscription creation
   - Test plan upgrade/downgrade logic
   - Test trial activation
   - Test renewal logic

2. **PaymentService:**
   - Test payment creation
   - Test webhook signature verification
   - Test refund logic

3. **UsageLimitService:**
   - Test limit checking
   - Test usage increment/decrement
   - Test percentage calculation

4. **PromoCodeService:**
   - Test validation logic
   - Test discount calculation
   - Test availability checks

### Integration Tests

1. **Payment Flow:**
   - Mock YooKassa API
   - Test full payment cycle
   - Test webhook handling

2. **Subscription Lifecycle:**
   - Test creation → active → renewal → cancellation
   - Test trial → paid conversion
   - Test plan changes

3. **Usage Limits:**
   - Test limit enforcement
   - Test usage tracking
   - Test monthly reset

### Feature Tests

1. **User Flows:**
   - Register → Trial → Subscribe → Use Features
   - Subscribe → Upgrade → Downgrade → Cancel
   - Apply Promo Code → Subscribe

2. **Admin Flows:**
   - Create Promo Code → User Applies → Discount Applied
   - Manual Subscription Management
   - Refund Processing

## Monitoring and Analytics

### Key Metrics

1. **Revenue Metrics:**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)

2. **Conversion Metrics:**
   - Trial → Paid conversion rate
   - Free → Paid conversion rate
   - Upgrade rate

3. **Churn Metrics:**
   - Monthly churn rate
   - Cancellation reasons
   - Reactivation rate

4. **Usage Metrics:**
   - Average usage per plan
   - Feature adoption rate
   - Limit hit frequency

### Logging

1. **Payment Events:**
   - Log all payment attempts
   - Log webhook receipts
   - Log refunds

2. **Subscription Events:**
   - Log subscription changes
   - Log plan upgrades/downgrades
   - Log cancellations

3. **Usage Events:**
   - Log limit hits
   - Log usage warnings (80%)
   - Log monthly resets

## Configuration

### Environment Variables

```env
# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Subscription Settings
TRIAL_PERIOD_DAYS=14
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
RECURRING_PAYMENT_RETRY_ATTEMPTS=3
RECURRING_PAYMENT_RETRY_DELAY_HOURS=24

# Usage Limits
USAGE_WARNING_THRESHOLD=80
USAGE_CACHE_TTL=60

# Promo Codes
PROMO_CODE_LENGTH=8
```

### Plan Configuration

Plans are seeded in database with JSON features. Example:

```json
{
  "name": "Профессиональная",
  "slug": "professional",
  "price": 299.00,
  "features": {
    "limits": {
      "appointments_per_month": null,
      "clients_total": 500,
      "services_total": 20,
      "portfolio_images": 30,
      "client_tags": 20,
      "vk_notifications_per_month": 100,
      "email_notifications_per_month": 500
    },
    "features": {
      "online_booking": true,
      "public_page": "extended",
      "crm": "full",
      "finance": "extended",
      "analytics": "basic",
      "export_data": true,
      "custom_templates": true,
      "priority_support": true
    }
  }
}
```

## Future Enhancements

1. **Annual Billing:**
   - Add yearly billing option with discount
   - Prorate on plan changes

2. **Team Plans:**
   - Multiple users per subscription
   - Role-based access

3. **Usage-Based Pricing:**
   - Pay per appointment/client
   - Overage charges

4. **Referral Program:**
   - Refer a friend, get discount
   - Track referrals

5. **Invoice Customization:**
   - Custom invoice templates
   - Company details

6. **Payment Methods:**
   - Add more payment methods (PayPal, Stripe)
   - Cryptocurrency support
