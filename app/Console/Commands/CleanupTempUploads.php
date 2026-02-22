<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CleanupTempUploads extends Command
{
    protected $signature = 'cleanup:temp-uploads {--hours=24 : Delete files older than this many hours}';
    protected $description = 'Clean up temporary booking uploads older than specified hours';

    public function handle()
    {
        $hours = (int) $this->option('hours');
        $cutoff = Carbon::now()->subHours($hours);
        $deleted = 0;

        $files = Storage::disk('public')->files('temp/booking');
        
        foreach ($files as $file) {
            $lastModified = Carbon::createFromTimestamp(
                Storage::disk('public')->lastModified($file)
            );
            
            if ($lastModified->lt($cutoff)) {
                Storage::disk('public')->delete($file);
                $deleted++;
            }
        }

        $this->info("Deleted {$deleted} temporary files older than {$hours} hours.");
        
        return Command::SUCCESS;
    }
}
