# Implementation Plan: Subscription System

## Overview

Реализация трехуровневой системы подписок с интеграцией ЮKassa, управлением лимитами, промокодами и автоматическим продлением. Разработка разделена на 4 основных этапа с инкрементальной доставкой функционала.

## Tasks

- [x] 1. Database Setup and Models
- [x] 1.1 Create subscription_plans migration
  - Create table with fields: id, name, slug, description, price, billing_period, features (JSON), is_active, sort_order
  - Add indexes on slug and is_active
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Create subscriptions migration
  - Create table with fields: id, user_id, plan_id, status, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, cancelled_at
  - Add indexes on user_id, status, current_period_end
  - Add foreign keys to users and subscription_plans
  - _Requirements: 3.1, 7.1_

- [x] 1.3 Create payments migration
  - Create table with fields: id, user_id, subscription_id, amount, currency, status, payment_method, provider, provider_payment_id, provider_data (JSON), paid_at, refunded_at
  - Add indexes on user_id, subscription_id, provider_payment_id, status
  - Add foreign keys
  - _Requirements: 3.5, 4.1_

- [x] 1.4 Create usage_tracking migration
  - Create table with fields: id, user_id, metric, count, period_start, period_end
  - Add unique index on (user_id, metric, period_start)
  - Add index on (user_id, period_start, period_end)
  - _Requirements: 2.4, 9.2_

- [x] 1.5 Create promo_codes migration
  - Create table with fields: id, code, type, value, plan_id, max_uses, used_count, valid_from, valid_until, is_active
  - Add unique index on code
  - Add indexes on is_active and plan_id
  - _Requirements: 8.1, 8.2_

- [x] 1.6 Create promo_code_usages migration
  - Create table with fields: id, promo_code_id, user_id, subscription_id, discount_amount, used_at
  - Add foreign keys
  - _Requirements: 8.4_

- [x] 1.7 Add current_plan_id to users table
  - Add column current_plan_id (nullable, foreign key to subscription_plans)
  - _Requirements: 1.1_

- [x] 1.8 Run all migrations
  - Execute: php artisan migrate
  - Verify all tables created successfully

- [ ] 2. Create Models
- [ ] 2.1 Create SubscriptionPlan model
  - Define fillable fields
  - Cast features to array, price to decimal
  - Add subscriptions() relationship
  - Add getLimit() and hasFeature() helper methods
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Create Subscription model
  - Define fillable fields
  - Cast datetime fields
  - Add user(), plan(), payments() relationships
  - Add isActive(), isOnTrial(), daysUntilExpiration() methods
  - _Requirements: 3.1, 7.1_

- [ ] 2.3 Create Payment model
  - Define fillable fields
  - Cast amount to decimal, provider_data to array
  - Add user(), subscription() relationships
  - Add isSuccessful(), isPending() methods
  - _Requirements: 3.5, 4.1_

- [ ] 2.4 Create UsageTracking model
  - Define fillable fields
  - Cast dates
  - Add user() relationship
  - Add scopeCurrentPeriod() query scope
  - _Requirements: 2.4, 9.2_

- [ ] 2.5 Create PromoCode model
  - Define fillable fields
  - Cast value to decimal, dates to datetime
  - Add plan(), usages() relationships
  - Add isValid(), calculateDiscount() methods
  - _Requirements: 8.1, 8.3_

- [ ] 2.6 Create PromoCodeUsage model
  - Define fillable fields
  - Add promoCode(), user(), subscription() relationships
  - _Requirements: 8.4_

- [ ] 2.7 Update User model
  - Add currentPlan() relationship
  - Add subscription() relationship
  - Add usageTracking() relationship
  - _Requirements: 1.1_

- [ ] 3. Checkpoint - Database and Models Complete
- Ensure all migrations run successfully, ask the user if questions arise.


- [ ] 4. Create Core Services
- [ ] 4.1 Create SubscriptionService
  - Implement createSubscription() method
  - Implement cancelSubscription() method
  - Implement resumeSubscription() method
  - Implement upgradePlan() method with prorated calculation
  - Implement downgradePlan() method (scheduled for period end)
  - Implement renewSubscription() method
  - Implement activateTrial() method
  - Implement isActive() and getCurrentPlan() methods
  - _Requirements: 3.1, 6.1, 6.2, 6.3, 7.1_

- [ ] 4.2 Create UsageLimitService
  - Implement checkLimit() method
  - Implement getCurrentUsage() method
  - Implement getLimit() method
  - Implement incrementUsage() method
  - Implement decrementUsage() method
  - Implement resetMonthlyUsage() method
  - Implement getUsagePercentage() method
  - Implement isWarningThreshold() method (80%)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.2, 9.3_

- [ ] 4.3 Create PromoCodeService
  - Implement validatePromoCode() method
  - Implement applyPromoCode() method
  - Implement calculateDiscount() method
  - Implement isAvailable() method
  - Implement createPromoCode() method (admin)
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 4.4 Create FeatureAccessService
  - Implement hasFeature() method
  - Implement getAvailableFeatures() method
  - Implement getLockedFeatures() method
  - Implement canShowPublicPageSection() method
  - Implement getFrontendConfig() method
  - _Requirements: 8.1, 9.4_

- [ ] 5. YooKassa Integration
- [ ] 5.1 Install YooKassa SDK
  - Run: composer require yoomoney/yookassa-sdk-php
  - _Requirements: 4.1_

- [ ] 5.2 Configure YooKassa in services.php
  - Add yookassa configuration with shop_id, secret_key, return_url
  - Update .env.example with YOOKASSA_* variables
  - _Requirements: 4.1_

- [ ] 5.3 Create PaymentService
  - Implement createPayment() method
  - Implement createRecurringPayment() method
  - Implement handleWebhook() method with signature verification
  - Implement checkPaymentStatus() method
  - Implement refundPayment() method
  - Implement savePaymentMethod() method for recurring
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

- [ ] 5.4 Create SendPaymentJob
  - Job to process payment asynchronously
  - Handle payment creation and status updates
  - Retry logic: 3 attempts with exponential backoff
  - _Requirements: 4.1_

- [ ] 5.5 Create ProcessSubscriptionRenewalJob
  - Job to process subscription renewal
  - Create recurring payment
  - Handle success/failure
  - _Requirements: 5.2, 5.3_

- [ ] 6. Checkpoint - Core Services Complete
- Ensure all services are implemented, ask the user if questions arise.

- [ ] 7. Create Controllers
- [ ] 7.1 Create SubscriptionPlanController
  - index() - list all active plans with features
  - show() - get single plan details
  - _Requirements: 1.2_

- [ ] 7.2 Create SubscriptionController
  - show() - get current user subscription
  - store() - create new subscription (with promo code)
  - cancel() - cancel subscription (disable auto-renewal)
  - resume() - resume cancelled subscription
  - upgrade() - upgrade to higher plan
  - downgrade() - schedule downgrade to lower plan
  - _Requirements: 3.1, 6.1, 6.2, 6.3_

- [ ] 7.3 Create PaymentController
  - create() - create payment and redirect to YooKassa
  - return() - handle return from YooKassa payment page
  - index() - list user's payment history
  - show() - get payment details
  - downloadInvoice() - download payment invoice PDF
  - _Requirements: 3.1, 4.2, 6.4_

- [ ] 7.4 Create YooKassaWebhookController
  - handle() - process YooKassa webhooks
  - Verify signature
  - Delegate to PaymentService
  - Return appropriate responses
  - _Requirements: 4.3, 4.4_

- [ ] 7.5 Create UsageController
  - index() - get current usage for all metrics
  - show() - get usage for specific metric
  - _Requirements: 9.1, 9.2_

- [ ] 7.6 Create PromoCodeController
  - validate() - validate promo code
  - apply() - apply promo code to checkout
  - _Requirements: 8.2, 8.3_

- [ ] 7.7 Create Admin/SubscriptionController (admin panel)
  - index() - list all subscriptions with filters
  - show() - view subscription details
  - update() - manually update subscription
  - cancel() - manually cancel subscription
  - extend() - manually extend subscription
  - _Requirements: 11.1, 11.2_

- [ ] 7.8 Create Admin/PromoCodeController (admin panel)
  - index() - list all promo codes
  - store() - create new promo code
  - update() - update promo code
  - destroy() - deactivate promo code
  - _Requirements: 11.3_

- [ ] 8. Create Middleware
- [ ] 8.1 Create CheckSubscriptionLimit middleware
  - Check if user has reached limit for specified metric
  - Return 403 with upgrade prompt if limit exceeded
  - Allow action if within limit
  - _Requirements: 2.2_

- [ ] 8.2 Apply middleware to protected routes
  - Apply to appointments routes: limit:appointments_per_month
  - Apply to clients routes: limit:clients_total
  - Apply to services routes: limit:services_total
  - Apply to portfolio routes: limit:portfolio_images
  - Apply to tags routes: limit:client_tags
  - _Requirements: 2.2_

- [ ] 9. Create Console Commands
- [ ] 9.1 Create CheckExpiringSubscriptionsCommand
  - Find subscriptions expiring in 3 days
  - Attempt recurring payment for each
  - Send reminder emails
  - _Requirements: 5.2, 5.6_

- [ ] 9.2 Create ResetMonthlyUsageCommand
  - Reset all monthly usage counters
  - Run on 1st of each month
  - Keep historical data
  - _Requirements: 2.5_

- [ ] 9.3 Create SendTrialRemindersCommand
  - Find trials expiring in 7, 3, 1 days
  - Send reminder emails
  - _Requirements: 7.2_

- [ ] 9.4 Create CancelExpiredSubscriptionsCommand
  - Find expired subscriptions
  - Update status to 'expired'
  - Downgrade to free plan
  - Send notification
  - _Requirements: 6.5_

- [ ] 9.5 Register scheduled tasks in routes/console.php
  - CheckExpiringSubscriptionsCommand: daily
  - ResetMonthlyUsageCommand: monthly on 1st at 00:00
  - SendTrialRemindersCommand: daily
  - CancelExpiredSubscriptionsCommand: daily
  - _Requirements: 5.2, 7.2_

- [ ] 10. Checkpoint - Backend Complete
- Ensure all backend components work, ask the user if questions arise.


- [ ] 11. Create Seeders
- [ ] 11.1 Create SubscriptionPlanSeeder
  - Seed "Базовая" plan (free, 0 RUB)
  - Seed "Профессиональная" plan (299 RUB/month)
  - Seed "Максимальная" plan (700 RUB/month) - used for trial
  - Include all features and limits in JSON
  - _Requirements: 1.1, 7.1_

- [ ] 11.2 Run seeders
  - Execute: php artisan db:seed --class=SubscriptionPlanSeeder
  - Verify plans created correctly

- [ ] 12. Add Routes
- [ ] 12.1 Add public routes
  - GET /billing/plans - list plans
  - GET /billing/plans/{plan} - show plan
  - POST /webhooks/yookassa - YooKassa webhook (no auth)
  - _Requirements: 1.2, 4.3_

- [ ] 12.2 Add authenticated routes
  - GET /billing/subscription - current subscription
  - POST /billing/subscribe - create subscription
  - POST /billing/cancel - cancel subscription
  - POST /billing/resume - resume subscription
  - POST /billing/upgrade - upgrade plan
  - POST /billing/downgrade - downgrade plan
  - GET /billing/payments - payment history
  - GET /billing/payments/{payment} - payment details
  - GET /billing/payments/{payment}/invoice - download invoice
  - POST /billing/payment/create - create payment
  - GET /billing/payment/return - return from YooKassa
  - GET /billing/usage - current usage
  - POST /billing/promo/validate - validate promo code
  - _Requirements: 3.1, 6.1, 6.4, 9.1_

- [ ] 12.3 Add admin routes
  - GET /admin/subscriptions - list all subscriptions
  - GET /admin/subscriptions/{subscription} - subscription details
  - PUT /admin/subscriptions/{subscription} - update subscription
  - POST /admin/subscriptions/{subscription}/cancel - cancel subscription
  - POST /admin/subscriptions/{subscription}/extend - extend subscription
  - GET /admin/promo-codes - list promo codes
  - POST /admin/promo-codes - create promo code
  - PUT /admin/promo-codes/{code} - update promo code
  - DELETE /admin/promo-codes/{code} - deactivate promo code
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 13. Create Frontend Components
- [ ] 13.1 Create Plans page (resources/js/Pages/Billing/Plans.tsx)
  - Display 3 plan cards side by side
  - Highlight current plan
  - Show all features and limits
  - "Choose Plan" button for each
  - **Use shadcn/ui:** Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge
  - _Requirements: 1.2_

- [ ] 13.2 Create PlanCard component (resources/js/Components/Billing/PlanCard.tsx)
  - Display plan name, price, billing period
  - List all features with checkmarks
  - Show limits
  - Highlight if current plan
  - "Choose" or "Current Plan" button
  - **Use shadcn/ui:** Card, Badge, Button, Check icon from lucide-react
  - _Requirements: 1.2_

- [ ] 13.3 Create FeatureComparison component (resources/js/Components/Billing/FeatureComparison.tsx)
  - Table comparing all 3 plans
  - Rows for each feature/limit
  - Columns for each plan
  - **Use shadcn/ui:** Table, TableHeader, TableBody, TableRow, TableCell
  - _Requirements: 1.2_

- [ ] 13.4 Create Checkout page (resources/js/Pages/Billing/Checkout.tsx)
  - Display selected plan summary
  - Promo code input field
  - Show discount if promo applied
  - Final amount display
  - "Pay" button redirects to YooKassa
  - **Use shadcn/ui:** Card, Input, Button, Alert
  - _Requirements: 3.1, 8.2_

- [ ] 13.5 Create PromoCodeInput component (resources/js/Components/Billing/PromoCodeInput.tsx)
  - Input field for promo code
  - "Apply" button
  - Show validation errors
  - Show discount amount when valid
  - **Use shadcn/ui:** Input, Button, Alert
  - _Requirements: 8.2, 8.3_

- [ ] 13.6 Create Subscription page (resources/js/Pages/Billing/Subscription.tsx)
  - Display current plan details
  - Show subscription status and dates
  - Payment method info
  - "Cancel", "Resume", "Upgrade", "Downgrade" buttons
  - Payment history table
  - Usage widget
  - **Use shadcn/ui:** Card, Button, Table, Badge, Progress
  - _Requirements: 6.1, 6.4, 9.1_

- [ ] 13.7 Create UsageWidget component (resources/js/Components/Billing/UsageWidget.tsx)
  - Display usage for all metrics
  - Progress bars showing usage vs limits
  - Warning badges at 80%+
  - Color coding (green < 80%, yellow 80-99%, red 100%)
  - **Use shadcn/ui:** Card, Progress, Badge
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 13.8 Create PaymentHistory component (resources/js/Components/Billing/PaymentHistory.tsx)
  - Table of past payments
  - Columns: date, amount, status, invoice
  - Download invoice button
  - Pagination
  - **Use shadcn/ui:** Table, Button, Badge
  - _Requirements: 6.4_

- [ ] 13.9 Create LimitWarning component (resources/js/Components/Billing/LimitWarning.tsx)
  - Alert shown when limit reached
  - Display metric name and current usage
  - "Upgrade Plan" button
  - **Use shadcn/ui:** Alert, AlertTitle, AlertDescription, Button
  - _Requirements: 2.2_

- [ ] 13.10 Create UpgradeModal component (resources/js/Components/Billing/UpgradeModal.tsx)
  - Modal showing upgrade options
  - Display current plan vs available upgrades
  - "Upgrade Now" button
  - **Use shadcn/ui:** Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Card
  - _Requirements: 2.2, 6.2_

- [ ] 13.11 Create TrialBanner component (resources/js/Components/Billing/TrialBanner.tsx)
  - Banner in app header during trial
  - Show days remaining
  - "Subscribe Now" button
  - Countdown timer
  - **Use shadcn/ui:** Alert, AlertTitle, AlertDescription, Button
  - _Requirements: 7.2_

- [ ] 13.12 Create TrialExpirationModal component (resources/js/Components/Billing/TrialExpirationModal.tsx)
  - Modal shown when trial expires
  - Display message about trial expiration
  - Two options: "Купить подписку" and "Остаться на бесплатной версии"
  - Show plan comparison
  - **Use shadcn/ui:** Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Card
  - _Requirements: 7.3_

- [ ] 13.13 Create FeatureGuard component (resources/js/Components/Billing/FeatureGuard.tsx)
  - Wrapper component for conditional feature rendering
  - Check if user has access to feature
  - Show children if accessible, fallback if not
  - Support showUpgradeModal prop
  - **Use shadcn/ui:** Dialog (for upgrade modal)
  - _Requirements: 8.1, 8.3_

- [ ] 13.14 Create LockedFeature component (resources/js/Components/Billing/LockedFeature.tsx)
  - Display locked feature with visual styling
  - Apply opacity 0.5, grayscale filter
  - Show lock icon overlay
  - Display tooltip on hover
  - Click opens upgrade modal
  - **Use shadcn/ui:** Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, Dialog
  - **Use lucide-react:** Lock icon
  - _Requirements: 8.2, 8.4, 8.5_

- [ ] 13.15 Create DisabledButton component (resources/js/Components/Billing/DisabledButton.tsx)
  - Button component with feature access check
  - Show lock icon if feature not available
  - Disabled state with visual feedback
  - Click opens upgrade modal if locked
  - **Use shadcn/ui:** Button, Dialog
  - **Use lucide-react:** Lock icon
  - _Requirements: 8.1, 8.3_

- [ ] 13.16 Create useFeatureAccess hook (resources/js/Hooks/useFeatureAccess.ts)
  - React hook for checking feature access
  - hasFeature(feature) method
  - hasLimit(metric) method
  - showUpgradeModal() method
  - Return current plan info
  - _Requirements: 8.1_

- [ ] 13.17 Update Dashboard to include TrialBanner
  - Show TrialBanner when user is on trial
  - Hide after trial ends or subscription purchased
  - _Requirements: 7.2_

- [ ] 13.18 Update PublicProfile page with conditional sections
  - Check feature availability before rendering sections
  - Hide portfolio if not available
  - Hide testimonials if not available
  - Hide gallery if not available
  - Use basic template if custom templates not available
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 14. Checkpoint - Frontend Complete
- Ensure all UI components render correctly, ask the user if questions arise.

- [ ] 15. Create Admin Panel Components
- [ ] 15.1 Create Admin Subscriptions page (resources/js/Pages/Admin/Subscriptions/Index.tsx)
  - List all subscriptions
  - Filters: status, plan, date range
  - Search by user email
  - Pagination
  - Actions: view, edit, cancel, extend
  - **Use shadcn/ui:** Table, Input, Select, Button, Badge
  - _Requirements: 11.1_

- [ ] 15.2 Create Admin Subscription Details page (resources/js/Pages/Admin/Subscriptions/Show.tsx)
  - Display full subscription details
  - User information
  - Payment history
  - Usage statistics
  - Manual actions: cancel, extend, refund
  - **Use shadcn/ui:** Card, Button, Table, Badge, Alert
  - _Requirements: 11.2_

- [ ] 15.3 Create Admin Promo Codes page (resources/js/Pages/Admin/PromoCodes/Index.tsx)
  - List all promo codes
  - Filters: active, type, plan
  - Create new promo code button
  - Actions: edit, deactivate
  - Show usage statistics
  - **Use shadcn/ui:** Table, Button, Badge, Select
  - _Requirements: 11.3_

- [ ] 15.4 Create Admin Promo Code Form (resources/js/Pages/Admin/PromoCodes/Form.tsx)
  - Form to create/edit promo code
  - Fields: code, type, value, plan, max_uses, valid_from, valid_until
  - Validation
  - **Use shadcn/ui:** Form, Input, Select, Button, Card, Label
  - _Requirements: 11.3_

- [ ] 15.5 Create Admin Analytics Dashboard (resources/js/Pages/Admin/Analytics/Billing.tsx)
  - Display MRR, ARR, ARPU
  - Conversion rates (trial → paid, free → paid)
  - Churn rate
  - Charts and graphs
  - **Use shadcn/ui:** Card, CardHeader, CardTitle, CardContent
  - _Requirements: 11.4_

- [ ] 16. Integration with Existing Features
- [ ] 16.1 Update AppointmentController
  - Add CheckSubscriptionLimit middleware
  - Increment usage on create
  - Decrement usage on delete
  - _Requirements: 2.2, 2.3_

- [ ] 16.2 Update ClientController
  - Add CheckSubscriptionLimit middleware
  - Increment usage on create
  - Decrement usage on delete
  - _Requirements: 2.2, 2.3_

- [ ] 16.3 Update ServiceController
  - Add CheckSubscriptionLimit middleware
  - Increment usage on create
  - Decrement usage on delete
  - _Requirements: 2.2, 2.3_

- [ ] 16.4 Update ClientTagController
  - Add CheckSubscriptionLimit middleware
  - Increment usage on create
  - Decrement usage on delete
  - _Requirements: 2.2, 2.3_

- [ ] 16.5 Update RegisterController
  - Activate trial on new user registration
  - Call SubscriptionService::activateTrial()
  - Activate "Максимальная" plan for 14 days
  - _Requirements: 7.1_

- [ ] 16.6 Update NotificationService
  - Check VK/Email notification limits before sending
  - Increment notification usage counters
  - _Requirements: 2.1_

- [ ] 16.7 Integrate FeatureGuard in all app pages
  - Wrap Analytics page with FeatureGuard (feature: analytics)
  - Wrap Export buttons with DisabledButton (feature: export_data)
  - Wrap Custom Templates with FeatureGuard (feature: custom_templates)
  - Add feature checks to all relevant UI elements
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 16.8 Update all controllers to pass feature config
  - Add FeatureAccessService to get frontend config
  - Pass available features to Inertia pages
  - Include in shared props for all authenticated pages
  - _Requirements: 8.1_

- [ ] 17. Email Notifications
- [ ] 17.1 Create SubscriptionActivatedMail
  - Email sent when subscription is activated
  - Include plan details and invoice
  - _Requirements: 3.4, 10.1_

- [ ] 17.2 Create PaymentFailedMail
  - Email sent when payment fails
  - Include payment link to retry
  - _Requirements: 10.2_

- [ ] 17.3 Create SubscriptionExpiringMail
  - Email sent 7 days before expiration
  - Remind to update payment method
  - _Requirements: 5.6, 10.3_

- [ ] 17.4 Create SubscriptionCancelledMail
  - Email sent when subscription is cancelled
  - Confirm cancellation and access until period end
  - _Requirements: 10.4_

- [ ] 17.5 Create UsageLimitReachedMail
  - Email sent when user reaches 100% of limit
  - Include upgrade link
  - _Requirements: 10.5_

- [ ] 17.6 Create TrialReminderMail
  - Email sent at 7, 3, 1 days before trial ends
  - Encourage subscription
  - _Requirements: 7.2_

- [ ] 17.7 Create TrialExpiredMail
  - Email sent when trial expires
  - Offer choice: purchase subscription or continue with free plan
  - Include plan comparison and pricing
  - _Requirements: 7.3, 12.6_

- [ ] 18. Testing
- [ ] 18.1 Write unit tests for SubscriptionService
  - Test createSubscription()
  - Test upgradePlan() with proration
  - Test downgradePlan() scheduling
  - Test activateTrial()
  - Test renewSubscription()

- [ ] 18.2 Write unit tests for UsageLimitService
  - Test checkLimit()
  - Test incrementUsage()
  - Test getUsagePercentage()
  - Test isWarningThreshold()

- [ ] 18.3 Write unit tests for PaymentService
  - Test createPayment()
  - Test webhook signature verification
  - Test refundPayment()

- [ ] 18.4 Write unit tests for PromoCodeService
  - Test validatePromoCode()
  - Test calculateDiscount()
  - Test isAvailable()

- [ ] 18.5 Write feature tests for subscription flow
  - Test full subscription purchase flow
  - Test plan upgrade flow
  - Test plan downgrade flow
  - Test subscription cancellation flow

- [ ] 18.6 Write feature tests for payment flow
  - Mock YooKassa API
  - Test payment creation
  - Test webhook handling
  - Test recurring payment

- [ ] 18.7 Write feature tests for usage limits
  - Test limit enforcement
  - Test usage tracking
  - Test monthly reset

- [ ] 18.8 Write feature tests for feature access
  - Test FeatureGuard component rendering
  - Test LockedFeature visual styling
  - Test DisabledButton behavior
  - Test public page section visibility
  - _Requirements: 8.1, 8.2, 9.1_

- [ ] 18.9 Write feature tests for trial expiration
  - Test trial activation on registration
  - Test trial expiration notification
  - Test downgrade to free plan after trial
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 19. Final Checkpoint - Complete System
- Run all tests, verify all features work end-to-end, ask the user if questions arise.

- [ ] 20. Documentation
- [ ] 20.1 Create TASK_3_SETUP.md
  - YooKassa account setup instructions
  - Environment variables configuration
  - Webhook URL setup
  - Testing with YooKassa sandbox

- [ ] 20.2 Create TASK_3_SUMMARY.md
  - Overview of implemented features
  - Architecture summary
  - Key files and their purposes
  - Usage examples

- [ ] 20.3 Update .task_progress.md
  - Mark Task 3 as complete
  - Update overall progress percentage

## Notes

- **КРИТИЧНО:** Все UI компоненты должны использовать shadcn/ui библиотеку
- All backend tasks should be completed before starting frontend
- Use shadcn/ui components for all UI elements: Button, Card, Dialog, Tooltip, Alert, Badge, Progress, Table, Input, Select, Form
- Import shadcn/ui components from '@/Components/ui/*'
- Use lucide-react for иконок (Lock, CreditCard, Calendar, User, etc.)
- Test payment flow with YooKassa sandbox before production
- Ensure all scheduled tasks are registered in routes/console.php
- Monitor payment webhooks closely in production
- Set up proper logging for all payment events
- Consider rate limiting on payment endpoints
- Implement proper error handling for all payment failures
- Cache plan data to reduce database queries
- Use queues for all email notifications
- Implement proper transaction handling for payment processing
- Add database indexes for performance optimization
- Consider implementing webhook retry mechanism
- Set up monitoring for failed recurring payments
- Implement proper audit logging for admin actions

**ВАЖНО - shadcn/ui компоненты:**
- Button: '@/Components/ui/button'
- Card: '@/Components/ui/card'
- Dialog: '@/Components/ui/dialog'
- Tooltip: '@/Components/ui/tooltip'
- Alert: '@/Components/ui/alert'
- Badge: '@/Components/ui/badge'
- Progress: '@/Components/ui/progress'
- Table: '@/Components/ui/table'
- Input: '@/Components/ui/input'
- Select: '@/Components/ui/select'
- Form: '@/Components/ui/form'

**ВАЖНО - Триал период:**
- Новые пользователи получают триал "Максимальная" (не "Профессиональная")
- Триал активируется автоматически при регистрации
- После окончания триала - уведомление с выбором (купить или бесплатная версия)
- При окончании триала весь функционал отключается

**ВАЖНО - Визуальное отключение функционала:**
- Недоступные функции должны быть затемнены (opacity: 0.5, grayscale)
- Показывать иконку замка на заблокированных функциях
- При клике на заблокированную функцию - модалка с предложением апгрейда
- Tooltip при наведении объясняет, что нужна подписка
- На публичной странице недоступные секции полностью скрываются (не затемняются)

**ВАЖНО - Интеграция с существующим кодом:**
- Обернуть все страницы с платными функциями в FeatureGuard
- Добавить проверки доступа во все контроллеры
- Передавать конфигурацию доступных функций в Inertia props
- Использовать useFeatureAccess hook во всех компонентах

## Estimated Timeline

- Database & Models: 1 day
- Core Services: 2-3 days (добавлен FeatureAccessService)
- YooKassa Integration: 2 days
- Controllers & Routes: 2 days
- Middleware & Commands: 1 day
- Frontend Components: 4-5 days (добавлены компоненты визуального отключения)
- Admin Panel: 2 days
- Integration & Testing: 3 days (добавлены тесты для новых функций)
- Documentation: 1 day

**Total: ~18-20 days (4 weeks)**

## Priority Order

1. **Phase 1 (Critical):** Database, Models, Core Services, Trial activation
2. **Phase 2 (High):** Feature Access Service, Frontend Guards, Visual Disabling
3. **Phase 3 (Medium):** YooKassa Integration, Payment Flow
4. **Phase 4 (Low):** Admin Panel, Analytics, Advanced Features
