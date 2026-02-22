<?php

namespace App\Services;

use App\Models\PortfolioItem;
use App\Models\User;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class PortfolioService
{
    private ImageManager $imageManager;
    private UsageLimitService $usageLimitService;

    public function __construct(UsageLimitService $usageLimitService)
    {
        $this->imageManager = new ImageManager(new Driver());
        $this->usageLimitService = $usageLimitService;
    }

    /**
     * Process uploaded image: resize, create thumbnail, and save.
     *
     * @param UploadedFile $file
     * @param User $user
     * @return array ['image_path' => string, 'thumbnail_path' => string]
     */
    public function processImage(UploadedFile $file, User $user): array
    {
        // Generate unique filename
        $filename = uniqid('portfolio_') . '.' . $file->getClientOriginalExtension();
        $thumbnailFilename = uniqid('thumb_') . '.' . $file->getClientOriginalExtension();

        // Create directories if they don't exist
        $userDir = 'portfolio/' . $user->id;
        Storage::disk('public')->makeDirectory($userDir);

        // Process main image (max 1920x1920, maintain aspect ratio)
        $image = $this->imageManager->read($file->getRealPath());
        $image->scale(width: 1920, height: 1920);
        
        // Save main image
        $imagePath = $userDir . '/' . $filename;
        Storage::disk('public')->put($imagePath, $image->encode());

        // Create thumbnail (400x500 for 4:5 aspect ratio)
        $thumbnail = $this->imageManager->read($file->getRealPath());
        $thumbnail->cover(400, 500);
        
        // Save thumbnail
        $thumbnailPath = $userDir . '/' . $thumbnailFilename;
        Storage::disk('public')->put($thumbnailPath, $thumbnail->encode());

        return [
            'image_path' => $imagePath,
            'thumbnail_path' => $thumbnailPath,
        ];
    }

    /**
     * Delete image and thumbnail files.
     *
     * @param PortfolioItem $item
     * @return void
     */
    public function deleteImage(PortfolioItem $item): void
    {
        // Delete main image
        if ($item->image_path && Storage::disk('public')->exists($item->image_path)) {
            Storage::disk('public')->delete($item->image_path);
        }

        // Delete thumbnail
        if ($item->thumbnail_path && Storage::disk('public')->exists($item->thumbnail_path)) {
            Storage::disk('public')->delete($item->thumbnail_path);
        }
    }

    /**
     * Check if user has reached portfolio limit based on subscription.
     *
     * @param User $user
     * @return bool
     */
    public function checkLimit(User $user): bool
    {
        return !$this->usageLimitService->checkLimit($user, 'portfolio_images');
    }

    /**
     * Get remaining portfolio slots for user.
     *
     * @param User $user
     * @return int Returns -1 for unlimited
     */
    public function getRemainingSlots(User $user): int
    {
        return $this->usageLimitService->getRemainingUsage($user, 'portfolio_images');
    }

    /**
     * Track portfolio image addition.
     *
     * @param User $user
     * @return void
     */
    public function trackImageAdded(User $user): void
    {
        $this->usageLimitService->trackUsage($user, 'portfolio_images', 1);
    }

    /**
     * Track portfolio image deletion.
     *
     * @param User $user
     * @return void
     */
    public function trackImageDeleted(User $user): void
    {
        $this->usageLimitService->decreaseUsage($user, 'portfolio_images', 1);
    }
}
