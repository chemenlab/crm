<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\OnboardingProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    /**
     * Display the schedule settings.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Ensure schedule exists for all 7 days
        if ($user->schedules()->count() < 7) {
            $this->initializeSchedule($user);
        }

        $schedule = $user->schedules()->orderBy('day_of_week')->get();

        return Inertia::render('App/Settings/Schedule', [
            'schedule' => $schedule,
        ]);
    }

    /**
     * Update the schedule.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'schedule' => 'required|array',
            'schedule.*.id' => 'required|exists:schedules,id',
            'schedule.*.start_time' => 'required|date_format:H:i',
            'schedule.*.end_time' => 'required|date_format:H:i|after:schedule.*.start_time',
            'schedule.*.is_day_off' => 'required|boolean',
        ]);

        foreach ($validated['schedule'] as $dayData) {
            $schedule = Schedule::find($dayData['id']);
            if ($schedule->user_id !== $request->user()->id) {
                abort(403);
            }

            $schedule->update([
                'start_time' => $dayData['start_time'],
                'end_time' => $dayData['end_time'],
                'is_day_off' => $dayData['is_day_off'],
            ]);
        }

        // Track onboarding progress if at least one working day is configured
        try {
            $hasWorkingDay = $request->user()->schedules()
                ->where('is_day_off', false)
                ->exists();
            
            if ($hasWorkingDay) {
                app(OnboardingProgressService::class)->trackStepCompletion(
                    $request->user(),
                    'schedule_setup'
                );
            }
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $request->user()->id,
                'step' => 'schedule_setup',
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'График работы обновлен');
    }

    /**
     * Initialize default schedule for user.
     */
    private function initializeSchedule($user)
    {
        $days = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 1=Mon, ...

        foreach ($days as $day) {
            $user->schedules()->firstOrCreate(
                ['day_of_week' => $day],
                [
                    'start_time' => '10:00',
                    'end_time' => '19:00',
                    'is_day_off' => in_array($day, [0, 6]), // Weekend off by default
                ]
            );
        }
    }
}
