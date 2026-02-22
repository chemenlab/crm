<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeBaseArticleVersion extends Model
{
    protected $table = 'kb_article_versions';
    
    public $timestamps = false;
    
    protected $fillable = [
        'article_id',
        'content',
        'created_by',
        'created_at',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
    ];
    
    /**
     * Статья
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseArticle::class, 'article_id');
    }
    
    /**
     * Пользователь, создавший версию
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
