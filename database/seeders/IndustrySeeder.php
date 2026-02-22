<?php

namespace Database\Seeders;

use App\Models\Industry;
use App\Models\ServicePreset;
use App\Models\ServicePresetOption;
use Illuminate\Database\Seeder;

class IndustrySeeder extends Seeder
{
    public function run(): void
    {
        $industries = [
            [
                'name' => 'Красота и здоровье',
                'slug' => 'beauty',
                'services' => [
                    ['name' => 'Стрижка женская', 'duration' => 60, 'price_min' => 1000, 'price_max' => 2500, 'options' => [
                        ['name' => 'Мытье головы', 'duration_change' => 15, 'price_change' => 300],
                        ['name' => 'Сложная укладка', 'duration_change' => 30, 'price_change' => 1000],
                    ]],
                    ['name' => 'Маникюр с покрытием', 'duration' => 90, 'price_min' => 1500, 'price_max' => 2000, 'options' => [
                         ['name' => 'Снятие старого покрытия', 'duration_change' => 15, 'price_change' => 200],
                         ['name' => 'Френч', 'duration_change' => 30, 'price_change' => 500],
                    ]],
                    ['name' => 'Массаж классический', 'duration' => 60, 'price_min' => 2000, 'price_max' => 3000, 'options' => []],
                ]
            ],
            [
                'name' => 'Автосервис',
                'slug' => 'auto',
                'services' => [
                    ['name' => 'Замена масла', 'duration' => 30, 'price_min' => 500, 'price_max' => 1000, 'options' => [
                        ['name' => 'Промывка двигателя', 'duration_change' => 15, 'price_change' => 400],
                    ]],
                    ['name' => 'Диагностика ходовой', 'duration' => 45, 'price_min' => 800, 'price_max' => 1500, 'options' => []],
                    ['name' => 'Шиномонтаж (комплект)', 'duration' => 60, 'price_min' => 1500, 'price_max' => 2500, 'options' => [
                        ['name' => 'Балансировка', 'duration_change' => 20, 'price_change' => 800],
                    ]],
                ]
            ],
            [
                'name' => 'Обучение',
                'slug' => 'education',
                'services' => [
                    ['name' => 'Урок английского (онлайн)', 'duration' => 60, 'price_min' => 1000, 'price_max' => 1500],
                    ['name' => 'Подготовка к ЕГЭ', 'duration' => 90, 'price_min' => 1500, 'price_max' => 2000],
                ]
            ],
             [
                'name' => 'Ремонт и строительство',
                'slug' => 'repair',
                'services' => [
                    ['name' => 'Выезд мастера на час', 'duration' => 60, 'price_min' => 1500, 'price_max' => 2000],
                    ['name' => 'Установка сантехники', 'duration' => 120, 'price_min' => 3000, 'price_max' => 5000],
                ]
            ],
        ];

        foreach ($industries as $indData) {
            $services = $indData['services'];
            unset($indData['services']);

            // Use updateOrCreate to avoid duplicates if run multiple times
            $industry = Industry::updateOrCreate(
                ['slug' => $indData['slug']],
                ['name' => $indData['name']]
            );

            foreach ($services as $svc) {
                $preset = ServicePreset::updateOrCreate(
                    [
                        'industry_id' => $industry->id,
                        'name' => $svc['name']
                    ],
                    [
                        'duration' => $svc['duration'],
                        'price_min' => $svc['price_min'],
                        'price_max' => $svc['price_max']
                    ]
                );

                if (isset($svc['options'])) {
                    foreach ($svc['options'] as $opt) {
                        ServicePresetOption::updateOrCreate(
                            [
                                'service_preset_id' => $preset->id,
                                'name' => $opt['name']
                            ],
                            [
                                'duration_change' => $opt['duration_change'],
                                'price_change' => $opt['price_change']
                            ]
                        );
                    }
                }
            }
        }
    }
}
