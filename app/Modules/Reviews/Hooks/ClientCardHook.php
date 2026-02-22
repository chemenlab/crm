<?php

namespace App\Modules\Reviews\Hooks;

class ClientCardHook
{
    /**
     * Get client card tab data
     */
    public function __invoke(array $context): array
    {
        return [
            'id' => 'reviews',
            'title' => 'Отзывы',
            'icon' => 'star',
            'component' => 'modules/reviews/ClientReviewsTab',
        ];
    }
}
