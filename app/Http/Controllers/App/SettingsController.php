<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\OnboardingProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Load user schedule
        $schedule = $user->userSchedules()->orderBy('day_of_week')->get();

        // Load notification settings
        $notifications = $user->notificationSettings ?? $user->notificationSettings()->create();

        // Load OAuth providers
        $oauthProviders = [
            'google' => [
                'connected' => $user->hasOAuthProvider('google'),
                'email' => $user->getOAuthProvider('google')?->provider_user_id ?? null,
            ],
            'yandex' => [
                'connected' => $user->hasOAuthProvider('yandex'),
                'email' => $user->getOAuthProvider('yandex')?->provider_user_id ?? null,
            ],
        ];

        // Load 2FA data
        $twoFactor = $user->twoFactorAuth;
        $twoFactorData = [
            'enabled' => $user->hasTwoFactorEnabled(),
            'enabledAt' => $twoFactor?->enabled_at?->format('d.m.Y H:i'),
            'unusedRecoveryCodesCount' => $twoFactor?->getUnusedRecoveryCodesCount() ?? 0,
        ];

        // Load portfolio items
        $portfolioItems = $user->portfolioItems()
            ->where('is_visible', true)
            ->orderBy('sort_order')
            ->get();

        // Calculate remaining portfolio slots
        $plan = $user->getCurrentPlan();
        $maxPortfolioItems = $plan ? ($plan->max_portfolio_images ?? 10) : 10;
        $remainingSlots = $maxPortfolioItems === -1 ? -1 : max(0, $maxPortfolioItems - $portfolioItems->count());

        return Inertia::render('App/Settings/Index', [
            'user' => $user,
            'schedule' => $schedule,
            'notifications' => $notifications,
            'oauthProviders' => $oauthProviders,
            'twoFactor' => $twoFactorData,
            'portfolioItems' => $portfolioItems,
            'remainingPortfolioSlots' => $remainingSlots,
            'bookingSettings' => [
                'slot_step' => $user->slot_step ?? 30,
                'buffer_time' => $user->buffer_time ?? 0,
            ],
        ]);
    }

    /**
     * Update public page settings
     */
    public function updatePublicPage(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'slug' => 'sometimes|nullable|string|max:255|unique:users,slug,' . $user->id,
            'site_title' => 'sometimes|nullable|string|max:255',
            'site_description' => 'sometimes|nullable|string|max:1000',
            'site_bio' => 'sometimes|nullable|string|max:1000',
            'site_location' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
            'social_telegram' => 'sometimes|nullable|string|max:255',
            'social_vk' => 'sometimes|nullable|string|max:255',
            'social_whatsapp' => 'sometimes|nullable|string|max:255',
        ]);

        // Handle social links separately - only update if any social field was sent
        if ($request->has('social_telegram') || $request->has('social_vk') || $request->has('social_whatsapp')) {
            $socialLinks = $user->social_links ?? [];

            if ($request->has('social_telegram')) {
                $socialLinks['telegram'] = $validated['social_telegram'] ?? '';
                unset($validated['social_telegram']);
            }
            if ($request->has('social_vk')) {
                $socialLinks['vk'] = $validated['social_vk'] ?? '';
                unset($validated['social_vk']);
            }
            if ($request->has('social_whatsapp')) {
                $socialLinks['whatsapp'] = $validated['social_whatsapp'] ?? '';
                unset($validated['social_whatsapp']);
            }

            $validated['social_links'] = $socialLinks;
        } else {
            // Remove social fields from validated if they weren't sent
            unset($validated['social_telegram'], $validated['social_vk'], $validated['social_whatsapp']);
        }

        // Only update fields that were actually sent in the request
        $fieldsToUpdate = array_filter($validated, function ($key) use ($request) {
            return $request->has($key);
        }, ARRAY_FILTER_USE_KEY);

        // Always include social_links if it was set
        if (isset($validated['social_links'])) {
            $fieldsToUpdate['social_links'] = $validated['social_links'];
        }

        $user->update($fieldsToUpdate);

        // Track onboarding progress if slug, site_title or site_description is set
        try {
            if (!empty($validated['slug']) || !empty($validated['site_title']) || !empty($validated['site_description'])) {
                app(OnboardingProgressService::class)->trackStepCompletion(
                    $user,
                    'public_page_setup'
                );
            }
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $user->id,
                'step' => 'public_page_setup',
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Настройки публичной страницы обновлены');
    }
}
