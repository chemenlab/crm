<?php

namespace App\Http\Controllers\App\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookingSettingsRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingSettingsController extends Controller
{
    /**
     * Get current booking settings.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return Inertia::render('App/Settings/Booking', [
            'bookingSettings' => [
                'slot_step' => $user->slot_step ?? 30,
                'buffer_time' => $user->buffer_time ?? 0,
            ],
        ]);
    }

    /**
     * Update booking settings.
     */
    public function update(BookingSettingsRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update([
            'slot_step' => $validated['slot_step'],
            'buffer_time' => $validated['buffer_time'],
        ]);

        return back()->with('success', 'Настройки записи успешно сохранены');
    }
}
