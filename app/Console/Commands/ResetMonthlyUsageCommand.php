<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Console\Command;

class ResetMonthlyUsageCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:reset-usage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset monthly usage limits for all users';

    /**
     * Execute the console command.
     */
    public function handle(UsageLimitService $usageLimitService): int
    {
        $this->info('Resetting monthly usage limits...');

        $users = User::whereHas('currentSubscription')->get();

        $count = 0;

        foreach ($users as $user) {
            $usageLimitService->resetMonthlyUsage($user);
            $count++;
        }

        $this->info("Monthly usage reset for {$count} users!");

        return Command::SUCCESS;
    }
}
