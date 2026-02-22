<?php

namespace App\Services\Modules;

use App\Models\Module;
use App\Models\ModuleGrant;
use App\Models\ModulePurchase;
use App\Models\User;
use App\Models\UserModule;
use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\Exceptions\ModuleAccessException;
use App\Services\Modules\Exceptions\ModuleLoadException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for managing user modules (enable/disable, access checks)
 */
class UserModuleService
{
    public function __construct(
        private readonly ModuleRegistry $registry,
        private readonly ModuleLoader $loader,
    ) {
    }

    /**
     * Enable a module for a user
     * 
     * @throws ModuleAccessException If user cannot access the module
     * @throws ModuleLoadException If module loading fails
     */
    public function enable(User $user, string $moduleSlug): bool
    {
        // Check if module exists in registry
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            throw ModuleAccessException::notFound($moduleSlug);
        }

        // Check if module is globally active
        $module = Module::where('slug', $moduleSlug)->first();
        if ($module && !$module->isGloballyActive()) {
            throw ModuleAccessException::globallyDisabled($moduleSlug);
        }

        // Check access (subscription, purchase, grant)
        if (!$this->canAccess($user, $moduleSlug)) {
            $this->throwAccessException($user, $moduleSlug, $manifest, $module);
        }

        // Check dependencies
        $missingDependencies = $this->getMissingDependencies($user, $manifest);
        if (!empty($missingDependencies)) {
            throw ModuleAccessException::dependenciesMissing($moduleSlug, $missingDependencies);
        }

        return DB::transaction(function () use ($user, $moduleSlug, $manifest, $module) {
            // Get or create user module record
            $userModule = UserModule::firstOrNew([
                'user_id' => $user->id,
                'module_slug' => $moduleSlug,
            ]);

            $isFirstEnable = !$userModule->exists;

            // Enable the module
            $userModule->is_enabled = true;
            $userModule->enabled_at = now();
            $userModule->disabled_at = null;
            $userModule->save();

            // Run migrations on first enable
            if ($isFirstEnable && $manifest->hasMigrations()) {
                try {
                    $this->loader->runMigrations($moduleSlug);
                } catch (ModuleLoadException $e) {
                    // Rollback the user module creation
                    $userModule->delete();
                    throw $e;
                }
            }

            // Increment installs count
            if ($module && $isFirstEnable) {
                $module->incrementInstalls();
            }

            // Load the module
            try {
                $this->loader->load($manifest);
            } catch (ModuleLoadException $e) {
                Log::warning("Module enabled but failed to load", [
                    'module' => $moduleSlug,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                // Don't rollback - module is enabled, just not loaded in this request
            }

            Log::info("Module enabled for user", [
                'module' => $moduleSlug,
                'user_id' => $user->id,
                'first_enable' => $isFirstEnable,
            ]);

            return true;
        });
    }


    /**
     * Disable a module for a user
     * Data is preserved, only deactivated
     */
    public function disable(User $user, string $moduleSlug): bool
    {
        $userModule = UserModule::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->first();

        if ($userModule === null) {
            // Module was never enabled for this user
            return false;
        }

        if (!$userModule->is_enabled) {
            // Already disabled
            return true;
        }

        $userModule->disable();

        // Unload the module
        $this->loader->unload($moduleSlug);

        Log::info("Module disabled for user", [
            'module' => $moduleSlug,
            'user_id' => $user->id,
        ]);

        return true;
    }

    /**
     * Check if a module is enabled for a user
     */
    public function isEnabled(User $user, string $moduleSlug): bool
    {
        try {
            return UserModule::where('user_id', $user->id)
                ->where('module_slug', $moduleSlug)
                ->where('is_enabled', true)
                ->exists();
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist
            return false;
        }
    }

    /**
     * Get all modules for a user (enabled and disabled)
     */
    public function getUserModules(User $user): Collection
    {
        return UserModule::where('user_id', $user->id)->get();
    }

    /**
     * Get enabled modules for a user
     */
    public function getEnabledModules(User $user): Collection
    {
        return UserModule::where('user_id', $user->id)
            ->where('is_enabled', true)
            ->get();
    }

    /**
     * Check if user can access a module (subscription, purchase, or grant)
     */
    public function canAccess(User $user, string $moduleSlug): bool
    {
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            return false;
        }

        // Get module from database for pricing info (admin can change pricing)
        $module = null;
        try {
            $module = Module::where('slug', $moduleSlug)->first();
            if ($module && !$module->isGloballyActive()) {
                return false;
            }
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist, skip this check
        }

        // Use database pricing if available, otherwise fall back to manifest
        $isFree = $module ? $module->isFree() : $manifest->isFree();

        // Free modules are always accessible (with min plan check)
        if ($isFree) {
            return $this->checkMinPlanRequirement($user, $manifest);
        }

        // Check for active grant (admin gave free access)
        if ($this->hasActiveGrant($user, $moduleSlug)) {
            return true;
        }

        // Check for active purchase
        if ($this->hasActivePurchase($user, $moduleSlug)) {
            return true;
        }

        return false;
    }

    /**
     * Check if user has active grant for module
     */
    public function hasActiveGrant(User $user, string $moduleSlug): bool
    {
        try {
            return ModuleGrant::hasActiveGrant($user->id, $moduleSlug);
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist
            return false;
        }
    }

    /**
     * Check if user has active purchase for module
     */
    public function hasActivePurchase(User $user, string $moduleSlug): bool
    {
        try {
            return ModulePurchase::where('user_id', $user->id)
                ->where('module_slug', $moduleSlug)
                ->active()
                ->exists();
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist
            return false;
        }
    }

    /**
     * Check minimum plan requirement
     */
    public function checkMinPlanRequirement(User $user, ModuleManifest $manifest): bool
    {
        // No minimum plan required
        if ($manifest->minPlan === null) {
            return true;
        }

        // User must have active subscription
        if (!$user->hasActiveSubscription()) {
            return false;
        }

        $currentPlan = $user->getCurrentPlan();
        if ($currentPlan === null) {
            return false;
        }

        // Check if current plan meets minimum requirement
        return $this->planMeetsRequirement($currentPlan->slug, $manifest->minPlan);
    }

    /**
     * Check if a plan meets the minimum requirement
     * Plans are ordered by sort_order, higher = better
     */
    private function planMeetsRequirement(string $currentPlanSlug, string $requiredPlanSlug): bool
    {
        // Same plan always meets requirement
        if ($currentPlanSlug === $requiredPlanSlug) {
            return true;
        }

        // Get plan sort orders
        $plans = \App\Models\SubscriptionPlan::whereIn('slug', [$currentPlanSlug, $requiredPlanSlug])
            ->pluck('sort_order', 'slug');

        $currentOrder = $plans[$currentPlanSlug] ?? 0;
        $requiredOrder = $plans[$requiredPlanSlug] ?? PHP_INT_MAX;

        return $currentOrder >= $requiredOrder;
    }

    /**
     * Get missing dependencies for a module
     */
    public function getMissingDependencies(User $user, ModuleManifest $manifest): array
    {
        if (!$manifest->hasDependencies()) {
            return [];
        }

        $missing = [];
        foreach ($manifest->dependencies as $dependency) {
            if (!$this->isEnabled($user, $dependency)) {
                $missing[] = $dependency;
            }
        }

        return $missing;
    }

    /**
     * Get access status for a module
     * Returns detailed information about why access is granted or denied
     */
    public function getAccessStatus(User $user, string $moduleSlug): array
    {
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            return [
                'can_access' => false,
                'reason' => 'not_found',
                'is_enabled' => false,
            ];
        }

        $module = null;
        try {
            $module = Module::where('slug', $moduleSlug)->first();
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist, continue without module record
        }

        $isEnabled = $this->isEnabled($user, $moduleSlug);

        // Check global status
        if ($module && !$module->isGloballyActive()) {
            return [
                'can_access' => false,
                'reason' => 'globally_disabled',
                'is_enabled' => $isEnabled,
            ];
        }

        // Use database pricing if available, otherwise fall back to manifest
        $isFree = $module ? $module->isFree() : $manifest->isFree();

        // Free module
        if ($isFree) {
            $meetsMinPlan = $this->checkMinPlanRequirement($user, $manifest);
            return [
                'can_access' => $meetsMinPlan,
                'reason' => $meetsMinPlan ? 'free' : 'plan_required',
                'is_enabled' => $isEnabled,
                'is_free' => true,
                'min_plan' => $manifest->minPlan,
            ];
        }

        // Check grant
        if ($this->hasActiveGrant($user, $moduleSlug)) {
            $grant = null;
            try {
                $grant = ModuleGrant::forUser($user->id)->forModule($moduleSlug)->active()->first();
            } catch (\Illuminate\Database\QueryException $e) {
                // Table doesn't exist
            }
            return [
                'can_access' => true,
                'reason' => 'grant',
                'is_enabled' => $isEnabled,
                'grant_expires_at' => $grant?->expires_at,
            ];
        }

        // Check purchase
        if ($this->hasActivePurchase($user, $moduleSlug)) {
            $purchase = null;
            try {
                $purchase = ModulePurchase::forUser($user->id)->forModule($moduleSlug)->active()->first();
            } catch (\Illuminate\Database\QueryException $e) {
                // Table doesn't exist
            }
            return [
                'can_access' => true,
                'reason' => 'purchased',
                'is_enabled' => $isEnabled,
                'purchase_expires_at' => $purchase?->expires_at,
                'auto_renew' => $purchase?->auto_renew,
            ];
        }

        // No access - needs purchase
        return [
            'can_access' => false,
            'reason' => 'purchase_required',
            'is_enabled' => $isEnabled,
            'price' => $module?->price ?? $manifest->pricing?->price ?? 0,
            'pricing_type' => $module?->pricing_type ?? $manifest->pricing?->type ?? 'one_time',
        ];
    }


    /**
     * Get all available modules with access status for a user
     */
    public function getAvailableModulesWithStatus(User $user): Collection
    {
        $modules = $this->registry->all();

        return $modules->map(function (ModuleManifest $manifest) use ($user) {
            $status = $this->getAccessStatus($user, $manifest->slug);
            return [
                'manifest' => $manifest,
                'status' => $status,
            ];
        });
    }

    /**
     * Record module usage
     */
    public function recordUsage(User $user, string $moduleSlug): void
    {
        $userModule = UserModule::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->first();

        if ($userModule && $userModule->is_enabled) {
            $userModule->recordUsage();
        }
    }

    /**
     * Enable multiple modules at once (handles dependencies)
     */
    public function enableWithDependencies(User $user, string $moduleSlug): array
    {
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            throw ModuleAccessException::notFound($moduleSlug);
        }

        $enabled = [];
        $errors = [];

        // Enable dependencies first
        if ($manifest->hasDependencies()) {
            foreach ($manifest->dependencies as $dependency) {
                if (!$this->isEnabled($user, $dependency)) {
                    try {
                        $this->enable($user, $dependency);
                        $enabled[] = $dependency;
                    } catch (ModuleAccessException $e) {
                        $errors[$dependency] = $e->getMessage();
                    }
                }
            }
        }

        // If any dependency failed, don't enable the main module
        if (!empty($errors)) {
            return [
                'success' => false,
                'enabled' => $enabled,
                'errors' => $errors,
            ];
        }

        // Enable the main module
        try {
            $this->enable($user, $moduleSlug);
            $enabled[] = $moduleSlug;
        } catch (ModuleAccessException $e) {
            $errors[$moduleSlug] = $e->getMessage();
        }

        return [
            'success' => empty($errors),
            'enabled' => $enabled,
            'errors' => $errors,
        ];
    }

    /**
     * Disable module and dependents
     */
    public function disableWithDependents(User $user, string $moduleSlug): array
    {
        $disabled = [];

        // Find modules that depend on this one
        $dependents = $this->findDependentModules($user, $moduleSlug);

        // Disable dependents first
        foreach ($dependents as $dependent) {
            if ($this->isEnabled($user, $dependent)) {
                $this->disable($user, $dependent);
                $disabled[] = $dependent;
            }
        }

        // Disable the main module
        $this->disable($user, $moduleSlug);
        $disabled[] = $moduleSlug;

        return $disabled;
    }

    /**
     * Find modules that depend on a given module
     */
    private function findDependentModules(User $user, string $moduleSlug): array
    {
        $dependents = [];
        $enabledModules = $this->getEnabledModules($user);

        foreach ($enabledModules as $userModule) {
            $manifest = $this->registry->get($userModule->module_slug);
            if ($manifest && in_array($moduleSlug, $manifest->dependencies)) {
                $dependents[] = $userModule->module_slug;
            }
        }

        return $dependents;
    }

    /**
     * Throw appropriate access exception based on why access is denied
     */
    private function throwAccessException(User $user, string $moduleSlug, ModuleManifest $manifest, ?Module $module): void
    {
        // Check minimum plan requirement first
        if ($manifest->minPlan !== null && !$this->checkMinPlanRequirement($user, $manifest)) {
            $currentPlan = $user->getCurrentPlan();
            throw ModuleAccessException::planRequired(
                $moduleSlug,
                $manifest->minPlan,
                $currentPlan?->slug
            );
        }

        // Use database pricing if available, otherwise fall back to manifest
        $isFree = $module ? $module->isFree() : $manifest->isFree();

        // Paid module without purchase
        if (!$isFree) {
            $price = $module?->price ?? $manifest->pricing?->price ?? 0;
            throw ModuleAccessException::purchaseRequired($moduleSlug, $price);
        }

        // Generic subscription required
        throw ModuleAccessException::subscriptionRequired($moduleSlug);
    }

    /**
     * Disable modules with expired purchases
     * Called by scheduled command
     */
    public function disableExpiredModules(): array
    {
        $disabled = [];

        // Find expired purchases
        $expiredPurchases = ModulePurchase::expired()
            ->with('user')
            ->get();

        foreach ($expiredPurchases as $purchase) {
            // Check if user still has access through grant
            if ($this->hasActiveGrant($purchase->user, $purchase->module_slug)) {
                continue;
            }

            // Check if there's another active purchase
            $hasOtherPurchase = ModulePurchase::where('user_id', $purchase->user_id)
                ->where('module_slug', $purchase->module_slug)
                ->where('id', '!=', $purchase->id)
                ->active()
                ->exists();

            if ($hasOtherPurchase) {
                continue;
            }

            // Disable the module
            if ($this->isEnabled($purchase->user, $purchase->module_slug)) {
                $this->disable($purchase->user, $purchase->module_slug);
                $disabled[] = [
                    'user_id' => $purchase->user_id,
                    'module_slug' => $purchase->module_slug,
                ];
            }
        }

        return $disabled;
    }

    /**
     * Disable modules with expired grants
     * Called by scheduled command
     */
    public function disableExpiredGrants(): array
    {
        $disabled = [];

        // Find expired grants
        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\ModuleGrant> $expiredGrants */
        $expiredGrants = ModuleGrant::expired()
            ->with('user')
            ->get();

        /** @var \App\Models\ModuleGrant $grant */
        foreach ($expiredGrants as $grant) {
            // Check if user still has access through purchase
            if ($this->hasActivePurchase($grant->user, $grant->module_slug)) {
                continue;
            }

            // Check if module is free
            $manifest = $this->registry->get($grant->module_slug);
            if ($manifest && $manifest->isFree()) {
                continue;
            }

            // Disable the module
            if ($this->isEnabled($grant->user, $grant->module_slug)) {
                $this->disable($grant->user, $grant->module_slug);
                $disabled[] = [
                    'user_id' => $grant->user_id,
                    'module_slug' => $grant->module_slug,
                ];
            }

            // Delete the expired grant
            $grant->delete();
        }

        return $disabled;
    }
}
