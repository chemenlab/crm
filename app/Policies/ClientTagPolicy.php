<?php

namespace App\Policies;

use App\Models\ClientTag;
use App\Models\User;

class ClientTagPolicy
{
    /**
     * Determine if the user can view the tag.
     */
    public function view(User $user, ClientTag $tag): bool
    {
        return $user->id === $tag->user_id;
    }

    /**
     * Determine if the user can update the tag.
     */
    public function update(User $user, ClientTag $tag): bool
    {
        return $user->id === $tag->user_id;
    }

    /**
     * Determine if the user can delete the tag.
     */
    public function delete(User $user, ClientTag $tag): bool
    {
        return $user->id === $tag->user_id;
    }
}
