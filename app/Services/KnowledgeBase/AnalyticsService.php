<?php

namespace App\Services\KnowledgeBase;

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Получить статистику по статье
     */
    public function getArticleStats(KnowledgeBaseArticle $article): array
    {
        return [
            'views_total' => $article->view_count,
            'views_today' => $article->views()->whereDate('viewed_at', today())->count(),
            'views_this_week' => $article->views()->where('viewed_at', '>=', now()->startOfWeek())->count(),
            'views_this_month' => $article->views()->where('viewed_at', '>=', now()->startOfMonth())->count(),
            'ratings_total' => $article->ratings()->count(),
            'ratings_helpful' => $article->ratings()->where('is_helpful', true)->count(),
            'ratings_not_helpful' => $article->ratings()->where('is_helpful', false)->count(),
            'helpful_percentage' => $article->getHelpfulPercentage(),
            'unique_viewers' => $article->views()->distinct('user_id')->count('user_id'),
            'average_rating' => $article->getHelpfulPercentage() / 100,
        ];
    }
    
    /**
     * Получить статистику по категории
     */
    public function getCategoryStats(KnowledgeBaseCategory $category): array
    {
        $articles = $category->articles()->where('is_published', true)->get();
        
        return [
            'articles_count' => $articles->count(),
            'total_views' => $articles->sum('view_count'),
            'total_ratings' => $articles->sum(function ($article) {
                return $article->ratings()->count();
            }),
            'average_helpful_percentage' => $articles->avg(function ($article) {
                return $article->getHelpfulPercentage();
            }),
            'most_viewed_article' => $articles->sortByDesc('view_count')->first(),
            'least_viewed_article' => $articles->sortBy('view_count')->first(),
        ];
    }
    
    /**
     * Получить общую статистику
     */
    public function getOverallStats(): array
    {
        $totalArticles = KnowledgeBaseArticle::where('is_published', true)->count();
        $totalViews = KnowledgeBaseArticle::sum('view_count');
        $totalRatings = DB::table('kb_article_ratings')->count();
        
        $helpfulRatings = DB::table('kb_article_ratings')->where('is_helpful', true)->count();
        $averageHelpfulPercentage = $totalRatings > 0 ? ($helpfulRatings / $totalRatings) * 100 : 0;
        
        return [
            'total_articles' => $totalArticles,
            'total_views' => $totalViews,
            'total_ratings' => $totalRatings,
            'average_helpful_percentage' => round($averageHelpfulPercentage, 2),
            'views_today' => DB::table('kb_article_views')->whereDate('viewed_at', today())->count(),
            'views_this_week' => DB::table('kb_article_views')->where('viewed_at', '>=', now()->startOfWeek())->count(),
            'views_this_month' => DB::table('kb_article_views')->where('viewed_at', '>=', now()->startOfMonth())->count(),
            'total_categories' => KnowledgeBaseCategory::where('is_active', true)->count(),
            'articles_with_media' => KnowledgeBaseArticle::has('media')->count(),
        ];
    }
    
    /**
     * Получить просмотры по периодам
     */
    public function getViewsByPeriod(string $period = 'day', int $limit = 30): array
    {
        $groupBy = match($period) {
            'hour' => 'DATE_FORMAT(viewed_at, "%Y-%m-%d %H:00:00")',
            'day' => 'DATE(viewed_at)',
            'week' => 'YEARWEEK(viewed_at)',
            'month' => 'DATE_FORMAT(viewed_at, "%Y-%m")',
            default => 'DATE(viewed_at)',
        };
        
        $results = DB::table('kb_article_views')
            ->select(DB::raw("{$groupBy} as period"), DB::raw('COUNT(*) as views'))
            ->where('viewed_at', '>=', now()->subDays($limit))
            ->groupBy('period')
            ->orderBy('period')
            ->get();
        
        return [
            'labels' => $results->pluck('period')->toArray(),
            'data' => $results->pluck('views')->toArray(),
        ];
    }
    
    /**
     * Получить топ статей
     */
    public function getTopArticles(int $limit = 10, string $metric = 'views'): Collection
    {
        $query = KnowledgeBaseArticle::where('is_published', true)
            ->with(['category']);
        
        switch ($metric) {
            case 'views':
                $query->orderBy('view_count', 'desc');
                break;
            case 'ratings':
                $query->withCount('ratings')->orderBy('ratings_count', 'desc');
                break;
            case 'helpful':
                // Сортировка по проценту полезности
                $query->withCount([
                    'ratings as helpful_count' => function ($q) {
                        $q->where('is_helpful', true);
                    },
                    'ratings as total_ratings'
                ])
                ->get()
                ->sortByDesc(function ($article) {
                    return $article->total_ratings > 0 
                        ? ($article->helpful_count / $article->total_ratings) * 100 
                        : 0;
                })
                ->take($limit);
                
                return $query->get();
        }
        
        return $query->limit($limit)->get();
    }
    
    /**
     * Получить статьи с низким рейтингом
     */
    public function getLowRatedArticles(float $threshold = 50.0): Collection
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->has('ratings', '>=', 5) // Минимум 5 оценок
            ->with(['category', 'ratings'])
            ->get()
            ->filter(function ($article) use ($threshold) {
                return $article->getHelpfulPercentage() < $threshold;
            })
            ->sortBy(function ($article) {
                return $article->getHelpfulPercentage();
            })
            ->values();
    }
    
    /**
     * Получить статистику по поисковым запросам
     */
    public function getSearchStats(int $days = 30): array
    {
        if (!DB::getSchemaBuilder()->hasTable('kb_search_queries')) {
            return [
                'total_searches' => 0,
                'unique_queries' => 0,
                'average_results' => 0,
                'top_queries' => [],
                'queries_with_no_results' => 0,
            ];
        }
        
        $searches = DB::table('kb_search_queries')
            ->where('created_at', '>=', now()->subDays($days))
            ->get();
        
        $topQueries = DB::table('kb_search_queries')
            ->select('query', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('query')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        return [
            'total_searches' => $searches->count(),
            'unique_queries' => $searches->unique('query')->count(),
            'average_results' => round($searches->avg('results_count'), 2),
            'top_queries' => $topQueries->toArray(),
            'queries_with_no_results' => $searches->where('results_count', 0)->count(),
        ];
    }
    
    /**
     * Получить статистику по категориям
     */
    public function getCategoriesStats(): Collection
    {
        return KnowledgeBaseCategory::where('is_active', true)
            ->withCount([
                'articles as published_articles' => function ($query) {
                    $query->where('is_published', true);
                }
            ])
            ->with(['articles' => function ($query) {
                $query->where('is_published', true);
            }])
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'articles_count' => $category->published_articles,
                    'total_views' => $category->articles->sum('view_count'),
                    'average_views' => $category->published_articles > 0 
                        ? round($category->articles->sum('view_count') / $category->published_articles, 2)
                        : 0,
                ];
            });
    }
}
