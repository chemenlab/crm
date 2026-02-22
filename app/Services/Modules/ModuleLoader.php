<?php

namespace App\Services\Modules;

use App\Models\ModuleErrorLog;
use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\Exceptions\ModuleLoadException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/**
 * Loader for module resources (routes, migrations, service providers)
 */
class ModuleLoader
{
    /**
     * Loaded modules
     */
    private array $loadedModules = [];

    /**
     * Modules with executed migrations
     */
    private array $migratedModules = [];

    public function __construct(
        private readonly ModuleRegistry $registry,
    ) {}

    /**
     * Load a module (routes, service provider)
     */
    public function load(ModuleManifest $manifest): void
    {
        if ($this->isLoaded($manifest->slug)) {
            return;
        }

        try {
            // Load service provider if exists
            $this->loadServiceProvider($manifest);

            // Load routes
            $this->loadRoutes($manifest);

            $this->loadedModules[$manifest->slug] = true;

            Log::info("Module loaded: {$manifest->slug}");
        } catch (\Throwable $e) {
            $this->logError($manifest->slug, 'load_error', $e);
            throw new ModuleLoadException(
                "Failed to load module {$manifest->slug}: {$e->getMessage()}",
                $manifest->slug,
                $e
            );
        }
    }

    /**
     * Unload a module
     */
    public function unload(string $slug): void
    {
        if (!$this->isLoaded($slug)) {
            return;
        }

        // Note: In Laravel, we can't truly unload routes at runtime
        // This marks the module as unloaded for our tracking
        unset($this->loadedModules[$slug]);

        Log::info("Module unloaded: {$slug}");
    }

    /**
     * Check if a module is loaded
     */
    public function isLoaded(string $slug): bool
    {
        return isset($this->loadedModules[$slug]);
    }

    /**
     * Run migrations for a module
     */
    public function runMigrations(string $slug): void
    {
        $manifest = $this->registry->get($slug);

        if ($manifest === null) {
            throw new ModuleLoadException("Module not found: {$slug}", $slug);
        }

        if (!$manifest->hasMigrations()) {
            return;
        }

        $migrationsPath = $manifest->getMigrationsPath();

        if ($migrationsPath === null || !File::isDirectory($migrationsPath)) {
            Log::debug("No migrations directory for module: {$slug}");
            return;
        }

        try {
            Artisan::call('migrate', [
                '--path' => $this->getRelativeMigrationsPath($manifest),
                '--force' => true,
            ]);

            $this->migratedModules[$slug] = true;

            Log::info("Migrations executed for module: {$slug}");
        } catch (\Throwable $e) {
            $this->logError($slug, 'migration_error', $e);
            throw new ModuleLoadException(
                "Failed to run migrations for module {$slug}: {$e->getMessage()}",
                $slug,
                $e
            );
        }
    }


    /**
     * Rollback migrations for a module
     */
    public function rollbackMigrations(string $slug): void
    {
        $manifest = $this->registry->get($slug);

        if ($manifest === null) {
            throw new ModuleLoadException("Module not found: {$slug}", $slug);
        }

        if (!$manifest->hasMigrations()) {
            return;
        }

        try {
            Artisan::call('migrate:rollback', [
                '--path' => $this->getRelativeMigrationsPath($manifest),
                '--force' => true,
            ]);

            unset($this->migratedModules[$slug]);

            Log::info("Migrations rolled back for module: {$slug}");
        } catch (\Throwable $e) {
            $this->logError($slug, 'migration_error', $e);
            throw new ModuleLoadException(
                "Failed to rollback migrations for module {$slug}: {$e->getMessage()}",
                $slug,
                $e
            );
        }
    }

    /**
     * Check if migrations have been run for a module
     */
    public function hasMigrated(string $slug): bool
    {
        return isset($this->migratedModules[$slug]);
    }

    /**
     * Load service provider for a module
     */
    private function loadServiceProvider(ModuleManifest $manifest): void
    {
        $providerClass = $this->getServiceProviderClass($manifest);

        if ($providerClass === null) {
            return;
        }

        if (!class_exists($providerClass)) {
            Log::debug("Service provider not found for module: {$manifest->slug}");
            return;
        }

        app()->register($providerClass);

        Log::debug("Service provider registered for module: {$manifest->slug}");
    }

    /**
     * Load routes for a module
     */
    private function loadRoutes(ModuleManifest $manifest): void
    {
        if (!$manifest->hasRoutes()) {
            return;
        }

        // Load web routes
        $webRoutesPath = $manifest->getWebRoutesPath();
        if ($webRoutesPath !== null && File::exists($webRoutesPath)) {
            Route::middleware(['web', 'auth'])
                ->prefix("app/modules/{$manifest->slug}")
                ->name("modules.{$manifest->slug}.")
                ->group($webRoutesPath);

            Log::debug("Web routes loaded for module: {$manifest->slug}");
        }

        // Load API routes
        $apiRoutesPath = $manifest->getApiRoutesPath();
        if ($apiRoutesPath !== null && File::exists($apiRoutesPath)) {
            Route::middleware(['api', 'auth:sanctum'])
                ->prefix("api/modules/{$manifest->slug}")
                ->name("api.modules.{$manifest->slug}.")
                ->group($apiRoutesPath);

            Log::debug("API routes loaded for module: {$manifest->slug}");
        }
    }

    /**
     * Get service provider class name for a module
     */
    private function getServiceProviderClass(ModuleManifest $manifest): ?string
    {
        $moduleName = $this->slugToClassName($manifest->slug);
        $providerClass = "App\\Modules\\{$moduleName}\\{$moduleName}ServiceProvider";

        return class_exists($providerClass) ? $providerClass : null;
    }

    /**
     * Convert slug to class name
     */
    private function slugToClassName(string $slug): string
    {
        return str_replace(' ', '', ucwords(str_replace('-', ' ', $slug)));
    }

    /**
     * Get relative migrations path for artisan command
     */
    private function getRelativeMigrationsPath(ModuleManifest $manifest): string
    {
        $path = $manifest->getPath();
        $basePath = base_path();

        // Remove base path to get relative path
        $relativePath = str_replace($basePath . '/', '', $path);

        return $relativePath . '/' . $manifest->migrations;
    }

    /**
     * Log error to module error logs
     */
    private function logError(string $slug, string $type, \Throwable $e, ?int $userId = null): void
    {
        try {
            ModuleErrorLog::create([
                'module_slug' => $slug,
                'error_type' => $type,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => $userId,
                'context' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
            ]);
        } catch (\Throwable $logError) {
            Log::error("Failed to log module error", [
                'module' => $slug,
                'original_error' => $e->getMessage(),
                'log_error' => $logError->getMessage(),
            ]);
        }
    }

    /**
     * Get all loaded modules
     */
    public function getLoadedModules(): array
    {
        return array_keys($this->loadedModules);
    }

    /**
     * Load all active modules for a user
     */
    public function loadActiveModulesForUser(\App\Models\User $user): void
    {
        $activeModules = $this->registry->getActiveForUser($user);

        foreach ($activeModules as $manifest) {
            try {
                $this->load($manifest);
            } catch (ModuleLoadException $e) {
                Log::error("Failed to load module for user", [
                    'module' => $manifest->slug,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
