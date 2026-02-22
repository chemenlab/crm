<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModuleReview;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleReviewController extends Controller
{
    /**
     * Display a listing of module reviews
     */
    public function index(Request $request)
    {
        $query = ModuleReview::with(['user', 'module'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'pending') {
                $query->where('is_approved', false);
            } elseif ($request->status === 'approved') {
                $query->where('is_approved', true);
            }
        }

        // Filter by module
        if ($request->has('module') && $request->module) {
            $query->where('module_slug', $request->module);
        }

        // Filter by rating
        if ($request->has('rating') && $request->rating) {
            $query->where('rating', $request->rating);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $reviews = $query->paginate(20)->withQueryString();

        // Get modules for filter dropdown
        $modules = \App\Models\Module::select('slug', 'name')
            ->orderBy('name')
            ->get();

        // Statistics
        $stats = [
            'total' => ModuleReview::count(),
            'pending' => ModuleReview::where('is_approved', false)->count(),
            'approved' => ModuleReview::where('is_approved', true)->count(),
            'average_rating' => round(ModuleReview::avg('rating') ?? 0, 1),
        ];

        return Inertia::render('Admin/ModuleReviews/Index', [
            'reviews' => $reviews->through(fn($review) => [
                'id' => $review->id,
                'user' => [
                    'id' => $review->user->id,
                    'name' => $review->user->name,
                    'email' => $review->user->email,
                ],
                'module' => [
                    'slug' => $review->module_slug,
                    'name' => $review->module?->name ?? $review->module_slug,
                ],
                'rating' => $review->rating,
                'comment' => $review->comment,
                'is_verified' => $review->is_verified,
                'is_approved' => $review->is_approved,
                'created_at' => $review->created_at->toISOString(),
            ]),
            'modules' => $modules,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status,
                'module' => $request->module,
                'rating' => $request->rating,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Approve a review
     */
    public function approve(ModuleReview $review)
    {
        $review->update(['is_approved' => true]);

        // Recalculate module rating
        $review->module?->recalculateRating();

        return back()->with('success', 'Отзыв одобрен');
    }

    /**
     * Reject (unapprove) a review
     */
    public function reject(ModuleReview $review)
    {
        $review->update(['is_approved' => false]);

        // Recalculate module rating (excluded unapproved)
        $review->module?->recalculateRating();

        return back()->with('success', 'Отзыв отклонён');
    }

    /**
     * Toggle verified status
     */
    public function toggleVerified(ModuleReview $review)
    {
        $review->update(['is_verified' => !$review->is_verified]);

        return back()->with(
            'success',
            $review->is_verified
            ? 'Отзыв помечен как проверенный'
            : 'Метка проверенного отзыва снята'
        );
    }

    /**
     * Delete a review
     */
    public function destroy(ModuleReview $review)
    {
        $moduleSlug = $review->module_slug;
        $review->delete();

        // Recalculate module rating
        $module = \App\Models\Module::where('slug', $moduleSlug)->first();
        $module?->recalculateRating();

        return back()->with('success', 'Отзыв удалён');
    }

    /**
     * Bulk approve reviews
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:module_reviews,id',
        ]);

        $reviews = ModuleReview::whereIn('id', $request->ids)->get();

        ModuleReview::whereIn('id', $request->ids)->update(['is_approved' => true]);

        // Recalculate ratings for affected modules
        $moduleSlugs = $reviews->pluck('module_slug')->unique();
        foreach ($moduleSlugs as $slug) {
            $module = \App\Models\Module::where('slug', $slug)->first();
            $module?->recalculateRating();
        }

        return back()->with('success', count($request->ids) . ' отзыв(ов) одобрено');
    }

    /**
     * Bulk reject reviews
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:module_reviews,id',
        ]);

        $reviews = ModuleReview::whereIn('id', $request->ids)->get();

        ModuleReview::whereIn('id', $request->ids)->update(['is_approved' => false]);

        // Recalculate ratings for affected modules
        $moduleSlugs = $reviews->pluck('module_slug')->unique();
        foreach ($moduleSlugs as $slug) {
            $module = \App\Models\Module::where('slug', $slug)->first();
            $module?->recalculateRating();
        }

        return back()->with('success', count($request->ids) . ' отзыв(ов) отклонено');
    }

    /**
     * Bulk delete reviews
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:module_reviews,id',
        ]);

        $reviews = ModuleReview::whereIn('id', $request->ids)->get();
        $moduleSlugs = $reviews->pluck('module_slug')->unique();

        ModuleReview::whereIn('id', $request->ids)->delete();

        // Recalculate ratings for affected modules
        foreach ($moduleSlugs as $slug) {
            $module = \App\Models\Module::where('slug', $slug)->first();
            $module?->recalculateRating();
        }

        return back()->with('success', count($request->ids) . ' отзыв(ов) удалено');
    }
}
