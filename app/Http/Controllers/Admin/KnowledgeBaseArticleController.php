<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseArticleMedia;
use App\Services\KnowledgeBase\ArticleService;
use App\Services\KnowledgeBase\CategoryService;
use App\Services\KnowledgeBase\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseArticleController extends Controller
{
    public function __construct(
        private ArticleService $articleService,
        private CategoryService $categoryService,
        private MediaService $mediaService
    ) {}
    
    /**
     * Список всех статей
     */
    public function index(Request $request): Response
    {
        $query = KnowledgeBaseArticle::with(['category'])
            ->withCount('views', 'ratings');
        
        // Фильтрация по статусу
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }
        
        // Фильтрация по категории
        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }
        
        // Поиск
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }
        
        // Сортировка
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        $articles = $query->paginate(20);
        $categories = $this->categoryService->getAllWithCounts();
        
        return Inertia::render('Admin/KnowledgeBase/Index', [
            'articles' => $articles,
            'categories' => $categories,
            'filters' => $request->only(['status', 'category_id', 'search', 'sort_by', 'sort_order']),
        ]);
    }
    
    /**
     * Форма создания статьи
     */
    public function create(): Response
    {
        $categories = $this->categoryService->getAllWithCounts();
        
        return Inertia::render('Admin/KnowledgeBase/ArticleEditor', [
            'categories' => $categories,
            'article' => null,
        ]);
    }
    
    /**
     * Сохранение новой статьи
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:kb_articles,slug',
            'category_id' => 'required|exists:kb_categories,id',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ]);
        
        // Преобразуем is_published в status
        $validated['status'] = $validated['is_published'] ?? false ? 'published' : 'draft';
        
        $article = $this->articleService->create($validated);
        
        return redirect()
            ->route('admin.knowledge-base.articles.edit', $article)
            ->with('success', 'Статья успешно создана');
    }
    
    /**
     * Форма редактирования статьи
     */
    public function edit(KnowledgeBaseArticle $article): Response
    {
        $categories = $this->categoryService->getAllWithCounts();
        $article->load(['category', 'media', 'versions']);
        
        return Inertia::render('Admin/KnowledgeBase/ArticleEditor', [
            'article' => $article,
            'categories' => $categories,
        ]);
    }
    
    /**
     * Обновление статьи
     */
    public function update(Request $request, KnowledgeBaseArticle $article): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:kb_articles,slug,' . $article->id,
            'category_id' => 'required|exists:kb_categories,id',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ]);
        
        // Преобразуем is_published в status
        $validated['status'] = $validated['is_published'] ?? false ? 'published' : 'draft';
        
        $this->articleService->update($article, $validated);
        
        return redirect()
            ->route('admin.knowledge-base.articles.edit', $article)
            ->with('success', 'Статья успешно обновлена');
    }
    
    /**
     * Удаление статьи
     */
    public function destroy(KnowledgeBaseArticle $article): RedirectResponse
    {
        $this->articleService->delete($article);
        
        return redirect()
            ->route('admin.knowledge-base.articles.index')
            ->with('success', 'Статья успешно удалена');
    }
    
    /**
     * Опубликовать статью
     */
    public function publish(KnowledgeBaseArticle $article): RedirectResponse
    {
        $this->articleService->publish($article);
        
        return back()->with('success', 'Статья опубликована');
    }
    
    /**
     * Снять с публикации
     */
    public function unpublish(KnowledgeBaseArticle $article): RedirectResponse
    {
        $this->articleService->unpublish($article);
        
        return back()->with('success', 'Статья снята с публикации');
    }
    
    /**
     * Загрузить медиа
     */
    public function uploadMedia(Request $request, KnowledgeBaseArticle $article): JsonResponse
    {
        try {
            // Проверка на video embed
            if ($request->has('video_url')) {
                $request->validate([
                    'video_url' => 'required|url',
                ]);
                
                $media = $this->mediaService->createVideoEmbed($request->input('video_url'), $article);
                
                return response()->json([
                    'success' => true,
                    'media' => $media,
                ]);
            }
            
            // Загрузка файла
            $request->validate([
                'file' => 'required|file|max:51200', // 50MB max
                'type' => 'required|in:image,video',
            ]);
            
            $file = $request->file('file');
            
            if ($request->input('type') === 'image') {
                // Дополнительная валидация для изображений
                $request->validate([
                    'file' => 'image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB max for images
                ]);
                $media = $this->mediaService->uploadImage($file, $article);
            } else {
                // Дополнительная валидация для видео
                $request->validate([
                    'file' => 'mimes:mp4,mov,avi|max:51200', // 50MB max for videos
                ]);
                $media = $this->mediaService->uploadVideo($file, $article);
            }
            
            return response()->json([
                'success' => true,
                'media' => $media,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Media upload error: ' . $e->getMessage(), [
                'article_id' => $article->id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
    
    /**
     * Удалить медиа
     */
    public function deleteMedia(KnowledgeBaseArticleMedia $media): RedirectResponse
    {
        $this->mediaService->deleteMedia($media);
        
        return back()->with('success', 'Медиа файл удален');
    }
}
