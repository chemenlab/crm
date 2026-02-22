<?php

namespace App\Modules\Leads\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Archived = 'archived';

    /**
     * Get the human-readable label for the status
     */
    public function label(): string
    {
        return match($this) {
            self::New => 'Новая',
            self::InProgress => 'В работе',
            self::Completed => 'Завершена',
            self::Cancelled => 'Отменена',
            self::Archived => 'Архив',
        };
    }

    /**
     * Get the color associated with the status
     */
    public function color(): string
    {
        return match($this) {
            self::New => 'blue',
            self::InProgress => 'yellow',
            self::Completed => 'green',
            self::Cancelled => 'red',
            self::Archived => 'gray',
        };
    }

    /**
     * Get all statuses as array for select options
     */
    public static function options(): array
    {
        return array_map(
            fn(self $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            self::cases()
        );
    }
}
