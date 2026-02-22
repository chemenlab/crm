<?php

namespace App\Modules\Leads;

use App\Modules\Leads\Models\Lead;
use App\Modules\Leads\Enums\LeadStatus;
use App\Services\Modules\HookManager;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LeadsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerPublicRoutes();
        $this->registerHooks();
    }

    /**
     * Register public routes for lead submission
     */
    private function registerPublicRoutes(): void
    {
        $publicRoutesPath = __DIR__ . '/Routes/public.php';

        if (file_exists($publicRoutesPath)) {
            Route::middleware('web')
                ->group($publicRoutesPath);
        }
    }

    /**
     * Register module hooks
     */
    private function registerHooks(): void
    {
        /** @var HookManager $hookManager */
        $hookManager = $this->app->make(HookManager::class);

        // Sidebar menu hook
        $hookManager->register('sidebar.menu', 'leads', function (array $context) {
            return [
                'title' => 'Заявки',
                'url' => '/app/modules/leads/list',
                'icon' => 'clipboard-list',
                'badge' => $this->getNewLeadsCount($context['user'] ?? null),
            ];
        }, 40);

        // Service form fields hook - adds booking_type field
        $hookManager->register('service.form.fields', 'leads', function (array $context) {
            return [
                'id' => 'booking_type',
                'type' => 'select',
                'label' => 'Тип записи',
                'options' => [
                    ['value' => 'appointment', 'label' => 'Запись на время'],
                    ['value' => 'lead', 'label' => 'Заявка без даты'],
                ],
                'default' => 'appointment',
                'description' => 'Заявка без даты позволяет клиентам оставить заявку без выбора конкретного времени',
            ];
        }, 10);

        // Public booking form hook - shows lead form instead of date picker
        $hookManager->register('public.booking.form', 'leads', function (array $context) {
            return [
                'id' => 'lead-form',
                'condition' => 'service.booking_type === "lead"',
                'component' => 'modules/leads/PublicLeadForm',
                'replaces' => 'date-time-picker',
            ];
        }, 10);

        // Settings sections hook
        $hookManager->register('settings.sections', 'leads', function (array $context) {
            return [
                'id' => 'leads',
                'title' => 'Настройки заявок',
                'icon' => 'clipboard-list',
                'url' => '/app/modules/leads/settings/fields',
            ];
        }, 50);
    }

    /**
     * Get new leads count for badge
     */
    private function getNewLeadsCount($user): ?int
    {
        if ($user === null) {
            return null;
        }

        try {
            $count = Lead::forUser($user->id)
                ->withStatus(LeadStatus::New)
                ->count();

            return $count > 0 ? $count : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
