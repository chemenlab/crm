<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Lazy-evaluate expensive data only when Inertia actually needs it
        $unreadTicketsCount = 0;
        $activeModulesCount = 0;
        $subscription = null;
        $usageStats = null;

        if ($user) {
            // Optimized: count tickets with unread messages using a subquery
            $unreadTicketsCount = \App\Models\SupportTicket::where('user_id', $user->id)
                ->where('status', '!=', 'closed')
                ->where(function ($query) {
                    $query->whereHas('publicMessages', function ($q) {
                        $q->where('author_type', '!=', \App\Models\User::class)
                          ->whereColumn('created_at', '>', 'support_tickets.last_viewed_by_user_at');
                    })
                    ->orWhere(function ($q) {
                        $q->whereNull('last_viewed_by_user_at')
                          ->whereHas('publicMessages', function ($sq) {
                              $sq->where('author_type', '!=', \App\Models\User::class);
                          });
                    });
                })
                ->count();

            // Подсчитываем активные модули пользователя
            try {
                $activeModulesCount = $user->userModules()->where('is_enabled', true)->count();
            } catch (\Exception $e) {
                $activeModulesCount = 0;
            }

            // Get subscription data
            $currentSubscription = $user->currentSubscription;
            if ($currentSubscription) {
                $currentSubscription->load('plan');
                $subscription = [
                    'plan' => [
                        'name' => $currentSubscription->plan->name,
                        'price' => $currentSubscription->plan->price,
                        'billing_period' => $currentSubscription->plan->billing_period,
                    ],
                    'status' => $currentSubscription->status,
                    'current_period_end' => $currentSubscription->current_period_end?->toIso8601String(),
                    'trial_ends_at' => $currentSubscription->trial_ends_at?->toIso8601String(),
                ];

                $plan = $currentSubscription->plan;

                $clientsLimit = $plan->getLimit('clients');
                $servicesLimit = $plan->getLimit('services');
                $appointmentsLimit = $plan->getLimit('appointments');

                $clientsCount = $user->clients()->count();
                $servicesCount = $user->services()->count();
                $appointmentsCount = $user->appointments()
                    ->whereMonth('start_time', now()->month)
                    ->whereYear('start_time', now()->year)
                    ->count();

                $usageStats = [
                    'clients' => [
                        'current' => $clientsCount,
                        'limit' => $clientsLimit,
                        'unlimited' => $clientsLimit === -1,
                    ],
                    'services' => [
                        'current' => $servicesCount,
                        'limit' => $servicesLimit,
                        'unlimited' => $servicesLimit === -1,
                    ],
                    'appointments' => [
                        'current' => $appointmentsCount,
                        'limit' => $appointmentsLimit,
                        'unlimited' => $appointmentsLimit === -1,
                    ],
                ];
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'city' => $user->city,
                    'timezone' => $user->timezone,
                    'tax_rate' => $user->tax_rate,
                    'instagram' => $user->instagram,
                    'vk' => $user->vk,
                    'telegram' => $user->telegram,
                    'whatsapp' => $user->whatsapp,
                    'has_password' => (bool) $user->password,
                    'telegram_id' => $user->telegram_id,
                    'telegram_username' => $user->telegram_username,
                    'telegram_verification_code' => $user->telegram_verification_code,
                    'telegram_verified_at' => $user->telegram_verified_at?->toIso8601String(),
                    'currentSubscription' => $user->currentSubscription ? [
                        'id' => $user->currentSubscription->id,
                        'status' => $user->currentSubscription->status,
                        'plan_name' => $user->currentSubscription->plan->name ?? null,
                        'ends_at' => $user->currentSubscription->ends_at?->toIso8601String(),
                    ] : null,
                ] : null,
            ],
            'unreadTicketsCount' => $unreadTicketsCount,
            'activeModulesCount' => $activeModulesCount,
            'subscription' => $subscription,
            'usage_stats' => $usageStats,
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
        ];
    }
}
