<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserOnboardingProgress;
use Illuminate\Support\Facades\Log;

class OnboardingProgressService
{
    /**
     * Все шаги онбординга
     */
    private const ALL_STEPS = [
        'profile_setup',
        'first_service',
        'first_client',
        'schedule_setup',
        'first_appointment',
        'public_page_setup',
        'notification_setup',
    ];

    /**
     * Отследить выполнение шага
     *
     * @param User $user
     * @param string $step
     * @return void
     */
    public function trackStepCompletion(User $user, string $step): void
    {
        try {
            // Валидация шага
            if (!in_array($step, self::ALL_STEPS)) {
                Log::warning("Invalid onboarding step: {$step}");
                return;
            }

            $progress = UserOnboardingProgress::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'completed_steps' => [],
                    'is_completed' => false,
                ]
            );

            // Проверяем, не выполнен ли уже этот шаг
            if (!$progress->isStepCompleted($step)) {
                $progress->completeStep($step);

                // Проверяем, все ли шаги выполнены
                if ($this->checkAllStepsCompleted($progress)) {
                    $progress->is_completed = true;
                    $progress->completed_at = now();
                    $progress->save();

                    // Отправляем уведомление о завершении
                    $this->sendCompletionNotification($user);
                }

                Log::info("Onboarding step completed", [
                    'user_id' => $user->id,
                    'step' => $step,
                    'progress' => $progress->getProgressPercentage(),
                ]);
            }
        } catch (\Exception $e) {
            // Логируем ошибку, но не прерываем основной процесс
            Log::error("Failed to track onboarding step", [
                'user_id' => $user->id,
                'step' => $step,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Проверить, все ли шаги выполнены
     *
     * @param UserOnboardingProgress $progress
     * @return bool
     */
    public function checkAllStepsCompleted(UserOnboardingProgress $progress): bool
    {
        $completedSteps = $progress->completed_steps ?? [];
        $remainingSteps = array_diff(self::ALL_STEPS, $completedSteps);

        return count($remainingSteps) === 0;
    }

    /**
     * Отправить уведомление о завершении онбординга
     *
     * @param User $user
     * @return void
     */
    private function sendCompletionNotification(User $user): void
    {
        try {
            // Можно отправить email или push уведомление
            // Пока просто логируем
            Log::info("User completed onboarding", [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);

            // TODO: В будущем можно добавить отправку email
            // Mail::to($user)->send(new OnboardingCompletedMail());
        } catch (\Exception $e) {
            Log::error("Failed to send onboarding completion notification", [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Получить прогресс пользователя
     *
     * @param User $user
     * @return UserOnboardingProgress|null
     */
    public function getProgress(User $user): ?UserOnboardingProgress
    {
        return UserOnboardingProgress::where('user_id', $user->id)->first();
    }

    /**
     * Получить процент выполнения
     *
     * @param User $user
     * @return int
     */
    public function getProgressPercentage(User $user): int
    {
        $progress = $this->getProgress($user);

        if (!$progress) {
            return 0;
        }

        return $progress->getProgressPercentage();
    }

    /**
     * Проверить, выполнен ли конкретный шаг
     *
     * @param User $user
     * @param string $step
     * @return bool
     */
    public function isStepCompleted(User $user, string $step): bool
    {
        $progress = $this->getProgress($user);

        if (!$progress) {
            return false;
        }

        return $progress->isStepCompleted($step);
    }

    /**
     * Получить список всех шагов
     *
     * @return array
     */
    public function getAllSteps(): array
    {
        return self::ALL_STEPS;
    }

    /**
     * Получить список невыполненных шагов
     *
     * @param User $user
     * @return array
     */
    public function getRemainingSteps(User $user): array
    {
        $progress = $this->getProgress($user);

        if (!$progress) {
            return self::ALL_STEPS;
        }

        $completedSteps = $progress->completed_steps ?? [];
        return array_values(array_diff(self::ALL_STEPS, $completedSteps));
    }
}
