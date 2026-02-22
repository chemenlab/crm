<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Services\PortfolioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortfolioController extends Controller
{
    public function __construct(
        private PortfolioService $portfolioService
    ) {}

    /**
     * Display a listing of the user's portfolio items.
     */
    public function index()
    {
        $user = Auth::user();
        
        $items = $user->portfolioItems()
            ->ordered()
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'image_url' => $item->image_url,
                    'thumbnail_url' => $item->thumbnail_url,
                    'tag' => $item->tag,
                    'sort_order' => $item->sort_order,
                    'is_visible' => $item->is_visible,
                    'views_count' => $item->views_count,
                ];
            });

        $remainingSlots = $this->portfolioService->getRemainingSlots($user);

        return Inertia::render('App/Portfolio/Index', [
            'items' => $items,
            'remainingSlots' => $remainingSlots,
        ]);
    }

    /**
     * Store a newly created portfolio item.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user has reached limit
        if ($this->portfolioService->checkLimit($user)) {
            return back()->withErrors([
                'limit' => 'Вы достигли лимита портфолио для вашего тарифного плана.'
            ]);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240', // 10MB
            'tag' => 'nullable|string|max:50',
            'is_visible' => 'boolean',
        ]);

        // Process image
        $imagePaths = $this->portfolioService->processImage(
            $request->file('image'),
            $user
        );

        // Get next sort order
        $maxSortOrder = $user->portfolioItems()->max('sort_order') ?? 0;

        // Create portfolio item
        $item = $user->portfolioItems()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePaths['image_path'],
            'thumbnail_path' => $imagePaths['thumbnail_path'],
            'tag' => $validated['tag'] ?? null,
            'sort_order' => $maxSortOrder + 1,
            'is_visible' => $validated['is_visible'] ?? true,
        ]);

        // Track usage
        $this->portfolioService->trackImageAdded($user);

        return back()->with('success', 'Работа добавлена в портфолио');
    }

    /**
     * Update the specified portfolio item.
     */
    public function update(Request $request, PortfolioItem $portfolioItem)
    {
        // Ensure user owns this item
        if ($portfolioItem->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tag' => 'nullable|string|max:50',
            'is_visible' => 'boolean',
        ]);

        $portfolioItem->update($validated);

        return back()->with('success', 'Работа обновлена');
    }

    /**
     * Remove the specified portfolio item.
     */
    public function destroy(PortfolioItem $portfolioItem)
    {
        // Ensure user owns this item
        if ($portfolioItem->user_id !== Auth::id()) {
            abort(403);
        }

        // Delete image files
        $this->portfolioService->deleteImage($portfolioItem);

        // Delete database record
        $portfolioItem->delete();

        // Track usage decrease
        $this->portfolioService->trackImageDeleted(Auth::user());

        return back()->with('success', 'Работа удалена из портфолио');
    }

    /**
     * Reorder portfolio items.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:portfolio_items,id',
            'items.*.sort_order' => 'required|integer|min:0',
        ]);

        $user = Auth::user();

        foreach ($validated['items'] as $itemData) {
            $item = PortfolioItem::find($itemData['id']);
            
            // Ensure user owns this item
            if ($item->user_id !== $user->id) {
                continue;
            }

            $item->update(['sort_order' => $itemData['sort_order']]);
        }

        return back()->with('success', 'Порядок работ обновлен');
    }
}
