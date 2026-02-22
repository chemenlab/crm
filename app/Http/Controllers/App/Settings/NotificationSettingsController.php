<?php

namespace App\Http\Controllers\App\Settings;

use App\Http\Controllers\Controller;
use App\Models\NotificationSetting;
use App\Services\OnboardingProgressService;
use Illuminate\Http\Request;

class NotificationSettingsController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'email_new_booking' => 'sometimes|boolean',
            'email_cancelled' => 'sometimes|boolean',
            'email_modified' => 'sometimes|boolean',
            'email_payment' => 'sometimes|boolean',
            'client_reminder_24h' => 'sometimes|boolean',
            'client_reminder_1h' => 'sometimes|boolean',
            'client_thank_you' => 'sometimes|boolean',
            'daily_summary' => 'sometimes|boolean',
            'daily_summary_time' => 'sometimes|nullable|date_format:H:i',
            'weekly_summary' => 'sometimes|boolean',
            'weekly_summary_day' => 'sometimes|nullable|integer|between:0,6',
        ]);

        $user = $request->user();

        // Get existing settings or create new
        $settings = NotificationSetting::firstOrCreate(
            ['user_id' => $user->id]
        );
        
        // Only update fields that were actually sent
        $fieldsToUpdate = array_filter($validated, function ($key) use ($request) {
            return $request->has($key);
        }, ARRAY_FILTER_USE_KEY);
        
        $settings->update($fieldsToUpdate);

        // Track onboarding progress
        try {
            app(OnboardingProgressService::class)->trackStepCompletion(
                $user,
                'notification_setup'
            );
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $user->id,
                'step' => 'notification_setup',
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Настройки уведомлений обновлены');
    }
}
