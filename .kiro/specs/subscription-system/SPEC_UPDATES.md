# Обновления спецификации системы подписок

**Дата:** 26 декабря 2024  
**Статус:** Готово к реализации

## Обзор изменений

Спецификация системы подписок обновлена под новые требования:

1. **Автоматический триал "Максимальная"** - новые пользователи получают 14-дневный триал с полным функционалом
2. **Визуальное отключение функционала** - недоступные функции затемнены и неактивны
3. **Скрытие функций на публичной странице** - недоступные секции полностью скрываются
4. **Уведомление о выборе после триала** - пользователь выбирает между покупкой и бесплатной версией
5. **🎨 Дизайн система shadcn/ui** - ВСЕ UI компоненты используют shadcn/ui для единообразного дизайна

## 🎨 Важно: shadcn/ui везде!

**КРИТИЧНО:** Все frontend компоненты должны использовать shadcn/ui библиотеку.

**Используемые компоненты:**
- `Button` - все кнопки
- `Card` - карточки планов, виджеты
- `Dialog` - модальные окна (апгрейд, окончание триала)
- `Tooltip` - подсказки на заблокированных функциях
- `Alert` - баннеры, предупреждения
- `Badge` - статусы, метки
- `Progress` - прогресс-бары использования
- `Table` - таблицы платежей, подписок
- `Input` - поля ввода промокодов
- `Select` - выпадающие списки
- `Form` - формы в админке

**Иконки:** lucide-react (Lock, CreditCard, Calendar, User, Check, etc.)

**Импорты:**
```tsx
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Lock } from 'lucide-react';
```

## Изменения в Requirements.md

### Обновлено: Requirement 7 (Триал период)

**Было:** Триал активирует план "Профессиональная"  
**Стало:** Триал активирует план "Максимальная"

**Новые критерии:**
- 7.3: При окончании триала отправляется уведомление с выбором (купить или бесплатная версия)

### Добавлено: Requirement 8 (Визуальное отключение функционала)

Новый requirement описывает, как недоступные функции должны отображаться на фронтенде:

- Затемнение (opacity 0.5, grayscale)
- Иконка замка
- Tooltip с объяснением
- Модалка апгрейда при клике
- Немедленное включение при апгрейде

### Добавлено: Requirement 9 (Скрытие функций на публичной странице)

Новый requirement описывает скрытие недоступных секций на публичной странице:

- Портфолио скрывается без подписки
- Кастомные шаблоны недоступны
- Расширенные секции скрываются
- Проверка перед рендерингом каждой секции

### Обновлено: Requirement 12 (Уведомления о биллинге)

**Добавлено:**
- 12.6: Уведомление при окончании триала с выбором

### Перенумерованы остальные Requirements

- Requirement 8 → 10 (Промокоды)
- Requirement 9 → 11 (Отслеживание использования)
- Requirement 10 → 12 (Уведомления о биллинге)
- Requirement 11 → 13 (Административная панель)
- Requirement 12 → 14 (Безопасность и соответствие)

## Изменения в Design.md

### Добавлено: FeatureAccessService

Новый сервис для проверки доступа к функциям:

```php
class FeatureAccessService
{
    public function hasFeature(User $user, string $feature): bool;
    public function getAvailableFeatures(User $user): array;
    public function getLockedFeatures(User $user): array;
    public function canShowPublicPageSection(User $user, string $section): bool;
    public function getFrontendConfig(User $user): array;
}
```

### Добавлено: Frontend Feature Access Components

Новые React компоненты для визуального отключения:

1. **FeatureGuard** - wrapper для условного рендеринга
2. **LockedFeature** - компонент заблокированной функции
3. **DisabledButton** - кнопка с проверкой доступа
4. **useFeatureAccess** - hook для проверки доступа

### Добавлено: Public Page Feature Visibility

Логика условного рендеринга для публичной страницы:

- Backend передает доступные секции
- Frontend скрывает недоступные секции
- Используется базовый или расширенный шаблон

### Обновлено: New User Registration with Trial

**Было:** Активация плана "Professional"  
**Стало:** Активация плана "Maximum" (Максимальная)

**Добавлено:** Шаг 6 - отправка уведомления с выбором при окончании триала

## Изменения в Tasks.md

### Добавлено: Task 4.4 (Create FeatureAccessService)

Создание сервиса для проверки доступа к функциям.

### Добавлено: Tasks 13.12-13.18 (Frontend Components)

Новые задачи по созданию компонентов визуального отключения:

- 13.12: TrialExpirationModal - модалка при окончании триала
- 13.13: FeatureGuard - wrapper компонент
- 13.14: LockedFeature - заблокированная функция
- 13.15: DisabledButton - кнопка с проверкой
- 13.16: useFeatureAccess - hook
- 13.17: Update Dashboard - интеграция TrialBanner
- 13.18: Update PublicProfile - условные секции

### Добавлено: Tasks 16.7-16.8 (Integration)

Интеграция проверок доступа во все страницы:

- 16.7: Обернуть все страницы в FeatureGuard
- 16.8: Передавать конфигурацию функций в Inertia props

### Добавлено: Task 17.7 (TrialExpiredMail)

Email уведомление при окончании триала с выбором.

### Добавлено: Tasks 18.8-18.9 (Testing)

Тесты для новых функций:

- 18.8: Тесты для feature access компонентов
- 18.9: Тесты для триала и его окончания

### Обновлено: Task 11.1 (SubscriptionPlanSeeder)

Добавлено примечание, что план "Максимальная" используется для триала.

### Обновлено: Task 16.5 (RegisterController)

Добавлено примечание об активации плана "Максимальная".

### Обновлено: Notes

Добавлены важные замечания:

- Триал период: план "Максимальная", автоактивация, уведомление с выбором
- Визуальное отключение: затемнение, замок, модалка, tooltip
- Интеграция: FeatureGuard, проверки доступа, Inertia props

### Обновлено: Estimated Timeline

**Было:** ~16 days (3 weeks)  
**Стало:** ~18-20 days (4 weeks)

Добавлен раздел Priority Order с приоритизацией задач.

## Ключевые технические решения

### 0. Дизайн система - shadcn/ui

**ВСЕ UI компоненты используют shadcn/ui библиотеку:**

```tsx
// Импорты shadcn/ui компонентов
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader } from '@/Components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/Components/ui/tooltip';
import { Alert, AlertTitle, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/Components/ui/table';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Form } from '@/Components/ui/form';

// Иконки из lucide-react
import { Lock, CreditCard, Calendar, User, Check } from 'lucide-react';
```

### 1. Триал период

```php
// При регистрации
SubscriptionService::activateTrial($user);
// Активирует план "Максимальная" на 14 дней
```

### 2. Проверка доступа к функции

```php
// Backend
$featureAccessService->hasFeature($user, 'analytics');

// Frontend
const { hasFeature } = useFeatureAccess();
if (hasFeature('analytics')) {
  // Показать аналитику
}
```

### 3. Визуальное отключение

```tsx
// Используем shadcn/ui компоненты
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/Components/ui/tooltip';
import { Dialog } from '@/Components/ui/dialog';
import { Lock } from 'lucide-react';

<FeatureGuard feature="analytics" fallback={<LockedFeature feature="analytics" />}>
  <AnalyticsDashboard />
</FeatureGuard>

// LockedFeature с shadcn/ui
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="relative opacity-50 grayscale cursor-not-allowed">
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-white" />
        </div>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>Эта функция доступна на платных тарифах</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 4. Публичная страница

```php
// Controller
$sections = [
    'portfolio' => $plan->hasFeature('portfolio'),
    'testimonials' => $plan->hasFeature('testimonials'),
];

// Frontend
{sections.portfolio && <PortfolioSection />}
```

### 5. Уведомление об окончании триала

```php
// Email
TrialExpiredMail::send($user);
// Предлагает выбор: купить или бесплатная версия
```

## Следующие шаги

1. **Просмотрите обновленную спецификацию:**
   - `.kiro/specs/subscription-system/requirements.md`
   - `.kiro/specs/subscription-system/design.md`
   - `.kiro/specs/subscription-system/tasks.md`

2. **Подтвердите, что спецификация покрывает все требования**

3. **Начните реализацию согласно tasks.md:**
   - Откройте файл `.kiro/specs/subscription-system/tasks.md`
   - Начните с Task 1.1 (Database Setup)
   - Следуйте порядку задач и отмечайте выполненные

## Вопросы для уточнения

Перед началом реализации, пожалуйста, подтвердите:

1. ✅ Триал должен давать план "Максимальная" (700₽/мес) с полным функционалом?
2. ✅ После окончания триала пользователь получает email с выбором?
3. ✅ Недоступные функции должны быть затемнены (не скрыты полностью)?
4. ✅ На публичной странице недоступные секции скрываются полностью?
5. ✅ При клике на заблокированную функцию показывается модалка апгрейда?

Если все верно, можно начинать реализацию! 🚀
