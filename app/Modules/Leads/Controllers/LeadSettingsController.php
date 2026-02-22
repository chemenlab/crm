<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Enums\LeadStatus;
use App\Modules\Leads\Models\Lead;
use App\Services\Modules\ModuleSettingsService;
use App\Services\Modules\UserModuleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadSettingsController extends Controller
{
    public function __construct(
        private readonly ModuleSettingsService $settingsService,
        private readonly UserModuleService $userModuleService,
    ) {}

    /**
     * Display module settings page
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Check if module is enabled for this user
        $isEnabled = $this->userModuleService->isEnabled($user, 'leads');

        // Module info from module.json
        $moduleInfo = [
            'slug' => 'leads',
            'name' => 'Заявки',
            'description' => 'Модуль для сбора и управления заявками на услуги. Позволяет принимать заявки через публичную форму, отслеживать их статус в Kanban-доске, добавлять задачи и комментарии.',
            'version' => '1.0.0',
            'author' => 'Booking System',
            'category' => 'CRM',
            'price' => 'Бесплатный',
            'is_enabled' => $isEnabled,
            'features' => [
                'Kanban-доска для управления заявками',
                'Публичная форма для сбора заявок',
                'Кастомные поля формы',
                'Задачи и комментарии к заявкам',
                'Конвертация заявок в записи',
                'Экспорт в CSV',
                'Напоминания',
                'Теги и приоритеты',
            ],
        ];

        // Stats (only if module is enabled)
        $stats = null;
        $settings = [];
        
        if ($isEnabled) {
            $totalLeads = Lead::forUser($user->id)->count();
            $leadsThisMonth = Lead::forUser($user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            $completedLeads = Lead::forUser($user->id)
                ->withStatus(LeadStatus::Completed)
                ->count();
            
            $conversionRate = $totalLeads > 0 
                ? round(($completedLeads / $totalLeads) * 100, 1) 
                : 0;

            $stats = [
                'total_leads' => $totalLeads,
                'leads_this_month' => $leadsThisMonth,
                'conversion_rate' => $conversionRate,
                'avg_response_time' => '< 1 час',
            ];

            // Settings
            $settings = $this->settingsService->getAll($user, 'leads');
            
            // Set defaults if not set
            $settings = array_merge([
                'notify_on_new_lead' => true,
                'default_status' => 'new',
                'auto_assign_tags' => false,
            ], $settings);
        }

        return Inertia::render('Modules/Leads/Settings/Index', [
            'moduleInfo' => $moduleInfo,
            'stats' => $stats,
            'settings' => $settings,
        ]);
    }

    /**
     * Update module settings
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'notify_on_new_lead' => 'sometimes|boolean',
            'default_status' => 'sometimes|string|in:new,in_progress',
            'auto_assign_tags' => 'sometimes|boolean',
        ]);

        $this->settingsService->setMany($user, 'leads', $validated);

        return back()->with('success', 'Настройки сохранены');
    }
}
