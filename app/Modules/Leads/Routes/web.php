<?php

use App\Modules\Leads\Controllers\LeadController;
use App\Modules\Leads\Controllers\LeadTodoController;
use App\Modules\Leads\Controllers\LeadCommentController;
use App\Modules\Leads\Controllers\LeadFormFieldController;
use App\Modules\Leads\Controllers\LeadSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Leads Module Web Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the ModuleLoader with prefix:
| /app/modules/leads
|
*/

// Main module page - Settings (accessible without module enabled for preview/install)
Route::get('/', [LeadSettingsController::class, 'index'])->name('index');

// All other routes require module to be enabled
Route::middleware(['module.active:leads'])->group(function () {
    // Leads list page (from sidebar menu)
    Route::get('/list', [LeadController::class, 'index'])->name('list');

    // Export
    Route::get('/export', [LeadController::class, 'export'])->name('export');

    // Bulk actions
    Route::post('/bulk/status', [LeadController::class, 'bulkUpdateStatus'])->name('bulk.status');
    Route::post('/bulk/delete', [LeadController::class, 'bulkDelete'])->name('bulk.delete');

    // Lead details - must be after /list to avoid conflict
    Route::get('/view/{lead}', [LeadController::class, 'show'])->name('show');

    // Lead actions
    Route::patch('/{lead}/status', [LeadController::class, 'updateStatus'])->name('update-status');
    Route::patch('/{lead}/position', [LeadController::class, 'updatePosition'])->name('update-position');
    Route::patch('/{lead}/priority', [LeadController::class, 'updatePriority'])->name('update-priority');
    Route::patch('/{lead}/tags', [LeadController::class, 'updateTags'])->name('update-tags');
    Route::patch('/{lead}/reminder', [LeadController::class, 'setReminder'])->name('set-reminder');
    Route::post('/{lead}/convert', [LeadController::class, 'convert'])->name('convert');
    Route::delete('/{lead}', [LeadController::class, 'destroy'])->name('destroy');

    // Lead todos
    Route::post('/{lead}/todos', [LeadTodoController::class, 'store'])->name('todos.store');
    Route::patch('/{lead}/todos/{todo}', [LeadTodoController::class, 'update'])->name('todos.update');
    Route::delete('/{lead}/todos/{todo}', [LeadTodoController::class, 'destroy'])->name('todos.destroy');

    // Lead comments
    Route::post('/{lead}/comments', [LeadCommentController::class, 'store'])->name('comments.store');
    Route::delete('/{lead}/comments/{comment}', [LeadCommentController::class, 'destroy'])->name('comments.destroy');

    // Settings (update requires module enabled)
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [LeadSettingsController::class, 'index'])->name('index');
        Route::patch('/', [LeadSettingsController::class, 'update'])->name('update');
        
        // Form fields
        Route::prefix('fields')->name('fields.')->group(function () {
            Route::get('/', [LeadFormFieldController::class, 'index'])->name('index');
            Route::post('/', [LeadFormFieldController::class, 'store'])->name('store');
            Route::patch('/reorder', [LeadFormFieldController::class, 'reorder'])->name('reorder');
            Route::patch('/{field}', [LeadFormFieldController::class, 'update'])->name('update');
            Route::delete('/{field}', [LeadFormFieldController::class, 'destroy'])->name('destroy');
        });
    });
});
