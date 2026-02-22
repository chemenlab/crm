<?php

namespace App\Modules\Reviews\Hooks;

class PublicPageHook
{
    /**
     * Get public page section data
     */
    public function __invoke(array $context): array
    {
        return [
            'id' => 'reviews',
            'title' => 'Отзывы клиентов',
            'component' => 'modules/reviews/PublicReviewsSection',
            'order' => 50,
        ];
    }
}
