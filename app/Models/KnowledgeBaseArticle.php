<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeBaseArticle extends Model
{
    use SoftDeletes;
    
    protected $table = 'kb_articles';
    
    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'content',
        'excerpt',
        'status',
        'view_count',
        'reading_time',
        'is_featured',
        'is_published',
        'published_at',
    ];
    
    protected $casts = [
        'is_featured' => 'boolean',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'view_count' => 'integer',
        'reading_time' => 'integer',
    ];
    
    /**
     * Категория статьи
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseCategory::class, 'category_id');
    }
    
    /**
     * Медиа файлы статьи
     */
    public function media(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticleMedia::class, 'article_id')->orderBy('order');
    }
    
    /**
     * Просмотры статьи
     */
    public function views(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticleView::class, 'article_id');
    }
    
    /**
     * Рейтинги статьи
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticleRating::class, 'article_id');
    }
    
    /**
     * Версии статьи
     */
    public function versions(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticleVersion::class, 'article_id')->orderBy('created_at', 'desc');
    }
    
    /**
     * Увеличить счетчик просмотров
     */
    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }
    
    /**
     * Рассчитать время чтения (слов в минуту)
     */
    public function calculateReadingTime(): int
    {
        $wordCount = str_word_count(strip_tags($this->content));
        return max(1, (int) ceil($wordCount / 200)); // 200 слов в минуту
    }
    
    /**
     * Получить процент полезности статьи
     */
    public function getHelpfulPercentage(): float
    {
        $totalRatings = $this->ratings()->count();
        
        if ($totalRatings === 0) {
            return 0;
        }
        
        $helpfulRatings = $this->ratings()->where('is_helpful', true)->count();
        
        return round(($helpfulRatings / $totalRatings) * 100, 2);
    }
    
    /**
     * Создать версию статьи
     */
    public function createVersion(int $userId): void
    {
        $this->versions()->create([
            'content' => $this->content,
            'created_by' => $userId,
            'created_at' => now(),
        ]);
    }
}
