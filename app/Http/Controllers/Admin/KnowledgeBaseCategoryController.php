<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBaseCategory;
use App\Services\KnowledgeBase\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseCategoryController extends Controller
{
    public function __construct(
        private CategoryService $categoryService
    ) {}
    
    /**
     * Список категорий
     */
    public function index(): Response
    {
        $categories = $this->categoryService->getTree();
        $allCategories = $this->categoryService->getAllWithCounts();
        
        return Inertia::render('Admin/KnowledgeBase/Categories', [
            'categories' => $categories,
            'allCategories' => $allCategories,
        ]);
    }
    
    /**
     * Создать категорию
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:kb_categories,slug',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:kb_categories,id',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);
        
        try {
            $category = $this->categoryService->create($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Категория успешно создана',
                'category' => $category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
    
    /**
     * Обновить категорию
     */
    public function update(Request $request, KnowledgeBaseCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:kb_categories,slug,' . $category->id,
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:kb_categories,id',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);
        
        try {
            $category = $this->categoryService->update($category, $validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Категория успешно обновлена',
                'category' => $category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
    
    /**
     * Удалить категорию
     */
    public function destroy(KnowledgeBaseCategory $category): JsonResponse
    {
        try {
            $this->categoryService->delete($category);
            
            return response()->json([
                'success' => true,
                'message' => 'Категория успешно удалена',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
    
    /**
     * Изменить порядок категорий
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|integer|exists:kb_categories,id',
        ]);
        
        $this->categoryService->reorder($validated['order']);
        
        return response()->json([
            'success' => true,
            'message' => 'Порядок категорий обновлен',
        ]);
    }
}
