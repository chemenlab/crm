<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TempUploadController extends Controller
{
    /**
     * Upload a temporary file
     */
    public function store(Request $request, $slug, ImageService $imageService)
    {
        $request->validate([
            'file' => 'required|file|image|max:20480', // 20MB max — compressed server-side
        ]);

        // Compress and store (max 1920x1920, quality 80)
        $path = $imageService->compressAndStore(
            $request->file('file'),
            'temp/booking',
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 80,
        );

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'name' => $request->file('file')->getClientOriginalName(),
        ]);
    }

    /**
     * Delete a temporary file
     */
    public function destroy(Request $request, $slug)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->input('path');
        
        // Only allow deleting from temp folder
        if (!str_starts_with($path, 'temp/booking/')) {
            return response()->json(['error' => 'Invalid path'], 400);
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['success' => true]);
    }
}
