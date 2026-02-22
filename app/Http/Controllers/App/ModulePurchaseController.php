<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\ModulePurchase;
use App\Services\Modules\Exceptions\ModulePurchaseException;
use App\Services\Modules\Exceptions\ModuleSettingsException;
use App\Services\Modules\ModulePurchaseService;
use App\Services\Modules\ModuleRegistry;
use App\Services\Modules\ModuleReviewService;
use App\Services\Modules\ModuleSettingsService;
use App\Services\Modules\UserModuleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModulePurchaseController extends Controller
{
    public function __construct(
        protected ModulePurchaseService $purchaseService,
        protected ModuleRegistry $registry,
        protected UserModuleService $userModuleService,
        protected ModuleSettingsService $settingsService,
        protected ModuleReviewService $reviewService,
    ) {
    }

    /**
     * Show module catalog
     */
    public function catalog()
    {
        $user = auth()->user();
        $modules = Module::active()->get();

        $modulesWithStatus = $modules->map(function ($module) use ($user) {
            $status = $this->userModuleService->getAccessStatus($user, $module->slug);

            return [
                'id' => $module->id,
                'slug' => $module->slug,
                'name' => $module->name,
                'description' => $module->description,
                'long_description' => $module->long_description,
                'version' => $module->version,
                'author' => $module->author,
                'category' => $module->category,
                'category_label' => $module->category_label,
                'icon' => $module->icon,
                'screenshots' => $module->screenshots,
                'pricing_type' => $module->pricing_type,
                'pricing_type_label' => $module->pricing_type_label,
                'price' => $module->price,
                'formatted_price' => $module->formatted_price,
                'subscription_period' => $module->subscription_period,
                'min_plan' => $module->min_plan,
                'is_featured' => $module->is_featured,
                'installs_count' => $module->installs_count,
                'rating' => $module->rating,
                'status' => $status,
            ];
        });

        // Group by category
        $categories = $modulesWithStatus->groupBy('category');

        return Inertia::render('App/Modules/Catalog', [
            'modules' => $modulesWithStatus,
            'categories' => $categories,
        ]);
    }

    /**
     * Show module details
     */
    public function show(string $slug)
    {
        $user = auth()->user();
        $module = Module::where('slug', $slug)->firstOrFail();
        $status = $this->userModuleService->getAccessStatus($user, $slug);

        // Get reviews
        $reviews = $this->reviewService->getAllModuleReviews($slug);
        $ratingStats = $this->reviewService->getRatingStats($slug);
        $userReview = $this->reviewService->getUserReview($user, $slug);
        $canReview = $this->reviewService->canReview($user, $slug);

        return Inertia::render('App/Modules/Show', [
            'module' => [
                'id' => $module->id,
                'slug' => $module->slug,
                'name' => $module->name,
                'description' => $module->description,
                'long_description' => $module->long_description,
                'documentation' => $module->documentation,
                'changelog' => $module->changelog,
                'version' => $module->version,
                'author' => $module->author,
                'category' => $module->category,
                'category_label' => $module->category_label,
                'icon' => $module->icon,
                'screenshots' => $module->screenshots,
                'pricing_type' => $module->pricing_type,
                'pricing_type_label' => $module->pricing_type_label,
                'price' => $module->price,
                'formatted_price' => $module->formatted_price,
                'subscription_period' => $module->subscription_period,
                'min_plan' => $module->min_plan,
                'dependencies' => $module->dependencies,
                'permissions' => $module->permissions,
                'is_featured' => $module->is_featured,
                'installs_count' => $module->installs_count,
                'rating' => (float) $module->rating,
                'reviews_count' => $ratingStats['total'],
            ],
            'status' => $status,
            'reviews' => $reviews->map(fn($r) => [
                'id' => $r->id,
                'user_name' => $r->author_name,
                'user_initials' => $r->author_initials,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'is_verified' => $r->is_verified,
                'created_at' => $r->created_at->toISOString(),
            ]),
            'rating_stats' => $ratingStats,
            'user_review' => $userReview ? [
                'id' => $userReview->id,
                'rating' => $userReview->rating,
                'comment' => $userReview->comment,
            ] : null,
            'can_review' => $canReview,
        ]);
    }

    /**
     * Show checkout page for purchasing a module
     */
    public function checkout(string $slug)
    {
        $user = auth()->user();
        $module = Module::where('slug', $slug)->firstOrFail();
        $status = $this->userModuleService->getAccessStatus($user, $slug);

        // If module is free or already purchased, redirect to module page
        if ($module->pricing_type === 'free') {
            return redirect()->route('modules.show', $slug)
                ->with('info', 'Этот модуль бесплатный');
        }

        if ($status['can_access']) {
            return redirect()->route('modules.show', $slug)
                ->with('info', 'У вас уже есть доступ к этому модулю');
        }

        // Calculate prices
        $monthlyPrice = $module->price;
        $yearlyPrice = $monthlyPrice * 10; // 2 months free
        $yearlyDiscount = 17; // ~17% discount

        return Inertia::render('App/Modules/Checkout', [
            'module' => [
                'slug' => $module->slug,
                'name' => $module->name,
                'description' => $module->description,
                'icon' => $module->icon,
                'pricing_type' => $module->pricing_type,
            ],
            'prices' => [
                'monthly' => $monthlyPrice,
                'yearly' => $yearlyPrice,
                'yearlyDiscount' => $yearlyDiscount,
            ],
        ]);
    }

    /**
     * Process checkout and redirect to payment
     */
    public function processCheckout(Request $request, string $slug)
    {
        $request->validate([
            'period' => 'required|in:monthly,yearly',
        ]);

        $user = auth()->user();

        try {
            $purchase = $this->purchaseService->createPurchase(
                $user,
                $slug,
                $request->period
            );

            $confirmationUrl = $this->purchaseService->getConfirmationUrl($purchase);

            if ($confirmationUrl) {
                return \Inertia\Inertia::location($confirmationUrl);
            }

            return back()->withErrors(['error' => 'Не удалось создать платёж']);

        } catch (ModulePurchaseException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Create purchase for a module
     */
    public function purchase(Request $request, string $slug)
    {
        $request->validate([
            'subscription_period' => 'nullable|in:monthly,yearly',
        ]);

        $user = auth()->user();

        try {
            $purchase = $this->purchaseService->createPurchase(
                $user,
                $slug,
                $request->subscription_period
            );

            // Get confirmation URL
            $confirmationUrl = $this->purchaseService->getConfirmationUrl($purchase);

            if ($confirmationUrl) {
                return redirect($confirmationUrl);
            }

            // If no confirmation URL, something went wrong
            return back()->withErrors(['error' => 'Не удалось создать платёж']);

        } catch (ModulePurchaseException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Payment success page
     */
    public function success(Request $request)
    {
        $purchaseId = $request->query('purchase_id');
        $purchase = null;

        if ($purchaseId) {
            $purchase = ModulePurchase::with('module')
                ->where('id', $purchaseId)
                ->where('user_id', auth()->id())
                ->first();
        }

        return Inertia::render('App/Modules/PurchaseSuccess', [
            'purchase' => $purchase ? [
                'id' => $purchase->id,
                'module_slug' => $purchase->module_slug,
                'module_name' => $purchase->module?->name ?? $purchase->module_slug,
                'price' => $purchase->price,
                'formatted_price' => $purchase->formatted_price,
                'status' => $purchase->status,
                'status_label' => $purchase->status_label,
                'pricing_type' => $purchase->pricing_type,
                'pricing_type_label' => $purchase->pricing_type_label,
                'expires_at' => $purchase->expires_at?->toISOString(),
            ] : null,
        ]);
    }


    /**
     * Show purchase history
     */
    public function history()
    {
        $user = auth()->user();
        $purchases = $this->purchaseService->getPurchaseHistory($user);

        return Inertia::render('App/Modules/PurchaseHistory', [
            'purchases' => $purchases->through(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'module_slug' => $purchase->module_slug,
                    'module_name' => $purchase->module?->name ?? $purchase->module_slug,
                    'module_icon' => $purchase->module?->icon,
                    'price' => $purchase->price,
                    'formatted_price' => $purchase->formatted_price,
                    'currency' => $purchase->currency,
                    'pricing_type' => $purchase->pricing_type,
                    'pricing_type_label' => $purchase->pricing_type_label,
                    'status' => $purchase->status,
                    'status_label' => $purchase->status_label,
                    'purchased_at' => $purchase->purchased_at?->toISOString(),
                    'expires_at' => $purchase->expires_at?->toISOString(),
                    'auto_renew' => $purchase->auto_renew,
                    'is_active' => $purchase->isActive(),
                    'is_expired' => $purchase->isExpired(),
                    'created_at' => $purchase->created_at->toISOString(),
                ];
            }),
        ]);
    }

    /**
     * Cancel subscription for a module
     */
    public function cancelSubscription(string $slug)
    {
        $user = auth()->user();

        try {
            $this->purchaseService->cancelSubscription($user, $slug);

            return back()->with('success', 'Автопродление отключено. Доступ сохранится до конца оплаченного периода.');

        } catch (ModulePurchaseException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show user's installed modules
     */
    public function myModules()
    {
        $user = auth()->user();
        $userModules = $this->userModuleService->getUserModules($user);

        $modulesData = $userModules->map(function ($userModule) use ($user) {
            $module = Module::where('slug', $userModule->module_slug)->first();
            $status = $this->userModuleService->getAccessStatus($user, $userModule->module_slug);

            return [
                'slug' => $userModule->module_slug,
                'name' => $module?->name ?? $userModule->module_slug,
                'description' => $module?->description,
                'icon' => $module?->icon,
                'category' => $module?->category,
                'category_label' => $module?->category_label,
                'is_enabled' => $userModule->is_enabled,
                'enabled_at' => $userModule->enabled_at?->toISOString(),
                'last_used_at' => $userModule->last_used_at?->toISOString(),
                'usage_count' => $userModule->usage_count,
                'status' => $status,
            ];
        });

        return Inertia::render('App/Modules/MyModules', [
            'modules' => $modulesData,
        ]);
    }

    /**
     * Enable a module
     */
    public function enable(string $slug)
    {
        $user = auth()->user();

        // Check if module requires purchase
        $module = Module::where('slug', $slug)->first();
        if ($module && !$module->isFree()) {
            // Check if user has access
            $status = $this->userModuleService->getAccessStatus($user, $slug);
            if (!$status['can_access'] && $status['reason'] === 'purchase_required') {
                // Redirect to checkout for paid modules
                return redirect()->route('modules.checkout', $slug)
                    ->with('info', 'Для использования этого модуля требуется покупка');
            }
        }

        try {
            $this->userModuleService->enable($user, $slug);
            return back()->with('success', 'Модуль успешно включён');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Disable a module
     */
    public function disable(string $slug)
    {
        $user = auth()->user();

        try {
            $this->userModuleService->disable($user, $slug);
            return back()->with('success', 'Модуль отключён');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show module settings page
     */
    public function settings(string $slug)
    {
        $user = auth()->user();
        $module = Module::where('slug', $slug)->firstOrFail();

        // Check if user has access to the module
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return redirect()->route('modules.show', $slug)
                ->withErrors(['error' => 'Модуль не включён']);
        }

        // Get settings schema from manifest
        $schema = $this->settingsService->getSchema($slug);

        // Get current settings values
        $values = $this->settingsService->getAll($user, $slug);

        return Inertia::render('App/Modules/Settings', [
            'module' => [
                'slug' => $module->slug,
                'name' => $module->name,
                'description' => $module->description,
                'icon' => $module->icon,
            ],
            'schema' => $schema,
            'values' => $values,
        ]);
    }

    /**
     * Save module settings
     */
    public function saveSettings(Request $request, string $slug)
    {
        $user = auth()->user();

        // Check if user has access to the module
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return back()->withErrors(['error' => 'Модуль не включён']);
        }

        $request->validate([
            'settings' => 'required|array',
        ]);

        try {
            $this->settingsService->setMany($user, $slug, $request->settings);
            return back()->with('success', 'Настройки сохранены');

        } catch (ModuleSettingsException $e) {
            if ($e->getErrors()) {
                return back()->withErrors($e->getErrors());
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reset module settings to defaults
     */
    public function resetSettings(string $slug)
    {
        $user = auth()->user();

        // Check if user has access to the module
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return back()->withErrors(['error' => 'Модуль не включён']);
        }

        try {
            $defaults = $this->settingsService->resetToDefaults($user, $slug);
            return back()->with([
                'success' => 'Настройки сброшены',
                'settings' => $defaults,
            ]);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Create a review for a module
     */
    public function createReview(Request $request, string $slug)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();

        try {
            $this->reviewService->createReview(
                $user,
                $slug,
                $request->rating,
                $request->comment
            );

            return back()->with('success', 'Отзыв добавлен');

        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update a review
     */
    public function updateReview(Request $request, string $slug)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();
        $review = $this->reviewService->getUserReview($user, $slug);

        if (!$review) {
            return back()->withErrors(['error' => 'Отзыв не найден']);
        }

        try {
            $this->reviewService->updateReview(
                $review,
                $request->rating,
                $request->comment
            );

            return back()->with('success', 'Отзыв обновлён');

        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a review
     */
    public function deleteReview(string $slug)
    {
        $user = auth()->user();
        $review = $this->reviewService->getUserReview($user, $slug);

        if (!$review) {
            return back()->withErrors(['error' => 'Отзыв не найден']);
        }

        $this->reviewService->deleteReview($review);

        return back()->with('success', 'Отзыв удалён');
    }
}
