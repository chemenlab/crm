<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBaseArticle;
use App\Services\KnowledgeBase\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class KnowledgeBaseAnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}
    
    /**
     * Дашборд аналитики
     */
    public function index(Request $request): Response
    {
        $overallStats = $this->analyticsService->getOverallStats();
        $topArticles = $this->analyticsService->getTopArticles(10, 'views');
        $lowRatedArticles = $this->analyticsService->getLowRatedArticles(50);
        $categoriesStats = $this->analyticsService->getCategoriesStats();
        $searchStats = $this->analyticsService->getSearchStats(30);
        
        // Графики просмотров
        $viewsByDay = $this->analyticsService->getViewsByPeriod('day', 30);
        
        return Inertia::render('Admin/KnowledgeBase/Analytics', [
            'stats' => $overallStats,
            'topArticles' => $topArticles,
            'lowRatedArticles' => $lowRatedArticles,
        ]);
    }
    
    /**
     * Статистика по конкретной статье
     */
    public function article(KnowledgeBaseArticle $article): JsonResponse
    {
        $stats = $this->analyticsService->getArticleStats($article);
        
        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }
    
    /**
     * Экспорт данных
     */
    public function export(Request $request): BinaryFileResponse
    {
        $request->validate([
            'type' => 'required|in:articles,categories,analytics',
            'format' => 'required|in:csv,json',
        ]);
        
        $type = $request->input('type');
        $format = $request->input('format');
        
        $data = match($type) {
            'articles' => KnowledgeBaseArticle::with(['category'])->get(),
            'categories' => $this->analyticsService->getCategoriesStats(),
            'analytics' => $this->analyticsService->getOverallStats(),
        };
        
        $filename = "knowledge-base-{$type}-" . now()->format('Y-m-d') . ".{$format}";
        
        if ($format === 'json') {
            $content = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $mimeType = 'application/json';
        } else {
            $content = $this->convertToCSV($data);
            $mimeType = 'text/csv';
        }
        
        $path = storage_path("app/temp/{$filename}");
        file_put_contents($path, $content);
        
        return ResponseFacade::download($path, $filename, [
            'Content-Type' => $mimeType,
        ])->deleteFileAfterSend();
    }
    
    /**
     * Конвертация данных в CSV
     */
    private function convertToCSV($data): string
    {
        if ($data instanceof \Illuminate\Support\Collection) {
            $data = $data->toArray();
        }
        
        if (empty($data)) {
            return '';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Заголовки
        $headers = array_keys((array) $data[0]);
        fputcsv($output, $headers);
        
        // Данные
        foreach ($data as $row) {
            fputcsv($output, (array) $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
}
