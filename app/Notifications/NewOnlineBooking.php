<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewOnlineBooking extends Notification
{
    use Queueable;

    protected $appointment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        // Use local_start_time to display time in user's timezone
        $localStartTime = $this->appointment->local_start_time;
        
        return [
            'appointment_id' => $this->appointment->id,
            'client_name' => $this->appointment->client->name ?? 'Неизвестный клиент',
            'service_name' => $this->appointment->service->name ?? 'Услуга',
            'date' => $localStartTime->format('d.m.Y'),
            'time' => $localStartTime->format('H:i'),
        ];
    }
}
