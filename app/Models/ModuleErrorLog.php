<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleErrorLog extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    protected $fillable = [
        'module_slug',
        'error_type',
        'error_message',
        'stack_trace',
        'user_id',
        'context',
        'created_at',
    ];

    protected $casts = [
        'context' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Error type constants
     */
    public const TYPE_HOOK_ERROR = 'hook_error';
    public const TYPE_ROUTE_ERROR = 'route_error';
    public const TYPE_MIGRATION_ERROR = 'migration_error';
    public const TYPE_LOAD_ERROR = 'load_error';
    public const TYPE_EVENT_ERROR = 'event_error';
    public const TYPE_RUNTIME_ERROR = 'runtime_error';

    /**
     * Get the module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_slug', 'slug');
    }

    /**
     * Get the user (if error occurred in user context)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get error type label
     */
    public function getErrorTypeLabelAttribute(): string
    {
        return match ($this->error_type) {
            self::TYPE_HOOK_ERROR => 'Ошибка хука',
            self::TYPE_ROUTE_ERROR => 'Ошибка маршрута',
            self::TYPE_MIGRATION_ERROR => 'Ошибка миграции',
            self::TYPE_LOAD_ERROR => 'Ошибка загрузки',
            self::TYPE_EVENT_ERROR => 'Ошибка события',
            self::TYPE_RUNTIME_ERROR => 'Ошибка выполнения',
            default => 'Неизвестная ошибка',
        };
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleSlug)
    {
        return $query->where('module_slug', $moduleSlug);
    }

    /**
     * Scope for specific error type
     */
    public function scopeOfType($query, string $errorType)
    {
        return $query->where('error_type', $errorType);
    }

    /**
     * Scope for specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for date range
     */
    public function scopeForDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /**
     * Scope for recent errors (last N days)
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Log an error
     */
    public static function logError(
        string $moduleSlug,
        string $errorType,
        string $errorMessage,
        ?string $stackTrace = null,
        ?int $userId = null,
        ?array $context = null
    ): static {
        return static::create([
            'module_slug' => $moduleSlug,
            'error_type' => $errorType,
            'error_message' => $errorMessage,
            'stack_trace' => $stackTrace,
            'user_id' => $userId,
            'context' => $context,
            'created_at' => now(),
        ]);
    }

    /**
     * Log hook error
     */
    public static function logHookError(
        string $moduleSlug,
        string $hookPoint,
        \Throwable $exception,
        ?int $userId = null
    ): static {
        return static::logError(
            $moduleSlug,
            self::TYPE_HOOK_ERROR,
            $exception->getMessage(),
            $exception->getTraceAsString(),
            $userId,
            ['hook_point' => $hookPoint]
        );
    }

    /**
     * Log route error
     */
    public static function logRouteError(
        string $moduleSlug,
        string $route,
        \Throwable $exception,
        ?int $userId = null
    ): static {
        return static::logError(
            $moduleSlug,
            self::TYPE_ROUTE_ERROR,
            $exception->getMessage(),
            $exception->getTraceAsString(),
            $userId,
            ['route' => $route]
        );
    }

    /**
     * Log migration error
     */
    public static function logMigrationError(
        string $moduleSlug,
        string $migration,
        \Throwable $exception
    ): static {
        return static::logError(
            $moduleSlug,
            self::TYPE_MIGRATION_ERROR,
            $exception->getMessage(),
            $exception->getTraceAsString(),
            null,
            ['migration' => $migration]
        );
    }

    /**
     * Log load error
     */
    public static function logLoadError(
        string $moduleSlug,
        \Throwable $exception
    ): static {
        return static::logError(
            $moduleSlug,
            self::TYPE_LOAD_ERROR,
            $exception->getMessage(),
            $exception->getTraceAsString()
        );
    }

    /**
     * Log event error
     */
    public static function logEventError(
        string $moduleSlug,
        string $eventName,
        \Throwable $exception,
        ?int $userId = null
    ): static {
        return static::logError(
            $moduleSlug,
            self::TYPE_EVENT_ERROR,
            $exception->getMessage(),
            $exception->getTraceAsString(),
            $userId,
            ['event' => $eventName]
        );
    }

    /**
     * Clean up old logs
     */
    public static function cleanupOldLogs(int $daysToKeep = 30): int
    {
        return static::where('created_at', '<', now()->subDays($daysToKeep))->delete();
    }

    /**
     * Get error count by type for module
     */
    public static function getErrorCountsByType(string $moduleSlug, int $days = 7): array
    {
        return static::forModule($moduleSlug)
            ->recent($days)
            ->selectRaw('error_type, COUNT(*) as count')
            ->groupBy('error_type')
            ->pluck('count', 'error_type')
            ->toArray();
    }
}
