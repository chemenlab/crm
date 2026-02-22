<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CleanupNotificationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup {--days=90 : Number of days to keep}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old notification logs';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning up notifications older than {$days} days (before {$cutoffDate->format('Y-m-d H:i:s')})...");

        try {
            $count = Notification::where('created_at', '<', $cutoffDate)->count();

            if ($count === 0) {
                $this->info('No old notifications to clean up.');
                return self::SUCCESS;
            }

            $this->info("Found {$count} notifications to delete.");

            if ($this->confirm('Do you want to proceed with deletion?', true)) {
                DB::beginTransaction();

                try {
                    Notification::where('created_at', '<', $cutoffDate)->delete();
                    
                    // Optimize table after deletion
                    DB::statement('OPTIMIZE TABLE notifications');

                    DB::commit();

                    $this->info("✓ Successfully deleted {$count} old notifications.");
                    $this->info('✓ Table optimized.');
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            } else {
                $this->info('Cleanup cancelled.');
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to clean up notifications: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
