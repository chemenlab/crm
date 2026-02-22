<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\TelegramIntegration;
use App\Services\Telegram\TelegramBotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TelegramIntegrationController extends Controller
{
    public function __construct(
        protected TelegramBotService $telegramService
    ) {}

    /**
     * Show Telegram integration status
     */
    public function show()
    {
        $user = Auth::user();
        $integration = TelegramIntegration::where('user_id', $user->id)->first();
        
        // Get linking code if exists
        $linkingCode = cache()->get("telegram_link_code_{$user->id}");

        return Inertia::render('App/Integrations/Telegram', [
            'integration' => $integration,
            'linkingCode' => $linkingCode,
            'botUsername' => config('services.telegram.bot_username', 'YourBotUsername'),
        ]);
    }

    /**
     * Generate linking code
     */
    public function generateCode()
    {
        $user = Auth::user();
        $code = $this->telegramService->generateLinkingCode($user);

        return redirect()->route('integrations.telegram')
            ->with('success', 'Код привязки сгенерирован');
    }

    /**
     * Disconnect Telegram integration
     */
    public function destroy()
    {
        $user = Auth::user();
        $integration = TelegramIntegration::where('user_id', $user->id)->first();

        if (!$integration) {
            return redirect()->back()
                ->withErrors(['error' => 'Telegram интеграция не найдена']);
        }

        $integration->update(['is_active' => false]);

        return redirect()->route('integrations.telegram')
            ->with('success', 'Telegram интеграция отключена');
    }
}
