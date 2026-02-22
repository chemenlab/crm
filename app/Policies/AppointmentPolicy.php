<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /**
     * Determine if the user can view the appointment.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id;
    }

    /**
     * Determine if the user can update the appointment.
     */
    public function update(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id;
    }

    /**
     * Determine if the user can delete the appointment.
     */
    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id;
    }
}
