<?php

namespace App\Providers;

use App\Services\Modules\HookManager;
use App\Services\Modules\ModuleEventDispatcher;
use App\Services\Modules\ModuleLoader;
use App\Services\Modules\ModuleManifestValidator;
use App\Services\Modules\ModuleRegistry;
use App\Services\Modules\ModuleSettingsService;
use App\Services\Modules\UserModuleService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register ModuleManifestValidator as singleton
        $this->app->singleton(ModuleManifestValidator::class, function ($app) {
            return new ModuleManifestValidator();
        });

        // Register ModuleRegistry as singleton
        $this->app->singleton(ModuleRegistry::class, function ($app) {
            return new ModuleRegistry(
                $app->make(ModuleManifestValidator::class),
                'app/Modules'
            );
        });

        // Register ModuleLoader as singleton
        $this->app->singleton(ModuleLoader::class, function ($app) {
            return new ModuleLoader(
                $app->make(ModuleRegistry::class)
            );
        });

        // Register HookManager as singleton
        $this->app->singleton(HookManager::class, function ($app) {
            return new HookManager();
        });

        // Register ModuleEventDispatcher as singleton
        $this->app->singleton(ModuleEventDispatcher::class, function ($app) {
            return new ModuleEventDispatcher();
        });

        // Register ModuleSettingsService as singleton
        $this->app->singleton(ModuleSettingsService::class, function ($app) {
            return new ModuleSettingsService(
                $app->make(ModuleRegistry::class)
            );
        });

        // Register UserModuleService as singleton
        $this->app->singleton(UserModuleService::class, function ($app) {
            return new UserModuleService(
                $app->make(ModuleRegistry::class),
                $app->make(ModuleLoader::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Discover modules on boot
        $registry = $this->app->make(ModuleRegistry::class);
        $registry->discover();

        // Register module middleware aliases
        $this->registerMiddlewareAliases();

        // Sync modules to database (only if not running in console for migrations)
        $this->syncModulesToDatabase($registry);

        // Load routes for all discovered modules
        // Routes are loaded for all modules, but middleware controls access
        $this->loadModuleRoutes($registry);
    }

    /**
     * Sync discovered modules to database
     * 
     * This ensures that all modules from the filesystem are registered
     * in the database for display in the catalog and admin panel.
     * 
     * NOTE: For existing modules, we only update technical fields (version, hooks, permissions)
     * and do NOT overwrite admin-configurable fields (price, screenshots, descriptions, etc.)
     */
    protected function syncModulesToDatabase(ModuleRegistry $registry): void
    {
        // Skip during migrations or when database is not ready
        if ($this->app->runningInConsole() && !$this->app->runningUnitTests()) {
            // Check if we're running migrations
            $argv = $_SERVER['argv'] ?? [];
            $command = $argv[1] ?? '';
            if (in_array($command, ['migrate', 'migrate:fresh', 'migrate:reset', 'migrate:rollback', 'migrate:install'])) {
                return;
            }
        }

        try {
            // Check if modules table exists
            if (!\Illuminate\Support\Facades\Schema::hasTable('modules')) {
                return;
            }

            foreach ($registry->all() as $manifest) {
                $existingModule = \App\Models\Module::where('slug', $manifest->slug)->first();

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
                } else {
                    // For new modules, create with all fields from manifest
                    \App\Models\Module::create([
                        'slug' => $manifest->slug,
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
            }
        } catch (\Throwable $e) {
            // Silently fail if database is not ready
            \Illuminate\Support\Facades\Log::debug("Module sync skipped: " . $e->getMessage());
        }
    }

    /**
     * Register middleware aliases for module system
     */
    protected function registerMiddlewareAliases(): void
    {
        $router = $this->app['router'];

        $router->aliasMiddleware('module.active', \App\Http\Middleware\CheckModuleActive::class);
        $router->aliasMiddleware('module.permission', \App\Http\Middleware\CheckModulePermission::class);
    }

    /**
     * Load routes for all discovered modules
     * 
     * Routes are loaded for all modules, but the CheckModuleActive middleware
     * controls access based on whether the module is enabled for the user.
     * This allows routes to be registered at boot time while still enforcing
     * per-user module activation.
     */
    protected function loadModuleRoutes(ModuleRegistry $registry): void
    {
        $loader = $this->app->make(ModuleLoader::class);

        foreach ($registry->all() as $manifest) {
            try {
                // Load module (service provider, hooks, etc.)
                $loader->load($manifest);

                // Load routes with module.active middleware
                $this->loadRoutesForModule($manifest);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to load routes for module: {$manifest->slug}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Load routes for a specific module with proper prefixes and middleware
     */
    protected function loadRoutesForModule(\App\Services\Modules\DTO\ModuleManifest $manifest): void
    {
        if (!$manifest->hasRoutes()) {
            return;
        }

        // Load web routes with prefix /app/modules/{slug}
        // Note: module.active middleware is applied inside the route file where needed
        // The main module page (/) should be accessible without module being active
        $webRoutesPath = $manifest->getWebRoutesPath();
        if ($webRoutesPath !== null && file_exists($webRoutesPath)) {
            Route::middleware(['web', 'auth'])
                ->prefix("app/modules/{$manifest->slug}")
                ->name("modules.{$manifest->slug}.")
                ->group($webRoutesPath);
        }

        // Load API routes with prefix /api/modules/{slug}
        // Note: Public routes within the module should use withoutMiddleware('auth:sanctum')
        $apiRoutesPath = $manifest->getApiRoutesPath();
        if ($apiRoutesPath !== null && file_exists($apiRoutesPath)) {
            Route::middleware(['api'])
                ->prefix("api/modules/{$manifest->slug}")
                ->name("api.modules.{$manifest->slug}.")
                ->group($apiRoutesPath);
        }
    }
}
