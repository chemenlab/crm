<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\CustomField;
use App\Models\NotificationSetting;
use App\Models\User;
use App\Models\UserOnboardingProgress;

use App\Models\UserSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Show the onboarding page
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // If onboarding is already completed, redirect to dashboard
        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('App/Onboarding/Index', [
            'user' => $user,
        ]);
    }

    /**
     * Check if slug is available
     */
    public function checkSlug(Request $request)
    {
        $slug = $request->input('slug');
        $userId = $request->user()->id;

        $exists = User::where('slug', $slug)
            ->where('id', '!=', $userId)
            ->exists();

        return response()->json([
            'available' => !$exists
        ]);
    }

    /**
     * Complete onboarding and save all data
     */
    public function complete(Request $request)
    {
        $validated = $request->validate([
            // Step 1: Industry
            'industry' => 'required|string|in:beauty,auto,repair,education,freelance,other',

            // Step 2: Business settings
            'business_name' => 'required|string|max:255',
            'timezone' => 'required|string',
            'currency' => 'required|string|in:RUB,USD,EUR',
            'tax_regime' => 'required|string|in:self_employed,ip_usn,custom',
            'tax_rate' => 'required_if:tax_regime,custom|nullable|numeric|min:0|max:100',

            // Step 3: First service + slug
            'service' => 'required|array',
            'service.name' => 'required|string|max:255',
            'service.price' => 'required|numeric|min:0',
            'service.duration' => 'required|integer|min:5',
            'service.description' => 'nullable|string',
            'slug' => 'nullable|string|max:50|unique:users,slug,' . $request->user()->id,
            'enable_online_booking' => 'boolean',

            // Step 4: Custom fields
            'custom_fields' => 'nullable|array',
            'custom_fields.*.name' => 'required|string|max:255',
            'custom_fields.*.type' => 'required|in:text,number,select,checkbox,date,photo,image,file',
            'custom_fields.*.is_required' => 'boolean',
            'custom_fields.*.is_public' => 'boolean',
            'custom_fields.*.options' => 'nullable|array',

            // Step 5: Address and contacts
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'phone' => 'required|string|max:20',
            'instagram' => 'nullable|string|max:100',
            'telegram' => 'nullable|string|max:100',
            'whatsapp' => 'nullable|string|max:20',

            // Schedule
            'schedule' => 'nullable|array',
        ]);

        $user = $request->user();

        // Determine tax rate based on regime
        $taxRate = match ($validated['tax_regime']) {
            'self_employed' => 4,
            'ip_usn' => 6,
            'custom' => $validated['tax_rate'],
            default => 4,
        };

        // Update user profile
        $user->update([
            'niche' => $validated['industry'],
            'name' => $validated['business_name'],
            'timezone' => $validated['timezone'],
            'currency' => $validated['currency'],
            'tax_system' => $validated['tax_regime'],
            'tax_rate' => $taxRate,
            'slug' => $validated['slug'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'phone' => $validated['phone'],
            'instagram' => $validated['instagram'] ?? null,
            'telegram' => $validated['telegram'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'site_title' => $validated['business_name'],
            'onboarding_completed' => true,
        ]);

        // Create first service
        $user->services()->create([
            'name' => $validated['service']['name'],
            'price' => $validated['service']['price'],
            'duration' => $validated['service']['duration'],
            'description' => $validated['service']['description'] ?? null,
            'is_active' => true,
            'color' => '#3b82f6', // Default blue color
        ]);

        // Create schedule if provided
        if (!empty($validated['schedule'])) {
            foreach ($validated['schedule'] as $day) {
                UserSchedule::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'day_of_week' => $day['day_of_week'],
                    ],
                    [
                        'is_working' => $day['is_working'] ?? false,
                        'start_time' => $day['start_time'] ?? '09:00',
                        'end_time' => $day['end_time'] ?? '18:00',
                        'break_start' => $day['break_start'] ?? null,
                        'break_end' => $day['break_end'] ?? null,
                    ]
                );
            }
        } else {
            // Create default schedule (Mon-Fri 9:00-18:00)
            $defaultDays = [1, 2, 3, 4, 5]; // Mon-Fri
            foreach (range(0, 6) as $day) {
                UserSchedule::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'is_working' => in_array($day, $defaultDays),
                        'start_time' => '09:00',
                        'end_time' => '18:00',
                    ]
                );
            }
        }

        // Create custom fields
        if (!empty($validated['custom_fields'])) {
            foreach ($validated['custom_fields'] as $index => $field) {
                $user->customFields()->create([
                    'name' => $field['name'],
                    'type' => $field['type'],
                    'is_required' => $field['is_required'] ?? false,
                    'is_public' => $field['is_public'] ?? true,
                    'options' => isset($field['options']) ? json_encode($field['options']) : null,
                    'order' => $index,
                ]);
            }
        }

        // Create default notification settings
        NotificationSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'email_new_booking' => true,
                'email_cancelled' => true,
                'client_reminder_24h' => true,
            ]
        );

        return redirect()->route('dashboard');
    }

    /**
     * Получить прогресс интерактивного тура
     */
    public function getProgress(Request $request)
    {
        $user = $request->user();
        
        $progress = UserOnboardingProgress::firstOrCreate(
            ['user_id' => $user->id],
            [
                'completed_steps' => [],
                'is_completed' => false,
            ]
        );

        return response()->json([
            'progress' => $progress,
            'percentage' => $progress->getProgressPercentage(),
        ]);
    }

    /**
     * Отметить шаг как выполненный
     */
    public function completeStep(Request $request, string $step)
    {
        $validated = $request->validate([
            'step' => 'required|string|in:profile_setup,first_service,first_client,schedule_setup,first_appointment,public_page_setup,notification_setup',
        ]);

        $user = $request->user();
        
        $progress = UserOnboardingProgress::firstOrCreate(
            ['user_id' => $user->id],
            [
                'completed_steps' => [],
                'is_completed' => false,
            ]
        );

        $progress->completeStep($validated['step']);

        // Проверяем, все ли шаги выполнены
        $allSteps = [
            'profile_setup',
            'first_service',
            'first_client',
            'schedule_setup',
            'first_appointment',
            'public_page_setup',
            'notification_setup',
        ];

        $completedSteps = $progress->completed_steps ?? [];
        $allCompleted = count(array_diff($allSteps, $completedSteps)) === 0;

        if ($allCompleted && !$progress->is_completed) {
            $progress->is_completed = true;
            $progress->completed_at = now();
            $progress->save();
        }

        return response()->json([
            'progress' => $progress,
            'percentage' => $progress->getProgressPercentage(),
        ]);
    }

    /**
     * Завершить интерактивный тур
     */
    public function completeTour(Request $request)
    {
        $user = $request->user();
        
        $progress = UserOnboardingProgress::firstOrCreate(
            ['user_id' => $user->id],
            [
                'completed_steps' => [],
                'is_completed' => false,
            ]
        );

        $progress->is_completed = true;
        $progress->completed_at = now();
        $progress->save();

        return response()->json([
            'success' => true,
            'progress' => $progress,
        ]);
    }

    /**
     * Сбросить прогресс тура
     */
    public function resetProgress(Request $request)
    {
        $user = $request->user();
        
        $progress = UserOnboardingProgress::where('user_id', $user->id)->first();
        
        if ($progress) {
            $progress->update([
                'completed_steps' => [],
                'current_step' => null,
                'is_completed' => false,
                'completed_at' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'progress' => $progress,
        ]);
    }

}
