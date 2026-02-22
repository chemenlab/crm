<?php

namespace App\Services\Booking;

use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TimeSlotGenerator
{
    /**
     * Default slot step in minutes.
     */
    public const DEFAULT_SLOT_STEP = 30;

    /**
     * Default buffer time in minutes.
     */
    public const DEFAULT_BUFFER_TIME = 0;

    /**
     * Get effective slot step for a service and user combination.
     * Priority: service custom -> user global -> default
     */
    public function getEffectiveSlotStep(Service $service, User $user): int
    {
        return $service->custom_slot_step ?? $user->slot_step ?? self::DEFAULT_SLOT_STEP;
    }

    /**
     * Get effective buffer time for a service and user combination.
     * Priority: service custom -> user global -> default
     */
    public function getEffectiveBufferTime(Service $service, User $user): int
    {
        return $service->custom_buffer_time ?? $user->buffer_time ?? self::DEFAULT_BUFFER_TIME;
    }

    /**
     * Generate available time slots for a given date, service, and user.
     */
    public function generateSlots(
        Carbon $date,
        Service $service,
        User $user,
        int $duration
    ): Collection {
        $slotStep = $this->getEffectiveSlotStep($service, $user);
        $bufferTime = $this->getEffectiveBufferTime($service, $user);

        // Get work schedule for the day
        $schedule = $user->userSchedules()
            ->where('day_of_week', $date->dayOfWeek)
            ->first();

        if (!$schedule || !$schedule->is_working) {
            return collect([]);
        }

        $workStart = $date->copy()->setTimeFromTimeString($schedule->start_time);
        $workEnd = $date->copy()->setTimeFromTimeString($schedule->end_time);

        // Get busy intervals with buffer
        $busyIntervals = $this->getBusyIntervalsWithBuffer($user, $date, $bufferTime);

        // Add break time as busy interval if exists
        if ($schedule->break_start && $schedule->break_end) {
            $breakStart = $date->copy()->setTimeFromTimeString($schedule->break_start);
            $breakEnd = $date->copy()->setTimeFromTimeString($schedule->break_end);
            $busyIntervals->push([
                'start' => $breakStart,
                'end' => $breakEnd,
            ]);
        }

        // Generate candidate slots
        $slots = collect();
        $current = $workStart->copy();

        while ($current->lt($workEnd)) {
            $slotEnd = $current->copy()->addMinutes($duration);

            // Check if slot fits in work hours
            if ($slotEnd->gt($workEnd)) {
                break;
            }

            // Check if slot overlaps with busy intervals
            if (!$this->overlapsWithBusy($current, $slotEnd, $busyIntervals)) {
                $slots->push($current->format('H:i'));
            }

            $current->addMinutes($slotStep);
        }

        return $slots;
    }

    /**
     * Get busy intervals from existing appointments with buffer time added.
     */
    private function getBusyIntervalsWithBuffer(
        User $user,
        Carbon $date,
        int $bufferTime
    ): Collection {
        return $user->appointments()
            ->whereDate('start_time', $date)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->get()
            ->map(fn($appointment) => [
                'start' => Carbon::parse($appointment->start_time),
                'end' => Carbon::parse($appointment->end_time)->addMinutes($bufferTime),
            ]);
    }

    /**
     * Check if a slot overlaps with any busy interval.
     */
    private function overlapsWithBusy(
        Carbon $slotStart,
        Carbon $slotEnd,
        Collection $busyIntervals
    ): bool {
        foreach ($busyIntervals as $interval) {
            // Overlap occurs when: slotStart < interval.end AND slotEnd > interval.start
            if ($slotStart->lt($interval['end']) && $slotEnd->gt($interval['start'])) {
                return true;
            }
        }
        return false;
    }
}
