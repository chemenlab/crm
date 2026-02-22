<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Console\Command;

class ProcessRecurringPaymentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:process-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process recurring payments for subscriptions';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionService $subscriptionService): int
    {
        $this->info('Processing recurring payments...');

        // Получаем подписки, которые нужно продлить (истекают в течение 24 часов)
        $subscriptions = Subscription::where('status', 'active')
            ->where('auto_renew', true)
            ->whereBetween('current_period_end', [now(), now()->addDay()])
            ->whereNotNull('yookassa_subscription_id')
            ->get();

        $processed = 0;
        $failed = 0;

        foreach ($subscriptions as $subscription) {
            $this->info("Processing subscription #{$subscription->id} for user #{$subscription->user_id}");

            $result = $subscriptionService->renew($subscription);

            if ($result) {
                $processed++;
                $this->info("✓ Subscription #{$subscription->id} renewed successfully");
            } else {
                $failed++;
                $this->error("✗ Failed to renew subscription #{$subscription->id}");
            }
        }

        $this->info("Processed: {$processed}, Failed: {$failed}");

        return Command::SUCCESS;
    }
}
