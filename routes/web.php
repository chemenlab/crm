<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Public\BookingController;
use App\Http\Controllers\Public\TempUploadController;

Route::get('/', [\App\Http\Controllers\Marketing\WelcomeController::class, 'index']);

// Public Booking Routes
Route::prefix('m/{slug}')->middleware('throttle:60,1')->group(function () {
    Route::get('/', [BookingController::class, 'show'])->name('public.booking.show');
    Route::post('/book', [BookingController::class, 'store'])->middleware('throttle:10,1')->name('public.booking.store');
    Route::get('/slots', [BookingController::class, 'slots'])->name('public.booking.slots');
    Route::post('/upload-temp', [TempUploadController::class, 'store'])->middleware('throttle:20,1')->name('public.booking.upload-temp');
    Route::delete('/delete-temp', [TempUploadController::class, 'destroy'])->name('public.booking.delete-temp');
});

Route::get('/pricing', function () {
    return Inertia::render('Marketing/Pricing');
});

// Public News Routes
Route::get('/news', [\App\Http\Controllers\Public\NewsController::class, 'index'])->name('news.index');
Route::get('/news/{slug}', [\App\Http\Controllers\Public\NewsController::class, 'show'])->name('news.show');

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:5,1');

    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:10,1');

    // Password Reset routes
    Route::get('/forgot-password', [ForgotPasswordController::class, 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [ForgotPasswordController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [ForgotPasswordController::class, 'reset'])->name('password.update');
});

// Email Verification (for authenticated users)
Route::middleware('auth')->group(function () {
    Route::get('/verify-email', [\App\Http\Controllers\Auth\EmailVerificationController::class, 'show'])->name('verification.notice');
    Route::post('/verify-email', [\App\Http\Controllers\Auth\EmailVerificationController::class, 'verify'])->name('verification.verify');
    Route::post('/verify-email/resend', [\App\Http\Controllers\Auth\EmailVerificationController::class, 'resend'])->name('verification.resend');
});

// Two-Factor Authentication Challenge (guest only)
Route::middleware('guest')->group(function () {
    Route::get('/two-factor-challenge', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'show'])
        ->name('two-factor.challenge');
    Route::post('/two-factor-challenge', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'verify'])
        ->name('two-factor.verify');
    Route::post('/two-factor-challenge/recovery', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'useRecoveryCode'])
        ->name('two-factor.recovery');
});

// Two-Factor Authentication Setup (authenticated users)
Route::middleware(['auth', 'verified'])->prefix('two-factor')->group(function () {
    Route::get('/setup', [\App\Http\Controllers\Auth\TwoFactorController::class, 'show'])
        ->name('two-factor.setup');
    Route::post('/enable', [\App\Http\Controllers\Auth\TwoFactorController::class, 'enable'])
        ->name('two-factor.enable');
    Route::post('/confirm', [\App\Http\Controllers\Auth\TwoFactorController::class, 'confirm'])
        ->name('two-factor.confirm');
    Route::delete('/disable', [\App\Http\Controllers\Auth\TwoFactorController::class, 'disable'])
        ->name('two-factor.disable');
    Route::post('/recovery-codes', [\App\Http\Controllers\Auth\TwoFactorController::class, 'regenerateRecoveryCodes'])
        ->name('two-factor.recovery-codes');
});

// OAuth routes
Route::prefix('auth/{provider}')->group(function () {
    Route::get('/redirect', [\App\Http\Controllers\Auth\OAuthController::class, 'redirect'])
        ->name('oauth.redirect');
    Route::get('/callback', [\App\Http\Controllers\Auth\OAuthController::class, 'callback'])
        ->name('oauth.callback');

    // Protected routes for linking/unlinking
    Route::middleware('auth')->group(function () {
        Route::get('/link', [\App\Http\Controllers\Auth\OAuthController::class, 'link'])
            ->name('oauth.link');
        Route::delete('/unlink', [\App\Http\Controllers\Auth\OAuthController::class, 'unlink'])
            ->name('oauth.unlink');
    });
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// App routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\App\DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/dashboard/day-appointments', [\App\Http\Controllers\App\DashboardController::class, 'getAppointmentsByDate'])
        ->name('dashboard.day-appointments');

    // Services routes
    Route::get('/services', [\App\Http\Controllers\App\ServiceController::class, 'index'])
        ->name('services.index');
    Route::post('/services', [\App\Http\Controllers\App\ServiceController::class, 'store'])
        ->middleware('usage.limit:services')
        ->name('services.store');
    Route::patch('/services/{service}', [\App\Http\Controllers\App\ServiceController::class, 'update'])
        ->name('services.update');
    Route::delete('/services/{service}', [\App\Http\Controllers\App\ServiceController::class, 'destroy'])
        ->name('services.destroy');

    // Clients routes
    Route::get('/clients', [\App\Http\Controllers\App\ClientController::class, 'index'])
        ->name('clients.index');
    Route::get('/clients/{client}', [\App\Http\Controllers\App\ClientController::class, 'show'])
        ->name('clients.show');
    Route::post('/clients', [\App\Http\Controllers\App\ClientController::class, 'store'])
        ->middleware('usage.limit:clients')
        ->name('clients.store');
    Route::patch('/clients/{client}', [\App\Http\Controllers\App\ClientController::class, 'update'])
        ->name('clients.update');
    Route::delete('/clients/{client}', [\App\Http\Controllers\App\ClientController::class, 'destroy'])
        ->name('clients.destroy');

    // Check phone uniqueness
    Route::post('/clients/check-phone', [\App\Http\Controllers\App\ClientController::class, 'checkPhone'])
        ->name('clients.checkPhone');

    // Client Tags
    Route::resource('client-tags', \App\Http\Controllers\App\ClientTagController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::post('/client-tags/{tag}/attach', [\App\Http\Controllers\App\ClientTagController::class, 'attachToClient'])
        ->name('client-tags.attach');
    Route::post('/client-tags/{tag}/detach', [\App\Http\Controllers\App\ClientTagController::class, 'detachFromClient'])
        ->name('client-tags.detach');

    Route::get('/calendar/events', [\App\Http\Controllers\App\AppointmentController::class, 'events'])
        ->name('calendar.events');

    Route::post('/calendar/upload-field-image', [\App\Http\Controllers\App\AppointmentController::class, 'uploadFieldImage'])
        ->name('calendar.uploadFieldImage');

    // Calendar resource routes
    Route::get('/calendar', [\App\Http\Controllers\App\AppointmentController::class, 'index'])
        ->name('calendar.index');
    Route::get('/calendar/create', [\App\Http\Controllers\App\AppointmentController::class, 'create'])
        ->name('calendar.create');
    Route::post('/calendar', [\App\Http\Controllers\App\AppointmentController::class, 'store'])
        ->middleware('usage.limit:appointments')
        ->name('calendar.store');
    Route::get('/calendar/{appointment}/edit', [\App\Http\Controllers\App\AppointmentController::class, 'edit'])
        ->name('calendar.edit');
    Route::patch('/calendar/{appointment}', [\App\Http\Controllers\App\AppointmentController::class, 'update'])
        ->name('calendar.update');
    Route::delete('/calendar/{appointment}', [\App\Http\Controllers\App\AppointmentController::class, 'destroy'])
        ->name('calendar.destroy');

    Route::patch('/calendar/{appointment}/status', [\App\Http\Controllers\App\AppointmentController::class, 'updateStatus'])
        ->name('calendar.updateStatus');

    Route::patch('/calendar/{appointment}/notes', [\App\Http\Controllers\App\AppointmentController::class, 'updateNotes'])
        ->name('calendar.updateNotes');

    // Onboarding routes
    Route::get('/onboarding', [\App\Http\Controllers\App\OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('/onboarding/check-slug', [\App\Http\Controllers\App\OnboardingController::class, 'checkSlug'])->name('onboarding.checkSlug');
    Route::post('/onboarding/complete', [\App\Http\Controllers\App\OnboardingController::class, 'complete'])->name('onboarding.complete');

    // Interactive Tour routes
    Route::get('/onboarding/progress', [\App\Http\Controllers\App\OnboardingController::class, 'getProgress'])->name('onboarding.progress');
    Route::post('/onboarding/step/{step}', [\App\Http\Controllers\App\OnboardingController::class, 'completeStep'])->name('onboarding.step');
    Route::post('/onboarding/tour/complete', [\App\Http\Controllers\App\OnboardingController::class, 'completeTour'])->name('onboarding.tour.complete');
    Route::post('/onboarding/tour/reset', [\App\Http\Controllers\App\OnboardingController::class, 'resetProgress'])->name('onboarding.tour.reset');

    Route::patch('/finance/goal', [\App\Http\Controllers\App\TransactionController::class, 'updateGoal'])->name('finance.goal.update');
    Route::resource('finance', \App\Http\Controllers\App\TransactionController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::get('/settings', [\App\Http\Controllers\App\SettingsController::class, 'index'])->name('settings.index');

    // Profile routes
    Route::put('/settings/profile', [\App\Http\Controllers\App\Settings\ProfileController::class, 'update'])->name('settings.profile.update');
    Route::post('/settings/profile/avatar', [\App\Http\Controllers\App\Settings\ProfileController::class, 'uploadAvatar'])->name('settings.profile.avatar');
    Route::put('/settings/profile/password', [\App\Http\Controllers\App\Settings\ProfileController::class, 'updatePassword'])->name('settings.profile.password');
    Route::put('/settings/profile/schedule', [\App\Http\Controllers\App\Settings\ProfileController::class, 'updateSchedule'])->name('settings.profile.schedule');

    // Telegram routes
    Route::post('/settings/profile/telegram/generate-link', [\App\Http\Controllers\App\Settings\ProfileController::class, 'generateTelegramLink'])->name('settings.profile.telegram.generate-link');
    Route::delete('/settings/profile/telegram/unlink', [\App\Http\Controllers\App\Settings\ProfileController::class, 'unlinkTelegram'])->name('settings.profile.telegram.unlink');
    Route::get('/settings/telegram/settings', [\App\Http\Controllers\App\Settings\ProfileController::class, 'getTelegramSettings'])->name('settings.telegram.get');
    Route::post('/settings/telegram/settings', [\App\Http\Controllers\App\Settings\ProfileController::class, 'updateTelegramSettings'])->name('settings.telegram.update');

    // Notification routes
    Route::put('/settings/notifications', [\App\Http\Controllers\App\Settings\NotificationSettingsController::class, 'update'])->name('settings.notifications.update');

    // Booking settings routes
    Route::get('/settings/booking', [\App\Http\Controllers\App\Settings\BookingSettingsController::class, 'show'])->name('settings.booking.show');
    Route::put('/settings/booking', [\App\Http\Controllers\App\Settings\BookingSettingsController::class, 'update'])->name('settings.booking.update');

    // Public page settings
    Route::put('/settings/public-page', [\App\Http\Controllers\App\SettingsController::class, 'updatePublicPage'])->name('settings.public-page.update');

    Route::resource('settings/custom-fields', \App\Http\Controllers\App\Settings\CustomFieldsController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Notification Templates
    Route::prefix('notifications')->group(function () {
        Route::get('/templates', [\App\Http\Controllers\App\NotificationTemplateController::class, 'index'])
            ->name('notifications.templates.index');
        Route::get('/templates/create', [\App\Http\Controllers\App\NotificationTemplateController::class, 'create'])
            ->name('notifications.templates.create');
        Route::post('/templates', [\App\Http\Controllers\App\NotificationTemplateController::class, 'store'])
            ->name('notifications.templates.store');
        Route::get('/templates/{template}/edit', [\App\Http\Controllers\App\NotificationTemplateController::class, 'edit'])
            ->name('notifications.templates.edit');
        Route::put('/templates/{template}', [\App\Http\Controllers\App\NotificationTemplateController::class, 'update'])
            ->name('notifications.templates.update');
        Route::delete('/templates/{template}', [\App\Http\Controllers\App\NotificationTemplateController::class, 'destroy'])
            ->name('notifications.templates.destroy');

        // Notification Log
        Route::get('/log', [\App\Http\Controllers\App\NotificationLogController::class, 'index'])
            ->name('notifications.log.index');
        Route::get('/log/{notification}', [\App\Http\Controllers\App\NotificationLogController::class, 'show'])
            ->name('notifications.log.show');
    });

    // VK Integration
    Route::prefix('integrations')->group(function () {
        Route::get('/vk', [\App\Http\Controllers\App\VKIntegrationController::class, 'show'])
            ->name('integrations.vk');
        Route::post('/vk', [\App\Http\Controllers\App\VKIntegrationController::class, 'store'])
            ->name('integrations.vk.store');
        Route::delete('/vk', [\App\Http\Controllers\App\VKIntegrationController::class, 'destroy'])
            ->name('integrations.vk.destroy');

        // Telegram Integration
        Route::get('/telegram', [\App\Http\Controllers\App\TelegramIntegrationController::class, 'show'])
            ->name('integrations.telegram');
        Route::post('/telegram/generate-code', [\App\Http\Controllers\App\TelegramIntegrationController::class, 'generateCode'])
            ->name('integrations.telegram.generate-code');
        Route::delete('/telegram', [\App\Http\Controllers\App\TelegramIntegrationController::class, 'destroy'])
            ->name('integrations.telegram.destroy');
    });
});

// Webhook routes (no auth, rate limited)
Route::middleware('throttle:120,1')->group(function () {
    Route::post('/webhooks/vk', [\App\Http\Controllers\Webhooks\VKWebhookController::class, 'handle'])
        ->name('webhooks.vk');
    Route::post('/webhooks/telegram', [\App\Http\Controllers\Webhooks\TelegramWebhookController::class, 'handle'])
        ->name('webhooks.telegram');
    Route::post('/webhooks/yookassa', [\App\Http\Controllers\Webhooks\YooKassaWebhookController::class, 'handle'])
        ->name('webhooks.yookassa');
    Route::post('/webhooks/modules/yookassa', [\App\Http\Controllers\Webhooks\ModulePurchaseWebhookController::class, 'handle'])
        ->name('webhooks.modules.yookassa');
});

// Subscription routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app/subscriptions')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\SubscriptionController::class, 'index'])
        ->name('subscriptions.index');
    Route::get('/checkout/{plan}', [\App\Http\Controllers\App\SubscriptionController::class, 'checkout'])
        ->name('subscriptions.checkout');
    Route::post('/subscribe/{plan}', [\App\Http\Controllers\App\SubscriptionController::class, 'store'])
        ->name('subscriptions.store');
    Route::get('/success', [\App\Http\Controllers\App\SubscriptionController::class, 'success'])
        ->name('subscriptions.success');
    Route::post('/upgrade/{plan}', [\App\Http\Controllers\App\SubscriptionController::class, 'upgrade'])
        ->name('subscriptions.upgrade');
    Route::post('/downgrade/{plan}', [\App\Http\Controllers\App\SubscriptionController::class, 'downgrade'])
        ->name('subscriptions.downgrade');
    Route::post('/cancel', [\App\Http\Controllers\App\SubscriptionController::class, 'cancel'])
        ->name('subscriptions.cancel');
    Route::post('/resume', [\App\Http\Controllers\App\SubscriptionController::class, 'resume'])
        ->name('subscriptions.resume');
    Route::post('/validate-promo', [\App\Http\Controllers\App\SubscriptionController::class, 'validatePromoCode'])
        ->name('subscriptions.validate-promo');
    Route::get('/usage', [\App\Http\Controllers\App\SubscriptionController::class, 'usage'])
        ->name('subscriptions.usage');
});

// Feature Access API routes (protected)
Route::middleware(['auth', 'verified'])->prefix('api/feature-access')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\FeatureAccessController::class, 'index'])
        ->name('api.feature-access.index');
    Route::get('/features/{feature}', [\App\Http\Controllers\Api\FeatureAccessController::class, 'checkFeature'])
        ->name('api.feature-access.check-feature');
    Route::get('/resources/{resource}', [\App\Http\Controllers\Api\FeatureAccessController::class, 'checkResource'])
        ->name('api.feature-access.check-resource');
    Route::get('/upgrade-suggestion/{feature}', [\App\Http\Controllers\Api\FeatureAccessController::class, 'upgradeSuggestion'])
        ->name('api.feature-access.upgrade-suggestion');
});

// Payment routes (protected)
Route::middleware(['auth', 'verified'])->prefix('payments')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\PaymentController::class, 'index'])
        ->name('payments.index');
    Route::get('/{payment}', [\App\Http\Controllers\App\PaymentController::class, 'show'])
        ->name('payments.show');
    Route::get('/{payment}/receipt', [\App\Http\Controllers\App\PaymentController::class, 'receipt'])
        ->name('payments.receipt');
});

// Portfolio routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app/portfolio')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\PortfolioController::class, 'index'])
        ->name('portfolio.index');
    Route::post('/', [\App\Http\Controllers\App\PortfolioController::class, 'store'])
        ->name('portfolio.store');
    Route::put('/{portfolioItem}', [\App\Http\Controllers\App\PortfolioController::class, 'update'])
        ->name('portfolio.update');
    Route::delete('/{portfolioItem}', [\App\Http\Controllers\App\PortfolioController::class, 'destroy'])
        ->name('portfolio.destroy');
    Route::post('/reorder', [\App\Http\Controllers\App\PortfolioController::class, 'reorder'])
        ->name('portfolio.reorder');
});

// Support Ticket routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app/support')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\SupportTicketController::class, 'index'])
        ->name('app.support.index');
    Route::get('/create', [\App\Http\Controllers\App\SupportTicketController::class, 'create'])
        ->name('app.support.create');
    Route::post('/', [\App\Http\Controllers\App\SupportTicketController::class, 'store'])
        ->name('app.support.store');
    Route::get('/{ticket}', [\App\Http\Controllers\App\SupportTicketController::class, 'show'])
        ->name('app.support.show');
    Route::post('/{ticket}/messages', [\App\Http\Controllers\App\SupportTicketMessageController::class, 'store'])
        ->name('app.support.messages.store');
    Route::post('/{ticket}/close', [\App\Http\Controllers\App\SupportTicketController::class, 'close'])
        ->name('app.support.close');
    Route::post('/{ticket}/reopen', [\App\Http\Controllers\App\SupportTicketController::class, 'reopen'])
        ->name('app.support.reopen');
    Route::post('/{ticket}/rate', [\App\Http\Controllers\App\SupportTicketController::class, 'rate'])
        ->name('app.support.rate');
});

// Knowledge Base routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app/knowledge-base')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\KnowledgeBaseController::class, 'index'])
        ->name('knowledge-base.index');
    Route::get('/search', [\App\Http\Controllers\App\KnowledgeBaseController::class, 'search'])
        ->name('knowledge-base.search');
    Route::get('/category/{slug}', [\App\Http\Controllers\App\KnowledgeBaseController::class, 'category'])
        ->name('knowledge-base.category');
    Route::get('/{slug}', [\App\Http\Controllers\App\KnowledgeBaseController::class, 'show'])
        ->name('knowledge-base.show');
    Route::post('/{article}/rate', [\App\Http\Controllers\App\KnowledgeBaseController::class, 'rate'])
        ->name('knowledge-base.rate');
});

// Module Purchase routes (protected)
Route::middleware(['auth', 'verified'])->prefix('app/modules')->group(function () {
    Route::get('/', [\App\Http\Controllers\App\ModulePurchaseController::class, 'catalog'])
        ->name('modules.catalog');
    Route::get('/my', [\App\Http\Controllers\App\ModulePurchaseController::class, 'myModules'])
        ->name('modules.my');
    Route::get('/history', [\App\Http\Controllers\App\ModulePurchaseController::class, 'history'])
        ->name('modules.history');
    Route::get('/purchase/success', [\App\Http\Controllers\App\ModulePurchaseController::class, 'success'])
        ->name('modules.purchase.success');

    // Module-specific routes (must come BEFORE {slug} wildcard)
    // These are handled by individual module route files loaded by ModuleServiceProvider
    // The {slug} routes below should NOT match module slugs that have their own routes

    Route::get('/{slug}', [\App\Http\Controllers\App\ModulePurchaseController::class, 'show'])
        ->name('modules.show')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::get('/{slug}/checkout', [\App\Http\Controllers\App\ModulePurchaseController::class, 'checkout'])
        ->name('modules.checkout')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/checkout', [\App\Http\Controllers\App\ModulePurchaseController::class, 'processCheckout'])
        ->name('modules.checkout.process')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/purchase', [\App\Http\Controllers\App\ModulePurchaseController::class, 'purchase'])
        ->name('modules.purchase')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/enable', [\App\Http\Controllers\App\ModulePurchaseController::class, 'enable'])
        ->name('modules.enable')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/disable', [\App\Http\Controllers\App\ModulePurchaseController::class, 'disable'])
        ->name('modules.disable')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/cancel-subscription', [\App\Http\Controllers\App\ModulePurchaseController::class, 'cancelSubscription'])
        ->name('modules.cancel-subscription')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::get('/{slug}/settings', [\App\Http\Controllers\App\ModulePurchaseController::class, 'settings'])
        ->name('modules.settings')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/settings', [\App\Http\Controllers\App\ModulePurchaseController::class, 'saveSettings'])
        ->name('modules.settings.save')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::post('/{slug}/settings/reset', [\App\Http\Controllers\App\ModulePurchaseController::class, 'resetSettings'])
        ->name('modules.settings.reset')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');

    // Reviews routes
    Route::post('/{slug}/reviews', [\App\Http\Controllers\App\ModulePurchaseController::class, 'createReview'])
        ->name('modules.reviews.store')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::put('/{slug}/reviews', [\App\Http\Controllers\App\ModulePurchaseController::class, 'updateReview'])
        ->name('modules.reviews.update')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
    Route::delete('/{slug}/reviews', [\App\Http\Controllers\App\ModulePurchaseController::class, 'deleteReview'])
        ->name('modules.reviews.destroy')
        ->where('slug', '^(?!leads$|reviews$)[a-z0-9-]+$');
});

// Admin Panel Routes
$adminPath = config('app.admin_panel_path', 'admin');

// Admin authentication routes (guest only)
Route::prefix($adminPath)->group(function () {
    Route::middleware('guest:admin')->group(function () {
        Route::get('/login', [\App\Http\Controllers\Admin\Auth\LoginController::class, 'showLoginForm'])
            ->name('admin.login');
        Route::post('/login', [\App\Http\Controllers\Admin\Auth\LoginController::class, 'login'])
            ->name('admin.login.post');
    });

    // Admin authenticated routes
    Route::middleware([\App\Http\Middleware\AdminAuthenticate::class])->group(function () {
        Route::post('/logout', [\App\Http\Controllers\Admin\Auth\LoginController::class, 'logout'])
            ->name('admin.logout');

        // Dashboard
        Route::get('/', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])
            ->name('admin.dashboard');

        // Subscription Management
        Route::prefix('subscriptions')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'index'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.subscriptions.index');
            Route::get('/create', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'create'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.create');
            Route::post('/', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'store'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.store');
            Route::get('/{subscription}', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'show'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.subscriptions.show');
            Route::get('/{subscription}/edit', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'edit'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.edit');
            Route::put('/{subscription}', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'update'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.update');
            Route::post('/{subscription}/cancel', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'cancel'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.cancel');
            Route::post('/{subscription}/extend', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'extend'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.extend');
            Route::post('/{subscription}/change-plan', [\App\Http\Controllers\Admin\SubscriptionManagementController::class, 'changePlan'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.subscriptions.change-plan');
        });

        // User Management
        Route::prefix('users')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_users')
                ->name('admin.users.index');
            Route::get('/create', [\App\Http\Controllers\Admin\UserManagementController::class, 'create'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_users')
                ->name('admin.users.create');
            Route::post('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'store'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_users')
                ->name('admin.users.store');
            Route::get('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'show'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_users')
                ->name('admin.users.show');
            Route::get('/{user}/edit', [\App\Http\Controllers\Admin\UserManagementController::class, 'edit'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_users')
                ->name('admin.users.edit');
            Route::put('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'update'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_users')
                ->name('admin.users.update');
            Route::delete('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'destroy'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_users')
                ->name('admin.users.destroy');
        });

        // Promo Code Management
        Route::prefix('promo-codes')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'index'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_promo_codes')
                ->name('admin.promo-codes.index');
            Route::get('/create', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'create'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_promo_codes')
                ->name('admin.promo-codes.create');
            Route::post('/', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'store'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_promo_codes')
                ->name('admin.promo-codes.store');
            Route::get('/{promoCode}', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'show'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_promo_codes')
                ->name('admin.promo-codes.show');
            Route::get('/{promoCode}/edit', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'edit'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_promo_codes')
                ->name('admin.promo-codes.edit');
            Route::put('/{promoCode}', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'update'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_promo_codes')
                ->name('admin.promo-codes.update');
            Route::delete('/{promoCode}', [\App\Http\Controllers\Admin\PromoCodeManagementController::class, 'destroy'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_promo_codes')
                ->name('admin.promo-codes.destroy');
        });

        // Plan Management
        Route::prefix('plans')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\PlanManagementController::class, 'index'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.plans.index');
            Route::get('/create', [\App\Http\Controllers\Admin\PlanManagementController::class, 'create'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.plans.create');
            Route::post('/', [\App\Http\Controllers\Admin\PlanManagementController::class, 'store'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.plans.store');
            Route::get('/{plan}', [\App\Http\Controllers\Admin\PlanManagementController::class, 'show'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.plans.show');
            Route::get('/{plan}/edit', [\App\Http\Controllers\Admin\PlanManagementController::class, 'edit'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.plans.edit');
            Route::put('/{plan}', [\App\Http\Controllers\Admin\PlanManagementController::class, 'update'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.plans.update');
            Route::delete('/{plan}', [\App\Http\Controllers\Admin\PlanManagementController::class, 'destroy'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':manage_subscriptions')
                ->name('admin.plans.destroy');
        });

        // Payment Management
        Route::prefix('payments')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\PaymentManagementController::class, 'index'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.payments.index');
            Route::get('/{payment}', [\App\Http\Controllers\Admin\PaymentManagementController::class, 'show'])
                ->middleware(\App\Http\Middleware\AdminCheckPermission::class . ':view_subscriptions')
                ->name('admin.payments.show');
        });

        // Support Ticket Management
        Route::prefix('support')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\SupportTicketController::class, 'index'])
                ->name('admin.support.index');
            Route::get('/stats', [\App\Http\Controllers\Admin\SupportStatsController::class, 'index'])
                ->name('admin.support.stats');
            Route::get('/export', [\App\Http\Controllers\Admin\SupportTicketController::class, 'export'])
                ->name('admin.support.export');
            Route::get('/{ticket}', [\App\Http\Controllers\Admin\SupportTicketController::class, 'show'])
                ->name('admin.support.show');
            Route::patch('/{ticket}/status', [\App\Http\Controllers\Admin\SupportTicketController::class, 'updateStatus'])
                ->name('admin.support.updateStatus');
            Route::patch('/{ticket}/priority', [\App\Http\Controllers\Admin\SupportTicketController::class, 'updatePriority'])
                ->name('admin.support.updatePriority');
            Route::post('/{ticket}/assign', [\App\Http\Controllers\Admin\SupportTicketController::class, 'assign'])
                ->name('admin.support.assign');
            Route::post('/{ticket}/messages', [\App\Http\Controllers\Admin\SupportTicketMessageController::class, 'store'])
                ->name('admin.support.messages.store');
            Route::post('/{ticket}/internal-notes', [\App\Http\Controllers\Admin\SupportTicketMessageController::class, 'storeInternal'])
                ->name('admin.support.internal-notes.store');
        });

        // Support Template Management
        Route::prefix('settings/support-templates')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\SupportTemplateController::class, 'index'])
                ->name('admin.support-templates.index');
            Route::post('/', [\App\Http\Controllers\Admin\SupportTemplateController::class, 'store'])
                ->name('admin.support-templates.store');
            Route::patch('/{template}', [\App\Http\Controllers\Admin\SupportTemplateController::class, 'update'])
                ->name('admin.support-templates.update');
            Route::delete('/{template}', [\App\Http\Controllers\Admin\SupportTemplateController::class, 'destroy'])
                ->name('admin.support-templates.destroy');
        });

        // Knowledge Base Management
        Route::prefix('knowledge-base')->group(function () {
            // Articles
            Route::get('/articles', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'index'])
                ->name('admin.knowledge-base.articles.index');
            Route::get('/articles/create', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'create'])
                ->name('admin.knowledge-base.articles.create');
            Route::post('/articles', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'store'])
                ->name('admin.knowledge-base.articles.store');
            Route::get('/articles/{article}/edit', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'edit'])
                ->name('admin.knowledge-base.articles.edit');
            Route::put('/articles/{article}', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'update'])
                ->name('admin.knowledge-base.articles.update');
            Route::delete('/articles/{article}', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'destroy'])
                ->name('admin.knowledge-base.articles.destroy');
            Route::post('/articles/{article}/publish', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'publish'])
                ->name('admin.knowledge-base.articles.publish');
            Route::post('/articles/{article}/unpublish', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'unpublish'])
                ->name('admin.knowledge-base.articles.unpublish');
            Route::post('/articles/{article}/media', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'uploadMedia'])
                ->name('admin.knowledge-base.articles.upload-media');
            Route::post('/articles/{article}/video-embed', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'createVideoEmbed'])
                ->name('admin.knowledge-base.articles.video-embed');
            Route::delete('/media/{media}', [\App\Http\Controllers\Admin\KnowledgeBaseArticleController::class, 'deleteMedia'])
                ->name('admin.knowledge-base.articles.delete-media');

            // Categories
            Route::get('/categories', [\App\Http\Controllers\Admin\KnowledgeBaseCategoryController::class, 'index'])
                ->name('admin.knowledge-base.categories.index');
            Route::post('/categories', [\App\Http\Controllers\Admin\KnowledgeBaseCategoryController::class, 'store'])
                ->name('admin.knowledge-base.categories.store');
            Route::put('/categories/{category}', [\App\Http\Controllers\Admin\KnowledgeBaseCategoryController::class, 'update'])
                ->name('admin.knowledge-base.categories.update');
            Route::delete('/categories/{category}', [\App\Http\Controllers\Admin\KnowledgeBaseCategoryController::class, 'destroy'])
                ->name('admin.knowledge-base.categories.destroy');
            Route::post('/categories/reorder', [\App\Http\Controllers\Admin\KnowledgeBaseCategoryController::class, 'reorder'])
                ->name('admin.knowledge-base.categories.reorder');

            // Analytics
            Route::get('/analytics', [\App\Http\Controllers\Admin\KnowledgeBaseAnalyticsController::class, 'index'])
                ->name('admin.knowledge-base.analytics.index');
            Route::get('/analytics/article/{article}', [\App\Http\Controllers\Admin\KnowledgeBaseAnalyticsController::class, 'article'])
                ->name('admin.knowledge-base.analytics.article');
            Route::get('/analytics/export', [\App\Http\Controllers\Admin\KnowledgeBaseAnalyticsController::class, 'export'])
                ->name('admin.knowledge-base.analytics.export');
        });

        // Module Management
        Route::prefix('modules')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'index'])
                ->name('admin.modules.index');
            Route::get('/stats', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'stats'])
                ->name('admin.modules.stats');
            Route::get('/error-logs', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'allErrorLogs'])
                ->name('admin.modules.error-logs');
            Route::post('/error-logs/clear', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'clearErrorLogs'])
                ->name('admin.modules.error-logs.clear');
            Route::post('/sync', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'syncModules'])
                ->name('admin.modules.sync');
            Route::get('/search-users', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'searchUsers'])
                ->name('admin.modules.search-users');

            Route::get('/{slug}', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'show'])
                ->name('admin.modules.show');
            Route::get('/{slug}/edit', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'edit'])
                ->name('admin.modules.edit');
            Route::put('/{slug}', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'update'])
                ->name('admin.modules.update');
            Route::post('/{slug}/toggle-status', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'toggleStatus'])
                ->name('admin.modules.toggle-status');
            Route::get('/{slug}/stats', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'moduleStats'])
                ->name('admin.modules.module-stats');
            Route::get('/{slug}/users', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'users'])
                ->name('admin.modules.users');
            Route::get('/{slug}/grants', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'grants'])
                ->name('admin.modules.grants');
            Route::post('/{slug}/grants', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'grantAccess'])
                ->name('admin.modules.grant-access');
            Route::delete('/{slug}/grants', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'revokeAccess'])
                ->name('admin.modules.revoke-access');
            Route::get('/{slug}/error-logs', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'errorLogs'])
                ->name('admin.modules.module-error-logs');
            Route::post('/{slug}/force-enable', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'forceEnableForUser'])
                ->name('admin.modules.force-enable');
            Route::post('/{slug}/force-disable', [\App\Http\Controllers\Admin\ModuleManagementController::class, 'forceDisableForUser'])
                ->name('admin.modules.force-disable');
        });

        // Module Reviews Moderation
        Route::prefix('module-reviews')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'index'])
                ->name('admin.module-reviews.index');
            Route::post('/{review}/approve', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'approve'])
                ->name('admin.module-reviews.approve');
            Route::post('/{review}/reject', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'reject'])
                ->name('admin.module-reviews.reject');
            Route::post('/{review}/toggle-verified', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'toggleVerified'])
                ->name('admin.module-reviews.toggle-verified');
            Route::delete('/{review}', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'destroy'])
                ->name('admin.module-reviews.destroy');
            Route::post('/bulk-approve', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'bulkApprove'])
                ->name('admin.module-reviews.bulk-approve');
            Route::post('/bulk-reject', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'bulkReject'])
                ->name('admin.module-reviews.bulk-reject');
            Route::post('/bulk-destroy', [\App\Http\Controllers\Admin\ModuleReviewController::class, 'bulkDestroy'])
                ->name('admin.module-reviews.bulk-destroy');
        });

        // Landing Settings Management
        Route::prefix('landing-settings')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\LandingSettingsController::class, 'index'])
                ->name('admin.landing-settings.index');
            Route::put('/update', [\App\Http\Controllers\Admin\LandingSettingsController::class, 'update'])
                ->name('admin.landing-settings.update');
            Route::post('/', [\App\Http\Controllers\Admin\LandingSettingsController::class, 'store'])
                ->name('admin.landing-settings.store');
            Route::delete('/{setting}', [\App\Http\Controllers\Admin\LandingSettingsController::class, 'destroy'])
                ->name('admin.landing-settings.destroy');
        });

        // News Management
        Route::prefix('news')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\NewsController::class, 'index'])
                ->name('admin.news.index');
            Route::get('/create', [\App\Http\Controllers\Admin\NewsController::class, 'create'])
                ->name('admin.news.create');
            Route::post('/', [\App\Http\Controllers\Admin\NewsController::class, 'store'])
                ->name('admin.news.store');
            Route::get('/{news}/edit', [\App\Http\Controllers\Admin\NewsController::class, 'edit'])
                ->name('admin.news.edit');
            Route::put('/{news}', [\App\Http\Controllers\Admin\NewsController::class, 'update'])
                ->name('admin.news.update');
            Route::delete('/{news}', [\App\Http\Controllers\Admin\NewsController::class, 'destroy'])
                ->name('admin.news.destroy');
            Route::post('/{news}/publish', [\App\Http\Controllers\Admin\NewsController::class, 'publish'])
                ->name('admin.news.publish');
            Route::post('/{news}/unpublish', [\App\Http\Controllers\Admin\NewsController::class, 'unpublish'])
                ->name('admin.news.unpublish');
        });
    });
});

// API routes for notifications (protected)
Route::middleware(['auth', 'verified'])->prefix('api')->group(function () {
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index'])
        ->name('api.notifications.index');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead'])
        ->name('api.notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead'])
        ->name('api.notifications.read-all');
    Route::delete('/notifications/delete-all', [\App\Http\Controllers\Api\NotificationController::class, 'deleteAll'])
        ->name('api.notifications.delete-all');
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount'])
        ->name('api.notifications.unread-count');
});

// API routes for modules (protected)
Route::middleware(['auth', 'verified'])->prefix('api/modules')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ModuleApiController::class, 'index'])
        ->name('api.modules.index');
    Route::get('/active', [\App\Http\Controllers\Api\ModuleApiController::class, 'active'])
        ->name('api.modules.active');
    Route::get('/hooks/{hookPoint}', [\App\Http\Controllers\Api\ModuleApiController::class, 'hooks'])
        ->name('api.modules.hooks');
    Route::get('/{slug}/access', [\App\Http\Controllers\Api\ModuleApiController::class, 'checkAccess'])
        ->name('api.modules.check-access');
    Route::get('/{slug}/settings', [\App\Http\Controllers\Api\ModuleApiController::class, 'getSettings'])
        ->name('api.modules.settings.get');
    Route::post('/{slug}/settings', [\App\Http\Controllers\Api\ModuleApiController::class, 'saveSettings'])
        ->name('api.modules.settings.save');
    Route::post('/{slug}/settings/reset', [\App\Http\Controllers\Api\ModuleApiController::class, 'resetSettings'])
        ->name('api.modules.settings.reset');
});
