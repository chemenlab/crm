<?php

namespace App\Console\Commands;

use App\Services\Modules\ModuleStatsService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AggregateModuleStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modules:aggregate-stats 
                            {--date= : Specific date to aggregate (Y-m-d format, defaults to yesterday)}
                            {--days= : Number of days to aggregate (from today backwards)}
                            {--force : Force re-aggregation even if stats exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggregate daily statistics for all modules (installs, active users, revenue)';

    public function __construct(
        private readonly ModuleStatsService $statsService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting module statistics aggregation...');

        try {
            $dates = $this->getDatesToAggregate();

            if (empty($dates)) {
                $this->warn('No dates to aggregate.');
                return Command::SUCCESS;
            }

            $this->info('Aggregating stats for ' . count($dates) . ' date(s)...');

            $progressBar = $this->output->createProgressBar(count($dates));
            $progressBar->start();

            foreach ($dates as $date) {
                $this->aggregateForDate($date);
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine();

            $this->info('Module statistics aggregation completed successfully.');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Failed to aggregate statistics: ' . $e->getMessage());
            Log::error('Module stats aggregation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * Get the dates to aggregate based on command options
     */
    protected function getDatesToAggregate(): array
    {
        $dates = [];

        // If specific date is provided
        if ($dateOption = $this->option('date')) {
            try {
                $dates[] = Carbon::parse($dateOption);
            } catch (\Exception $e) {
                $this->error("Invalid date format: {$dateOption}. Use Y-m-d format.");
                return [];
            }
            return $dates;
        }

        // If days option is provided, aggregate multiple days
        if ($daysOption = $this->option('days')) {
            $days = (int) $daysOption;
            for ($i = 1; $i <= $days; $i++) {
                $dates[] = Carbon::now()->subDays($i);
            }
            return $dates;
        }

        // Default: aggregate yesterday's stats
        $dates[] = Carbon::yesterday();

        return $dates;
    }

    /**
     * Aggregate statistics for a specific date
     */
    protected function aggregateForDate(Carbon $date): void
    {
        $dateString = $date->toDateString();

        if ($this->output->isVerbose()) {
            $this->line("  Aggregating stats for {$dateString}...");
        }

        try {
            $this->statsService->aggregateDailyStats($date);

            Log::info('Module stats aggregated', [
                'date' => $dateString,
            ]);

        } catch (\Exception $e) {
            $this->warn("  Failed to aggregate stats for {$dateString}: {$e->getMessage()}");
            Log::warning('Failed to aggregate module stats for date', [
                'date' => $dateString,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
