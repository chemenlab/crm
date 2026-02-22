<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\VKIntegration;
use App\Services\VK\VKService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VKWebhookController extends Controller
{
    public function __construct(
        protected VKService $vkService
    ) {}

    /**
     * Handle VK webhook callback
     */
    public function handle(Request $request)
    {
        $data = $request->all();
        
        Log::info('VK Webhook Received', ['data' => $data]);

        $type = $data['type'] ?? null;
        $groupId = $data['group_id'] ?? null;

        if (!$groupId) {
            return response()->json(['error' => 'group_id required'], 400);
        }

        // Find integration by group_id
        $integration = VKIntegration::where('group_id', $groupId)
            ->where('is_active', true)
            ->first();

        if (!$integration) {
            Log::warning('VK Integration not found', ['group_id' => $groupId]);
            return response()->json(['error' => 'Integration not found'], 404);
        }

        // Verify signature if secret key is set
        if ($integration->secret_key && $request->header('X-VK-Signature')) {
            $signature = $request->header('X-VK-Signature');
            
            if (!$this->vkService->verifySignature($integration->secret_key, $data, $signature)) {
                Log::warning('VK Webhook signature verification failed');
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        // Handle webhook
        $response = $this->vkService->handleWebhook($data, $integration);

        // Return response based on type
        if ($type === 'confirmation') {
            return response($response['response']);
        }

        return response()->json($response);
    }
}
