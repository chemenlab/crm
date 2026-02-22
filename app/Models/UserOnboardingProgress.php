<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOnboardingProgress extends Model
{
    protected $table = 'user_onboarding_progress';

    protected $fillable = [
        'user_id',
        'completed_steps',
        'current_step',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'completed_steps' => 'array',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'completed_steps' => '[]',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Проверить, выполнен ли шаг
     */
    public function isStepCompleted(string $step): bool
    {
        $steps = $this->completed_steps ?? [];
        return in_array($step, $steps);
    }

    /**
     * Отметить шаг как выполненный
     */
    public function completeStep(string $step): void
    {
        $steps = $this->completed_steps ?? [];
        
        if (!in_array($step, $steps)) {
            $steps[] = $step;
            $this->completed_steps = $steps;
            $this->current_step = $step;
            $this->save();
        }
    }

    /**
     * Получить процент завершения
     */
    public function getProgressPercentage(): int
    {
        $totalSteps = 7; // Всего шагов в онбординге
        $completedCount = count($this->completed_steps ?? []);
        
        return (int) (($completedCount / $totalSteps) * 100);
    }
}
