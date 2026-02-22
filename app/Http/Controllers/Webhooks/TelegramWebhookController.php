<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Laravel\Facades\Telegram;

class TelegramWebhookController extends Controller
{
    /**
     * Handle Telegram webhook
     */
    public function handle(Request $request)
    {
        try {
            Log::info('Telegram Webhook Received', ['data' => $request->all()]);
            
            // Обрабатываем входящее обновление
            $update = Telegram::commandsHandler(true);
            
            return response()->json(['ok' => true]);
            
        } catch (\Exception $e) {
            Log::error('Telegram Webhook Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['ok' => true]);
        }
    }
}
