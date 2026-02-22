<?php

use App\Modules\Reviews\Controllers\Api\ReviewApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Reviews Module API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the ModuleLoader with prefix:
| /api/modules/reviews
|
*/

// Authenticated routes (require auth:sanctum)
Route::middleware(['auth:sanctum', 'module.active:reviews'])->group(function () {
    // Reviews CRUD
    Route::get('/', [ReviewApiController::class, 'index']);
    Route::post('/', [ReviewApiController::class, 'store']);
    Route::put('/{review}', [ReviewApiController::class, 'update']);
    Route::delete('/{review}', [ReviewApiController::class, 'destroy']);

    // Statistics
    Route::get('/stats', [ReviewApiController::class, 'stats']);
    Route::get('/recent', [ReviewApiController::class, 'recent']);

    // Review actions
    Route::post('/{review}/approve', [ReviewApiController::class, 'approve']);
    Route::post('/{review}/reject', [ReviewApiController::class, 'reject']);
    Route::post('/{review}/respond', [ReviewApiController::class, 'respond']);
    Route::post('/{review}/toggle-featured', [ReviewApiController::class, 'toggleFeatured']);

    // Client reviews
    Route::get('/client/{clientId}', [ReviewApiController::class, 'clientReviews']);
});

// Public routes (no auth required)
Route::prefix('public')->group(function () {
    Route::get('/{username}', [ReviewApiController::class, 'publicReviews']);
    Route::post('/{username}', [ReviewApiController::class, 'submitPublicReview']);
});
