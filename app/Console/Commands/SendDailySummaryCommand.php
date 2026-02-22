<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\Telegram\TelegramBotService;
use Illuminate\Support\Facades\Log;

class SendDailySummaryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:send-daily-summary';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily appointment summary to masters via Telegram';

    protected TelegramBotService $telegramService;

    public function __construct(TelegramBotService $telegramService)
    {
        parent::__construct();
        $this->telegramService = $telegramService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting daily summary sending...');

        // Get all masters with Telegram integration
        $masters = User::whereHas('telegramIntegration', function ($query) {
            $query->where('is_active', true);
        })->with('telegramIntegration')->get();

        if ($masters->isEmpty()) {
            $this->info('No masters with active Telegram integration found.');
            return self::SUCCESS;
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($masters as $master) {
            try {
                $this->telegramService->sendDailySummary($master);
                $successCount++;
                $this->info("✓ Sent summary to {$master->name} (ID: {$master->id})");
            } catch (\Exception $e) {
                $failCount++;
                $this->error("✗ Failed to send summary to {$master->name} (ID: {$master->id}): {$e->getMessage()}");
                Log::error('Failed to send daily summary', [
                    'master_id' => $master->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("\nSummary:");
        $this->info("Total masters: {$masters->count()}");
        $this->info("Sent successfully: {$successCount}");
        $this->info("Failed: {$failCount}");

        return self::SUCCESS;
    }
}
