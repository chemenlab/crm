<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class NewsController extends Controller
{
    /**
     * Display a listing of news.
     */
    public function index(Request $request)
    {
        $query = News::query();

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'published') {
                $query->where('is_published', true);
            } elseif ($request->status === 'draft') {
                $query->where('is_published', false);
            }
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $news = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/News/Index', [
            'news' => $news,
            'filters' => $request->only(['search', 'status', 'category']),
            'categories' => News::CATEGORIES,
        ]);
    }

    /**
     * Show the form for creating a new news article.
     */
    public function create()
    {
        return Inertia::render('Admin/News/Create', [
            'categories' => News::CATEGORIES,
        ]);
    }

    /**
     * Store a newly created news article.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'required|string|max:500',
            'content' => 'required|string',
            'category' => 'required|string|in:Советы,Обновление,Кейс',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'is_published' => 'boolean',
        ]);

        // Generate unique slug
        $validated['slug'] = News::generateUniqueSlug($validated['title']);

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            $validated['cover_image'] = $request->file('cover_image')->store('news', 'public');
        }

        // Set published_at if publishing
        if ($validated['is_published'] ?? false) {
            $validated['published_at'] = now();
        }

        $news = News::create($validated);

        // Calculate and update reading time
        $news->update([
            'reading_time' => $news->calculateReadingTime(),
        ]);

        return redirect()->route('admin.news.index')
            ->with('success', 'Новость успешно создана!');
    }

    /**
     * Show the form for editing the specified news article.
     */
    public function edit(News $news)
    {
        return Inertia::render('Admin/News/Edit', [
            'news' => $news,
            'categories' => News::CATEGORIES,
        ]);
    }

    /**
     * Update the specified news article.
     */
    public function update(Request $request, News $news)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'required|string|max:500',
            'content' => 'required|string',
            'category' => 'required|string|in:Советы,Обновление,Кейс',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'is_published' => 'boolean',
        ]);

        // Update slug if title changed
        if ($news->title !== $validated['title']) {
            $validated['slug'] = News::generateUniqueSlug($validated['title'], $news->id);
        }

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            // Delete old cover image
            if ($news->cover_image) {
                Storage::disk('public')->delete($news->cover_image);
            }
            $validated['cover_image'] = $request->file('cover_image')->store('news', 'public');
        }

        // Handle publishing
        if (($validated['is_published'] ?? false) && !$news->is_published) {
            $validated['published_at'] = now();
        }

        $news->update($validated);

        // Update reading time
        $news->update([
            'reading_time' => $news->calculateReadingTime(),
        ]);

        return redirect()->route('admin.news.index')
            ->with('success', 'Новость успешно обновлена!');
    }

    /**
     * Remove the specified news article.
     */
    public function destroy(News $news)
    {
        // Delete cover image
        if ($news->cover_image) {
            Storage::disk('public')->delete($news->cover_image);
        }

        $news->delete();

        return redirect()->route('admin.news.index')
            ->with('success', 'Новость удалена!');
    }

    /**
     * Publish the specified news article.
     */
    public function publish(News $news)
    {
        $news->update([
            'is_published' => true,
            'published_at' => $news->published_at ?? now(),
        ]);

        return back()->with('success', 'Новость опубликована!');
    }

    /**
     * Unpublish the specified news article.
     */
    public function unpublish(News $news)
    {
        $news->update([
            'is_published' => false,
        ]);

        return back()->with('success', 'Новость снята с публикации.');
    }
}
