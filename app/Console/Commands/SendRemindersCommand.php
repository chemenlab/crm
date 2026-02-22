<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\Notifications\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'notifications:send-reminders {window : Time window (24h or 2h)}';

    /**
     * The console command description.
     */
    protected $description = 'Send appointment reminders based on time window';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $window = $this->argument('window');
        
        if (!in_array($window, ['24h', '2h'])) {
            $this->error('Invalid time window. Use 24h or 2h');
            return self::FAILURE;
        }

        $this->info("Sending {$window} reminders...");

        // Determine time range
        if ($window === '24h') {
            $startTime = now()->addHours(23)->startOfHour();
            $endTime = now()->addHours(25)->endOfHour();
            $notificationType = 'reminder_24h';
        } else {
            $startTime = now()->addHours(1)->addMinutes(50);
            $endTime = now()->addHours(2)->addMinutes(10);
            $notificationType = 'reminder_2h';
        }

        // Find appointments in time window
        $appointments = Appointment::whereBetween('start_time', [$startTime, $endTime])
            ->whereIn('status', ['pending', 'confirmed'])
            ->with(['user', 'client', 'service'])
            ->get();

        $sent = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($appointments as $appointment) {
            try {
                // Check if reminder already sent
                $alreadySent = $appointment->user->notificationLogs()
                    ->where('appointment_id', $appointment->id)
                    ->where('type', $notificationType)
                    ->whereIn('status', ['sent', 'delivered'])
                    ->exists();

                if ($alreadySent) {
                    $skipped++;
                    continue;
                }

                // Check notification settings
                $settings = $appointment->user->notificationSettings;
                $settingField = $window === '24h' ? 'reminder_24h' : 'reminder_2h';
                
                if ($settings && !$settings->{$settingField}) {
                    $skipped++;
                    continue;
                }

                // Get local time for display
                $localStartTime = $appointment->local_start_time;

                // Prepare data
                $data = [
                    'appointment_id' => $appointment->id,
                    'client_name' => $appointment->client->name ?? 'Клиент',
                    'client_phone' => $appointment->client->phone ?? '',
                    'service_name' => $appointment->service->name ?? 'Услуга',
                    'appointment_date' => $localStartTime->format('d.m.Y'),
                    'appointment_time' => $localStartTime->format('H:i'),
                    'appointment_datetime' => $localStartTime->format('d.m.Y H:i'),
                    'master_name' => $appointment->user->name,
                    'master_phone' => $appointment->user->phone ?? '',
                    'price' => $appointment->price ?? 0,
                    'duration' => $appointment->duration ?? 60,
                    'address' => $appointment->user->address ?? '',
                    'city' => $appointment->user->city ?? '',
                ];

                // Send notification
                if ($appointment->client) {
                    $notificationService->send(
                        $appointment->user,
                        $appointment->client,
                        $notificationType,
                        $data
                    );
                    $sent++;
                }

            } catch (\Exception $e) {
                $failed++;
                Log::error("Failed to send {$window} reminder", [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Reminders sent: {$sent}");
        $this->info("Skipped: {$skipped}");
        
        if ($failed > 0) {
            $this->warn("Failed: {$failed}");
        }

        return self::SUCCESS;
    }
}
