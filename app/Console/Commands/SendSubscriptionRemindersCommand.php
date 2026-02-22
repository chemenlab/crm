<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendSubscriptionRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminders about subscription renewal';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Sending subscription reminders...');

        // Подписки, истекающие через 3 дня
        $expiringSoon = Subscription::where('status', 'active')
            ->whereBetween('current_period_end', [now()->addDays(3), now()->addDays(3)->endOfDay()])
            ->with('user', 'plan')
            ->get();

        foreach ($expiringSoon as $subscription) {
            $this->sendReminder($subscription, 3);
        }

        // Подписки, истекающие завтра
        $expiringTomorrow = Subscription::where('status', 'active')
            ->whereBetween('current_period_end', [now()->addDay(), now()->addDay()->endOfDay()])
            ->with('user', 'plan')
            ->get();

        foreach ($expiringTomorrow as $subscription) {
            $this->sendReminder($subscription, 1);
        }

        $this->info('Reminders sent successfully!');

        return Command::SUCCESS;
    }

    /**
     * Send reminder notification
     */
    protected function sendReminder(Subscription $subscription, int $daysLeft): void
    {
        // TODO: Интегрировать с системой уведомлений
        Log::info('Subscription reminder sent', [
            'subscription_id' => $subscription->id,
            'user_id' => $subscription->user_id,
            'days_left' => $daysLeft,
            'plan' => $subscription->plan->name,
        ]);

        $this->info("Reminder sent to user #{$subscription->user_id} ({$daysLeft} days left)");
    }
}
