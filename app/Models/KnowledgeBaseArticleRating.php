<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeBaseArticleRating extends Model
{
    protected $table = 'kb_article_ratings';
    
    protected $fillable = [
        'article_id',
        'user_id',
        'is_helpful',
        'feedback',
    ];
    
    protected $casts = [
        'is_helpful' => 'boolean',
    ];
    
    /**
     * Статья
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseArticle::class, 'article_id');
    }
    
    /**
     * Пользователь
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
