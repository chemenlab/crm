<?php

namespace App\Console\Commands;

use App\Services\Subscription\SubscriptionService;
use Illuminate\Console\Command;

class CheckExpiredSubscriptionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and process expired subscriptions';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionService $subscriptionService): int
    {
        $this->info('Checking expired subscriptions...');

        $subscriptionService->checkExpiredSubscriptions();

        $this->info('Expired subscriptions processed successfully!');

        return Command::SUCCESS;
    }
}
