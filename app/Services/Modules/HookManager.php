<?php

namespace App\Services\Modules;

use App\Models\ModuleErrorLog;
use App\Models\User;
use App\Models\UserModule;
use Illuminate\Support\Facades\Log;

/**
 * Manager for module hook points (extension points)
 */
class HookManager
{
    /**
     * Registered hooks
     * Structure: [hookPoint => [moduleSlug => [priority => callback]]]
     */
    private array $hooks = [];

    /**
     * Available hook points in the system
     */
    public const HOOK_POINTS = [
        'sidebar.menu',
        'sidebar.menu.bottom',
        'dashboard.widgets',
        'dashboard.stats',
        'client.card.tabs',
        'client.card.actions',
        'appointment.form.fields',
        'appointment.card.info',
        'settings.sections',
        'public.page.sections',
        'public.page.booking',
    ];

    /**
     * Register a hook from a module
     */
    public function register(
        string $hookPoint,
        string $moduleSlug,
        callable $callback,
        int $priority = 10
    ): void {
        if (!isset($this->hooks[$hookPoint])) {
            $this->hooks[$hookPoint] = [];
        }

        if (!isset($this->hooks[$hookPoint][$moduleSlug])) {
            $this->hooks[$hookPoint][$moduleSlug] = [];
        }

        $this->hooks[$hookPoint][$moduleSlug][$priority] = $callback;

        Log::debug("Hook registered", [
            'hookPoint' => $hookPoint,
            'module' => $moduleSlug,
            'priority' => $priority,
        ]);
    }

    /**
     * Execute all hooks for a hook point
     * Only executes hooks for modules that are active for the user
     */
    public function execute(string $hookPoint, array $context = [], ?User $user = null): array
    {
        $results = [];

        if (!isset($this->hooks[$hookPoint])) {
            return $results;
        }

        // Get active module slugs for user
        $activeModules = $this->getActiveModuleSlugs($user);

        // Collect all callbacks with their priorities
        $callbacks = [];
        foreach ($this->hooks[$hookPoint] as $moduleSlug => $priorityCallbacks) {
            // Skip if module is not active for user
            if ($user !== null && !in_array($moduleSlug, $activeModules)) {
                continue;
            }

            foreach ($priorityCallbacks as $priority => $callback) {
                $callbacks[] = [
                    'moduleSlug' => $moduleSlug,
                    'priority' => $priority,
                    'callback' => $callback,
                ];
            }
        }

        // Sort by priority (lower number = higher priority)
        usort($callbacks, fn($a, $b) => $a['priority'] <=> $b['priority']);

        // Execute callbacks
        foreach ($callbacks as $item) {
            try {
                $result = call_user_func($item['callback'], $context);
                
                if ($result !== null) {
                    $results[] = [
                        'module' => $item['moduleSlug'],
                        'data' => $result,
                    ];
                }
            } catch (\Throwable $e) {
                $this->logHookError($item['moduleSlug'], $hookPoint, $e, $user?->id);
                
                Log::error("Hook execution failed", [
                    'hookPoint' => $hookPoint,
                    'module' => $item['moduleSlug'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }


    /**
     * Execute hooks and return flat array of results
     */
    public function executeFlat(string $hookPoint, array $context = [], ?User $user = null): array
    {
        $results = $this->execute($hookPoint, $context, $user);
        
        return array_map(fn($item) => $item['data'], $results);
    }

    /**
     * Remove all hooks for a module
     */
    public function removeModule(string $moduleSlug): void
    {
        foreach ($this->hooks as $hookPoint => &$modules) {
            unset($modules[$moduleSlug]);
        }

        Log::debug("Hooks removed for module: {$moduleSlug}");
    }

    /**
     * Get registered hooks for a hook point
     */
    public function getRegistered(string $hookPoint): array
    {
        if (!isset($this->hooks[$hookPoint])) {
            return [];
        }

        $registered = [];
        foreach ($this->hooks[$hookPoint] as $moduleSlug => $priorityCallbacks) {
            foreach ($priorityCallbacks as $priority => $callback) {
                $registered[] = [
                    'module' => $moduleSlug,
                    'priority' => $priority,
                ];
            }
        }

        // Sort by priority
        usort($registered, fn($a, $b) => $a['priority'] <=> $b['priority']);

        return $registered;
    }

    /**
     * Check if a hook point has any registered hooks
     */
    public function hasHooks(string $hookPoint): bool
    {
        return isset($this->hooks[$hookPoint]) && !empty($this->hooks[$hookPoint]);
    }

    /**
     * Check if a module has registered a hook
     */
    public function moduleHasHook(string $moduleSlug, string $hookPoint): bool
    {
        return isset($this->hooks[$hookPoint][$moduleSlug]);
    }

    /**
     * Get all hook points with registered hooks
     */
    public function getActiveHookPoints(): array
    {
        return array_keys(array_filter($this->hooks, fn($modules) => !empty($modules)));
    }

    /**
     * Get all modules registered for a hook point
     */
    public function getModulesForHook(string $hookPoint): array
    {
        if (!isset($this->hooks[$hookPoint])) {
            return [];
        }

        return array_keys($this->hooks[$hookPoint]);
    }

    /**
     * Clear all hooks (useful for testing)
     */
    public function clear(): void
    {
        $this->hooks = [];
    }

    /**
     * Check if hook point is valid
     */
    public function isValidHookPoint(string $hookPoint): bool
    {
        return in_array($hookPoint, self::HOOK_POINTS);
    }

    /**
     * Get all available hook points
     */
    public function getAvailableHookPoints(): array
    {
        return self::HOOK_POINTS;
    }

    /**
     * Get active module slugs for a user
     */
    private function getActiveModuleSlugs(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        return UserModule::where('user_id', $user->id)
            ->where('is_enabled', true)
            ->pluck('module_slug')
            ->toArray();
    }

    /**
     * Log hook error to database
     */
    private function logHookError(string $moduleSlug, string $hookPoint, \Throwable $e, ?int $userId): void
    {
        try {
            ModuleErrorLog::create([
                'module_slug' => $moduleSlug,
                'error_type' => 'hook_error',
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => $userId,
                'context' => [
                    'hook_point' => $hookPoint,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
            ]);
        } catch (\Throwable $logError) {
            Log::error("Failed to log hook error", [
                'module' => $moduleSlug,
                'hook' => $hookPoint,
                'original_error' => $e->getMessage(),
                'log_error' => $logError->getMessage(),
            ]);
        }
    }

    /**
     * Count total registered hooks
     */
    public function countHooks(): int
    {
        $count = 0;
        foreach ($this->hooks as $modules) {
            foreach ($modules as $priorities) {
                $count += count($priorities);
            }
        }
        return $count;
    }

    /**
     * Get hooks summary for debugging
     */
    public function getSummary(): array
    {
        $summary = [];
        foreach ($this->hooks as $hookPoint => $modules) {
            $summary[$hookPoint] = array_keys($modules);
        }
        return $summary;
    }
}
