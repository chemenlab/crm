<?php

namespace App\Services\Modules\DTO;

use JsonSerializable;

/**
 * Data Transfer Object for module pricing configuration
 */
class ModulePricing implements JsonSerializable
{
    public function __construct(
        public readonly string $type,
        public readonly ?float $price = null,
        public readonly ?string $period = null,
    ) {}

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            type: $data['type'] ?? 'free',
            price: isset($data['price']) ? (float) $data['price'] : null,
            period: $data['period'] ?? null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        $data = ['type' => $this->type];

        if ($this->price !== null) {
            $data['price'] = $this->price;
        }

        if ($this->period !== null) {
            $data['period'] = $this->period;
        }

        return $data;
    }

    /**
     * JSON serialization
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    /**
     * Check if free
     */
    public function isFree(): bool
    {
        return $this->type === 'free';
    }

    /**
     * Check if subscription
     */
    public function isSubscription(): bool
    {
        return $this->type === 'subscription';
    }

    /**
     * Check if one-time purchase
     */
    public function isOneTime(): bool
    {
        return $this->type === 'one_time';
    }
}
