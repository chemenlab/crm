<?php

namespace App\Services\Modules\Exceptions;

use Exception;
use Throwable;

/**
 * Exception thrown when module loading fails
 */
class ModuleLoadException extends Exception
{
    public function __construct(
        string $message,
        public readonly string $moduleSlug,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * Get the module slug
     */
    public function getModuleSlug(): string
    {
        return $this->moduleSlug;
    }
}
