<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Interfaces\EncodedImageInterface;

class ImageService
{
    private ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    /**
     * Compress and store an uploaded image.
     *
     * @param UploadedFile $file
     * @param string $directory Storage directory (e.g. 'avatars', 'temp/booking')
     * @param int $maxWidth Max width in pixels
     * @param int $maxHeight Max height in pixels
     * @param int $quality JPEG quality (1-100)
     * @param string|null $filename Custom filename (auto-generated if null)
     * @return string Stored file path relative to public disk
     */
    public function compressAndStore(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1920,
        int $maxHeight = 1920,
        int $quality = 80,
        ?string $filename = null,
    ): string {
        $filename = $filename ?? (Str::uuid() . '.jpg');

        Storage::disk('public')->makeDirectory($directory);

        $image = $this->imageManager->read($file->getRealPath());
        $image->scale(width: $maxWidth, height: $maxHeight);

        $encoded = $image->toJpeg($quality);

        $path = $directory . '/' . $filename;
        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }
}
