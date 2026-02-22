# Полный аудит проекта Booking / MClient
**Дата:** 18.02.2026
**Стек:** Laravel 12 + React 19 + Inertia.js + Tailwind CSS 3 + shadcn/ui + TypeScript
**Файлов:** ~238 TSX/TS (фронтенд), ~80 PHP (бэкенд), ~95 миграций БД

---

## Общая оценка

| Направление | Оценка |
|---|---|
| Архитектура бэкенда (Laravel) | **6.0 / 10** |
| Фронтенд (React/TypeScript) | **5.3 / 10** |
| UX/UI | **7.2 / 10** |
| **Среднее** | **6.2 / 10** |

---

# ЧАСТЬ I — БЭКЕНД (Laravel)

## 🔴 КРИТИЧЕСКИЕ уязвимости

### [КРИТ-1] Утечка хеша пароля на фронтенд
**Файл:** `app/Http/Middleware/HandleInertiaRequests.php` ~строка 132
**Проблема:** `'password' => $request->user()->password` — хеш пароля BCrypt/Argon2 передаётся в браузер в shared props.
**Последствия:** При любой XSS атаке злоумышленник получает хеш и может провести offline brute-force.
**Исправление:** `'has_password' => (bool) $request->user()->password`
> ⚠️ По записям в MEMORY.md это было помечено как исправленное — **проверить в коде!**

---

### [КРИТ-2] Race condition при бронировании
**Файл:** `app/Http/Controllers/Public/BookingController.php` ~строки 499–530
**Проблема:** Проверка доступности слота и создание записи — не атомарная операция. Два пользователя могут одновременно пройти проверку и забронировать один и тот же слот.
**Исправление:**
```php
DB::transaction(function () use ($data) {
    // SELECT ... FOR UPDATE на слот
    // затем создание Appointment
});
```

---

### [КРИТ-3] Webhook без обязательного секрета
**Файл:** `app/Services/Payment/PaymentService.php` ~строки 375–392
**Проблема:** Если `YOOKASSA_WEBHOOK_SECRET` не задан в `.env`, секрет пустой и верификация всегда провалится (возвращает `false`). Но нет принудительной проверки, что секрет вообще установлен. Webhook-контроллер должен блокировать запросы, если конфигурация не заполнена.
**Исправление:** Добавить стартап-валидацию в `AppServiceProvider`:
```php
if (config('services.yookassa.webhook_secret') === null) {
    throw new \RuntimeException('YOOKASSA_WEBHOOK_SECRET must be set');
}
```

---

### [КРИТ-4] Promo Code — пропущены ключевые проверки
**Файл:** `app/Services/Subscription/PromoCodeService.php` ~строки 15–63
**Проблема:** `validate()` проверяет `first_payment_only`, но **не проверяет**:
- `is_active` — промокод может быть деактивирован
- `max_uses` vs фактическое количество использований
- Дата истечения (`expires_at`)
- Ограничение по конкретным пользователям

**Последствия:** Неактивные или просроченные промокоды принимаются системой.

---

### [КРИТ-5] Каскадное удаление пользователя без транзакции
**Файл:** `app/Models/User.php` ~строки 98–124
**Проблема:** Удаление 24+ связанных моделей без `DB::transaction()`. При ошибке на середине — данные остаются в несогласованном состоянии.
**Исправление:**
```php
DB::transaction(function () {
    $this->appointments()->delete();
    $this->clients()->delete();
    // ... остальные
    $this->delete();
});
```

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ

### [HIGH-1] N+1 запросы на каждый HTTP-запрос
**Файл:** `app/Http/Middleware/HandleInertiaRequests.php` ~строки 46–144
**Проблема:** На каждый запрос выполняются:
- Подзапрос непрочитанных тикетов (все незакрытые, фильтрация в PHP)
- 3 отдельных `count()` запроса (clients, services, appointments) — нужны только на дашборде
- `userModules()->count()` отдельным запросом

**Исправление:** Кешировать статистику (Redis/cache, TTL 5 мин), загружать только нужные данные по контексту страницы.

---

### [HIGH-2] Отсутствие Rate Limiting на критичных маршрутах
**Файлы:** `routes/web.php`, контроллеры Auth
Не защищены rate limiting:
- Публичное бронирование (`/public/{username}`)
- Форма сброса пароля (`/forgot-password`)
- Email верификация (`/email/verify`)
- Вебхуки (/yookassa)
- Создание записей (спам-бронирования)

---

### [HIGH-3] IDOR в checkPhone()
**Файл:** `app/Http/Controllers/App/ClientController.php` ~строки 57–117
**Проблема:** `checkPhone()` возвращает полный объект клиента включая все приватные данные. Запрос с телефоном чужого клиента вернёт его данные, если клиент принадлежит тому же мастеру.

---

### [HIGH-4] Путевой обход в перемещении файлов
**Файл:** `app/Http/Controllers/Public/BookingController.php` ~строка 571
```php
$newPath = 'appointments/' . $appointment->id . '/' . basename($value);
```
`basename()` защищает от directory traversal, но `$value` из пользовательских полей не проходит полную санацию перед использованием.

---

### [HIGH-5] Загрузка файлов без валидации расширения
**Файл:** `app/Http/Controllers/Public/TempUploadController.php` ~строки 18–35
**Проблема:** Валидируется только MIME type (`image`). Расширение файла не проверяется. MIME type можно подделать.
**Исправление:** Добавить `mimes:jpg,jpeg,png,gif,webp` в правила валидации.

---

### [HIGH-6] Чрезмерное логирование с персональными данными
**Файл:** `app/Http/Controllers/Public/BookingController.php` ~строки 297–374
**Проблема:** В логах записываются: timezone, serviceId, userId, полные данные слотов. При утечке логов — раскрытие паттернов бронирования пользователей.

---

### [HIGH-7] Нет проверки авторизации в NotificationLogController
**Файл:** `app/Http/Controllers/App/NotificationLogController.php`
**Проблема:** `show()` не использует Policy. Inline-проверка `if ($notification->user_id !== auth()->id())` вместо `$this->authorize('view', $notification)` — менее надёжно и сложнее аудировать.

---

### [HIGH-8] Несогласованность Enum для статусов
**Проблема:** В модуле Leads используются PHP Enums, в ядре — строки:
```php
'status' => 'required|in:scheduled,confirmed,completed,cancelled,no_show'
```
Строки дублируются в 3+ файлах. Опечатка = тихая ошибка.
**Исправление:** Создать `app/Enums/AppointmentStatus.php`.

---

### [HIGH-9] `env()` в маршрутах (не кешируется)
**Файл:** `routes/web.php` ~строка 414
`env('ADMIN_PANEL_PATH', 'admin')` не работает при `php artisan config:cache`.
> По MEMORY.md исправлено на `config('app.admin_panel_path')` — **проверить!**

---

## 🟡 СРЕДНИЙ ПРИОРИТЕТ

### [MED-1] Нет HTTP Security Headers
Отсутствуют:
- `Content-Security-Policy`
- `X-Frame-Options` (clickjacking)
- `X-Content-Type-Options`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy`

**Исправление:** Добавить middleware `SecurityHeaders` или настроить через nginx/Apache.

---

### [MED-2] Нет CAPTCHA на публичном бронировании
**Файл:** `app/Http/Controllers/Public/BookingController.php`
Форма публичного бронирования доступна без аутентификации и без капчи. Возможен спам-флуд записями.

---

### [MED-3] God Object — модель User
**Файл:** `app/Models/User.php` (~504 строки)
- 35+ отношений
- Логика подписок, OAuth, 2FA, каскадного удаления в одном файле
- 30+ fillable полей (включая `site_title`, `theme_color`, `site_gradient_from` — должны быть в `user_profiles`)

**Исправление:** Выделить трейты `HasSubscription`, `HasTwoFactor`, `HasOAuth`; перенести `site_*` поля в отдельную таблицу.

---

### [MED-4] Монолитный routes/web.php
**Файл:** `routes/web.php` — 737 строк
**Исправление:** Разделить на `routes/admin.php`, `routes/app.php`, `routes/public.php`, `routes/auth.php`.

---

### [MED-5] Дублирование regex-ограничений
**Файл:** `routes/web.php` ~строки 370–410
Regex `'^(?!leads$|reviews$)[a-z0-9-]+$'` повторяется 11 раз.
**Исправление:** Вынести в константу или паттерн маршрута.

---

### [MED-6] Дублирование контроллеров и сервисов
- `app/Settings/ProfileController.php` VS `app/Http/Controllers/App/Settings/ProfileController.php`
- `app/Services/NotificationService.php` (заглушки с TODO) VS `app/Services/Notifications/NotificationService.php` (рабочая)
- `app/Exceptions/Handler.php` (артефакт, в Laravel 12 используется `bootstrap/app.php`)

---

### [MED-7] Привязка Module через slug вместо id
**Файл:** `app/Models/Module.php` ~строки 52–55
`module_slug` используется как foreign key. Slug может измениться — потеря связей.

---

### [MED-8] Hardcoded 'UTC' вместо config('app.timezone')
**Файлы:** `BookingController.php` ~строки 290, 455; `AppointmentController.php` ~строка 158
```php
Carbon::parse($date, 'UTC')  // должно быть config('app.timezone')
```

---

### [MED-9] Нет валидации .env переменных при старте
Если не заданы `YOOKASSA_*` секреты, система молча работает в небезопасном режиме.
**Исправление:** Добавить `php artisan app:validate-config` или проверку в ServiceProvider.

---

### [MED-10] Нет шифрования персональных данных в БД
Телефоны и emails клиентов хранятся в plaintext. При утечке БД — полная экспозиция.
**Рекомендация:** Для чувствительных полей — Laravel Encrypted Cast или application-level шифрование.

---

## 🟢 НИЗКИЙ ПРИОРИТЕТ / ТЕХНИЧЕСКИЙ ДОЛГ

### [LOW-1] Нет тестов
Только `ExampleTest` и `ModuleSystemTest`. Нет unit/feature тестов для:
- PaymentService, SubscriptionService
- BookingController (критичная бизнес-логика)
- PromoCodeService
- TimeSlotGenerator

### [LOW-2] Unused dependencies
- `@fullcalendar/*` — не используется
- `gsap` — не используется
- `driver.js` — не используется
- 3 иконочных библиотеки (lucide, tabler, solar) — стандартизировать

### [LOW-3] Нет code splitting
`import.meta.glob` загружает все ~100 страниц сразу.

### [LOW-4] ~30+ TODO-комментариев в коде
Незавершённый функционал:
- SMS не реализован (SMSRuProvider — заглушка)
- PDF чеки — заглушка
- Email уведомления — заглушка
- Возврат платежей — не реализован

### [LOW-5] Несогласованные HTTP методы
Mix of `PUT` и `PATCH` без единой конвенции в `routes/web.php`.

### [LOW-6] Несогласованные форматы дат
Mix of `toIso8601String()`, `toDateTimeString()`, `toISOString()`.

### [LOW-7] IP whitelist только по точному совпадению
`app/Http/Middleware/AdminAuthenticate.php` — нет поддержки CIDR диапазонов (`192.168.1.0/24`).

---

# ЧАСТЬ II — ФРОНТЕНД (React/TypeScript)

## 🔴 КРИТИЧЕСКИЕ уязвимости

### [FE-КРИТ-1] XSS через dangerouslySetInnerHTML
**Файлы:**
- `resources/js/Pages/Marketing/News/Show.tsx` ~строка 116:
  ```tsx
  <div dangerouslySetInnerHTML={{ __html: news.content }} />
  ```
  Контент новостей из БД рендерится без санитизации — прямой XSS если контент не экранируется на сервере.

- `resources/js/Pages/App/Payments/Index.tsx` ~строки 152, 155:
  ```tsx
  <span dangerouslySetInnerHTML={{ __html: link.label }} />
  ```
  Labels Laravel пагинации рендерятся как HTML.

- `resources/js/Components/ui/chart.tsx` ~строки 81–98:
  CSS инжектируется через `dangerouslySetInnerHTML` из конфигурации.

**Исправление:** Использовать `react-markdown` для контента; для пагинации — рендерить числа вручную; для chart.tsx — CSS variables.

---

### [FE-КРИТ-2] 96+ использований `any` в TypeScript
**Файлы с наибольшей концентрацией:**
- `Pages/App/Calendar/Create.tsx` — 10 `any`
- `Pages/App/Calendar/Edit.tsx` — 10 `any`
- `Components/AppointmentDetailsModal.tsx` — 10 `any`
- `Pages/App/Settings/Index.tsx` — 5 `any`

**Последствия:** TypeScript не может поймать ошибки типов в критичных местах (auth, payment data).

---

### [FE-КРИТ-3] 20+ директив @ts-ignore
```tsx
// @ts-ignore
declare const route: any;  // Settings/Index.tsx, Calendar/Create.tsx и др.
```
Полное отключение проверки типов для роутинга — ошибочные параметры не обнаруживаются.
**Исправление:** Использовать `ziggy-js` с типами или создать `global.d.ts` декларацию.

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ (ФРОНТЕНД)

### [FE-HIGH-1] Нет Error Boundaries
0 файлов с `ErrorBoundary` или классовыми компонентами с `componentDidCatch`.
**Последствия:** Ошибка в любом компоненте = белый экран для пользователя.
**Исправление:** Создать `ErrorBoundary.tsx`, обернуть layouts.

---

### [FE-HIGH-2] Race condition в форме отзыва
**Файл:** `resources/js/Pages/Public/Booking/Show.tsx` ~строки 175–192
```tsx
setIsSubmittingReview(true);
await axios.post(...);
setTimeout(() => { setIsReviewDialogOpen(false); }, 2000);
```
- Нет защиты от двойного submit
- `setTimeout` не очищается если компонент размонтирован — memory leak

---

### [FE-HIGH-3] Валидация загружаемых файлов только на клиенте
**Файлы:** `BookingModal.tsx`, `MediaUploader.tsx`, `PortfolioUpload.tsx`, `ImageFieldUpload.tsx`
```tsx
const fileType = file.type.startsWith('image/') ? 'image' : 'video';
```
MIME type проверяется только на клиенте — легко обходится. `console.log` в `MediaUploader.tsx` логирует метаданные файла в консоль браузера.

---

### [FE-HIGH-4] Прямые axios вызовы без CSRF токена
**Файлы:** `Booking/Show.tsx` ~строка 180, `MediaUploader.tsx` ~строка 78
```tsx
await axios.post(`/api/modules/reviews/public/${master.username}`, reviewForm);
fetch(route('admin.knowledge-base.articles.upload-media', articleId), { method: 'POST', body: formData });
```
Inertia автоматически добавляет CSRF токен только для `router.post()`. Прямые axios/fetch запросы без токена.

---

### [FE-HIGH-5] Публичная страница раскрывает полный номер телефона
**Файл:** `resources/js/Pages/Public/Booking/Show.tsx` ~строки 116, 353, 627
Телефон мастера, WhatsApp, Telegram передаются в props и отображаются полностью на публичной странице.
**Последствия:** Скрейпинг ботами, спам, социальная инженерия.
**Исправление:** Маскировать `+7 (999) XX-XX-67` или использовать форму обратной связи.

---

### [FE-HIGH-6] Нет code splitting
**Файл:** `resources/js/app.tsx` ~строки 28–31
```tsx
import.meta.glob('./Pages/**/*.tsx')  // eager: true по умолчанию
```
Все ~100 страниц загружаются в одном бандле.
**Исправление:**
```tsx
import.meta.glob('./Pages/**/*.tsx', { eager: false })
```

---

## 🟡 СРЕДНИЙ ПРИОРИТЕТ (ФРОНТЕНД)

### [FE-MED-1] Недостаточная валидация форм
- Login: только HTML5 `required`, без regex
- Review form: только trim(), нет лимита длины, нет валидации рейтинга
- Booking form: телефон форматируется но не валидируется

**Исправление:** `react-hook-form` + `zod` (уже импортированы в проекте — использовать везде).

---

### [FE-MED-2] Нет состояний загрузки в таблицах
**Файл:** `resources/js/Pages/App/Clients/Index.tsx`
При пагинации нет spinner/skeleton — пользователь не знает, что данные загружаются.

---

### [FE-MED-3] Проблемы с timezone в датах
```tsx
new Date(payment.created_at).toLocaleDateString('ru-RU')  // Payments/Index.tsx
```
Даты отображаются в timezone браузера, а не в timezone пользователя из настроек.
**Исправление:** `date-fns-tz` с timezone из `usePage().props.auth.user.timezone`.

---

### [FE-MED-4] Hardcoded цвета в компонентах
**Файлы:** `Auth/Login.tsx` ~строки 54–124, `Public/Booking/Show.tsx` ~строки 213–248
```tsx
<style>{` body { background-color: #0a0a0a; --lime: #c4eb5a; } `}</style>
```
Inline `<style>` теги с захардкоженными цветами вместо CSS variables из ThemeProvider.

---

### [FE-MED-5] Нет Suspense границ
React 19 поддерживает Suspense для async компонентов, но не используется. Нет fallback UI при загрузке данных.

---

### [FE-MED-6] Нет мониторинга ошибок
Нет интеграции с Sentry/Bugsnag/Rollbar. Ошибки в production незаметны.

---

## 🟢 НИЗКИЙ ПРИОРИТЕТ (ФРОНТЕНД)

### [FE-LOW-1] Состояние ModuleContext не мемоизировано
**Файл:** `resources/js/contexts/ModuleContext.tsx`
`autoFetch={true}` на каждый рендер — лишние ре-рендеры дочерних компонентов.

### [FE-LOW-2] URL объекты не освобождаются
**Файл:** `BookingModal.tsx`
`URL.revokeObjectURL(localPreview)` вызывается только при ошибке, но не при успехе.

### [FE-LOW-3] Проблемы доступности (a11y)
Кнопки без `aria-label`, inputs без правильных `htmlFor`, цветовой контраст не проверен для WCAG AA.

---

# ЧАСТЬ III — ПРЕДЛАГАЕМЫЙ НОВЫЙ ФУНКЦИОНАЛ

## Высокий приоритет (критично для бизнеса)

### [FEAT-1] Система ожидания (Waitlist)
Если слот занят — клиент встаёт в очередь. При отмене — автоматическое уведомление первому в очереди.
**Реализация:** Таблица `waitlists`, Observer на `Appointment::cancelled`, NotificationJob.

---

### [FEAT-2] Повторяющиеся записи (Recurring Appointments)
Клиент записывается "каждые 2 недели" с выбором количества повторений.
**Реализация:** Поля `recurrence_rule` (iCal format), `parent_appointment_id` в таблице записей.

---

### [FEAT-3] Онлайн-оплата при бронировании (депозит)
Взимать частичную предоплату при создании записи для снижения no-show.
**Реализация:** YooKassa уже подключена — добавить `deposit_amount` в сервисах, создавать платёж при бронировании.

---

### [FEAT-4] Система напоминаний (multi-step)
- За 24 часа до записи — напоминание
- За 2 часа — финальное напоминание
- После записи — запрос отзыва
**Реализация:** Laravel Scheduler + NotificationJob с типом `reminder`.

---

### [FEAT-5] Публичный виджет для встраивания
`<script src="https://domain/widget/{username}.js">` — встраиваемый iframe с формой бронирования для сайта мастера.
**Реализация:** Отдельный Blade layout, CORS headers, CSP для iframe.

---

## Средний приоритет

### [FEAT-6] Аналитика и отчёты
- Конверсия бронирований (просмотры → записи)
- Популярные услуги по дням недели
- Средний чек динамика
- Клиенты по источникам (прямо / через виджет / реферал)
**Реализация:** Отдельная таблица `analytics_events`, дашборд на Recharts (уже в проекте).

---

### [FEAT-7] Программа лояльности / бонусы
Накопительные баллы за визиты, скидки за кол-во записей, реферальная программа.
**Реализация:** Таблица `loyalty_points`, `loyalty_transactions`; вычисление при закрытии записи.

---

### [FEAT-8] Групповые записи / мероприятия
Услуга с ограниченным количеством мест (йога, курсы). Несколько клиентов на один слот.
**Реализация:** `capacity` поле в сервисах, подсчёт занятых мест при бронировании.

---

### [FEAT-9] Мобильное приложение (PWA)
Service Worker + Web Push Notifications вместо Telegram.
**Реализация:** `vite-plugin-pwa`, `web-push` пакет Laravel.

---

### [FEAT-10] Интеграции с внешними сервисами
- **Google Calendar** — двусторонняя синхронизация записей
- **Яндекс.Карты / 2GIS** — отображение локации на публичной странице
- **AmoCRM / Bitrix24** — экспорт лидов
- **ВКонтакте / Telegram Bot** — бронирование через мессенджеры

---

### [FEAT-11] Умное расписание с AI
- Предсказание загрузки на основе исторических данных
- Рекомендация оптимального времени для конкретного клиента
- Автоматическое определение продолжительности из истории похожих записей

---

### [FEAT-12] Отзывы с верификацией визита
Отзыв можно оставить только если статус записи `completed`. Автоматически запрашивать отзыв через N дней после визита.
**Реализация:** Scheduled job, уникальная подпись для формы отзыва привязанная к appointment_id.

---

### [FEAT-13] Telegram Mini App
Полноценное приложение внутри Telegram для бронирования без браузера.
**Реализация:** React в Telegram WebApp API, отдельный маршрут `/telegram/app`.

---

## Низкий приоритет

### [FEAT-14] Многоязычность (i18n)
Публичная страница на языке клиента, поддержка EN/UA/KZ.
**Реализация:** `react-i18next`, Laravel lang files.

---

### [FEAT-15] Тёмная тема
`dark:` классы Tailwind уже частично есть — дореализовать ThemeProvider.

---

### [FEAT-16] Экспорт данных
- Клиенты → CSV/Excel
- Записи → CSV/Excel/PDF
- Фин. отчёты → PDF

---

### [FEAT-17] API для внешних разработчиков
REST API с OAuth2 для интеграции с внешними сервисами мастера.
**Реализация:** Laravel Passport, `routes/api.php`, версионирование `/api/v1/`.

---

# ИТОГОВАЯ ТАБЛИЦА

## Бэкенд

| # | Проблема | Критичность |
|---|---|---|
| КРИТ-1 | Утечка хеша пароля | 🔴 Критично |
| КРИТ-2 | Race condition при бронировании | 🔴 Критично |
| КРИТ-3 | Webhook без обязательного секрета | 🔴 Критично |
| КРИТ-4 | PromoCode — пропущены проверки | 🔴 Критично |
| КРИТ-5 | Каскадное удаление без транзакции | 🔴 Критично |
| HIGH-1 | N+1 запросы на каждый запрос | 🟠 Высокий |
| HIGH-2 | Нет Rate Limiting на публичных маршрутах | 🟠 Высокий |
| HIGH-3 | IDOR в checkPhone() | 🟠 Высокий |
| HIGH-4 | Path traversal в перемещении файлов | 🟠 Высокий |
| HIGH-5 | Загрузка файлов без валидации расширения | 🟠 Высокий |
| HIGH-6 | Чрезмерное логирование ПДн | 🟠 Высокий |
| HIGH-7 | Нет Policy в NotificationLogController | 🟠 Высокий |
| HIGH-8 | Строковые статусы вместо Enum | 🟠 Высокий |
| HIGH-9 | env() в маршрутах | 🟠 Высокий |
| MED-1 | Нет Security Headers | 🟡 Средний |
| MED-2 | Нет CAPTCHA на публичном бронировании | 🟡 Средний |
| MED-3 | God Object User | 🟡 Средний |
| MED-4 | Монолитный routes/web.php | 🟡 Средний |
| MED-5 | DRY нарушение в regex | 🟡 Средний |
| MED-6 | Дублирование контроллеров/сервисов | 🟡 Средний |
| MED-7 | Связывание Module по slug | 🟡 Средний |
| MED-8 | Hardcoded 'UTC' | 🟡 Средний |
| MED-9 | Нет валидации .env | 🟡 Средний |
| MED-10 | Нет шифрования ПДн в БД | 🟡 Средний |

## Фронтенд

| # | Проблема | Критичность |
|---|---|---|
| FE-КРИТ-1 | XSS через dangerouslySetInnerHTML | 🔴 Критично |
| FE-КРИТ-2 | 96+ any типов | 🔴 Критично |
| FE-КРИТ-3 | 20+ @ts-ignore | 🔴 Критично |
| FE-HIGH-1 | Нет Error Boundaries | 🟠 Высокий |
| FE-HIGH-2 | Race condition в форме отзыва | 🟠 Высокий |
| FE-HIGH-3 | Валидация файлов только на клиенте | 🟠 Высокий |
| FE-HIGH-4 | axios/fetch без CSRF токена | 🟠 Высокий |
| FE-HIGH-5 | Телефон на публичной странице | 🟠 Высокий |
| FE-HIGH-6 | Нет code splitting | 🟠 Высокий |
| FE-MED-1 | Слабая валидация форм | 🟡 Средний |
| FE-MED-2 | Нет loading states в таблицах | 🟡 Средний |
| FE-MED-3 | Timezone в датах | 🟡 Средний |
| FE-MED-4 | Hardcoded цвета | 🟡 Средний |
| FE-MED-5 | Нет Suspense | 🟡 Средний |
| FE-MED-6 | Нет мониторинга ошибок | 🟡 Средний |

---

# ПЛАН ИСПРАВЛЕНИЙ

## Sprint 1 (критично, ~1 неделя)
1. ✅ Исправить утечку пароля (уже сделано по MEMORY.md — перепроверить)
2. 🔧 Race condition при бронировании → DB transaction + SELECT FOR UPDATE
3. 🔧 XSS в News/Show.tsx → react-markdown вместо dangerouslySetInnerHTML
4. 🔧 XSS в Payments пагинации → рендерить числа вручную
5. 🔧 PromoCode — добавить is_active, max_uses, expires_at проверки
6. 🔧 Каскадное удаление User → DB::transaction()
7. 🔧 Rate Limiting на публичное бронирование, forgot-password, webhooks

## Sprint 2 (высокий приоритет, ~2 недели)
8. 🔧 Error Boundaries для всех layouts
9. 🔧 Убрать any типы в Calendar/Create, Edit, AppointmentDetailsModal
10. 🔧 Security Headers middleware
11. 🔧 CAPTCHA (Cloudflare Turnstile) на публичном бронировании
12. 🔧 File upload — добавить mimes валидацию на сервере
13. 🔧 CSRF для прямых axios вызовов
14. 🔧 Code splitting в app.tsx
15. 🔧 Маскировка телефона на публичной странице

## Sprint 3 (средний приоритет, ~2 недели)
16. 🔧 Разбить routes/web.php на отдельные файлы
17. 🔧 AppointmentStatus Enum
18. 🔧 Вынести site_* поля User в user_profiles
19. 🔧 Трейты HasSubscription, HasTwoFactor для User модели
20. 🔧 Кеширование shared props в HandleInertiaRequests
21. 🔧 Удалить дублирующие контроллеры (app/Settings/)
22. 🔧 react-hook-form + zod везде

## Sprint 4 (технический долг, ~2 недели)
23. 🔧 Sentry/Bugsnag интеграция
24. 🔧 Feature tests для BookingController, PaymentService
25. 🔧 Suspense boundaries
26. 🔧 Удалить неиспользуемые зависимости
27. 🔧 Стандартизировать на одну иконочную библиотеку

---

*Аудит выполнен: 18.02.2026*
