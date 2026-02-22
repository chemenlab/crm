<?php

namespace App\Services\KnowledgeBase;

use App\Models\KnowledgeBaseArticle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SearchService
{
    /**
     * Поиск статей
     */
    public function search(string $query, ?int $categoryId = null): Collection
    {
        $searchQuery = KnowledgeBaseArticle::query()
            ->where('is_published', true)
            ->whereRaw('MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)', [$query])
            ->with(['category', 'media']);
        
        // Фильтрация по категории
        if ($categoryId) {
            $searchQuery->where('category_id', $categoryId);
        }
        
        // Сортировка по релевантности
        $results = $searchQuery
            ->orderByRaw('MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) DESC', [$query])
            ->limit(50)
            ->get();
        
        // Отслеживание поиска
        $this->trackSearch($query, $results->count());
        
        return $results;
    }
    
    /**
     * Индексировать статью (для будущего использования с Laravel Scout)
     */
    public function indexArticle(KnowledgeBaseArticle $article): void
    {
        // В текущей реализации используется MySQL FULLTEXT
        // Этот метод зарезервирован для будущей интеграции с Laravel Scout
        // или другими поисковыми движками (Elasticsearch, Algolia и т.д.)
    }
    
    /**
     * Удалить статью из индекса
     */
    public function removeFromIndex(KnowledgeBaseArticle $article): void
    {
        // В текущей реализации используется MySQL FULLTEXT
        // Этот метод зарезервирован для будущей интеграции с Laravel Scout
    }
    
    /**
     * Получить популярные поисковые запросы
     */
    public function getPopularSearches(int $limit = 10): array
    {
        return DB::table('kb_search_queries')
            ->select('query', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('query')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->pluck('count', 'query')
            ->toArray();
    }
    
    /**
     * Отследить поисковый запрос
     */
    public function trackSearch(string $query, int $resultsCount): void
    {
        // Создание таблицы для отслеживания поисковых запросов (если не существует)
        if (!DB::getSchemaBuilder()->hasTable('kb_search_queries')) {
            DB::statement('
                CREATE TABLE IF NOT EXISTS kb_search_queries (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    query VARCHAR(255) NOT NULL,
                    results_count INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_query (query),
                    INDEX idx_created_at (created_at)
                )
            ');
        }
        
        DB::table('kb_search_queries')->insert([
            'query' => $query,
            'results_count' => $resultsCount,
            'created_at' => now(),
        ]);
    }
    
    /**
     * Поиск с подсветкой результатов
     */
    public function searchWithHighlights(string $query, ?int $categoryId = null): array
    {
        $results = $this->search($query, $categoryId);
        
        $highlights = [];
        foreach ($results as $article) {
            $highlights[$article->id] = $this->highlightMatches($article, $query);
        }
        
        return [
            'articles' => $results,
            'highlights' => $highlights,
            'total' => $results->count(),
            'query' => $query,
        ];
    }
    
    /**
     * Подсветка совпадений в тексте
     */
    private function highlightMatches(KnowledgeBaseArticle $article, string $query): array
    {
        $matches = [];
        $words = explode(' ', $query);
        
        // Поиск в заголовке
        foreach ($words as $word) {
            if (stripos($article->title, $word) !== false) {
                $matches[] = $this->extractContext($article->title, $word, 100);
            }
        }
        
        // Поиск в контенте
        $content = strip_tags($article->content);
        foreach ($words as $word) {
            if (stripos($content, $word) !== false) {
                $matches[] = $this->extractContext($content, $word, 200);
            }
        }
        
        return array_unique(array_slice($matches, 0, 3));
    }
    
    /**
     * Извлечь контекст вокруг найденного слова
     */
    private function extractContext(string $text, string $word, int $contextLength = 150): string
    {
        $pos = stripos($text, $word);
        if ($pos === false) {
            return '';
        }
        
        $start = max(0, $pos - $contextLength / 2);
        $length = $contextLength;
        
        $context = substr($text, $start, $length);
        
        // Добавление многоточия
        if ($start > 0) {
            $context = '...' . $context;
        }
        if ($start + $length < strlen($text)) {
            $context .= '...';
        }
        
        // Подсветка найденного слова
        $context = preg_replace('/(' . preg_quote($word, '/') . ')/i', '<mark>$1</mark>', $context);
        
        return $context;
    }
}
