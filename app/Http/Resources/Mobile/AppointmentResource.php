<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'client_id'      => $this->client_id,
            'service_id'     => $this->service_id,
            'start_time'     => $this->start_time->toIso8601ZuluString(),
            'end_time'       => $this->end_time->toIso8601ZuluString(),
            'status'         => $this->status,
            'payment_method' => $this->payment_method,
            'price'          => (float) $this->price,
            'notes'          => $this->notes,
            'client'         => $this->whenLoaded('client', fn () => [
                'id'    => $this->client->id,
                'name'  => $this->client->name,
                'phone' => $this->client->phone,
                'email' => $this->client->email,
            ]),
            'service'        => $this->whenLoaded('service', fn () => [
                'id'       => $this->service->id,
                'name'     => $this->service->name,
                'duration' => $this->service->duration,
                'color'    => $this->service->color,
            ]),
            'updated_at'     => $this->updated_at->toIso8601ZuluString(),
            'created_at'     => $this->created_at->toIso8601ZuluString(),
        ];
    }
}
