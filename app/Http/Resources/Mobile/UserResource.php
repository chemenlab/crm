<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'timezone'    => $this->timezone ?? 'UTC',
            'slot_step'   => $this->slot_step,
            'buffer_time' => $this->buffer_time,
            'avatar_url'  => $this->avatar_path
                ? Storage::url($this->avatar_path)
                : null,
            'slug'        => $this->slug,
            'currency'    => $this->currency ?? 'RUB',
        ];
    }
}
