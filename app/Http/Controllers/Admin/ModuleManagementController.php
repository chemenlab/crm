<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Module;
use App\Models\User;
use App\Services\Modules\Exceptions\ModuleAdminException;
use App\Services\Modules\ModuleAdminService;
use App\Services\Modules\ModuleStatsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ModuleManagementController extends Controller
{
    public function __construct(
        private readonly ModuleAdminService $adminService,
        private readonly ModuleStatsService $statsService,
    ) {
    }

    /**
     * Display list of all modules
     */
    public function index(Request $request)
    {
        $modules = $this->adminService->getAllModules();

        // Apply filters
        if ($request->filled('category')) {
            $modules = $modules->filter(fn($m) => $m['category'] === $request->category);
        }

        if ($request->filled('pricing_type')) {
            $modules = $modules->filter(fn($m) => $m['pricing_type'] === $request->pricing_type);
        }

        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $modules = $modules->filter(fn($m) => $m['is_active'] === $isActive);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $modules = $modules->filter(
                fn($m) =>
                str_contains(strtolower($m['name']), $search) ||
                str_contains(strtolower($m['slug']), $search) ||
                str_contains(strtolower($m['description'] ?? ''), $search)
            );
        }

        return Inertia::render('Admin/Modules/Index', [
            'modules' => $modules->values(),
            'filters' => $request->only(['category', 'pricing_type', 'status', 'search']),
            'categories' => $this->getCategories(),
        ]);
    }

    /**
     * Display module details
     */
    public function show(string $slug)
    {
        $module = $this->adminService->getModule($slug);

        if (!$module) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        // Get stats for this module
        $stats = $this->statsService->getModuleStats($slug);

        // Get recent errors
        $errorStats = $this->adminService->getErrorStats($slug);

        return Inertia::render('Admin/Modules/Show', [
            'module' => $module,
            'stats' => $stats,
            'errorStats' => $errorStats,
        ]);
    }

    /**
     * Display module edit form
     */
    public function edit(string $slug)
    {
        $module = $this->adminService->getModule($slug);

        if (!$module) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        return Inertia::render('Admin/Modules/Edit', [
            'module' => $module,
            'categories' => $this->getCategories(),
        ]);
    }

    /**
     * Update module settings
     */
    public function update(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'long_description' => 'sometimes|nullable|string',
            'documentation' => 'sometimes|nullable|string',
            'changelog' => 'sometimes|nullable|string',
            'category' => 'sometimes|string|in:finance,marketing,communication,analytics,productivity,integration,other',
            'icon' => 'sometimes|nullable|string|max:100',
            'screenshots' => 'sometimes|nullable|array',
            'pricing_type' => 'sometimes|string|in:free,subscription,one_time',
            'price' => 'sometimes|numeric|min:0',
            'subscription_period' => 'sometimes|string|in:monthly,yearly',
            'min_plan' => 'sometimes|nullable|string',
            'is_featured' => 'sometimes|boolean',
        ]);

        try {
            $module = $this->adminService->updateModule($slug, $validated, $admin?->id);

            // Log activity
            if ($admin) {
                AdminActivityLog::log(
                    $admin->id,
                    'update_module',
                    'Module',
                    $module->id,
                    $validated,
                    "Обновлен модуль: {$slug}"
                );
            }

            return redirect()->route('admin.modules.show', $slug)
                ->with('success', 'Модуль успешно обновлен');
        } catch (ModuleAdminException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Toggle module global status
     */
    public function toggleStatus(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        try {
            $this->adminService->setGlobalStatus($slug, $validated['is_active'], $admin?->id);

            // Log activity
            if ($admin) {
                $action = $validated['is_active'] ? 'enable_module' : 'disable_module';
                AdminActivityLog::log(
                    $admin->id,
                    $action,
                    'Module',
                    null,
                    ['slug' => $slug, 'is_active' => $validated['is_active']],
                    ($validated['is_active'] ? 'Включен' : 'Отключен') . " модуль: {$slug}"
                );
            }

            $status = $validated['is_active'] ? 'включен' : 'отключен';
            return back()->with('success', "Модуль {$status}");
        } catch (ModuleAdminException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Display module statistics
     */
    public function stats(Request $request)
    {
        $period = $request->get('period', 'month');

        $from = match ($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };
        $to = Carbon::now();

        $overview = $this->statsService->getOverviewStats();
        $topByInstalls = $this->statsService->getTopModules(10);
        $topByRevenue = $this->statsService->getTopModulesByRevenue(10, $from, $to);
        $chartData = $this->statsService->getOverallChartData($from, $to);

        return Inertia::render('Admin/Modules/Stats', [
            'overview' => $overview,
            'topByInstalls' => $topByInstalls,
            'topByRevenue' => $topByRevenue,
            'chartData' => $chartData,
            'period' => $period,
        ]);
    }

    /**
     * Display module-specific statistics
     */
    public function moduleStats(Request $request, string $slug)
    {
        $period = $request->get('period', 'month');

        $from = match ($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };
        $to = Carbon::now();

        $stats = $this->statsService->getModuleStats($slug, $from, $to);

        if (empty($stats)) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        $users = $this->statsService->getModuleUsers($slug);
        $purchaseHistory = $this->statsService->getModulePurchaseHistory($slug);

        return Inertia::render('Admin/Modules/ModuleStats', [
            'stats' => $stats,
            'users' => $users,
            'purchaseHistory' => $purchaseHistory,
            'period' => $period,
        ]);
    }

    /**
     * Display module users
     */
    public function users(Request $request, string $slug)
    {
        $enabledOnly = $request->has('enabled_only') ? $request->boolean('enabled_only') : null;
        $users = $this->adminService->getModuleUsers($slug, 20, $enabledOnly);

        $module = $this->adminService->getModule($slug);

        if (!$module) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        return Inertia::render('Admin/Modules/Users', [
            'module' => $module,
            'users' => $users,
            'filters' => $request->only(['enabled_only']),
        ]);
    }

    /**
     * Display grants for a module
     */
    public function grants(Request $request, string $slug)
    {
        $grants = $this->adminService->getModuleGrants($slug);

        $module = $this->adminService->getModule($slug);

        if (!$module) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        return Inertia::render('Admin/Modules/Grants', [
            'module' => $module,
            'grants' => $grants,
        ]);
    }

    /**
     * Grant free access to a user
     */
    public function grantAccess(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'expires_at' => 'nullable|date|after:now',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $expiresAt = $validated['expires_at'] ? Carbon::parse($validated['expires_at']) : null;

        try {
            $grant = $this->adminService->grantFreeAccess(
                $user,
                $slug,
                $admin?->id ?? 0,
                $expiresAt,
                $validated['reason'] ?? ''
            );

            // Log activity
            if ($admin) {
                AdminActivityLog::log(
                    $admin->id,
                    'grant_module_access',
                    'ModuleGrant',
                    $grant->id,
                    [
                        'module_slug' => $slug,
                        'user_id' => $user->id,
                        'expires_at' => $expiresAt?->toDateTimeString(),
                        'reason' => $validated['reason'] ?? '',
                    ],
                    "Выдан бесплатный доступ к модулю {$slug} пользователю {$user->email}"
                );
            }

            return back()->with('success', 'Бесплатный доступ выдан');
        } catch (ModuleAdminException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Revoke free access from a user
     */
    public function revokeAccess(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        $revoked = $this->adminService->revokeGrant($user, $slug, $admin?->id);

        if ($revoked) {
            // Log activity
            if ($admin) {
                AdminActivityLog::log(
                    $admin->id,
                    'revoke_module_access',
                    'ModuleGrant',
                    null,
                    [
                        'module_slug' => $slug,
                        'user_id' => $user->id,
                    ],
                    "Отозван бесплатный доступ к модулю {$slug} у пользователя {$user->email}"
                );
            }

            return back()->with('success', 'Бесплатный доступ отозван');
        }

        return back()->withErrors(['error' => 'Грант не найден']);
    }

    /**
     * Display error logs for a module
     */
    public function errorLogs(Request $request, string $slug)
    {
        $errorLogs = $this->adminService->getErrorLogs($slug);
        $errorStats = $this->adminService->getErrorStats($slug);

        $module = $this->adminService->getModule($slug);

        if (!$module) {
            return redirect()->route('admin.modules.index')
                ->with('error', 'Модуль не найден');
        }

        return Inertia::render('Admin/Modules/ErrorLogs', [
            'module' => $module,
            'errorLogs' => $errorLogs,
            'errorStats' => $errorStats,
        ]);
    }

    /**
     * Display all error logs
     */
    public function allErrorLogs(Request $request)
    {
        $errorType = $request->get('error_type');
        $errorLogs = $this->adminService->getAllErrorLogs(50, $errorType);

        return Inertia::render('Admin/Modules/AllErrorLogs', [
            'errorLogs' => $errorLogs,
            'filters' => $request->only(['error_type']),
            'errorTypes' => $this->getErrorTypes(),
        ]);
    }

    /**
     * Clear old error logs
     */
    public function clearErrorLogs(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'days_to_keep' => 'sometimes|integer|min:1|max:365',
        ]);

        $daysToKeep = $validated['days_to_keep'] ?? 30;
        $deleted = $this->adminService->cleanupOldLogs($daysToKeep);

        // Log activity
        if ($admin) {
            AdminActivityLog::log(
                $admin->id,
                'clear_module_error_logs',
                'ModuleErrorLog',
                null,
                ['days_to_keep' => $daysToKeep, 'deleted_count' => $deleted],
                "Очищены логи ошибок модулей старше {$daysToKeep} дней ({$deleted} записей)"
            );
        }

        return back()->with('success', "Удалено {$deleted} записей логов");
    }

    /**
     * Sync modules from manifests
     */
    public function syncModules()
    {
        $admin = Auth::guard('admin')->user();

        $synced = $this->adminService->syncAllModulesFromManifests();

        // Log activity
        if ($admin) {
            AdminActivityLog::log(
                $admin->id,
                'sync_modules',
                'Module',
                null,
                ['synced' => $synced],
                "Синхронизированы модули из манифестов: " . count($synced) . " модулей"
            );
        }

        return back()->with('success', 'Модули синхронизированы: ' . count($synced));
    }

    /**
     * Force enable module for a user
     */
    public function forceEnableForUser(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        try {
            $this->adminService->forceEnableForUser($user, $slug, $admin?->id);

            // Log activity
            if ($admin) {
                AdminActivityLog::log(
                    $admin->id,
                    'force_enable_module',
                    'UserModule',
                    null,
                    ['module_slug' => $slug, 'user_id' => $user->id],
                    "Принудительно включен модуль {$slug} для пользователя {$user->email}"
                );
            }

            return back()->with('success', 'Модуль включен для пользователя');
        } catch (ModuleAdminException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Force disable module for a user
     */
    public function forceDisableForUser(Request $request, string $slug)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        $disabled = $this->adminService->forceDisableForUser($user, $slug, $admin?->id);

        if ($disabled) {
            // Log activity
            if ($admin) {
                AdminActivityLog::log(
                    $admin->id,
                    'force_disable_module',
                    'UserModule',
                    null,
                    ['module_slug' => $slug, 'user_id' => $user->id],
                    "Принудительно отключен модуль {$slug} для пользователя {$user->email}"
                );
            }

            return back()->with('success', 'Модуль отключен для пользователя');
        }

        return back()->withErrors(['error' => 'Модуль не был включен для этого пользователя']);
    }

    /**
     * Search users for grant dialog
     */
    public function searchUsers(Request $request)
    {
        $search = $request->get('q', '');

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        $users = User::where('email', 'like', "%{$search}%")
            ->orWhere('name', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'email', 'avatar']);

        return response()->json($users);
    }

    /**
     * Get available categories
     */
    private function getCategories(): array
    {
        return [
            ['value' => 'finance', 'label' => 'Финансы'],
            ['value' => 'marketing', 'label' => 'Маркетинг'],
            ['value' => 'communication', 'label' => 'Коммуникации'],
            ['value' => 'analytics', 'label' => 'Аналитика'],
            ['value' => 'productivity', 'label' => 'Продуктивность'],
            ['value' => 'integration', 'label' => 'Интеграции'],
            ['value' => 'other', 'label' => 'Другое'],
        ];
    }

    /**
     * Get error types for filter
     */
    private function getErrorTypes(): array
    {
        return [
            ['value' => 'hook_error', 'label' => 'Ошибка хука'],
            ['value' => 'route_error', 'label' => 'Ошибка маршрута'],
            ['value' => 'migration_error', 'label' => 'Ошибка миграции'],
            ['value' => 'load_error', 'label' => 'Ошибка загрузки'],
            ['value' => 'event_error', 'label' => 'Ошибка события'],
            ['value' => 'runtime_error', 'label' => 'Ошибка выполнения'],
        ];
    }
}
