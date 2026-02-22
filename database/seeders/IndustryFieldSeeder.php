<?php

namespace Database\Seeders;

use App\Models\Industry;
use App\Models\IndustryField;
use Illuminate\Database\Seeder;

class IndustryFieldSeeder extends Seeder
{
    public function run(): void
    {
        $fields = [
            'beauty' => [
                ['label' => 'Аллергии / Ограничения', 'type' => 'text', 'is_required' => false],
                ['label' => 'Источник (Откуда узнали)', 'type' => 'select', 'options' => ['Instagram', '2ГИС', 'Рекомендация', 'Другое'], 'is_required' => false],
                ['label' => 'Референс (Фото желаемого)', 'type' => 'file', 'is_required' => false],
            ],
            'auto' => [
                ['label' => 'Госномер', 'type' => 'text', 'is_required' => true],
                ['label' => 'Марка и Модель', 'type' => 'text', 'is_required' => true],
                ['label' => 'Пробег (км)', 'type' => 'number', 'is_required' => false],
                ['label' => 'VIN-код', 'type' => 'text', 'is_required' => false],
            ],
            'repair' => [
                ['label' => 'Адрес объекта', 'type' => 'text', 'is_required' => true],
                ['label' => 'Подъезд / Этаж / Домофон', 'type' => 'text', 'is_required' => false],
                ['label' => 'Фото поломки', 'type' => 'file', 'is_required' => false],
                ['label' => 'Материалы', 'type' => 'select', 'options' => ['Купить мастеру', 'Материалы есть', 'Не нужны'], 'is_required' => true],
            ],
            'education' => [
                ['label' => 'Имя ученика', 'type' => 'text', 'is_required' => true],
                ['label' => 'Класс / Возраст', 'type' => 'text', 'is_required' => true],
                ['label' => 'Цель занятий', 'type' => 'select', 'options' => ['Подготовка к экзаменам', 'Повышение успеваемости', 'Для себя'], 'is_required' => false],
                ['label' => 'Место проведения', 'type' => 'select', 'options' => ['Zoom/Skype', 'У ученика', 'У преподавателя'], 'is_required' => true],
            ],
        ];

        foreach ($fields as $slug => $industryFields) {
            $industry = Industry::where('slug', $slug)->first();
            if (!$industry) continue;

            foreach ($industryFields as $index => $field) {
                IndustryField::updateOrCreate(
                    [
                        'industry_id' => $industry->id,
                        'label' => $field['label']
                    ],
                    [
                        'type' => $field['type'],
                        'options' => $field['options'] ?? null,
                        'is_required' => $field['is_required'],
                        'sort_order' => $index,
                    ]
                );
            }
        }
    }
}
