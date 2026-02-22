# Requirements Document: Subscription System

## Introduction

Система подписок для MasterPlan CRM - трехуровневая биллинговая система с тарифами "Базовая" (бесплатно), "Профессиональная" (299₽/мес) и "Максимальная" (700₽/мес). Система включает интеграцию с платежным провайдером ЮKassa, управление лимитами, промокоды и триал период.

## Glossary

- **Subscription_System** - система управления подписками и биллингом
- **Plan** - тарифный план с набором функций и лимитов
- **Subscription** - активная подписка пользователя на определенный план
- **Payment** - платеж за подписку
- **Usage_Limit** - лимит использования функции (записи, клиенты, услуги и т.д.)
- **Promo_Code** - промокод для скидки или продления триала
- **Trial_Period** - пробный период (14 дней)
- **YooKassa** - платежный провайдер для приема платежей
- **Recurring_Payment** - автоматический рекуррентный платеж

## Requirements

### Requirement 1: Тарифные планы

**User Story:** Как владелец CRM, я хочу видеть доступные тарифные планы с их возможностями, чтобы выбрать подходящий для моего бизнеса.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide three plans: "Базовая" (free), "Профессиональная" (299 RUB/month), "Максимальная" (700 RUB/month)
2. WHEN a user views plans, THE Subscription_System SHALL display all features and limits for each plan
3. THE Subscription_System SHALL store plan features in JSON format with limits and feature flags
4. THE Subscription_System SHALL allow administrators to create and modify plans
5. WHEN a plan is deactivated, THE Subscription_System SHALL prevent new subscriptions but maintain existing ones

### Requirement 2: Лимиты использования

**User Story:** Как пользователь на определенном тарифе, я хочу, чтобы система контролировала мои лимиты, чтобы я понимал ограничения своего плана.

#### Acceptance Criteria

1. THE Subscription_System SHALL enforce the following limits based on user's plan:
   - Базовая: 30 appointments/month, 50 clients, 5 services, 5 portfolio images, 3 tags
   - Профессиональная: unlimited appointments, 500 clients, 20 services, 30 portfolio images, 20 tags
   - Максимальная: unlimited for all metrics
2. WHEN a user attempts to exceed their limit, THE Subscription_System SHALL prevent the action and display upgrade prompt
3. WHEN a user reaches 80% of any limit, THE Subscription_System SHALL display a warning notification
4. THE Subscription_System SHALL track usage per billing period (monthly)
5. WHEN a new billing period starts, THE Subscription_System SHALL reset monthly usage counters

### Requirement 3: Создание подписки

**User Story:** Как пользователь, я хочу оформить подписку на выбранный тарифный план, чтобы получить доступ к расширенным возможностям.

#### Acceptance Criteria

1. WHEN a user selects a paid plan, THE Subscription_System SHALL create a payment request via YooKassa
2. WHEN payment is successful, THE Subscription_System SHALL activate the subscription immediately
3. THE Subscription_System SHALL set subscription period to 30 days from activation date
4. WHEN a subscription is created, THE Subscription_System SHALL send confirmation email to user
5. THE Subscription_System SHALL store payment details including provider payment ID and status

### Requirement 4: Интеграция с ЮKassa

**User Story:** Как пользователь, я хочу безопасно оплатить подписку банковской картой, чтобы активировать выбранный тарифный план.

#### Acceptance Criteria

1. THE Subscription_System SHALL integrate with YooKassa API for payment processing
2. WHEN creating a payment, THE Subscription_System SHALL redirect user to YooKassa payment page
3. WHEN payment is completed, THE Subscription_System SHALL receive webhook notification from YooKassa
4. THE Subscription_System SHALL verify webhook signature before processing payment
5. WHEN payment fails, THE Subscription_System SHALL notify user and provide retry option
6. THE Subscription_System SHALL support payment methods: bank cards, YooMoney, SBP

### Requirement 5: Рекуррентные платежи

**User Story:** Как пользователь с активной подпиской, я хочу, чтобы подписка автоматически продлевалась, чтобы не терять доступ к функциям.

#### Acceptance Criteria

1. WHEN a user makes first payment, THE Subscription_System SHALL save payment method for recurring payments
2. THE Subscription_System SHALL attempt automatic renewal 3 days before subscription expiration
3. WHEN automatic payment succeeds, THE Subscription_System SHALL extend subscription for next period
4. WHEN automatic payment fails, THE Subscription_System SHALL notify user and retry after 24 hours
5. WHEN automatic payment fails 3 times, THE Subscription_System SHALL cancel subscription and notify user
6. THE Subscription_System SHALL send reminder email 7 days before subscription expiration

### Requirement 6: Управление подпиской

**User Story:** Как пользователь с активной подпиской, я хочу управлять своей подпиской, чтобы изменить план или отменить автопродление.

#### Acceptance Criteria

1. WHEN a user cancels subscription, THE Subscription_System SHALL disable auto-renewal but maintain access until period end
2. WHEN a user upgrades plan, THE Subscription_System SHALL apply changes immediately and calculate prorated amount
3. WHEN a user downgrades plan, THE Subscription_System SHALL schedule change for next billing period
4. THE Subscription_System SHALL allow users to view payment history and download invoices
5. WHEN subscription expires without renewal, THE Subscription_System SHALL downgrade user to free plan

### Requirement 7: Триал период

**User Story:** Как новый пользователь, я хочу получить пробный период с полным функционалом, чтобы оценить все возможности системы перед покупкой.

#### Acceptance Criteria

1. WHEN a new user registers, THE Subscription_System SHALL automatically activate 14-day trial of "Максимальная" plan
2. THE Subscription_System SHALL send trial reminder emails at 7 days, 3 days, and 1 day before expiration
3. WHEN trial expires without payment, THE Subscription_System SHALL send notification with choice: purchase subscription or continue with free plan
4. WHEN trial expires without payment, THE Subscription_System SHALL downgrade user to "Базовая" plan
5. THE Subscription_System SHALL allow only one trial per user (tracked by email)
6. WHEN user subscribes during trial, THE Subscription_System SHALL cancel trial and start paid subscription

### Requirement 8: Визуальное отключение функционала

**User Story:** Как пользователь на бесплатном тарифе, я хочу видеть недоступные функции затемненными, чтобы понимать, что мне нужно для их использования.

#### Acceptance Criteria

1. WHEN a user's plan does not include a feature, THE Subscription_System SHALL display that feature in disabled state on frontend
2. THE Subscription_System SHALL apply visual styling to disabled features: reduced opacity, grayscale filter, disabled cursor
3. WHEN a user attempts to interact with disabled feature, THE Subscription_System SHALL display upgrade modal with plan comparison
4. THE Subscription_System SHALL show lock icon on disabled features
5. THE Subscription_System SHALL display tooltip on hover explaining feature requires upgrade
6. WHEN a user upgrades plan, THE Subscription_System SHALL immediately enable all newly available features without page reload

### Requirement 9: Скрытие функций на публичной странице

**User Story:** Как владелец публичной страницы, я хочу, чтобы недоступные функции не отображались посетителям, чтобы страница выглядела профессионально.

#### Acceptance Criteria

1. WHEN a user's plan does not include portfolio feature, THE Subscription_System SHALL hide portfolio section from public page
2. WHEN a user's plan does not include custom templates, THE Subscription_System SHALL use basic template for public page
3. WHEN a user's plan does not include extended public page features, THE Subscription_System SHALL hide advanced sections (testimonials, gallery, custom blocks)
4. THE Subscription_System SHALL check feature availability before rendering each public page section
5. WHEN a user upgrades plan, THE Subscription_System SHALL immediately show newly available sections on public page

### Requirement 10: Промокоды

**User Story:** Как пользователь, я хочу применить промокод при оплате, чтобы получить скидку на подписку.

#### Acceptance Criteria

1. THE Subscription_System SHALL support three promo code types: percentage discount, fixed discount, trial extension
2. WHEN a user enters promo code, THE Subscription_System SHALL validate code and display discount amount
3. THE Subscription_System SHALL enforce promo code restrictions: usage limit, expiration date, specific plans
4. WHEN promo code is used, THE Subscription_System SHALL record usage and decrement available uses
5. THE Subscription_System SHALL prevent using same promo code twice by same user
6. WHEN promo code reaches usage limit or expires, THE Subscription_System SHALL mark it as inactive

### Requirement 11: Отслеживание использования

**User Story:** Как пользователь, я хочу видеть текущее использование лимитов моего тарифа, чтобы планировать апгрейд при необходимости.

#### Acceptance Criteria

1. THE Subscription_System SHALL display usage widget showing current usage vs limits for all metrics
2. WHEN user creates appointment/client/service, THE Subscription_System SHALL increment corresponding usage counter
3. THE Subscription_System SHALL calculate usage percentage for each metric
4. WHEN usage exceeds 80%, THE Subscription_System SHALL display warning badge on usage widget
5. THE Subscription_System SHALL provide detailed usage breakdown by metric and time period

### Requirement 12: Уведомления о биллинге

**User Story:** Как пользователь, я хочу получать уведомления о событиях подписки, чтобы быть в курсе статуса оплаты.

#### Acceptance Criteria

1. WHEN subscription is activated, THE Subscription_System SHALL send confirmation email with invoice
2. WHEN payment fails, THE Subscription_System SHALL send notification with payment link
3. WHEN subscription is about to expire, THE Subscription_System SHALL send reminder 7 days before
4. WHEN subscription is cancelled, THE Subscription_System SHALL send confirmation email
5. WHEN user reaches usage limit, THE Subscription_System SHALL send notification with upgrade link
6. WHEN trial expires, THE Subscription_System SHALL send notification with choice: purchase subscription or continue with free plan

### Requirement 13: Административная панель

**User Story:** Как администратор, я хочу управлять подписками пользователей, чтобы решать проблемы с биллингом и предоставлять поддержку.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide admin interface to view all subscriptions with filters
2. THE Subscription_System SHALL allow admins to manually activate/cancel/extend subscriptions
3. THE Subscription_System SHALL allow admins to create and manage promo codes
4. THE Subscription_System SHALL display subscription analytics: MRR, churn rate, conversion rate
5. THE Subscription_System SHALL allow admins to refund payments and adjust billing

### Requirement 14: Безопасность и соответствие

**User Story:** Как пользователь, я хочу, чтобы мои платежные данные были защищены, чтобы чувствовать себя в безопасности.

#### Acceptance Criteria

1. THE Subscription_System SHALL NOT store credit card numbers or CVV codes
2. THE Subscription_System SHALL use HTTPS for all payment-related communications
3. THE Subscription_System SHALL encrypt sensitive data (payment tokens) in database
4. THE Subscription_System SHALL log all payment transactions for audit purposes
5. THE Subscription_System SHALL comply with PCI DSS requirements through YooKassa integration

## Feature Limits by Plan

### Базовая (Free)
- Appointments: 30/month
- Clients: 50 total
- Services: 5 total
- Portfolio images: 5 total
- Client tags: 3 total
- VK notifications: 0/month
- Email notifications: 50/month
- Features: basic online booking, basic public page, basic CRM, basic finance
- No analytics, no export, no custom templates, no priority support

### Профессиональная (299 RUB/month)
- Appointments: unlimited
- Clients: 500 total
- Services: 20 total
- Portfolio images: 30 total
- Client tags: 20 total
- VK notifications: 100/month
- Email notifications: 500/month
- Features: extended public page, full CRM, extended finance, basic analytics, Excel export, custom templates, priority support

### Максимальная (700 RUB/month)
- All metrics: unlimited
- Features: premium public page, full CRM, full finance, extended analytics, Excel export, custom templates, VIP priority support

## Technical Requirements

### Database
- MySQL 8.0+
- Tables: subscription_plans, subscriptions, payments, usage_tracking, promo_codes, promo_code_usages

### External Services
- YooKassa API for payment processing
- Email service for notifications

### Performance
- Payment webhook processing: < 5 seconds
- Usage limit check: < 100ms
- Subscription status check: < 50ms

### Scalability
- Support 10,000+ active subscriptions
- Handle 1,000+ concurrent payment webhooks
- Process 100,000+ usage tracking records per day
