<?php

namespace App\Services\Modules\DTO;

use JsonSerializable;

/**
 * Data Transfer Object for module routes configuration
 */
class ModuleRoutes implements JsonSerializable
{
    public function __construct(
        public readonly ?string $web = null,
        public readonly ?string $api = null,
    ) {}

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            web: $data['web'] ?? null,
            api: $data['api'] ?? null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->web !== null) {
            $data['web'] = $this->web;
        }

        if ($this->api !== null) {
            $data['api'] = $this->api;
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
     * Check if has web routes
     */
    public function hasWeb(): bool
    {
        return $this->web !== null;
    }

    /**
     * Check if has API routes
     */
    public function hasApi(): bool
    {
        return $this->api !== null;
    }
}
