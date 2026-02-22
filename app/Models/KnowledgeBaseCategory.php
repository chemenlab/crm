<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeBaseCategory extends Model
{
    protected $table = 'kb_categories';
    
    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'icon',
        'color',
        'order',
        'is_active',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];
    
    /**
     * Родительская категория
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseCategory::class, 'parent_id');
    }
    
    /**
     * Дочерние категории
     */
    public function children(): HasMany
    {
        return $this->hasMany(KnowledgeBaseCategory::class, 'parent_id')->orderBy('order');
    }
    
    /**
     * Статьи в категории
     */
    public function articles(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticle::class, 'category_id');
    }
    
    /**
     * Получить полный путь категории
     */
    public function getFullPath(): string
    {
        $path = [$this->name];
        $parent = $this->parent;
        
        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }
        
        return implode(' > ', $path);
    }
    
    /**
     * Получить количество статей в категории
     */
    public function getArticleCount(): int
    {
        return $this->articles()->where('is_published', true)->count();
    }
    
    /**
     * Проверить, является ли категория корневой
     */
    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }
}
