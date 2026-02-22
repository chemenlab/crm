<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'description'        => $this->description,
            'price'              => (float) $this->price,
            'duration'           => $this->duration,
            'color'              => $this->color,
            'is_active'          => (bool) $this->is_active,
            'custom_slot_step'   => $this->custom_slot_step,
            'custom_buffer_time' => $this->custom_buffer_time,
            'updated_at'         => $this->updated_at->toIso8601ZuluString(),
        ];
    }
}
