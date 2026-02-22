<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\VKIntegration;
use App\Services\VK\VKService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VKIntegrationController extends Controller
{
    public function __construct(
        protected VKService $vkService
    ) {}

    /**
     * Show VK integration status
     */
    public function show()
    {
        $user = Auth::user();
        $integration = VKIntegration::where('user_id', $user->id)->first();

        return Inertia::render('App/Integrations/VK', [
            'integration' => $integration,
        ]);
    }

    /**
     * Connect VK group
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'group_id' => 'required|string|max:50',
            'access_token' => 'required|string',
            'secret_key' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();

        // Generate confirmation code
        $confirmationCode = Str::random(20);

        // Create or update integration
        $integration = VKIntegration::updateOrCreate(
            ['user_id' => $user->id],
            [
                'group_id' => $validated['group_id'],
                'access_token' => $validated['access_token'], // Will be encrypted by model
                'secret_key' => $validated['secret_key'] ?? null,
                'confirmation_code' => $confirmationCode,
                'is_active' => true,
                'last_sync_at' => now(),
            ]
        );

        // Verify integration
        $isValid = $this->vkService->verifyIntegration($integration);

        if (!$isValid) {
            $integration->update(['is_active' => false]);
            
            return redirect()->back()
                ->withErrors(['access_token' => 'Не удалось подключить VK группу. Проверьте токен и права доступа.']);
        }

        return redirect()->route('integrations.vk')
            ->with('success', 'VK группа успешно подключена');
    }

    /**
     * Disconnect VK integration
     */
    public function destroy()
    {
        $user = Auth::user();
        $integration = VKIntegration::where('user_id', $user->id)->first();

        if (!$integration) {
            return redirect()->back()
                ->withErrors(['error' => 'VK интеграция не найдена']);
        }

        $integration->update(['is_active' => false]);

        return redirect()->route('integrations.vk')
            ->with('success', 'VK интеграция отключена');
    }
}
