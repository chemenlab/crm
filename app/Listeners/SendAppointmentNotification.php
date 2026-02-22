<?php

namespace App\Listeners;

use App\Events\AppointmentCreated;
use App\Events\AppointmentUpdated;
use App\Events\AppointmentCancelled;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\Log;

class SendAppointmentNotification
{
    /**
     * Create the event listener.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Handle appointment created event
     */
    public function handleCreated(AppointmentCreated $event): void
    {
        $appointment = $event->appointment;
        
        // Check if notification settings allow this type
        if (!$this->shouldSendNotification($appointment->user, 'appointment_created')) {
            return;
        }

        try {
            $data = $this->prepareNotificationData($appointment);
            
            // Send to client
            if ($appointment->client) {
                $this->notificationService->send(
                    $appointment->user,
                    $appointment->client,
                    'appointment_created',
                    $data
                );
            }

            // Send to master (Telegram)
            $this->notificationService->sendToMaster(
                $appointment->user,
                'master_new_appointment',
                $data
            );
        } catch (\Exception $e) {
            Log::error('Failed to send appointment created notification', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle appointment updated event
     */
    public function handleUpdated(AppointmentUpdated $event): void
    {
        $appointment = $event->appointment;
        $changes = $event->changes;

        // Check if time/date changed (rescheduled)
        if (isset($changes['start_time']) || isset($changes['end_time'])) {
            if (!$this->shouldSendNotification($appointment->user, 'appointment_rescheduled')) {
                return;
            }

            try {
                $data = $this->prepareNotificationData($appointment);
                
                if ($appointment->client) {
                    $this->notificationService->send(
                        $appointment->user,
                        $appointment->client,
                        'appointment_rescheduled',
                        $data
                    );
                }
            } catch (\Exception $e) {
                Log::error('Failed to send appointment rescheduled notification', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Check if status changed to confirmed
        if (isset($changes['status']) && $appointment->status === 'confirmed') {
            if (!$this->shouldSendNotification($appointment->user, 'appointment_confirmed')) {
                return;
            }

            try {
                $data = $this->prepareNotificationData($appointment);
                
                if ($appointment->client) {
                    $this->notificationService->send(
                        $appointment->user,
                        $appointment->client,
                        'appointment_confirmed',
                        $data
                    );
                }
            } catch (\Exception $e) {
                Log::error('Failed to send appointment confirmed notification', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Handle appointment cancelled event
     */
    public function handleCancelled(AppointmentCancelled $event): void
    {
        $appointment = $event->appointment;
        
        if (!$this->shouldSendNotification($appointment->user, 'appointment_cancelled')) {
            return;
        }

        try {
            $data = $this->prepareNotificationData($appointment);
            
            // Send to client
            if ($appointment->client) {
                $this->notificationService->send(
                    $appointment->user,
                    $appointment->client,
                    'appointment_cancelled',
                    $data
                );
            }

            // Send to master (Telegram)
            $this->notificationService->sendToMaster(
                $appointment->user,
                'master_appointment_cancelled',
                $data
            );
        } catch (\Exception $e) {
            Log::error('Failed to send appointment cancelled notification', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Prepare notification data from appointment
     */
    protected function prepareNotificationData($appointment): array
    {
        // Use local_start_time to display time in user's timezone
        $localStartTime = $appointment->local_start_time;
        
        return [
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
    }

    /**
     * Check if notification should be sent based on settings
     */
    protected function shouldSendNotification($user, string $type): bool
    {
        $settings = $user->notificationSettings;
        
        if (!$settings) {
            return true; // Send by default if no settings
        }

        // Map notification types to settings fields
        $settingsMap = [
            'appointment_created' => 'appointment_created',
            'appointment_confirmed' => 'appointment_confirmed',
            'appointment_cancelled' => 'appointment_cancelled',
            'appointment_rescheduled' => 'appointment_rescheduled',
            'reminder_24h' => 'reminder_24h',
            'reminder_2h' => 'reminder_2h',
            'master_new_appointment' => 'appointment_created',
            'master_appointment_cancelled' => 'appointment_cancelled',
        ];

        $settingField = $settingsMap[$type] ?? null;
        
        if (!$settingField) {
            return true;
        }

        return $settings->{$settingField} ?? true;
    }
}
