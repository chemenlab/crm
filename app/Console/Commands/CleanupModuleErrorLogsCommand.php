<?php

namespace App\Console\Commands;

use App\Services\Modules\ModuleAdminService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupModuleErrorLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modules:cleanup-logs 
                            {--days=30 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old module error logs';

    /**
     * Execute the console command.
     */
    public function handle(ModuleAdminService $adminService): int
    {
        $daysToKeep = (int) $this->option('days');
        
        $this->info("Cleaning up module error logs older than {$daysToKeep} days...");
        
        try {
            $deleted = $adminService->cleanupOldLogs($daysToKeep);
            
            $this->info("Successfully deleted {$deleted} old error log entries.");
            
            Log::info('Module error logs cleanup completed via command', [
                'days_to_keep' => $daysToKeep,
                'deleted_count' => $deleted,
            ]);
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Failed to cleanup logs: {$e->getMessage()}");
            
            Log::error('Module error logs cleanup failed', [
                'error' => $e->getMessage(),
                'days_to_keep' => $daysToKeep,
            ]);
            
            return Command::FAILURE;
        }
    }
}
