<?php

namespace App\Http\Middleware;

use App\Services\Modules\ModuleRegistry;
use App\Services\Modules\UserModuleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if a module is active for the current user.
 * 
 * Returns 404 for disabled modules to hide their existence.
 * This middleware should be applied to all module routes.
 * 
 * Usage: middleware('module.active:module-slug')
 * 
 * Requirements: 4.4, 5.1, 5.4
 */
class CheckModuleActive
{
    public function __construct(
        protected ModuleRegistry $registry,
        protected UserModuleService $userModuleService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param string $moduleSlug The module slug to check
     */
    public function handle(Request $request, Closure $next, string $moduleSlug): Response
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

        // Check if module exists in registry
        if (!$this->registry->has($moduleSlug)) {
            return $this->notFoundResponse($request);
        }

        // Check if module is globally active
        $manifest = $this->registry->get($moduleSlug);
        try {
            $module = \App\Models\Module::where('slug', $moduleSlug)->first();
            if ($module && !$module->isGloballyActive()) {
                return $this->notFoundResponse($request);
            }
        } catch (\Illuminate\Database\QueryException $e) {
            // Table doesn't exist, skip global check
        }

        // Check if module is enabled for this user
        if (!$this->userModuleService->isEnabled($user, $moduleSlug)) {
            return $this->notFoundResponse($request);
        }

        // Record module usage
        $this->userModuleService->recordUsage($user, $moduleSlug);

        return $next($request);
    }

    /**
     * Return a 404 response for disabled/non-existent modules
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
}
