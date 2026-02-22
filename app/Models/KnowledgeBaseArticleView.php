<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeBaseArticleView extends Model
{
    protected $table = 'kb_article_views';
    
    public $timestamps = false;
    
    protected $fillable = [
        'article_id',
        'user_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];
    
    protected $casts = [
        'viewed_at' => 'datetime',
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
