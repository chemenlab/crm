<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBaseArticle;
use App\Services\KnowledgeBase\ArticleService;
use App\Services\KnowledgeBase\CategoryService;
use App\Services\KnowledgeBase\SearchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    public function __construct(
        private ArticleService $articleService,
        private CategoryService $categoryService,
        private SearchService $searchService
    ) {}
    
    /**
     * Главная страница базы знаний
     */
    public function index(Request $request): Response
    {
        $categories = $this->categoryService->getTree();
        $featuredArticles = $this->articleService->getFeaturedArticles();
        $popularArticles = $this->articleService->getPopularArticles(5);
        $latestArticles = $this->articleService->getLatest(5);
        
        return Inertia::render('App/KnowledgeBase/Index', [
            'categories' => $categories,
            'featuredArticles' => $featuredArticles,
            'popularArticles' => $popularArticles,
            'latestArticles' => $latestArticles,
        ]);
    }
    
    /**
     * Просмотр статьи
     */
    public function show(Request $request, string $slug): Response
    {
        $article = $this->articleService->findBySlug($slug);
        
        if (!$article) {
            abort(404, 'Статья не найдена');
        }
        
        // Запись просмотра
        $this->articleService->recordView($article, $request->user(), $request);
        
        // Получение похожих статей
        $relatedArticles = $this->articleService->getRelatedArticles($article, 5);
        
        // Получение хлебных крошек
        $breadcrumbs = $this->categoryService->getBreadcrumbs($article->category);
        
        // Проверка рейтинга текущего пользователя
        $userRating = null;
        if ($request->user()) {
            $userRating = $article->ratings()
                ->where('user_id', $request->user()->id)
                ->first();
        }
        
        return Inertia::render('App/KnowledgeBase/Show', [
            'article' => $article->load(['category', 'media']),
            'relatedArticles' => $relatedArticles,
            'breadcrumbs' => $breadcrumbs,
            'userRating' => $userRating,
            'helpfulPercentage' => $article->getHelpfulPercentage(),
        ]);
    }
    
    /**
     * Поиск статей
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2|max:255',
            'category_id' => 'nullable|integer|exists:kb_categories,id',
        ]);
        
        $results = $this->searchService->searchWithHighlights(
            $request->input('query'),
            $request->input('category_id')
        );
        
        return response()->json($results);
    }
    
    /**
     * Оценить статью
     */
    public function rate(Request $request, KnowledgeBaseArticle $article): RedirectResponse
    {
        $request->validate([
            'is_helpful' => 'required|boolean',
            'feedback' => 'nullable|string|max:1000',
        ]);
        
        $this->articleService->rateArticle(
            $article,
            $request->user(),
            $request->boolean('is_helpful'),
            $request->input('feedback')
        );
        
        return back()->with('success', 'Спасибо за вашу оценку!');
    }
    
    /**
     * Просмотр статей по категории
     */
    public function category(Request $request, string $slug): Response
    {
        $category = $this->categoryService->findBySlug($slug);
        
        if (!$category) {
            abort(404, 'Категория не найдена');
        }
        
        $articles = $this->articleService->getByCategory($category->id, 20);
        $breadcrumbs = $this->categoryService->getBreadcrumbs($category);
        $subcategories = $this->categoryService->getChildren($category->id);
        
        return Inertia::render('App/KnowledgeBase/Category', [
            'category' => $category,
            'articles' => $articles,
            'breadcrumbs' => $breadcrumbs,
            'subcategories' => $subcategories,
        ]);
    }
}
