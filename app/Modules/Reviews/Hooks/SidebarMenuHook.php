<?php

namespace App\Modules\Reviews\Hooks;

use App\Models\User;
use App\Modules\Reviews\Models\Review;

class SidebarMenuHook
{
    /**
     * Get sidebar menu item data
     */
    public function __invoke(array $context): array
    {
        $user = $context['user'] ?? null;

        return [
            'title' => 'Отзывы',
            'url' => '/app/modules/reviews',
            'icon' => 'star',
            'badge' => $this->getPendingCount($user),
        ];
    }

    /**
     * Get pending reviews count
     */
    private function getPendingCount(?User $user): ?int
    {
        if ($user === null) {
            return null;
        }

        $count = Review::forUser($user->id)->pending()->count();

        return $count > 0 ? $count : null;
    }
}
