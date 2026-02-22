<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Telegram\TelegramNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendQueuedTelegramNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public User $user,
        public string $message
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $service = app(TelegramNotificationService::class);
        $service->sendNotification($this->user->telegram_id, $this->message);
    }
}
