<?php

use App\Modules\Reviews\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Reviews Module Web Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the ModuleLoader with prefix:
| /app/modules/reviews
|
*/

Route::middleware(['module.active:reviews'])->group(function () {
    // Reviews list
    Route::get('/', [ReviewController::class, 'index'])->name('index');

    // Create review
    Route::get('/create', [ReviewController::class, 'create'])->name('create');
    Route::post('/', [ReviewController::class, 'store'])->name('store');

    // Edit review
    Route::get('/{review}/edit', [ReviewController::class, 'edit'])->name('edit');
    Route::put('/{review}', [ReviewController::class, 'update'])->name('update');

    // Delete review
    Route::delete('/{review}', [ReviewController::class, 'destroy'])->name('destroy');

    // Review actions
    Route::post('/{review}/approve', [ReviewController::class, 'approve'])->name('approve');
    Route::post('/{review}/reject', [ReviewController::class, 'reject'])->name('reject');
    Route::post('/{review}/respond', [ReviewController::class, 'respond'])->name('respond');
    Route::post('/{review}/toggle-featured', [ReviewController::class, 'toggleFeatured'])->name('toggle-featured');

    // Settings
    Route::get('/settings', [ReviewController::class, 'settings'])->name('settings');
});
