<?php

namespace App\Services\Notifications;

use App\Models\NotificationTemplate;
use App\Models\User;
use Illuminate\Support\Collection;

class TemplateService
{
    /**
     * Available variables for templates
     */
    protected array $availableVariables = [
        'client_name' => 'Имя клиента',
        'client_phone' => 'Телефон клиента',
        'service_name' => 'Название услуги',
        'appointment_date' => 'Дата записи (дд.мм.гггг)',
        'appointment_time' => 'Время записи (чч:мм)',
        'appointment_datetime' => 'Дата и время',
        'master_name' => 'Имя мастера',
        'master_phone' => 'Телефон мастера',
        'price' => 'Стоимость',
        'duration' => 'Длительность',
        'address' => 'Адрес',
        'city' => 'Город',
    ];

    /**
     * Render template with variables
     */
    public function render(NotificationTemplate $template, array $variables): string
    {
        $body = $template->body;
        
        foreach ($variables as $key => $value) {
            $body = str_replace('{' . $key . '}', $value, $body);
        }
        
        return $body;
    }

    /**
     * Get available variables for template type
     */
    public function getAvailableVariables(string $type): array
    {
        return $this->availableVariables;
    }

    /**
     * Validate template body contains required variables
     */
    public function validate(string $body, array $requiredVars = []): bool
    {
        foreach ($requiredVars as $var) {
            if (!str_contains($body, '{' . $var . '}')) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get system templates
     */
    public function getSystemTemplates(): Collection
    {
        return NotificationTemplate::system()->get();
    }

    /**
     * Create custom template
     */
    public function createCustomTemplate(
        User $master,
        string $type,
        string $channel,
        string $body,
        ?string $subject = null
    ): NotificationTemplate {
        return NotificationTemplate::create([
            'user_id' => $master->id,
            'type' => $type,
            'channel' => $channel,
            'subject' => $subject,
            'body' => $body,
            'variables' => $this->availableVariables,
            'is_active' => true,
            'is_system' => false,
        ]);
    }

    /**
     * Get template for user (custom or system fallback)
     */
    public function getTemplate(User $master, string $type, string $channel): ?NotificationTemplate
    {
        // Try to get custom template first
        $template = NotificationTemplate::where('user_id', $master->id)
            ->byType($type)
            ->byChannel($channel)
            ->where('is_active', true)
            ->first();

        // Fallback to system template
        if (!$template) {
            $template = NotificationTemplate::system()
                ->byType($type)
                ->byChannel($channel)
                ->where('is_active', true)
                ->first();
        }

        return $template;
    }
}
