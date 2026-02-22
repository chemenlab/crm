<?php

namespace App\Services\Modules\Exceptions;

use Exception;

/**
 * Exception thrown when module manifest is invalid
 */
class InvalidManifestException extends Exception
{
    public function __construct(
        string $message,
        public readonly ?string $path = null,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }

    /**
     * Get the path to the invalid manifest
     */
    public function getPath(): ?string
    {
        return $this->path;
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
