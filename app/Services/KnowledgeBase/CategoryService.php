<?php

namespace App\Services\KnowledgeBase;

use App\Models\KnowledgeBaseCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CategoryService
{
    /**
     * Создать категорию
     */
    public function create(array $data): KnowledgeBaseCategory
    {
        // Генерация slug если не указан
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        
        // Валидация иерархии
        if (!empty($data['parent_id'])) {
            $this->validateHierarchy($data['parent_id']);
        }
        
        // Установка порядка
        if (!isset($data['order'])) {
            $data['order'] = KnowledgeBaseCategory::where('parent_id', $data['parent_id'] ?? null)->max('order') + 1;
        }
        
        return KnowledgeBaseCategory::create($data);
    }
    
    /**
     * Обновить категорию
     */
    public function update(KnowledgeBaseCategory $category, array $data): KnowledgeBaseCategory
    {
        // Генерация slug если изменилось имя
        if (isset($data['name']) && $data['name'] !== $category->name && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        
        // Валидация иерархии при изменении родителя
        if (isset($data['parent_id']) && $data['parent_id'] !== $category->parent_id) {
            $this->validateHierarchy($data['parent_id'], $category->id);
        }
        
        $category->update($data);
        
        return $category->fresh();
    }
    
    /**
     * Удалить категорию
     */
    public function delete(KnowledgeBaseCategory $category): bool
    {
        // Проверка наличия статей
        if ($category->articles()->count() > 0) {
            throw new \Exception('Невозможно удалить категорию со статьями. Сначала переместите или удалите статьи.');
        }
        
        // Проверка наличия подкатегорий
        if ($category->children()->count() > 0) {
            throw new \Exception('Невозможно удалить категорию с подкатегориями. Сначала удалите подкатегории.');
        }
        
        return $category->delete();
    }
    
    /**
     * Изменить порядок категорий
     */
    public function reorder(array $order): void
    {
        foreach ($order as $position => $categoryId) {
            KnowledgeBaseCategory::where('id', $categoryId)->update(['order' => $position]);
        }
    }
    
    /**
     * Получить дерево категорий
     */
    public function getTree(): Collection
    {
        // Получение всех активных категорий
        $categories = KnowledgeBaseCategory::where('is_active', true)
            ->orderBy('order')
            ->get();
        
        // Построение дерева
        return $this->buildTree($categories);
    }
    
    /**
     * Получить хлебные крошки
     */
    public function getBreadcrumbs(KnowledgeBaseCategory $category): array
    {
        $breadcrumbs = [];
        $current = $category;
        
        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            
            $current = $current->parent;
        }
        
        return $breadcrumbs;
    }
    
    /**
     * Валидация иерархии (предотвращение циклов)
     */
    private function validateHierarchy(?int $parentId, ?int $categoryId = null): void
    {
        if (!$parentId) {
            return;
        }
        
        // Проверка что родитель существует
        $parent = KnowledgeBaseCategory::find($parentId);
        if (!$parent) {
            throw new \Exception('Родительская категория не найдена');
        }
        
        // Проверка что категория не является родителем самой себя
        if ($categoryId && $parentId === $categoryId) {
            throw new \Exception('Категория не может быть родителем самой себя');
        }
        
        // Проверка на циклы в иерархии
        if ($categoryId) {
            $current = $parent;
            while ($current) {
                if ($current->id === $categoryId) {
                    throw new \Exception('Обнаружен цикл в иерархии категорий');
                }
                $current = $current->parent;
            }
        }
    }
    
    /**
     * Построить дерево категорий
     */
    private function buildTree(Collection $categories, ?int $parentId = null): Collection
    {
        return $categories
            ->where('parent_id', $parentId)
            ->map(function ($category) use ($categories) {
                $category->children = $this->buildTree($categories, $category->id);
                $category->article_count = $category->getArticleCount();
                return $category;
            })
            ->values();
    }
    
    /**
     * Получить все категории с количеством статей
     */
    public function getAllWithCounts(): Collection
    {
        return KnowledgeBaseCategory::withCount([
            'articles' => function ($query) {
                $query->where('is_published', true);
            }
        ])
        ->orderBy('order')
        ->get();
    }
    
    /**
     * Получить категорию по slug
     */
    public function findBySlug(string $slug): ?KnowledgeBaseCategory
    {
        return KnowledgeBaseCategory::where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }
    
    /**
     * Получить дочерние категории
     */
    public function getChildren(int $categoryId): Collection
    {
        return KnowledgeBaseCategory::where('parent_id', $categoryId)
            ->where('is_active', true)
            ->orderBy('order')
            ->get();
    }
}
