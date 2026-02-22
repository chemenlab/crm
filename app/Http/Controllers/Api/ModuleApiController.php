<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Services\Modules\Exceptions\ModuleSettingsException;
use App\Services\Modules\HookManager;
use App\Services\Modules\ModuleSettingsService;
use App\Services\Modules\UserModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleApiController extends Controller
{
    public function __construct(
        protected UserModuleService $userModuleService,
        protected HookManager $hookManager,
        protected ModuleSettingsService $settingsService,
    ) {}

    /**
     * Get all modules with user status
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $modules = Module::active()->get()->map(function ($module) use ($user) {
            $status = $this->userModuleService->getAccessStatus($user, $module->slug);
            
            return [
                'id' => $module->id,
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

        $userModules = $this->userModuleService->getUserModules($user)->map(function ($userModule) use ($user) {
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

        return response()->json([
            'modules' => $modules,
            'userModules' => $userModules,
        ]);
    }

    /**
     * Get active modules for current user
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeModules = $this->userModuleService->getEnabledModules($user);

        return response()->json([
            'activeModules' => $activeModules->pluck('module_slug')->toArray(),
        ]);
    }

    /**
     * Get hooks data for a specific hook point
     */
    public function hooks(Request $request, string $hookPoint): JsonResponse
    {
        $user = $request->user();
        
        // Validate hook point
        if (!$this->hookManager->isValidHookPoint($hookPoint)) {
            return response()->json([
                'error' => 'Invalid hook point',
            ], 400);
        }

        // Get context from request
        $context = $request->input('context', []);
        
        // Execute hooks and get results
        $results = $this->hookManager->execute($hookPoint, $context, $user);

        return response()->json([
            'hookPoint' => $hookPoint,
            'results' => $results,
        ]);
    }

    /**
     * Check if user can access a module
     */
    public function checkAccess(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $status = $this->userModuleService->getAccessStatus($user, $slug);

        return response()->json($status);
    }

    /**
     * Get module settings
     */
    public function getSettings(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        
        // Check if module is enabled for user
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return response()->json([
                'error' => 'Модуль не включён',
            ], 403);
        }

        $schema = $this->settingsService->getSchema($slug);
        $values = $this->settingsService->getAll($user, $slug);

        return response()->json([
            'schema' => $schema,
            'settings' => $values,
        ]);
    }

    /**
     * Save module settings
     */
    public function saveSettings(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        
        // Check if module is enabled for user
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return response()->json([
                'error' => 'Модуль не включён',
            ], 403);
        }

        $request->validate([
            'settings' => 'required|array',
        ]);

        try {
            $this->settingsService->setMany($user, $slug, $request->settings);
            
            return response()->json([
                'success' => true,
                'message' => 'Настройки сохранены',
            ]);

        } catch (ModuleSettingsException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'errors' => $e->getErrors(),
            ], 422);
        }
    }

    /**
     * Reset module settings to defaults
     */
    public function resetSettings(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        
        // Check if module is enabled for user
        $status = $this->userModuleService->getAccessStatus($user, $slug);
        if (!$status['is_enabled']) {
            return response()->json([
                'error' => 'Модуль не включён',
            ], 403);
        }

        try {
            $defaults = $this->settingsService->resetToDefaults($user, $slug);
            
            return response()->json([
                'success' => true,
                'message' => 'Настройки сброшены',
                'settings' => $defaults,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
