<?php

namespace App\Services\Modules\DTO;

use JsonSerializable;

/**
 * Data Transfer Object for module manifest (module.json)
 */
class ModuleManifest implements JsonSerializable
{
    public function __construct(
        public readonly string $slug,
        public readonly string $name,
        public readonly string $description,
        public readonly string $version,
        public readonly ?string $author = null,
        public readonly ?string $category = null,
        public readonly ?string $icon = null,
        public readonly ?ModulePricing $pricing = null,
        public readonly ?string $minPlan = null,
        public readonly array $dependencies = [],
        public readonly array $hooks = [],
        public readonly ?ModuleRoutes $routes = null,
        public readonly ?string $migrations = null,
        public readonly array $permissions = [],
        public readonly array $settings = [],
        public readonly ?string $path = null,
    ) {}

    /**
     * Create from array (parsed JSON)
     */
    public static function fromArray(array $data, ?string $path = null): self
    {
        return new self(
            slug: $data['slug'],
            name: $data['name'],
            description: $data['description'],
            version: $data['version'],
            author: $data['author'] ?? null,
            category: $data['category'] ?? null,
            icon: $data['icon'] ?? null,
            pricing: isset($data['pricing']) ? ModulePricing::fromArray($data['pricing']) : null,
            minPlan: $data['minPlan'] ?? null,
            dependencies: $data['dependencies'] ?? [],
            hooks: $data['hooks'] ?? [],
            routes: isset($data['routes']) ? ModuleRoutes::fromArray($data['routes']) : null,
            migrations: $data['migrations'] ?? null,
            permissions: $data['permissions'] ?? [],
            settings: $data['settings'] ?? [],
            path: $path,
        );
    }


    /**
     * Convert to array
     */
    public function toArray(): array
    {
        $data = [
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'version' => $this->version,
        ];

        if ($this->author !== null) {
            $data['author'] = $this->author;
        }

        if ($this->category !== null) {
            $data['category'] = $this->category;
        }

        if ($this->icon !== null) {
            $data['icon'] = $this->icon;
        }

        if ($this->pricing !== null) {
            $data['pricing'] = $this->pricing->toArray();
        }

        if ($this->minPlan !== null) {
            $data['minPlan'] = $this->minPlan;
        }

        if (!empty($this->dependencies)) {
            $data['dependencies'] = $this->dependencies;
        }

        if (!empty($this->hooks)) {
            $data['hooks'] = $this->hooks;
        }

        if ($this->routes !== null) {
            $data['routes'] = $this->routes->toArray();
        }

        if ($this->migrations !== null) {
            $data['migrations'] = $this->migrations;
        }

        if (!empty($this->permissions)) {
            $data['permissions'] = $this->permissions;
        }

        if (!empty($this->settings)) {
            $data['settings'] = $this->settings;
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
     * Check if module is free
     */
    public function isFree(): bool
    {
        return $this->pricing === null || $this->pricing->type === 'free';
    }

    /**
     * Check if module has hooks
     */
    public function hasHooks(): bool
    {
        return !empty($this->hooks);
    }

    /**
     * Check if module has routes
     */
    public function hasRoutes(): bool
    {
        return $this->routes !== null;
    }

    /**
     * Check if module has migrations
     */
    public function hasMigrations(): bool
    {
        return $this->migrations !== null;
    }

    /**
     * Check if module has dependencies
     */
    public function hasDependencies(): bool
    {
        return !empty($this->dependencies);
    }

    /**
     * Get full path to module directory
     */
    public function getPath(): ?string
    {
        return $this->path;
    }

    /**
     * Get migrations path
     */
    public function getMigrationsPath(): ?string
    {
        if ($this->path === null || $this->migrations === null) {
            return null;
        }

        return $this->path . '/' . $this->migrations;
    }

    /**
     * Get web routes path
     */
    public function getWebRoutesPath(): ?string
    {
        if ($this->path === null || $this->routes === null || $this->routes->web === null) {
            return null;
        }

        return $this->path . '/' . $this->routes->web;
    }

    /**
     * Get API routes path
     */
    public function getApiRoutesPath(): ?string
    {
        if ($this->path === null || $this->routes === null || $this->routes->api === null) {
            return null;
        }

        return $this->path . '/' . $this->routes->api;
    }
}
