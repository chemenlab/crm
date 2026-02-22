<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use App\Models\UserModule;
use App\Modules\Leads\Enums\LeadStatus;
use App\Modules\Leads\Models\Lead;
use App\Modules\Leads\Models\LeadFormField;
use App\Services\Modules\ModuleSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicLeadController extends Controller
{
    public function __construct(
        private readonly ModuleSettingsService $settingsService
    ) {}

    /**
     * Store a new lead from public form
     */
    public function store(Request $request, string $slug): RedirectResponse
    {
        // Find master by slug
        $user = User::where('slug', $slug)->first();

        if (!$user) {
            abort(404, 'Мастер не найден');
        }

        // Check if leads module is active for this user
        $moduleActive = UserModule::where('user_id', $user->id)
            ->where('module_slug', 'leads')
            ->where('is_enabled', true)
            ->exists();

        if (!$moduleActive) {
            return redirect()->back()->withErrors([
                'service' => 'Модуль заявок не активен',
            ]);
        }

        // Validate base fields
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'message' => 'nullable|string|max:2000',
            'custom_fields' => 'nullable|array',
        ]);

        // Verify service belongs to user and is lead type
        $service = Service::where('id', $validated['service_id'])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$service) {
            return redirect()->back()->withErrors([
                'service' => 'Услуга не найдена',
            ]);
        }

        if ($service->booking_type !== 'lead') {
            return redirect()->back()->withErrors([
                'service' => 'Эта услуга не поддерживает заявки',
            ]);
        }

        // Validate custom fields
        $customFieldsData = [];
        if (!empty($validated['custom_fields'])) {
            $activeFields = LeadFormField::forUser($user->id)
                ->active()
                ->get()
                ->keyBy('id');

            foreach ($validated['custom_fields'] as $fieldId => $value) {
                $field = $activeFields->get($fieldId);
                if (!$field) {
                    continue;
                }

                // Validate required fields
                if ($field->is_required && empty($value)) {
                    return redirect()->back()->withErrors([
                        "custom_fields.{$fieldId}" => "Поле \"{$field->label}\" обязательно для заполнения",
                    ]);
                }

                // Validate field type
                if (!empty($value)) {
                    $validationError = $this->validateFieldValue($field, $value);
                    if ($validationError) {
                        return redirect()->back()->withErrors([
                            "custom_fields.{$fieldId}" => $validationError,
                        ]);
                    }
                }

                $customFieldsData[$fieldId] = $value;
            }

            // Check all required fields are present
            foreach ($activeFields as $field) {
                if ($field->is_required && !isset($customFieldsData[$field->id])) {
                    return redirect()->back()->withErrors([
                        "custom_fields.{$field->id}" => "Поле \"{$field->label}\" обязательно для заполнения",
                    ]);
                }
            }
        }

        // Get default status from module settings
        $defaultStatus = $this->settingsService->get($user, 'leads', 'default_status', 'new');

        // Get max position for new status
        $maxPosition = Lead::forUser($user->id)
            ->where('status', $defaultStatus)
            ->max('position') ?? -1;

        // Find or create client
        $client = $user->clients()->firstOrCreate(
            ['phone' => $validated['phone']],
            ['name' => $validated['name']]
        );

        // Create lead
        $lead = Lead::create([
            'user_id' => $user->id,
            'client_id' => $client->id,
            'service_id' => $service->id,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'message' => $validated['message'] ?? null,
            'status' => $defaultStatus,
            'position' => $maxPosition + 1,
            'custom_fields' => !empty($customFieldsData) ? $customFieldsData : null,
        ]);

        // Send notification if enabled
        $notifyOnNewLead = $this->settingsService->get($user, 'leads', 'notify_on_new_lead', true);
        if ($notifyOnNewLead) {
            $this->sendNewLeadNotification($user, $lead);
        }

        Log::info('New lead created', [
            'lead_id' => $lead->id,
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        // For Inertia requests, redirect back to the booking page
        return redirect("/m/{$slug}")
            ->with('success', 'Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.')
            ->with('lead_submitted', true);
    }

    /**
     * Validate field value based on type
     */
    private function validateFieldValue(LeadFormField $field, mixed $value): ?string
    {
        return match ($field->type) {
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL) ? null : 'Некорректный email',
            'url' => filter_var($value, FILTER_VALIDATE_URL) ? null : 'Некорректный URL',
            'select' => in_array($value, $field->options ?? []) ? null : 'Выберите значение из списка',
            'checkbox' => is_bool($value) || in_array($value, [0, 1, '0', '1', true, false], true) ? null : 'Некорректное значение',
            default => null,
        };
    }

    /**
     * Send notification about new lead
     */
    private function sendNewLeadNotification(User $user, Lead $lead): void
    {
        try {
            // Check if NewLeadNotification class exists
            if (class_exists(\App\Modules\Leads\Notifications\NewLeadNotification::class)) {
                $user->notify(new \App\Modules\Leads\Notifications\NewLeadNotification($lead));
            } else {
                // Fallback: log that notification class doesn't exist yet
                Log::info('NewLeadNotification class not found, skipping notification', [
                    'lead_id' => $lead->id,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to send new lead notification', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
