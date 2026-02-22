<?php

namespace App\Modules\Reviews\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Reviews\Models\Review;
use App\Modules\Reviews\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewApiController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService
    ) {}

    /**
     * Get reviews list
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->get('status');
        $perPage = $request->get('per_page', 15);

        $reviews = $this->reviewService->getReviews($user, $status, $perPage);

        return response()->json($reviews);
    }

    /**
     * Get review statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->reviewService->getStats($request->user());

        return response()->json($stats);
    }

    /**
     * Get recent reviews
     */
    public function recent(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 5);
        $reviews = $this->reviewService->getRecentReviews($request->user(), $limit);

        return response()->json($reviews);
    }

    /**
     * Store a new review
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_email' => 'nullable|email|max:255',
            'author_phone' => 'nullable|string|max:50',
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'nullable|string|max:2000',
            'client_id' => 'nullable|exists:clients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
        ]);

        $review = $this->reviewService->createReview($request->user(), $validated);

        return response()->json($review, 201);
    }

    /**
     * Update a review
     */
    public function update(Request $request, Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $validated = $request->validate([
            'author_name' => 'string|max:255',
            'author_email' => 'nullable|email|max:255',
            'rating' => 'integer|min:1|max:5',
            'text' => 'nullable|string|max:2000',
            'is_featured' => 'boolean',
        ]);

        $review = $this->reviewService->updateReview($review, $validated);

        return response()->json($review);
    }

    /**
     * Delete a review
     */
    public function destroy(Review $review): JsonResponse
    {
        $this->authorize('delete', $review);

        $this->reviewService->deleteReview($review);

        return response()->json(['message' => 'Review deleted']);
    }

    /**
     * Approve a review
     */
    public function approve(Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $review = $this->reviewService->approveReview($review);

        return response()->json($review);
    }

    /**
     * Reject a review
     */
    public function reject(Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $review = $this->reviewService->rejectReview($review);

        return response()->json($review);
    }

    /**
     * Add response to a review
     */
    public function respond(Request $request, Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $validated = $request->validate([
            'response' => 'required|string|max:1000',
        ]);

        $review = $this->reviewService->addResponse($review, $validated['response']);

        return response()->json($review);
    }

    /**
     * Toggle featured status
     */
    public function toggleFeatured(Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $review = $this->reviewService->toggleFeatured($review);

        return response()->json($review);
    }

    /**
     * Get reviews for a specific client
     */
    public function clientReviews(Request $request, int $clientId): JsonResponse
    {
        $user = $request->user();
        $client = $user->clients()->findOrFail($clientId);

        $reviews = $this->reviewService->getClientReviews($user, $client);

        return response()->json($reviews);
    }

    /**
     * Public endpoint: Get reviews for a master's public page
     */
    public function publicReviews(string $username): JsonResponse
    {
        $user = User::where('slug', $username)->firstOrFail();

        $reviews = $this->reviewService->getPublicReviews($user);
        $stats = $this->reviewService->getStats($user);

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => $stats['average_rating'],
            'total_reviews' => $stats['total_reviews'],
        ]);
    }

    /**
     * Public endpoint: Submit a review from public page
     */
    public function submitPublicReview(Request $request, string $username): JsonResponse
    {
        $user = User::where('slug', $username)->firstOrFail();

        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_email' => 'nullable|email|max:255',
            'author_phone' => 'nullable|string|max:50',
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'nullable|string|max:2000',
        ]);

        $review = $this->reviewService->createPublicReview($user, $validated);

        return response()->json([
            'message' => 'Спасибо за ваш отзыв!',
            'review' => $review,
        ], 201);
    }
}
