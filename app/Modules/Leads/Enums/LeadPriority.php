<?php

namespace App\Modules\Leads\Enums;

enum LeadPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return match($this) {
            self::Low => 'Низкий',
            self::Normal => 'Обычный',
            self::High => 'Высокий',
            self::Urgent => 'Срочный',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Low => 'gray',
            self::Normal => 'blue',
            self::High => 'orange',
            self::Urgent => 'red',
        };
    }

    public static function options(): array
    {
        return array_map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'color' => $case->color(),
        ], self::cases());
    }
}
