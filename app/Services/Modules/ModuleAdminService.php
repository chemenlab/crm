<?php

namespace App\Services\Modules;

use App\Models\AdminActivityLog;
use App\Models\Module;
use App\Models\ModuleErrorLog;
use App\Models\ModuleGlobalSetting;
use App\Models\ModuleGrant;
use App\Models\User;
use App\Models\UserModule;
use App\Services\Modules\Exceptions\ModuleAdminException;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for admin management of modules
 */
class ModuleAdminService
{
    public function __construct(
        private readonly ModuleRegistry $registry,
        private readonly UserModuleService $userModuleService,
    ) {
    }

    /**
     * Get all modules with admin-relevant information
     */
    public function getAllModules(): Collection
    {
        return Module::with([
            'userModules' => function ($query) {
                $query->where('is_enabled', true);
            }
        ])
            ->orderBy('name')
            ->get()
            ->map(fn(Module $module) => $this->formatModuleForAdmin($module));
    }

    /**
     * Get a single module with detailed information
     */
    public function getModule(string $moduleSlug): ?array
    {
        $module = Module::where('slug', $moduleSlug)->first();

        if (!$module) {
            return null;
        }

        return $this->formatModuleForAdmin($module, true);
    }

    /**
     * Update module settings (price, description, etc.)
     * 
     * @throws ModuleAdminException
     */
    public function updateModule(string $moduleSlug, array $data, ?int $adminId = null): Module
    {
        $module = Module::where('slug', $moduleSlug)->first();

        if (!$module) {
            throw ModuleAdminException::moduleNotFound($moduleSlug);
        }

        $oldData = $module->toArray();

        // Validate and filter allowed fields
        $allowedFields = [
            'name',
            'description',
            'long_description',
            'documentation',
            'changelog',
            'category',
            'icon',
            'screenshots',
            'pricing_type',
            'price',
            'subscription_period',
            'min_plan',
            'is_featured',
        ];

        $updateData = array_intersect_key($data, array_flip($allowedFields));

        // Validate pricing_type
        if (isset($updateData['pricing_type'])) {
            if (!in_array($updateData['pricing_type'], ['free', 'subscription', 'one_time'])) {
                throw ModuleAdminException::invalidPricingType($updateData['pricing_type']);
            }
        }

        // Validate subscription_period
        if (isset($updateData['subscription_period'])) {
            if (!in_array($updateData['subscription_period'], ['monthly', 'yearly'])) {
                throw ModuleAdminException::invalidSubscriptionPeriod($updateData['subscription_period']);
            }
        }

        $module->update($updateData);

        Log::info("Module updated by admin", [
            'module' => $moduleSlug,
            'admin_id' => $adminId,
            'changes' => array_keys($updateData),
        ]);

        return $module->fresh();
    }

    /**
     * Set global status (enable/disable for all users)
     */
    public function setGlobalStatus(string $moduleSlug, bool $isActive, ?int $adminId = null): void
    {
        $module = Module::where('slug', $moduleSlug)->first();

        if (!$module) {
            throw ModuleAdminException::moduleNotFound($moduleSlug);
        }

        $wasActive = $module->is_active;
        $module->update(['is_active' => $isActive]);

        // If disabling, notify affected users
        if ($wasActive && !$isActive) {
            $this->notifyUsersOfGlobalDisable($moduleSlug);
        }

        Log::info("Module global status changed", [
            'module' => $moduleSlug,
            'admin_id' => $adminId,
            'is_active' => $isActive,
            'was_active' => $wasActive,
        ]);
    }

    /**
     * Grant free access to a user
     */
    public function grantFreeAccess(
        User $user,
        string $moduleSlug,
        int $grantedBy,
        ?Carbon $expiresAt = null,
        string $reason = ''
    ): ModuleGrant {
        // Check if module exists
        $module = Module::where('slug', $moduleSlug)->first();
        if (!$module) {
            throw ModuleAdminException::moduleNotFound($moduleSlug);
        }

        // Create or update grant
        $grant = ModuleGrant::grantAccess(
            $user->id,
            $moduleSlug,
            $grantedBy,
            $reason,
            $expiresAt
        );

        Log::info("Free module access granted", [
            'module' => $moduleSlug,
            'user_id' => $user->id,
            'granted_by' => $grantedBy,
            'expires_at' => $expiresAt?->toDateTimeString(),
            'reason' => $reason,
        ]);

        return $grant;
    }

    /**
     * Revoke free access from a user
     */
    public function revokeGrant(User $user, string $moduleSlug, ?int $revokedBy = null): bool
    {
        $revoked = ModuleGrant::revokeAccess($user->id, $moduleSlug);

        if ($revoked) {
            // Check if user should still have access
            if (!$this->userModuleService->canAccess($user, $moduleSlug)) {
                // Disable the module for the user
                $this->userModuleService->disable($user, $moduleSlug);
            }

            Log::info("Free module access revoked", [
                'module' => $moduleSlug,
                'user_id' => $user->id,
                'revoked_by' => $revokedBy,
            ]);
        }

        return $revoked;
    }

    /**
     * Get all grants for a module
     */
    public function getModuleGrants(string $moduleSlug, int $perPage = 20): LengthAwarePaginator
    {
        return ModuleGrant::forModule($moduleSlug)
            ->with(['user:id,name,email,avatar', 'grantedByUser:id,name,email'])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(fn(ModuleGrant $grant) => [
                'id' => $grant->id,
                'user_id' => $grant->user_id,
                'user_name' => $grant->user?->name,
                'user_email' => $grant->user?->email,
                'user_avatar' => $grant->user?->avatar,
                'granted_by' => $grant->granted_by,
                'granted_by_name' => $grant->grantedByUser?->name,
                'reason' => $grant->reason,
                'expires_at' => $grant->expires_at?->toDateTimeString(),
                'is_active' => $grant->isActive(),
                'is_permanent' => $grant->isPermanent(),
                'created_at' => $grant->created_at->toDateTimeString(),
            ]);
    }

    /**
     * Get error logs for a module
     */
    public function getErrorLogs(string $moduleSlug, int $perPage = 50): LengthAwarePaginator
    {
        return ModuleErrorLog::forModule($moduleSlug)
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(fn(ModuleErrorLog $log) => [
                'id' => $log->id,
                'error_type' => $log->error_type,
                'error_type_label' => $log->error_type_label,
                'error_message' => $log->error_message,
                'stack_trace' => $log->stack_trace,
                'user_id' => $log->user_id,
                'user_name' => $log->user?->name,
                'user_email' => $log->user?->email,
                'context' => $log->context,
                'created_at' => $log->created_at->toDateTimeString(),
            ]);
    }

    /**
     * Get error logs for all modules
     */
    public function getAllErrorLogs(int $perPage = 50, ?string $errorType = null): LengthAwarePaginator
    {
        $query = ModuleErrorLog::with(['user:id,name,email', 'module:slug,name'])
            ->orderByDesc('created_at');

        if ($errorType) {
            $query->ofType($errorType);
        }

        return $query->paginate($perPage)
            ->through(fn(ModuleErrorLog $log) => [
                'id' => $log->id,
                'module_slug' => $log->module_slug,
                'module_name' => $log->module?->name ?? $log->module_slug,
                'error_type' => $log->error_type,
                'error_type_label' => $log->error_type_label,
                'error_message' => $log->error_message,
                'stack_trace' => $log->stack_trace,
                'user_id' => $log->user_id,
                'user_name' => $log->user?->name,
                'context' => $log->context,
                'created_at' => $log->created_at->toDateTimeString(),
            ]);
    }

    /**
     * Clean up old error logs
     */
    public function cleanupOldLogs(int $daysToKeep = 30): int
    {
        $deleted = ModuleErrorLog::cleanupOldLogs($daysToKeep);

        Log::info("Old module error logs cleaned up", [
            'days_to_keep' => $daysToKeep,
            'deleted_count' => $deleted,
        ]);

        return $deleted;
    }

    /**
     * Get global settings for a module
     */
    public function getGlobalSettings(string $moduleSlug): array
    {
        return ModuleGlobalSetting::getAllSettings($moduleSlug);
    }

    /**
     * Update global settings for a module
     */
    public function updateGlobalSettings(string $moduleSlug, array $settings, ?int $adminId = null): void
    {
        foreach ($settings as $key => $value) {
            ModuleGlobalSetting::setSettingValue($moduleSlug, $key, $value, $adminId);
        }

        Log::info("Module global settings updated", [
            'module' => $moduleSlug,
            'admin_id' => $adminId,
            'keys' => array_keys($settings),
        ]);
    }

    /**
     * Get users with a specific module
     */
    public function getModuleUsers(string $moduleSlug, int $perPage = 20, ?bool $enabledOnly = null): LengthAwarePaginator
    {
        $query = UserModule::forModule($moduleSlug)
            ->with('user:id,name,email,avatar');

        if ($enabledOnly !== null) {
            $query->where('is_enabled', $enabledOnly);
        }

        return $query->orderByDesc('enabled_at')
            ->paginate($perPage)
            ->through(fn(UserModule $userModule) => [
                'user_id' => $userModule->user_id,
                'user_name' => $userModule->user?->name,
                'user_email' => $userModule->user?->email,
                'user_avatar' => $userModule->user?->avatar,
                'is_enabled' => $userModule->is_enabled,
                'enabled_at' => $userModule->enabled_at?->toDateTimeString(),
                'disabled_at' => $userModule->disabled_at?->toDateTimeString(),
                'last_used_at' => $userModule->last_used_at?->toDateTimeString(),
                'usage_count' => $userModule->usage_count,
            ]);
    }

    /**
     * Force enable module for a user (admin action)
     */
    public function forceEnableForUser(User $user, string $moduleSlug, ?int $adminId = null): bool
    {
        $module = Module::where('slug', $moduleSlug)->first();
        if (!$module) {
            throw ModuleAdminException::moduleNotFound($moduleSlug);
        }

        $userModule = UserModule::firstOrNew([
            'user_id' => $user->id,
            'module_slug' => $moduleSlug,
        ]);

        $userModule->is_enabled = true;
        $userModule->enabled_at = now();
        $userModule->disabled_at = null;
        $userModule->save();

        Log::info("Module force enabled for user by admin", [
            'module' => $moduleSlug,
            'user_id' => $user->id,
            'admin_id' => $adminId,
        ]);

        return true;
    }

    /**
     * Force disable module for a user (admin action)
     */
    public function forceDisableForUser(User $user, string $moduleSlug, ?int $adminId = null): bool
    {
        $userModule = UserModule::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->first();

        if (!$userModule) {
            return false;
        }

        $userModule->disable();

        Log::info("Module force disabled for user by admin", [
            'module' => $moduleSlug,
            'user_id' => $user->id,
            'admin_id' => $adminId,
        ]);

        return true;
    }

    /**
     * Get error statistics for a module
     */
    public function getErrorStats(string $moduleSlug, int $days = 7): array
    {
        $errorCounts = ModuleErrorLog::getErrorCountsByType($moduleSlug, $days);
        $totalErrors = array_sum($errorCounts);

        $recentErrors = ModuleErrorLog::forModule($moduleSlug)
            ->recent($days)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn(ModuleErrorLog $log) => [
                'id' => $log->id,
                'error_type' => $log->error_type,
                'error_message' => $log->error_message,
                'created_at' => $log->created_at->toDateTimeString(),
            ]);

        return [
            'total_errors' => $totalErrors,
            'by_type' => $errorCounts,
            'recent' => $recentErrors,
            'period_days' => $days,
        ];
    }

    /**
     * Sync module from manifest (update database from module.json)
     * 
     * NOTE: For existing modules, we only update technical fields (version, hooks, permissions, etc.)
     * and do NOT overwrite admin-configurable fields (price, screenshots, long_description, etc.)
     */
    public function syncModuleFromManifest(string $moduleSlug): ?Module
    {
        $manifest = $this->registry->get($moduleSlug);

        if (!$manifest) {
            return null;
        }

        // Check if module already exists
        $existingModule = Module::where('slug', $moduleSlug)->first();

        if ($existingModule) {
            // For existing modules, only update technical fields from manifest
            // Do NOT overwrite admin-configurable fields (price, screenshots, descriptions, etc.)
            $existingModule->update([
                'version' => $manifest->version,
                'author' => $manifest->author,
                'dependencies' => $manifest->dependencies,
                'hooks' => $manifest->hooks,
                'permissions' => $manifest->permissions,
            ]);

            return $existingModule->fresh();
        }

        // For new modules, create with all fields from manifest
        return Module::create([
            'slug' => $moduleSlug,
            'name' => $manifest->name,
            'description' => $manifest->description,
            'version' => $manifest->version,
            'author' => $manifest->author,
            'category' => $manifest->category,
            'icon' => $manifest->icon,
            'dependencies' => $manifest->dependencies,
            'hooks' => $manifest->hooks,
            'permissions' => $manifest->permissions,
            'pricing_type' => $manifest->pricing?->type ?? 'free',
            'price' => $manifest->pricing?->price ?? 0,
            'subscription_period' => $manifest->pricing?->period ?? 'monthly',
            'min_plan' => $manifest->minPlan,
        ]);
    }

    /**
     * Sync all modules from manifests
     */
    public function syncAllModulesFromManifests(): array
    {
        $synced = [];
        $manifests = $this->registry->all();

        foreach ($manifests as $manifest) {
            $module = $this->syncModuleFromManifest($manifest->slug);
            if ($module) {
                $synced[] = $module->slug;
            }
        }

        Log::info("All modules synced from manifests", [
            'synced_count' => count($synced),
            'modules' => $synced,
        ]);

        return $synced;
    }

    /**
     * Format module data for admin view
     */
    private function formatModuleForAdmin(Module $module, bool $detailed = false): array
    {
        $data = [
            'slug' => $module->slug,
            'name' => $module->name,
            'description' => $module->description,
            'version' => $module->version,
            'author' => $module->author,
            'category' => $module->category,
            'category_label' => $module->category_label,
            'icon' => $module->icon,
            'pricing_type' => $module->pricing_type,
            'pricing_type_label' => $module->pricing_type_label,
            'price' => (float) $module->price,
            'formatted_price' => $module->formatted_price,
            'subscription_period' => $module->subscription_period,
            'min_plan' => $module->min_plan,
            'is_active' => $module->is_active,
            'is_featured' => $module->is_featured,
            'installs_count' => $module->installs_count,
            'rating' => (float) $module->rating,
            'created_at' => $module->created_at?->toDateTimeString(),
            'updated_at' => $module->updated_at?->toDateTimeString(),
        ];

        if ($detailed) {
            $data['long_description'] = $module->long_description;
            $data['documentation'] = $module->documentation;
            $data['changelog'] = $module->changelog;
            $data['screenshots'] = $module->screenshots;
            $data['dependencies'] = $module->dependencies;
            $data['hooks'] = $module->hooks;
            $data['permissions'] = $module->permissions;
            $data['active_users_count'] = UserModule::forModule($module->slug)->enabled()->count();
            $data['grants_count'] = ModuleGrant::forModule($module->slug)->active()->count();
            $data['error_count_7d'] = ModuleErrorLog::forModule($module->slug)->recent(7)->count();
        }

        return $data;
    }

    /**
     * Notify users when module is globally disabled
     */
    private function notifyUsersOfGlobalDisable(string $moduleSlug): void
    {
        // Get all users with this module enabled
        $userModules = UserModule::forModule($moduleSlug)
            ->enabled()
            ->with('user')
            ->get();

        foreach ($userModules as $userModule) {
            // TODO: Send notification to user about module being disabled
            // This could be implemented using the existing notification system
            Log::info("User should be notified about module global disable", [
                'module' => $moduleSlug,
                'user_id' => $userModule->user_id,
            ]);
        }
    }
}
