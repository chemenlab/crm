<?php

namespace App\Services\Modules;

use App\Models\User;
use App\Models\UserModule;
use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\Exceptions\InvalidManifestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Central registry for all modules in the system
 * Implements Singleton pattern through Laravel's service container
 */
class ModuleRegistry
{
    /**
     * Cache key for modules list
     */
    private const CACHE_KEY = 'modules:registry';

    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    /**
     * Registered modules
     */
    private Collection $modules;

    /**
     * Whether modules have been discovered
     */
    private bool $discovered = false;

    public function __construct(
        private readonly ModuleManifestValidator $validator,
        private readonly string $modulesPath = 'app/Modules',
    ) {
        $this->modules = collect();
    }

    /**
     * Discover and register all modules from the modules directory
     */
    public function discover(): void
    {
        // Try to load from cache first
        $cached = Cache::get(self::CACHE_KEY);
        
        if ($cached !== null) {
            $this->modules = collect($cached)->map(function ($data) {
                return ModuleManifest::fromArray($data['manifest'], $data['path']);
            });
            $this->discovered = true;
            return;
        }

        $this->modules = collect();
        $basePath = base_path($this->modulesPath);

        if (!File::isDirectory($basePath)) {
            Log::info("Modules directory does not exist: {$basePath}");
            $this->discovered = true;
            return;
        }

        $directories = File::directories($basePath);

        foreach ($directories as $directory) {
            $manifestPath = $directory . '/module.json';

            if (!File::exists($manifestPath)) {
                Log::debug("No module.json found in: {$directory}");
                continue;
            }

            try {
                $json = File::get($manifestPath);
                $manifest = $this->validator->parseAndValidate($json, $directory);
                $this->modules->put($manifest->slug, $manifest);
                
                Log::info("Module registered: {$manifest->slug}", [
                    'name' => $manifest->name,
                    'version' => $manifest->version,
                    'path' => $directory,
                ]);
            } catch (InvalidManifestException $e) {
                Log::error("Failed to register module from {$directory}", [
                    'error' => $e->getMessage(),
                    'errors' => $e->getErrors(),
                ]);
            }
        }

        // Cache the discovered modules
        $this->cacheModules();
        $this->discovered = true;
    }


    /**
     * Get all registered modules
     */
    public function all(): Collection
    {
        $this->ensureDiscovered();
        return $this->modules;
    }

    /**
     * Get a module by slug
     */
    public function get(string $slug): ?ModuleManifest
    {
        $this->ensureDiscovered();
        return $this->modules->get($slug);
    }

    /**
     * Check if a module exists
     */
    public function has(string $slug): bool
    {
        $this->ensureDiscovered();
        return $this->modules->has($slug);
    }

    /**
     * Get active modules for a user
     */
    public function getActiveForUser(User $user): Collection
    {
        $this->ensureDiscovered();

        $enabledSlugs = UserModule::where('user_id', $user->id)
            ->where('is_enabled', true)
            ->pluck('module_slug')
            ->toArray();

        return $this->modules->filter(function (ModuleManifest $manifest) use ($enabledSlugs) {
            return in_array($manifest->slug, $enabledSlugs);
        });
    }

    /**
     * Get modules by category
     */
    public function getByCategory(string $category): Collection
    {
        $this->ensureDiscovered();
        
        return $this->modules->filter(function (ModuleManifest $manifest) use ($category) {
            return $manifest->category === $category;
        });
    }

    /**
     * Get free modules
     */
    public function getFree(): Collection
    {
        $this->ensureDiscovered();
        
        return $this->modules->filter(function (ModuleManifest $manifest) {
            return $manifest->isFree();
        });
    }

    /**
     * Get paid modules
     */
    public function getPaid(): Collection
    {
        $this->ensureDiscovered();
        
        return $this->modules->filter(function (ModuleManifest $manifest) {
            return !$manifest->isFree();
        });
    }

    /**
     * Get modules with specific hook
     */
    public function getWithHook(string $hookPoint): Collection
    {
        $this->ensureDiscovered();
        
        return $this->modules->filter(function (ModuleManifest $manifest) use ($hookPoint) {
            return isset($manifest->hooks[$hookPoint]) && $manifest->hooks[$hookPoint];
        });
    }

    /**
     * Clear the cache and re-discover modules
     */
    public function refresh(): void
    {
        Cache::forget(self::CACHE_KEY);
        $this->modules = collect();
        $this->discovered = false;
        $this->discover();
    }

    /**
     * Clear the cache
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
        $this->discovered = false;
    }

    /**
     * Get count of registered modules
     */
    public function count(): int
    {
        $this->ensureDiscovered();
        return $this->modules->count();
    }

    /**
     * Check if modules have been discovered
     */
    public function isDiscovered(): bool
    {
        return $this->discovered;
    }

    /**
     * Ensure modules have been discovered
     */
    private function ensureDiscovered(): void
    {
        if (!$this->discovered) {
            $this->discover();
        }
    }

    /**
     * Cache the discovered modules
     */
    private function cacheModules(): void
    {
        $cacheData = $this->modules->map(function (ModuleManifest $manifest) {
            return [
                'manifest' => $manifest->toArray(),
                'path' => $manifest->getPath(),
            ];
        })->toArray();

        Cache::put(self::CACHE_KEY, $cacheData, self::CACHE_TTL);
    }

    /**
     * Register a module manually (useful for testing)
     */
    public function register(ModuleManifest $manifest): void
    {
        $this->modules->put($manifest->slug, $manifest);
    }

    /**
     * Unregister a module (useful for testing)
     */
    public function unregister(string $slug): void
    {
        $this->modules->forget($slug);
    }
}
