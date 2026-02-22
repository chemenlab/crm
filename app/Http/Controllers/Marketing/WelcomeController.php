<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\LandingSetting;
use App\Models\News;
use App\Models\SubscriptionPlan;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $landingSettings = LandingSetting::getAllSettings();

        // Get active subscription plans for pricing section
        $plans = SubscriptionPlan::active()
            ->ordered()
            ->get()
            ->map(function ($plan) {
                // Features in SubscriptionPlan model is a JSON that contains both 'limits' and 'features' keys
                $planFeatures = $plan->features ?? [];

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => (float) $plan->price,
                    'price_formatted' => number_format($plan->price) . ' ₽',
                    'limits' => $planFeatures['limits'] ?? [],
                    'features' => $planFeatures['features'] ?? [],
                    'is_featured' => $plan->slug === 'professional',
                ];
            });

        // Get latest published news for landing page
        $news = News::published()
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'slug' => $item->slug,
                    'excerpt' => $item->excerpt,
                    'category' => $item->category,
                    'category_color' => $item->category_color,
                    'cover_image_url' => $item->cover_image_url,
                    'formatted_date' => $item->formatted_date,
                ];
            });

        return Inertia::render('Marketing/Welcome', [
            'landingSettings' => $landingSettings,
            'plans' => $plans,
            'news' => $news,
        ]);
    }
}

