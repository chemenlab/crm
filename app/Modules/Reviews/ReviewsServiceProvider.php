<?php

namespace App\Modules\Reviews;

use App\Modules\Reviews\Models\Review;
use App\Modules\Reviews\Services\ReviewService;
use App\Services\Modules\HookManager;
use Illuminate\Support\ServiceProvider;

class ReviewsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(ReviewService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerHooks();
        $this->registerPolicies();
    }

    /**
     * Register module hooks
     */
    private function registerHooks(): void
    {
        /** @var HookManager $hookManager */
        $hookManager = $this->app->make(HookManager::class);

        // Sidebar menu hook
        $hookManager->register('sidebar.menu', 'reviews', function (array $context) {
            return [
                'title' => 'Отзывы',
                'url' => '/app/modules/reviews',
                'icon' => 'star',
                'badge' => $this->getPendingReviewsCount($context['user'] ?? null),
            ];
        }, 50);

        // Client card tabs hook
        $hookManager->register('client.card.tabs', 'reviews', function (array $context) {
            return [
                'id' => 'reviews',
                'title' => 'Отзывы',
                'icon' => 'star',
                'component' => 'modules/reviews/ClientReviewsTab',
            ];
        }, 10);

        // Public page sections hook
        $hookManager->register('public.page.sections', 'reviews', function (array $context) {
            return [
                'id' => 'reviews',
                'title' => 'Отзывы клиентов',
                'component' => 'modules/reviews/PublicReviewsSection',
                'order' => 50,
            ];
        }, 50);

        // Settings sections hook
        $hookManager->register('settings.sections', 'reviews', function (array $context) {
            return [
                'id' => 'reviews',
                'title' => 'Настройки отзывов',
                'icon' => 'star',
                'url' => '/app/modules/reviews/settings',
            ];
        }, 60);
    }

    /**
     * Register policies
     */
    private function registerPolicies(): void
    {
        // Policy will be registered in AuthServiceProvider
        // For now, we use simple authorization in controllers
    }

    /**
     * Get pending reviews count for badge
     */
    private function getPendingReviewsCount($user): ?int
    {
        if ($user === null) {
            return null;
        }

        $count = Review::forUser($user->id)->pending()->count();

        return $count > 0 ? $count : null;
    }
}
