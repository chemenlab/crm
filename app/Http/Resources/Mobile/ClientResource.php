<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'phone'        => $this->phone,
            'email'        => $this->email,
            'notes'        => $this->notes,
            'total_visits' => $this->total_visits,
            'total_spent'  => (float) $this->total_spent,
            'updated_at'   => $this->updated_at->toIso8601ZuluString(),
            'created_at'   => $this->created_at->toIso8601ZuluString(),
        ];
    }
}
