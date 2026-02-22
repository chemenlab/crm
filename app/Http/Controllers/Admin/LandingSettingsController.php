<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LandingSettingsController extends Controller
{
    public function index()
    {
        $settings = LandingSetting::orderBy('section')
            ->orderBy('order')
            ->get()
            ->groupBy('section');

        return Inertia::render('Admin/LandingSettings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:landing_settings,id',
            'settings.*.value' => 'required|array',
            'settings.*.is_active' => 'boolean',
        ]);

        foreach ($validated['settings'] as $settingData) {
            LandingSetting::where('id', $settingData['id'])
                ->update([
                    'value' => $settingData['value'],
                    'is_active' => $settingData['is_active'] ?? true,
                ]);
        }

        return redirect()->back()->with('success', 'Настройки успешно обновлены');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section' => 'required|string',
            'key' => 'required|string|unique:landing_settings,key',
            'value' => 'required|array',
            'order' => 'integer',
        ]);

        LandingSetting::create($validated);

        return redirect()->back()->with('success', 'Настройка успешно добавлена');
    }

    public function destroy(LandingSetting $setting)
    {
        $setting->delete();

        return redirect()->back()->with('success', 'Настройка успешно удалена');
    }
}
