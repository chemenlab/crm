<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class KnowledgeBaseArticleMedia extends Model
{
    protected $table = 'kb_article_media';
    
    protected $fillable = [
        'article_id',
        'type',
        'filename',
        'path',
        'url',
        'size',
        'metadata',
        'order',
    ];
    
    protected $casts = [
        'metadata' => 'array',
        'size' => 'integer',
        'order' => 'integer',
    ];
    
    /**
     * Статья, к которой относится медиа
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseArticle::class, 'article_id');
    }
    
    /**
     * Получить полный URL файла
     */
    public function getFullUrl(): string
    {
        if ($this->type === 'video_embed') {
            return $this->url;
        }
        
        return Storage::url($this->path);
    }
    
    /**
     * Получить URL миниатюры
     */
    public function getThumbnailUrl(): string
    {
        if ($this->type === 'image') {
            $pathInfo = pathinfo($this->path);
            $thumbnailPath = $pathInfo['dirname'] . '/thumbnails/' . $pathInfo['basename'];
            
            if (Storage::exists($thumbnailPath)) {
                return Storage::url($thumbnailPath);
            }
        }
        
        return $this->getFullUrl();
    }
}
