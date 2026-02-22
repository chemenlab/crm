<?php

namespace App\Modules\Leads\Notifications;

use App\Modules\Leads\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewLeadNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Lead $lead;

    /**
     * Create a new notification instance.
     */
    public function __construct(Lead $lead)
    {
        $this->lead = $lead;
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
        return [
            'type' => 'new_lead',
            'lead_id' => $this->lead->id,
            'client_name' => $this->lead->name,
            'client_phone' => $this->lead->phone,
            'service_name' => $this->lead->service->name ?? 'Услуга',
            'message' => $this->lead->message,
            'created_at' => $this->lead->created_at->format('d.m.Y H:i'),
        ];
    }

    /**
     * Get the lead instance.
     */
    public function getLead(): Lead
    {
        return $this->lead;
    }
}
