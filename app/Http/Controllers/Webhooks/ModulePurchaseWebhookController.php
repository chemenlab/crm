<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Modules\ModulePurchaseService;
use App\Services\Payment\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ModulePurchaseWebhookController extends Controller
{
    public function __construct(
        protected ModulePurchaseService $purchaseService,
        protected PaymentService $paymentService,
    ) {}

    /**
     * Handle YooKassa webhook for module purchases
     */
    public function handle(Request $request)
    {
        try {
            // Get request body
            $requestBody = $request->getContent();
            $signature = $request->header('X-Yookassa-Signature');

            // Verify signature if configured
            if ($signature && !$this->paymentService->verifyWebhookSignature($requestBody, $signature)) {
                Log::warning('Module purchase webhook: signature verification failed');
                return response()->json(['error' => 'Invalid signature'], 403);
            }

            // Parse data
            $data = json_decode($requestBody, true);

            if (!$data) {
                Log::error('Module purchase webhook: Invalid JSON');
                return response()->json(['error' => 'Invalid JSON'], 400);
            }

            // Check if this is a module purchase (by metadata)
            $metadata = $data['object']['metadata'] ?? [];
            $type = $metadata['type'] ?? null;

            if (!in_array($type, ['module_purchase', 'module_renewal'])) {
                // Not a module purchase, let the main webhook handler process it
                Log::info('Module purchase webhook: Not a module payment, skipping', [
                    'type' => $type,
                ]);
                return response()->json(['status' => 'skipped']);
            }

            // Process the webhook
            $result = $this->purchaseService->handlePaymentWebhook($data);

            if ($result) {
                return response()->json(['status' => 'success']);
            }

            return response()->json(['error' => 'Processing failed'], 500);

        } catch (\Exception $e) {
            Log::error('Module purchase webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Internal error'], 500);
        }
    }
}
