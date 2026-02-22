<?php

namespace App\Http\Middleware;

use App\Models\Module;
use App\Services\Modules\ModuleRegistry;
use App\Services\Modules\UserModuleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check module permissions and subscription plan requirements.
 * 
 * This middleware verifies:
 * 1. User has the required permission for the module action
 * 2. User's subscription plan meets the module's minimum plan requirement
 * 
 * Usage: 
 * - middleware('module.permission:module-slug,permission-name')
 * - middleware('module.permission:reviews,reviews.delete')
 * 
 * Requirements: 5.2, 5.3
 */
class CheckModulePermission
{
    public function __construct(
        protected ModuleRegistry $registry,
        protected UserModuleService $userModuleService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param string $moduleSlug The module slug
     * @param string|null $permission The permission to check (optional)
     */
    public function handle(Request $request, Closure $next, string $moduleSlug, ?string $permission = null): Response
    {
        $user = $request->user();

        // User must be authenticated
        if (!$user) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Необходима авторизация',
                ], 401);
            }
            return redirect()->route('login');
        }

        // Get module manifest
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            return $this->notFoundResponse($request);
        }

        // Check minimum plan requirement
        if (!$this->userModuleService->checkMinPlanRequirement($user, $manifest)) {
            return $this->planRequiredResponse($request, $manifest->minPlan);
        }

        // Check specific permission if provided
        if ($permission !== null) {
            if (!$this->hasModulePermission($user, $moduleSlug, $permission)) {
                return $this->forbiddenResponse($request, $permission);
            }
        }

        return $next($request);
    }

    /**
     * Check if user has a specific module permission
     */
    protected function hasModulePermission($user, string $moduleSlug, string $permission): bool
    {
        // Get module manifest to check if permission is defined
        $manifest = $this->registry->get($moduleSlug);
        if ($manifest === null) {
            return false;
        }

        // If module doesn't define permissions, allow all
        if (empty($manifest->permissions)) {
            return true;
        }

        // Check if the permission is defined in the module
        if (!in_array($permission, $manifest->permissions)) {
            // Permission not defined in module, allow by default
            return true;
        }

        // Check if user has the permission using Laravel's permission system
        // If Spatie permissions is installed and user has the method
        if (method_exists($user, 'hasPermissionTo')) {
            try {
                return $user->hasPermissionTo($permission);
            } catch (\Throwable $e) {
                // Permission doesn't exist in the system, allow by default
                return true;
            }
        }

        // If no permission system is available, allow by default
        // Module-specific permission checks can be implemented in the module itself
        return true;
    }

    /**
     * Return a 404 response
     */
    protected function notFoundResponse(Request $request): Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Страница не найдена',
            ], 404);
        }

        abort(404);
    }

    /**
     * Return a 403 response for missing permission
     */
    protected function forbiddenResponse(Request $request, string $permission): Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Недостаточно прав для выполнения этого действия',
                'required_permission' => $permission,
            ], 403);
        }

        abort(403, 'Недостаточно прав для выполнения этого действия');
    }

    /**
     * Return a 403 response for plan requirement
     */
    protected function planRequiredResponse(Request $request, ?string $requiredPlan): Response
    {
        $message = $requiredPlan 
            ? "Для доступа к этой функции необходим тарифный план \"{$requiredPlan}\" или выше"
            : 'Для доступа к этой функции необходима активная подписка';

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'required_plan' => $requiredPlan,
            ], 403);
        }

        return redirect()->route('subscriptions.index')
            ->with('error', $message);
    }
}
