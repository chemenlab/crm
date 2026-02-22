<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupportStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportStatsController extends Controller
{
    public function __construct(
        private SupportStatsService $statsService
    ) {}

    /**
     * Статистика по тикетам
     */
    public function index(Request $request)
    {
        try {
            $globalStats = $this->statsService->getGlobalStats();
            
            $adminStats = null;
            if ($request->has('admin_id')) {
                $admin = \App\Models\User::findOrFail($request->admin_id);
                $adminStats = $this->statsService->getAdminStats($admin);
            }

            // Получаем список администраторов для фильтра
            $admins = \App\Models\User::where('role', 'admin')
                ->select('id', 'name')
                ->get();

            return Inertia::render('Admin/Support/Stats', [
                'globalStats' => $globalStats,
                'adminStats' => $adminStats,
                'admins' => $admins,
                'filters' => $request->only(['admin_id', 'date_from', 'date_to']),
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось загрузить статистику.']);
        }
    }
}
