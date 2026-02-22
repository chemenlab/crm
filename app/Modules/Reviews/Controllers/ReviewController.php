<?php

namespace App\Modules\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reviews\Models\Review;
use App\Modules\Reviews\Services\ReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService
    ) {}

    /**
     * Display list of reviews
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $request->get('status');

        $reviews = $this->reviewService->getReviews($user, $status);
        $stats = $this->reviewService->getStats($user);

        return Inertia::render('Modules/Reviews/Index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Show create review form
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Reviews/Create');
    }

    /**
     * Store a new review
     */
    public function store(Request $request)
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

        return redirect()
            ->route('modules.reviews.index')
            ->with('success', 'Отзыв успешно добавлен');
    }

    /**
     * Show edit review form
     */
    public function edit(Review $review): Response
    {
        $this->authorize('update', $review);

        return Inertia::render('Modules/Reviews/Edit', [
            'review' => $review->load(['client', 'appointment']),
        ]);
    }

    /**
     * Update a review
     */
    public function update(Request $request, Review $review)
    {
        $this->authorize('update', $review);

        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_email' => 'nullable|email|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'nullable|string|max:2000',
            'is_featured' => 'boolean',
        ]);

        $this->reviewService->updateReview($review, $validated);

        return redirect()
            ->route('modules.reviews.index')
            ->with('success', 'Отзыв успешно обновлён');
    }

    /**
     * Delete a review
     */
    public function destroy(Review $review)
    {
        $this->authorize('delete', $review);

        $this->reviewService->deleteReview($review);

        return redirect()
            ->route('modules.reviews.index')
            ->with('success', 'Отзыв удалён');
    }

    /**
     * Approve a review
     */
    public function approve(Review $review)
    {
        $this->authorize('update', $review);

        $this->reviewService->approveReview($review);

        return back()->with('success', 'Отзыв одобрен');
    }

    /**
     * Reject a review
     */
    public function reject(Review $review)
    {
        $this->authorize('update', $review);

        $this->reviewService->rejectReview($review);

        return back()->with('success', 'Отзыв отклонён');
    }

    /**
     * Add response to a review
     */
    public function respond(Request $request, Review $review)
    {
        $this->authorize('update', $review);

        $validated = $request->validate([
            'response' => 'required|string|max:1000',
        ]);

        $this->reviewService->addResponse($review, $validated['response']);

        return back()->with('success', 'Ответ добавлен');
    }

    /**
     * Toggle featured status
     */
    public function toggleFeatured(Review $review)
    {
        $this->authorize('update', $review);

        $this->reviewService->toggleFeatured($review);

        return back()->with('success', $review->is_featured ? 'Отзыв закреплён' : 'Отзыв откреплён');
    }

    /**
     * Show module settings
     */
    public function settings(Request $request): Response
    {
        $settings = $this->reviewService->getSettings($request->user());

        return Inertia::render('Modules/Reviews/Settings', [
            'settings' => $settings,
        ]);
    }
}
