<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\News;
use Inertia\Inertia;

class NewsController extends Controller
{
    /**
     * Display a listing of published news.
     */
    public function index()
    {
        $news = News::published()
            ->latest()
            ->paginate(9);

        // Transform data for frontend
        $news->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => $item->excerpt,
                'category' => $item->category,
                'category_color' => $item->category_color,
                'cover_image_url' => $item->cover_image_url,
                'formatted_date' => $item->formatted_date,
                'reading_time' => $item->reading_time,
                'view_count' => $item->view_count,
            ];
        });

        return Inertia::render('Marketing/News/Index', [
            'news' => $news,
        ]);
    }

    /**
     * Display the specified news article.
     */
    public function show(string $slug)
    {
        $news = News::published()
            ->where('slug', $slug)
            ->firstOrFail();

        // Increment view count
        $news->incrementViewCount();

        // Get related news (same category, exclude current)
        $relatedNews = News::published()
            ->where('category', $news->category)
            ->where('id', '!=', $news->id)
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'slug' => $item->slug,
                    'category' => $item->category,
                    'category_color' => $item->category_color,
                    'cover_image_url' => $item->cover_image_url,
                    'formatted_date' => $item->formatted_date,
                ];
            });

        return Inertia::render('Marketing/News/Show', [
            'news' => [
                'id' => $news->id,
                'title' => $news->title,
                'slug' => $news->slug,
                'excerpt' => $news->excerpt,
                'content' => $news->content,
                'category' => $news->category,
                'category_color' => $news->category_color,
                'cover_image_url' => $news->cover_image_url,
                'formatted_date' => $news->formatted_date,
                'reading_time' => $news->reading_time,
                'view_count' => $news->view_count,
            ],
            'relatedNews' => $relatedNews,
        ]);
    }
}
