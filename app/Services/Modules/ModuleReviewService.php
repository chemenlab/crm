<?php

namespace App\Services\Modules;

use App\Models\Module;
use App\Models\ModulePurchase;
use App\Models\ModuleReview;
use App\Models\User;
use App\Models\UserModule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for managing module reviews
 */
class ModuleReviewService
{
    /**
     * Create a review for a module
     * 
     * @throws \InvalidArgumentException
     */
    public function createReview(
        User $user,
        string $moduleSlug,
        int $rating,
        ?string $comment = null
    ): ModuleReview {
        // Validate rating
        if ($rating < 1 || $rating > 5) {
            throw new \InvalidArgumentException('Rating must be between 1 and 5');
        }

        // Check if module exists
        $module = Module::where('slug', $moduleSlug)->firstOrFail();

        // Check if user has already reviewed this module
        $existingReview = ModuleReview::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->first();

        if ($existingReview) {
            throw new \InvalidArgumentException('Вы уже оставили отзыв на этот модуль');
        }

        // Check if user has installed/used the module
        $hasUsed = UserModule::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->exists();

        // Check if user has purchased the module
        $hasPurchased = ModulePurchase::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->where('status', 'completed')
            ->exists();

        $isVerified = $hasUsed || $hasPurchased || $module->isFree();

        // Create the review
        $review = ModuleReview::create([
            'user_id' => $user->id,
            'module_slug' => $moduleSlug,
            'rating' => $rating,
            'comment' => $comment,
            'is_verified' => $isVerified,
            'is_approved' => true, // Auto-approve, can add moderation later
        ]);

        // Recalculate module rating
        $module->recalculateRating();

        Log::info("Review created for module: {$moduleSlug}", [
            'user_id' => $user->id,
            'rating' => $rating,
            'is_verified' => $isVerified,
        ]);

        return $review;
    }

    /**
     * Update a review
     */
    public function updateReview(
        ModuleReview $review,
        int $rating,
        ?string $comment = null
    ): ModuleReview {
        if ($rating < 1 || $rating > 5) {
            throw new \InvalidArgumentException('Rating must be between 1 and 5');
        }

        $review->update([
            'rating' => $rating,
            'comment' => $comment,
        ]);

        // Recalculate module rating
        $review->module->recalculateRating();

        return $review->fresh();
    }

    /**
     * Delete a review
     */
    public function deleteReview(ModuleReview $review): void
    {
        $moduleSlug = $review->module_slug;

        $review->delete();

        // Recalculate module rating
        $module = Module::where('slug', $moduleSlug)->first();
        if ($module) {
            $module->recalculateRating();
        }
    }

    /**
     * Get reviews for a module
     */
    public function getModuleReviews(
        string $moduleSlug,
        int $perPage = 10,
        ?int $rating = null
    ): LengthAwarePaginator {
        $query = ModuleReview::with('user')
            ->forModule($moduleSlug)
            ->approved()
            ->latest();

        if ($rating !== null) {
            $query->withRating($rating);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get all reviews for a module (collection)
     */
    public function getAllModuleReviews(string $moduleSlug): Collection
    {
        return ModuleReview::with('user')
            ->forModule($moduleSlug)
            ->approved()
            ->latest()
            ->get();
    }

    /**
     * Get user's review for a module
     */
    public function getUserReview(User $user, string $moduleSlug): ?ModuleReview
    {
        return ModuleReview::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->first();
    }

    /**
     * Check if user can review a module
     */
    public function canReview(User $user, string $moduleSlug): bool
    {
        // Check if already reviewed
        $hasReviewed = ModuleReview::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->exists();

        if ($hasReviewed) {
            return false;
        }

        // Check if user has used the module
        return UserModule::where('user_id', $user->id)
            ->where('module_slug', $moduleSlug)
            ->exists();
    }

    /**
     * Get rating statistics for a module
     */
    public function getRatingStats(string $moduleSlug): array
    {
        $reviews = ModuleReview::forModule($moduleSlug)
            ->approved()
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        $totalReviews = array_sum($reviews);
        $avgRating = $totalReviews > 0
            ? array_sum(array_map(fn($r, $c) => $r * $c, array_keys($reviews), array_values($reviews))) / $totalReviews
            : 0;

        return [
            'average' => round($avgRating, 1),
            'total' => $totalReviews,
            'distribution' => [
                5 => $reviews[5] ?? 0,
                4 => $reviews[4] ?? 0,
                3 => $reviews[3] ?? 0,
                2 => $reviews[2] ?? 0,
                1 => $reviews[1] ?? 0,
            ],
        ];
    }

    /**
     * Get recent reviews across all modules
     */
    public function getRecentReviews(int $limit = 10): Collection
    {
        return ModuleReview::with(['user', 'module'])
            ->approved()
            ->latest()
            ->take($limit)
            ->get();
    }
}
