<?php

namespace App\Console\Commands;

use App\Models\ModulePurchase;
use App\Services\Modules\ModulePurchaseService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiredModuleSubscriptionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modules:check-expired 
                            {--notify : Send notifications about expiring subscriptions}
                            {--days=3 : Days ahead to check for expiring subscriptions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and process expired module subscriptions';

    public function __construct(
        private readonly ModulePurchaseService $purchaseService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking expired module subscriptions...');

        // Process expired subscriptions
        $processed = $this->processExpiredSubscriptions();

        // Send notifications about expiring subscriptions
        if ($this->option('notify')) {
            $this->sendExpirationNotifications();
        }

        $this->info('Done.');

        return Command::SUCCESS;
    }

    /**
     * Process expired subscriptions
     */
    protected function processExpiredSubscriptions(): array
    {
        $expiredPurchases = ModulePurchase::expired()
            ->with(['user', 'module'])
            ->get();

        if ($expiredPurchases->isEmpty()) {
            $this->info('No expired subscriptions found.');
            return [];
        }

        $this->info("Found {$expiredPurchases->count()} expired subscription(s).");

        $processed = [];

        foreach ($expiredPurchases as $purchase) {
            $this->line("Processing: {$purchase->module_slug} for user #{$purchase->user_id}");

            // Try to renew if auto-renew is enabled
            if ($purchase->auto_renew) {
                try {
                    $renewed = $this->purchaseService->renewSubscription($purchase);
                    if ($renewed) {
                        $this->info("  ✓ Renewed successfully");
                        $processed[] = [
                            'purchase_id' => $purchase->id,
                            'action' => 'renewed',
                        ];
                        continue;
                    }
                } catch (\Exception $e) {
                    $this->warn("  ✗ Auto-renewal failed: {$e->getMessage()}");
                    Log::warning('Module auto-renewal failed', [
                        'purchase_id' => $purchase->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Disable the module
            try {
                $this->purchaseService->processExpiredSubscriptions();
                $this->info("  ✓ Module disabled");
                $processed[] = [
                    'purchase_id' => $purchase->id,
                    'action' => 'disabled',
                    'user_id' => $purchase->user_id,
                    'module_slug' => $purchase->module_slug,
                ];

                // Send notification about disabled module
                $this->sendDisabledNotification($purchase);

            } catch (\Exception $e) {
                $this->error("  ✗ Failed to disable: {$e->getMessage()}");
                Log::error('Failed to disable expired module', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Processed {$expiredPurchases->count()} subscription(s).");

        return $processed;
    }

    /**
     * Send notifications about expiring subscriptions
     */
    protected function sendExpirationNotifications(): void
    {
        $daysAhead = (int) $this->option('days');
        $expiringPurchases = $this->purchaseService->getExpiringSubscriptions($daysAhead);

        if ($expiringPurchases->isEmpty()) {
            $this->info('No subscriptions expiring soon.');
            return;
        }

        $this->info("Found {$expiringPurchases->count()} subscription(s) expiring in {$daysAhead} days.");

        foreach ($expiringPurchases as $purchase) {
            $this->line("Notifying: {$purchase->module_slug} for user #{$purchase->user_id}");
            
            try {
                $this->sendExpirationWarning($purchase);
                $this->info("  ✓ Notification sent");
            } catch (\Exception $e) {
                $this->warn("  ✗ Failed to send notification: {$e->getMessage()}");
            }
        }
    }

    /**
     * Send expiration warning notification
     */
    protected function sendExpirationWarning(ModulePurchase $purchase): void
    {
        $user = $purchase->user;
        $module = $purchase->module;
        $daysLeft = now()->diffInDays($purchase->expires_at);

        // Log the notification (in production, send actual notification)
        Log::info('Module subscription expiring soon', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'module_slug' => $purchase->module_slug,
            'module_name' => $module?->name ?? $purchase->module_slug,
            'expires_at' => $purchase->expires_at,
            'days_left' => $daysLeft,
            'auto_renew' => $purchase->auto_renew,
        ]);

        // TODO: Implement actual notification sending
        // Example:
        // $user->notify(new ModuleSubscriptionExpiringNotification($purchase));
    }

    /**
     * Send notification about disabled module
     */
    protected function sendDisabledNotification(ModulePurchase $purchase): void
    {
        $user = $purchase->user;
        $module = $purchase->module;

        // Log the notification (in production, send actual notification)
        Log::info('Module subscription expired and disabled', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'module_slug' => $purchase->module_slug,
            'module_name' => $module?->name ?? $purchase->module_slug,
        ]);

        // TODO: Implement actual notification sending
        // Example:
        // $user->notify(new ModuleSubscriptionExpiredNotification($purchase));
    }
}
