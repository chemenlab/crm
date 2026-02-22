<?php

namespace App\Http\Middleware;

use App\Services\Subscription\UsageLimitService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUsageLimit
{
    public function __construct(
        protected UsageLimitService $usageLimitService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param string $resource Resource type to check (appointments, clients, services, etc.)
     */
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Проверяем лимит
        if (!$this->usageLimitService->checkLimit($user, $resource)) {
            $plan = $user->getCurrentPlan();
            $limit = $plan ? $plan->getLimit($resource) : 0;

            return back()->withErrors([
                'limit' => "Достигнут лимит по ресурсу \"{$resource}\". Текущий лимит: {$limit}. Обновите тариф для увеличения лимитов."
            ]);
        }

        return $next($request);
    }
}
