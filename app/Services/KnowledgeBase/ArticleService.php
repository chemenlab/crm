<?php

namespace App\Services\KnowledgeBase;

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseArticleView;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ArticleService
{
    public function __construct(
        private MediaService $mediaService,
        private SearchService $searchService
    ) {}
    
    /**
     * Создать статью
     */
    public function create(array $data): KnowledgeBaseArticle
    {
        // Генерация slug если не указан
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        
        // Создание статьи
        $article = KnowledgeBaseArticle::create($data);
        
        // Расчет времени чтения
        $article->reading_time = $article->calculateReadingTime();
        $article->save();
        
        // Индексация для поиска
        $this->searchService->indexArticle($article);
        
        return $article;
    }
    
    /**
     * Обновить статью
     */
    public function update(KnowledgeBaseArticle $article, array $data): KnowledgeBaseArticle
    {
        // Создание версии перед обновлением (если контент изменился)
        if (isset($data['content']) && $data['content'] !== $article->content) {
            $article->createVersion(auth()->id() ?? 1);
        }
        
        // Генерация slug если изменился заголовок
        if (isset($data['title']) && $data['title'] !== $article->title && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        
        // Обновление статьи
        $article->update($data);
        
        // Пересчет времени чтения если изменился контент
        if (isset($data['content'])) {
            $article->reading_time = $article->calculateReadingTime();
            $article->save();
        }
        
        // Обновление индекса поиска
        $this->searchService->indexArticle($article);
        
        return $article->fresh();
    }
    
    /**
     * Удалить статью
     */
    public function delete(KnowledgeBaseArticle $article): bool
    {
        // Удаление всех медиа файлов
        foreach ($article->media as $media) {
            $this->mediaService->deleteMedia($media);
        }
        
        // Удаление из индекса поиска
        $this->searchService->removeFromIndex($article);
        
        // Мягкое удаление статьи
        return $article->delete();
    }
    
    /**
     * Опубликовать статью
     */
    public function publish(KnowledgeBaseArticle $article): bool
    {
        $article->is_published = true;
        $article->status = 'published';
        $article->published_at = now();
        
        return $article->save();
    }
    
    /**
     * Снять с публикации
     */
    public function unpublish(KnowledgeBaseArticle $article): bool
    {
        $article->is_published = false;
        $article->status = 'draft';
        
        return $article->save();
    }
    
    /**
     * Записать просмотр статьи
     */
    public function recordView(KnowledgeBaseArticle $article, ?User $user, Request $request): void
    {
        KnowledgeBaseArticleView::create([
            'article_id' => $article->id,
            'user_id' => $user?->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'viewed_at' => now(),
        ]);
        
        // Увеличение счетчика просмотров
        $article->incrementViewCount();
    }
    
    /**
     * Оценить статью
     */
    public function rateArticle(KnowledgeBaseArticle $article, User $user, bool $isHelpful, ?string $feedback = null): void
    {
        $article->ratings()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'is_helpful' => $isHelpful,
                'feedback' => $feedback,
            ]
        );
    }
    
    /**
     * Получить похожие статьи
     */
    public function getRelatedArticles(KnowledgeBaseArticle $article, int $limit = 5): Collection
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->where('id', '!=', $article->id)
            ->where(function ($query) use ($article) {
                $query->where('category_id', $article->category_id)
                    ->orWhereHas('category', function ($q) use ($article) {
                        $q->where('parent_id', $article->category->parent_id);
                    });
            })
            ->with(['category'])
            ->orderBy('view_count', 'desc')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Получить популярные статьи
     */
    public function getPopularArticles(int $limit = 10): Collection
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->orderBy('view_count', 'desc')
            ->limit($limit)
            ->with(['category'])
            ->get();
    }
    
    /**
     * Получить избранные статьи
     */
    public function getFeaturedArticles(): Collection
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->where('is_featured', true)
            ->orderBy('published_at', 'desc')
            ->with(['category'])
            ->get();
    }
    
    /**
     * Получить статьи по категории
     */
    public function getByCategory(int $categoryId, int $perPage = 20)
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->where('category_id', $categoryId)
            ->orderBy('published_at', 'desc')
            ->with(['category', 'media'])
            ->paginate($perPage);
    }
    
    /**
     * Получить статью по slug
     */
    public function findBySlug(string $slug): ?KnowledgeBaseArticle
    {
        return KnowledgeBaseArticle::where('slug', $slug)
            ->where('is_published', true)
            ->with(['category', 'media', 'ratings'])
            ->first();
    }
    
    /**
     * Получить последние статьи
     */
    public function getLatest(int $limit = 10): Collection
    {
        return KnowledgeBaseArticle::where('is_published', true)
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->with(['category'])
            ->get();
    }
    
    /**
     * Восстановить версию статьи
     */
    public function restoreVersion(KnowledgeBaseArticle $article, int $versionId): bool
    {
        $version = $article->versions()->find($versionId);
        
        if (!$version) {
            throw new \Exception('Версия не найдена');
        }
        
        // Создание новой версии с текущим контентом перед восстановлением
        $article->createVersion(auth()->id() ?? 1);
        
        // Восстановление контента из версии
        $article->content = $version->content;
        $article->reading_time = $article->calculateReadingTime();
        
        return $article->save();
    }
}
