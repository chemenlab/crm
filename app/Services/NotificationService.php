<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
// In a real app, we would import Mailable classes here

class NotificationService
{
    /**
     * Send notification about a new appointment.
     */
    public function sendNewAppointmentNotification(Appointment $appointment)
    {
        $master = $appointment->user;
        $client = $appointment->client;
        $settings = $master->notificationSetting;

        // 1. Notify Master
        if ($settings && $settings->email_new_booking) {
            // TODO: Send real email
            Log::info("Notification: New booking for Master {$master->name} from {$client->name}");
            // Mail::to($master->email)->send(new NewBookingMail($appointment));
        }

        // 2. Notify Client (Confirmation)
        if ($client->email) {
            // TODO: Send real email
            Log::info("Notification: Booking confirmation for Client {$client->name}");
            // Mail::to($client->email)->send(new BookingConfirmationMail($appointment));
        }
    }

    /**
     * Send notification about appointment cancellation.
     */
    public function sendCancellationNotification(Appointment $appointment, $cancelledBy = 'master')
    {
        $master = $appointment->user;
        $client = $appointment->client;
        $settings = $master->notificationSetting;

        // 1. Notify Master (if cancelled by client)
        if ($cancelledBy === 'client' && $settings && $settings->email_cancelled) {
            Log::info("Notification: Booking cancelled by client for Master {$master->name}");
        }

        // 2. Notify Client (if cancelled by master)
        if ($cancelledBy === 'master' && $client->email) {
            Log::info("Notification: Booking cancelled by master for Client {$client->name}");
        }
    }

    /**
     * Send reminders (to be called by a scheduled job).
     */
    public function sendReminders()
    {
        // Logic to find appointments starting in 24h or 1h and send reminders
        // This would typically be run by a cron job
    }
}
