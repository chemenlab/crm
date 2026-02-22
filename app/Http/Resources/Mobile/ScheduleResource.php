<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'day_of_week' => $this->day_of_week,
            'is_working'  => (bool) $this->is_working,
            'start_time'  => $this->start_time,
            'end_time'    => $this->end_time,
            'break_start' => $this->break_start,
            'break_end'   => $this->break_end,
        ];
    }
}
