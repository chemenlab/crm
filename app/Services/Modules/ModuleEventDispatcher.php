<?php

namespace App\Services\Modules;

use App\Models\ModuleErrorLog;
use App\Models\UserModule;
use Illuminate\Support\Facades\Log;

/**
 * Event dispatcher for module events
 * Allows modules to publish and subscribe to events
 */
class ModuleEventDispatcher
{
    /**
     * Core system events that modules can subscribe to
     */
    public const CORE_EVENTS = [
        'appointment.created',
        'appointment.updated',
        'appointment.completed',
        'appointment.cancelled',
        'client.created',
        'client.updated',
        'client.deleted',
        'payment.received',
        'payment.refunded',
        'user.registered',
        'user.subscription.changed',
    ];

    /**
     * Event subscribers
     * Structure: [event => [moduleSlug => [handlers]]]
     */
    private array $subscribers = [];

    /**
     * Active modules cache (for filtering)
     */
    private array $activeModulesCache = [];

    /**
     * Subscribe a module to an event
     */
    public function subscribe(string $event, string $moduleSlug, callable $handler): void
    {
        if (!isset($this->subscribers[$event])) {
            $this->subscribers[$event] = [];
        }

        if (!isset($this->subscribers[$event][$moduleSlug])) {
            $this->subscribers[$event][$moduleSlug] = [];
        }

        $this->subscribers[$event][$moduleSlug][] = $handler;

        Log::debug("Module subscribed to event", [
            'event' => $event,
            'module' => $moduleSlug,
        ]);
    }

    /**
     * Dispatch an event to all subscribers
     * Only notifies modules that are active for the user (if user context provided)
     */
    public function dispatch(string $event, array $payload = [], ?int $userId = null): void
    {
        if (!isset($this->subscribers[$event])) {
            return;
        }

        // Get active modules for user
        $activeModules = $userId !== null 
            ? $this->getActiveModulesForUser($userId) 
            : null;

        foreach ($this->subscribers[$event] as $moduleSlug => $handlers) {
            // Skip if module is not active for user
            if ($activeModules !== null && !in_array($moduleSlug, $activeModules)) {
                continue;
            }

            // Check if this is a module event and the source module is inactive
            if ($this->isModuleEvent($event)) {
                $sourceModule = $this->getSourceModuleFromEvent($event);
                if ($sourceModule !== null && $activeModules !== null && !in_array($sourceModule, $activeModules)) {
                    continue;
                }
            }

            foreach ($handlers as $handler) {
                try {
                    call_user_func($handler, $payload, $event);
                } catch (\Throwable $e) {
                    $this->logEventError($moduleSlug, $event, $e, $userId);
                    
                    Log::error("Event handler failed", [
                        'event' => $event,
                        'module' => $moduleSlug,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }


    /**
     * Dispatch a module-specific event
     * Format: module.{slug}.{event}
     */
    public function dispatchModuleEvent(string $moduleSlug, string $eventName, array $payload = [], ?int $userId = null): void
    {
        $event = "module.{$moduleSlug}.{$eventName}";
        $this->dispatch($event, $payload, $userId);
    }

    /**
     * Unsubscribe a module from all events
     */
    public function unsubscribeModule(string $moduleSlug): void
    {
        foreach ($this->subscribers as $event => &$modules) {
            unset($modules[$moduleSlug]);
        }

        Log::debug("Module unsubscribed from all events: {$moduleSlug}");
    }

    /**
     * Unsubscribe a module from a specific event
     */
    public function unsubscribeFromEvent(string $event, string $moduleSlug): void
    {
        if (isset($this->subscribers[$event][$moduleSlug])) {
            unset($this->subscribers[$event][$moduleSlug]);
        }
    }

    /**
     * Get all subscribers for an event
     */
    public function getSubscribers(string $event): array
    {
        if (!isset($this->subscribers[$event])) {
            return [];
        }

        return array_keys($this->subscribers[$event]);
    }

    /**
     * Check if an event has subscribers
     */
    public function hasSubscribers(string $event): bool
    {
        return isset($this->subscribers[$event]) && !empty($this->subscribers[$event]);
    }

    /**
     * Check if a module is subscribed to an event
     */
    public function isSubscribed(string $event, string $moduleSlug): bool
    {
        return isset($this->subscribers[$event][$moduleSlug]);
    }

    /**
     * Get all events a module is subscribed to
     */
    public function getModuleSubscriptions(string $moduleSlug): array
    {
        $events = [];
        foreach ($this->subscribers as $event => $modules) {
            if (isset($modules[$moduleSlug])) {
                $events[] = $event;
            }
        }
        return $events;
    }

    /**
     * Get all registered events
     */
    public function getRegisteredEvents(): array
    {
        return array_keys($this->subscribers);
    }

    /**
     * Check if event is a core system event
     */
    public function isCoreEvent(string $event): bool
    {
        return in_array($event, self::CORE_EVENTS);
    }

    /**
     * Check if event is a module event
     */
    public function isModuleEvent(string $event): bool
    {
        return str_starts_with($event, 'module.');
    }

    /**
     * Get source module from module event name
     */
    public function getSourceModuleFromEvent(string $event): ?string
    {
        if (!$this->isModuleEvent($event)) {
            return null;
        }

        $parts = explode('.', $event);
        return $parts[1] ?? null;
    }

    /**
     * Clear all subscribers (useful for testing)
     */
    public function clear(): void
    {
        $this->subscribers = [];
        $this->activeModulesCache = [];
    }

    /**
     * Clear active modules cache
     */
    public function clearCache(): void
    {
        $this->activeModulesCache = [];
    }

    /**
     * Get active modules for a user
     */
    private function getActiveModulesForUser(int $userId): array
    {
        if (isset($this->activeModulesCache[$userId])) {
            return $this->activeModulesCache[$userId];
        }

        $modules = UserModule::where('user_id', $userId)
            ->where('is_enabled', true)
            ->pluck('module_slug')
            ->toArray();

        $this->activeModulesCache[$userId] = $modules;

        return $modules;
    }

    /**
     * Log event error to database
     */
    private function logEventError(string $moduleSlug, string $event, \Throwable $e, ?int $userId): void
    {
        try {
            ModuleErrorLog::create([
                'module_slug' => $moduleSlug,
                'error_type' => 'event_error',
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => $userId,
                'context' => [
                    'event' => $event,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
            ]);
        } catch (\Throwable $logError) {
            Log::error("Failed to log event error", [
                'module' => $moduleSlug,
                'event' => $event,
                'original_error' => $e->getMessage(),
                'log_error' => $logError->getMessage(),
            ]);
        }
    }

    /**
     * Get summary of all subscriptions
     */
    public function getSummary(): array
    {
        $summary = [];
        foreach ($this->subscribers as $event => $modules) {
            $summary[$event] = array_keys($modules);
        }
        return $summary;
    }

    /**
     * Count total subscriptions
     */
    public function countSubscriptions(): int
    {
        $count = 0;
        foreach ($this->subscribers as $modules) {
            foreach ($modules as $handlers) {
                $count += count($handlers);
            }
        }
        return $count;
    }
}
