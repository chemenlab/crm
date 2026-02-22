<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * Determine if the user can view the service.
     */
    public function view(User $user, Service $service): bool
    {
        return $user->id === $service->user_id;
    }

    /**
     * Determine if the user can update the service.
     */
    public function update(User $user, Service $service): bool
    {
        return $user->id === $service->user_id;
    }

    /**
     * Determine if the user can delete the service.
     */
    public function delete(User $user, Service $service): bool
    {
        return $user->id === $service->user_id;
    }
}
