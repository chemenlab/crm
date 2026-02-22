<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class YooKassaWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Handle YooKassa webhook
     */
    public function handle(Request $request)
    {
        try {
            // Получаем тело запроса
            $requestBody = $request->getContent();
            $signature = $request->header('X-Yookassa-Signature', '');

            // Всегда проверяем подпись webhook
            if (!$this->paymentService->verifyWebhookSignature($requestBody, $signature)) {
                Log::warning('YooKassa webhook signature verification failed');
                return response()->json(['error' => 'Invalid signature'], 403);
            }

            // Парсим данные
            $data = json_decode($requestBody, true);

            if (!$data) {
                Log::error('YooKassa webhook: Invalid JSON');
                return response()->json(['error' => 'Invalid JSON'], 400);
            }

            // Обрабатываем webhook
            $result = $this->paymentService->handleWebhook($data);

            if ($result) {
                return response()->json(['status' => 'success']);
            }

            return response()->json(['error' => 'Processing failed'], 500);
        } catch (\Exception $e) {
            Log::error('YooKassa webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Internal error'], 500);
        }
    }
}
