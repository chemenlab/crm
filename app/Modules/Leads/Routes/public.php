<?php

use App\Modules\Leads\Controllers\PublicLeadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Leads Module Public Routes
|--------------------------------------------------------------------------
|
| These routes are for public lead submission.
| They are registered by LeadsServiceProvider.
|
*/

Route::post('/m/{slug}/lead', [PublicLeadController::class, 'store'])
    ->name('public.lead.store');
