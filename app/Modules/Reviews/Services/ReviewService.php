<?php

namespace App\Modules\Reviews\Services;

use App\Models\Client;
use App\Models\User;
use App\Modules\Reviews\Models\Review;
use App\Services\Modules\ModuleSettingsService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ReviewService
{
    public function __construct(
        private readonly ModuleSettingsService $settingsService
    ) {}

    /**
     * Get reviews for a user (master)
     */
    public function getReviews(
        User $user,
        ?string $status = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = Review::forUser($user->id)
            ->with(['client', 'appointment'])
            ->orderByDesc('created_at');

        if ($status !== null) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get approved reviews for public display
     */
    public function getPublicReviews(User $user, int $limit = 10): Collection
    {
        $settings = $this->getSettings($user);
        $minRating = $settings['min_rating_to_show'] ?? 1;

        return Review::forUser($user->id)
            ->approved()
            ->minRating($minRating)
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get reviews for a specific client
     */
    public function getClientReviews(User $user, Client $client): Collection
    {
        return Review::forUser($user->id)
            ->where('client_id', $client->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get review statistics for a user
     */
    public function getStats(User $user): array
    {
        $reviews = Review::forUser($user->id)->approved();

        $totalReviews = $reviews->count();
        $averageRating = $reviews->avg('rating') ?? 0;

        $ratingDistribution = Review::forUser($user->id)
            ->approved()
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Fill missing ratings with 0
        for ($i = 1; $i <= 5; $i++) {
            if (!isset($ratingDistribution[$i])) {
                $ratingDistribution[$i] = 0;
            }
        }
        ksort($ratingDistribution);

        $pendingCount = Review::forUser($user->id)->pending()->count();

        return [
            'total_reviews' => $totalReviews,
            'average_rating' => round($averageRating, 1),
            'rating_distribution' => $ratingDistribution,
            'pending_count' => $pendingCount,
        ];
    }

    /**
     * Create a new review
     */
    public function createReview(User $user, array $data): Review
    {
        $settings = $this->getSettings($user);
        $requireModeration = $settings['require_moderation'] ?? false;

        $review = new Review([
            'user_id' => $user->id,
            'client_id' => $data['client_id'] ?? null,
            'appointment_id' => $data['appointment_id'] ?? null,
            'author_name' => $data['author_name'],
            'author_email' => $data['author_email'] ?? null,
            'author_phone' => $data['author_phone'] ?? null,
            'rating' => $data['rating'],
            'text' => $data['text'] ?? null,
            'source' => $data['source'] ?? Review::SOURCE_MANUAL,
            'is_verified' => isset($data['client_id']),
            'status' => $requireModeration ? Review::STATUS_PENDING : Review::STATUS_APPROVED,
        ]);

        $review->save();

        return $review;
    }

    /**
     * Update a review
     */
    public function updateReview(Review $review, array $data): Review
    {
        $review->fill([
            'author_name' => $data['author_name'] ?? $review->author_name,
            'author_email' => $data['author_email'] ?? $review->author_email,
            'rating' => $data['rating'] ?? $review->rating,
            'text' => $data['text'] ?? $review->text,
            'is_featured' => $data['is_featured'] ?? $review->is_featured,
        ]);

        $review->save();

        return $review;
    }

    /**
     * Delete a review
     */
    public function deleteReview(Review $review): bool
    {
        return $review->delete();
    }

    /**
     * Approve a review
     */
    public function approveReview(Review $review): Review
    {
        $review->approve();
        return $review;
    }

    /**
     * Reject a review
     */
    public function rejectReview(Review $review): Review
    {
        $review->reject();
        return $review;
    }

    /**
     * Add response to a review
     */
    public function addResponse(Review $review, string $response): Review
    {
        $review->addResponse($response);
        return $review;
    }

    /**
     * Toggle featured status
     */
    public function toggleFeatured(Review $review): Review
    {
        $review->is_featured = !$review->is_featured;
        $review->save();
        return $review;
    }

    /**
     * Get module settings for user
     */
    public function getSettings(User $user): array
    {
        return $this->settingsService->getAll($user, 'reviews');
    }

    /**
     * Create review from public page submission
     */
    public function createPublicReview(User $master, array $data): Review
    {
        return $this->createReview($master, array_merge($data, [
            'source' => Review::SOURCE_PUBLIC_PAGE,
        ]));
    }

    /**
     * Get recent reviews for dashboard widget
     */
    public function getRecentReviews(User $user, int $limit = 5): Collection
    {
        return Review::forUser($user->id)
            ->with(['client'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
}
