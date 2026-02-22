<?php

return [
    'barbershop' => [
        'name' => 'Барбершоп',
        'icon' => '✂️',
        'description' => 'Стрижки, бороды, уход',
        'services' => [
            ['name' => 'Мужская стрижка', 'price' => 1500, 'duration' => 60, 'color' => '#000000'],
            ['name' => 'Стрижка бороды', 'price' => 800, 'duration' => 30, 'color' => '#555555'],
            ['name' => 'Комплекс (Стрижка + Борода)', 'price' => 2000, 'duration' => 90, 'color' => '#333333'],
            ['name' => 'Детская стрижка', 'price' => 1000, 'duration' => 45, 'color' => '#777777'],
        ]
    ],
    'beauty_salon' => [
        'name' => 'Салон красоты',
        'icon' => '💅',
        'description' => 'Маникюр, педикюр, ресницы',
        'services' => [
            ['name' => 'Маникюр с покрытием', 'price' => 2000, 'duration' => 90, 'color' => '#e91e63'],
            ['name' => 'Педикюр', 'price' => 2500, 'duration' => 90, 'color' => '#9c27b0'],
            ['name' => 'Наращивание ресниц', 'price' => 3000, 'duration' => 120, 'color' => '#673ab7'],
            ['name' => 'Коррекция бровей', 'price' => 800, 'duration' => 30, 'color' => '#795548'],
        ]
    ],
    'tutor' => [
        'name' => 'Репетитор',
        'icon' => '📚',
        'description' => 'Языки, школьные предметы',
        'services' => [
            ['name' => 'Индивидуальное занятие', 'price' => 1500, 'duration' => 60, 'color' => '#2196f3'],
            ['name' => 'Подготовка к экзамену', 'price' => 2000, 'duration' => 90, 'color' => '#03a9f4'],
            ['name' => 'Групповое занятие', 'price' => 800, 'duration' => 60, 'color' => '#00bcd4'],
        ]
    ],
    'psychologist' => [
        'name' => 'Психолог',
        'icon' => '🧠',
        'description' => 'Консультации, терапия',
        'services' => [
            ['name' => 'Индивидуальная консультация', 'price' => 3000, 'duration' => 50, 'color' => '#4caf50'],
            ['name' => 'Семейная терапия', 'price' => 5000, 'duration' => 90, 'color' => '#8bc34a'],
            ['name' => 'Онлайн консультация', 'price' => 3000, 'duration' => 50, 'color' => '#cddc39'],
        ]
    ],
    'fitness' => [
        'name' => 'Фитнес-тренер',
        'icon' => '💪',
        'description' => 'Персональные тренировки',
        'services' => [
            ['name' => 'Персональная тренировка', 'price' => 2000, 'duration' => 60, 'color' => '#ff9800'],
            ['name' => 'Сплит-тренировка', 'price' => 3000, 'duration' => 60, 'color' => '#ff5722'],
            ['name' => 'Онлайн ведение (мес)', 'price' => 5000, 'duration' => 0, 'color' => '#ffc107'],
        ]
    ],
    'other' => [
        'name' => 'Другое',
        'icon' => '✨',
        'description' => 'Своя ниша',
        'services' => []
    ],
];
