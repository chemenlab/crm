<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\OnboardingProgressService;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = 20;

        $query = $request->user()->services()
            ->with('options')
            ->orderBy('name');

        $usageLimitService = app(UsageLimitService::class);
        $remainingSlots = $usageLimitService->getRemainingUsage($request->user(), 'services');

        // Check if Leads module is active for this user
        $isLeadsModuleActive = $request->user()->userModules()
            ->where('module_slug', 'leads')
            ->where('is_enabled', true)
            ->exists();

        if ($request->wantsJson()) {
            return response()->json($query->paginate($perPage)->withQueryString());
        }

        return Inertia::render('App/Services/Index', [
            'services' => $query->paginate($perPage)->withQueryString(),
            'remainingSlots' => $remainingSlots,
            'isLeadsModuleActive' => $isLeadsModuleActive,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check limit before creating
        $usageLimitService = app(UsageLimitService::class);
        if (!$usageLimitService->checkLimit($request->user(), 'services')) {
            return back()->withErrors([
                'limit' => 'Вы достигли лимита услуг для вашего тарифного плана.'
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:5',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
            'booking_type' => 'nullable|in:appointment,lead',
            'custom_slot_step' => 'nullable|integer|min:15|max:120',
            'custom_buffer_time' => 'nullable|integer|min:0|max:60',
            'options' => 'array',
            'options.*.name' => 'required|string',
            'options.*.price_change' => 'required|numeric',
            'options.*.duration_change' => 'required|integer',
        ]);

        $service = $request->user()->services()->create($validated);

        if (!empty($validated['options'])) {
            $service->options()->createMany($validated['options']);
        }

        // Track usage
        app(UsageLimitService::class)->trackUsage($request->user(), 'services');

        // Track onboarding progress
        try {
            app(OnboardingProgressService::class)->trackStepCompletion(
                $request->user(),
                'first_service'
            );
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $request->user()->id,
                'step' => 'first_service',
                'error' => $e->getMessage(),
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json($service);
        }

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $service)
    {
        $this->authorize('update', $service);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:5',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
            'booking_type' => 'nullable|in:appointment,lead',
            'custom_slot_step' => 'nullable|integer|min:15|max:120',
            'custom_buffer_time' => 'nullable|integer|min:0|max:60',
            'options' => 'array',
            'options.*.id' => 'nullable|exists:service_options,id',
            'options.*.name' => 'required|string',
            'options.*.price_change' => 'required|numeric',
            'options.*.duration_change' => 'required|integer',
        ]);

        $service->update($validated);

        // Sync options
        if (isset($validated['options'])) {
            // Get IDs of options that should remain
            $optionIds = collect($validated['options'])
                ->pluck('id')
                ->filter()
                ->toArray();

            // Delete options not in the list
            $service->options()->whereNotIn('id', $optionIds)->delete();

            // Update or create options
            foreach ($validated['options'] as $optionData) {
                $service->options()->updateOrCreate(
                    ['id' => $optionData['id'] ?? null],
                    [
                        'name' => $optionData['name'],
                        'price_change' => $optionData['price_change'],
                        'duration_change' => $optionData['duration_change'],
                    ]
                );
            }
        } else {
            // If options is explicitly passed as empty or null, we might want to clear them,
            // but usually React Hook Form sends what's in the form.
            // Let's assume if key is present but empty array, we delete all.
            if ($request->has('options')) {
                $service->options()->delete();
            }
        }

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $service = $request->user()->services()->where('id', $id)->firstOrFail();

        // Check for ANY appointments - DB has RESTRICT constraint
        $totalAppointmentsCount = $service->appointments()->count();

        if ($totalAppointmentsCount > 0) {
            // Check for active appointments (scheduled/pending/confirmed with future date)
            $activeAppointmentsCount = $service->appointments()
                ->whereIn('status', ['scheduled', 'pending', 'confirmed'])
                ->where('start_time', '>=', now())
                ->count();

            if ($activeAppointmentsCount > 0) {
                $word = $this->pluralizeAppointments($activeAppointmentsCount);
                return back()->withErrors([
                    'service' => "Невозможно удалить услугу: есть {$activeAppointmentsCount} {$word}. Сначала отмените или перенесите записи."
                ]);
            }

            // Has past appointments
            return back()->withErrors([
                'service' => "Невозможно удалить услугу: есть {$totalAppointmentsCount} " . $this->pluralizeAppointments($totalAppointmentsCount) . " в истории. Услуга используется в записях."
            ]);
        }

        $service->delete();

        // Decrease usage
        app(UsageLimitService::class)->decreaseUsage($request->user(), 'services');

        return back()->with('success', 'Услуга успешно удалена');
    }

    /**
     * Pluralize word "запись" based on count.
     */
    private function pluralizeAppointments(int $count): string
    {
        $lastDigit = $count % 10;
        $lastTwoDigits = $count % 100;

        if ($lastTwoDigits >= 11 && $lastTwoDigits <= 19) {
            return 'активных записей';
        }

        if ($lastDigit === 1) {
            return 'активная запись';
        }

        if ($lastDigit >= 2 && $lastDigit <= 4) {
            return 'активные записи';
        }

        return 'активных записей';
    }
}
