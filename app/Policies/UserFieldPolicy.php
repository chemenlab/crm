<?php

namespace App\Policies;

use App\Models\UserField;
use App\Models\User;

class UserFieldPolicy
{
    /**
     * Determine if the user can view the field.
     */
    public function view(User $user, UserField $field): bool
    {
        return $user->id === $field->user_id;
    }

    /**
     * Determine if the user can update the field.
     */
    public function update(User $user, UserField $field): bool
    {
        return $user->id === $field->user_id;
    }

    /**
     * Determine if the user can delete the field.
     */
    public function delete(User $user, UserField $field): bool
    {
        return $user->id === $field->user_id;
    }
}
