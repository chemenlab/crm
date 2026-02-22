<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Subscription\FeatureAccessService;
use Illuminate\Http\Request;

class FeatureAccessController extends Controller
{
    public function __construct(
        protected FeatureAccessService $featureAccessService
    ) {}

    /**
     * Get all features access status
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'features' => $this->featureAccessService->getAllFeaturesStatus($user),
            'resources' => $this->featureAccessService->getAllResourcesStatus($user),
            'subscription' => [
                'has_active' => $this->featureAccessService->hasActiveSubscription($user),
                'is_trial' => $this->featureAccessService->isInTrial($user),
                'trial_days_remaining' => $this->featureAccessService->getTrialDaysRemaining($user),
                'plan' => $user->getCurrentPlan()?->only(['name', 'slug', 'price']),
                'status' => $user->currentSubscription?->status,
            ],
        ]);
    }

    /**
     * Check specific feature access
     */
    public function checkFeature(Request $request, string $feature)
    {
        $user = $request->user();

        $status = $this->featureAccessService->getFeatureStatus($user, $feature);

        // Логируем попытку доступа
        $this->featureAccessService->logAccessAttempt($user, $feature, $status['has_access']);

        return response()->json($status);
    }

    /**
     * Check specific resource access
     */
    public function checkResource(Request $request, string $resource)
    {
        $user = $request->user();

        return response()->json(
            $this->featureAccessService->getResourceStatus($user, $resource)
        );
    }

    /**
     * Get upgrade suggestion for feature
     */
    public function upgradeSuggestion(Request $request, string $feature)
    {
        $user = $request->user();

        $suggestion = $this->featureAccessService->getUpgradeSuggestion($user, $feature);

        if (!$suggestion) {
            return response()->json([
                'needs_upgrade' => false,
            ]);
        }

        return response()->json([
            'needs_upgrade' => true,
            'suggested_plan' => $suggestion,
        ]);
    }
}
