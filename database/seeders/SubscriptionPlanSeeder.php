<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Базовая',
                'slug' => 'basic',
                'description' => 'Бесплатный тариф для начинающих мастеров',
                'price' => 0,
                'billing_period' => 'monthly',
                'is_active' => true,
                'features' => [
                    'limits' => [
                        'appointments' => 50,
                        'clients' => 30,
                        'services' => 5,
                        'portfolio_images' => 10,
                        'tags' => 5,
                        'notifications_per_month' => 100,
                    ],
                    'features' => [
                        'analytics' => false,
                        'priority_support' => false,
                        'custom_branding' => false,
                        'portfolio' => false,
                        'online_booking' => true,
                        'notifications' => true,
                        'calendar' => true,
                    ],
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Профессиональная',
                'slug' => 'professional',
                'description' => 'Для активно работающих мастеров',
                'price' => 299,
                'billing_period' => 'monthly',
                'is_active' => true,
                'features' => [
                    'limits' => [
                        'appointments' => 200,
                        'clients' => 100,
                        'services' => 20,
                        'portfolio_images' => 50,
                        'tags' => 20,
                        'notifications_per_month' => 500,
                    ],
                    'features' => [
                        'analytics' => true,
                        'priority_support' => false,
                        'custom_branding' => false,
                        'portfolio' => true,
                        'online_booking' => true,
                        'notifications' => true,
                        'calendar' => true,
                    ],
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Максимальная',
                'slug' => 'maximum',
                'description' => 'Для профессионалов без ограничений',
                'price' => 700,
                'billing_period' => 'monthly',
                'is_active' => true,
                'features' => [
                    'limits' => [
                        'appointments' => -1, // Безлимит
                        'clients' => -1,
                        'services' => -1,
                        'portfolio_images' => -1,
                        'tags' => -1,
                        'notifications_per_month' => -1,
                    ],
                    'features' => [
                        'analytics' => true,
                        'priority_support' => true,
                        'custom_branding' => true,
                        'portfolio' => true,
                        'online_booking' => true,
                        'notifications' => true,
                        'calendar' => true,
                    ],
                ],
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }

        $this->command->info('Subscription plans seeded successfully!');
    }
}
