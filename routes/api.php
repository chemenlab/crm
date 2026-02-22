<?php

use App\Http\Controllers\Api\Mobile\AppointmentController;
use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\ClientController;
use App\Http\Controllers\Api\Mobile\DashboardController;
use App\Http\Controllers\Api\Mobile\ScheduleController;
use App\Http\Controllers\Api\Mobile\ServiceController;
use App\Http\Controllers\Api\Mobile\SlotController;
use App\Http\Controllers\Api\Mobile\SyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile')->name('mobile.')->group(function () {

    // Public: registration + email verification + login (rate limited to 5/min per IP)
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:mobile-login')
        ->name('register');

    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])
        ->middleware('throttle:mobile-login')
        ->name('verify-email');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:mobile-login')
        ->name('login');

    // Protected routes: require Sanctum Bearer token, 60 req/min per user
    Route::middleware(['auth:sanctum', 'throttle:mobile-api'])->group(function () {

        // Auth
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/me', [AuthController::class, 'me'])->name('me');

        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status');

        // Clients
        Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
        Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
        Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');

        // Services (read-only from mobile)
        Route::get('/services', [ServiceController::class, 'index'])->name('services.index');

        // Available time slots
        Route::get('/slots', [SlotController::class, 'index'])->name('slots.index');

        // Dashboard summary
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Work schedule
        Route::get('/schedule', [ScheduleController::class, 'index'])->name('schedule');

        // Delta sync (returns all changed entities since updated_after)
        Route::get('/sync', [SyncController::class, 'index'])->name('sync');
    });
});
