<?php

namespace App\Console\Commands;

use App\Mail\InactiveAccountWarningMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class CleanupInactiveUsers extends Command
{
    protected $signature = 'users:cleanup-inactive 
                            {--warn-days=90 : Days of inactivity before warning}
                            {--delete-days=104 : Days of inactivity before deletion (warn + 14)}
                            {--dry-run : Show what would happen without making changes}';

    protected $description = 'Warn and delete inactive user accounts';

    public function handle()
    {
        $warnDays = (int) $this->option('warn-days');
        $deleteDays = (int) $this->option('delete-days');
        $dryRun = $this->option('dry-run');

        $this->info("Checking for inactive users...");
        $this->info("Warning threshold: {$warnDays} days");
        $this->info("Deletion threshold: {$deleteDays} days");

        if ($dryRun) {
            $this->warn("DRY RUN MODE - No changes will be made");
        }

        // 1. Delete users inactive for deleteDays who were already warned
        $this->deleteInactiveUsers($deleteDays, $dryRun);

        // 2. Warn users inactive for warnDays
        $this->warnInactiveUsers($warnDays, $deleteDays, $dryRun);

        $this->info("Cleanup complete.");
    }

    protected function deleteInactiveUsers(int $deleteDays, bool $dryRun): void
    {
        $cutoffDate = Carbon::now()->subDays($deleteDays);

        // Find users who:
        // - Have no appointments in the last deleteDays
        // - Were warned (inactive_warning_sent_at is set)
        // - Warning was sent at least 14 days ago
        $usersToDelete = User::where('inactive_warning_sent_at', '<=', Carbon::now()->subDays(14))
            ->whereDoesntHave('appointments', function ($query) use ($cutoffDate) {
                $query->where('created_at', '>=', $cutoffDate);
            })
            ->get();

        $this->info("Found {$usersToDelete->count()} users to delete");

        foreach ($usersToDelete as $user) {
            $this->line("  - Deleting: {$user->email} (ID: {$user->id})");

            if (!$dryRun) {
                $this->deleteUserWithFiles($user);
            }
        }
    }

    protected function warnInactiveUsers(int $warnDays, int $deleteDays, bool $dryRun): void
    {
        $cutoffDate = Carbon::now()->subDays($warnDays);

        // Find users who:
        // - Have no appointments in the last warnDays
        // - Haven't been warned yet
        // - Have verified email (so we can contact them)
        $usersToWarn = User::whereNull('inactive_warning_sent_at')
            ->whereNotNull('email_verified_at')
            ->whereDoesntHave('appointments', function ($query) use ($cutoffDate) {
                $query->where('created_at', '>=', $cutoffDate);
            })
            ->get();

        $this->info("Found {$usersToWarn->count()} users to warn");

        $daysUntilDeletion = $deleteDays - $warnDays;

        foreach ($usersToWarn as $user) {
            $this->line("  - Warning: {$user->email} (ID: {$user->id})");

            if (!$dryRun) {
                try {
                    Mail::to($user->email)->queue(
                        new InactiveAccountWarningMail($user->name, $daysUntilDeletion)
                    );

                    $user->update(['inactive_warning_sent_at' => now()]);

                    Log::info('Inactive account warning sent', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send inactive warning', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    protected function deleteUserWithFiles(User $user): void
    {
        try {
            // Delete user's files from storage
            $this->deleteUserFiles($user);

            // Delete user (cascade will handle related records)
            $user->delete();

            Log::info('Inactive user deleted', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete inactive user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function deleteUserFiles(User $user): void
    {
        // Delete avatar
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        // Delete portfolio images
        foreach ($user->portfolioItems as $item) {
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }
        }

        // Delete appointment field images
        $userFolder = 'appointment-fields/' . $user->id;
        if (Storage::disk('public')->exists($userFolder)) {
            Storage::disk('public')->deleteDirectory($userFolder);
        }

        // Delete any other user-specific folders
        $avatarsFolder = 'avatars/' . $user->id;
        if (Storage::disk('public')->exists($avatarsFolder)) {
            Storage::disk('public')->deleteDirectory($avatarsFolder);
        }

        Log::info('User files deleted', ['user_id' => $user->id]);
    }
}
