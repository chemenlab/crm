<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Appointment Created
            [
                'type' => 'appointment_created',
                'channel' => 'vk',
                'body' => "Здравствуйте, {client_name}!\n\nВы записаны на {service_name}\n📅 {appointment_date} в {appointment_time}\n\nМастер: {master_name}\n📍 {address}\n💰 {price} руб.\n\nДо встречи!",
            ],
            [
                'type' => 'appointment_created',
                'channel' => 'telegram',
                'body' => "Здравствуйте, {client_name}!\n\nВы записаны на {service_name}\n📅 {appointment_date} в {appointment_time}\n\nМастер: {master_name}\n📍 {address}\n💰 {price} руб.\n\nДо встречи!",
            ],
            [
                'type' => 'appointment_created',
                'channel' => 'sms',
                'body' => "Вы записаны на {service_name} {appointment_date} в {appointment_time}. Мастер: {master_name}",
            ],

            // Reminder 24h
            [
                'type' => 'reminder_24h',
                'channel' => 'vk',
                'body' => "Напоминаем, {client_name}!\n\nЗавтра у вас запись:\n{service_name}\n⏰ {appointment_time}\n\nМастер: {master_name}\n📞 {master_phone}",
            ],
            [
                'type' => 'reminder_24h',
                'channel' => 'telegram',
                'body' => "Напоминаем, {client_name}!\n\nЗавтра у вас запись:\n{service_name}\n⏰ {appointment_time}\n\nМастер: {master_name}\n📞 {master_phone}",
            ],
            [
                'type' => 'reminder_24h',
                'channel' => 'sms',
                'body' => "Напоминание: завтра {appointment_time} у вас запись на {service_name}. Мастер: {master_name}",
            ],

            // Reminder 2h
            [
                'type' => 'reminder_2h',
                'channel' => 'vk',
                'body' => "{client_name}, через 2 часа у вас запись!\n\n{service_name}\n⏰ {appointment_time}\n📍 {address}\n\nЖдем вас!",
            ],
            [
                'type' => 'reminder_2h',
                'channel' => 'telegram',
                'body' => "{client_name}, через 2 часа у вас запись!\n\n{service_name}\n⏰ {appointment_time}\n📍 {address}\n\nЖдем вас!",
            ],
            [
                'type' => 'reminder_2h',
                'channel' => 'sms',
                'body' => "Через 2 часа у вас запись на {service_name} в {appointment_time}. Адрес: {address}",
            ],

            // Appointment Confirmed
            [
                'type' => 'appointment_confirmed',
                'channel' => 'vk',
                'body' => "{client_name}, ваша запись подтверждена!\n\n{service_name}\n📅 {appointment_date} в {appointment_time}\n📍 {address}\n\nСпасибо!",
            ],
            [
                'type' => 'appointment_confirmed',
                'channel' => 'telegram',
                'body' => "{client_name}, ваша запись подтверждена!\n\n{service_name}\n📅 {appointment_date} в {appointment_time}\n📍 {address}\n\nСпасибо!",
            ],
            [
                'type' => 'appointment_confirmed',
                'channel' => 'sms',
                'body' => "Ваша запись на {service_name} {appointment_date} в {appointment_time} подтверждена",
            ],

            // Appointment Cancelled
            [
                'type' => 'appointment_cancelled',
                'channel' => 'vk',
                'body' => "{client_name}, ваша запись отменена.\n\n{service_name}\n📅 {appointment_date} в {appointment_time}\n\nДля новой записи свяжитесь с мастером: {master_phone}",
            ],
            [
                'type' => 'appointment_cancelled',
                'channel' => 'telegram',
                'body' => "{client_name}, ваша запись отменена.\n\n{service_name}\n📅 {appointment_date} в {appointment_time}\n\nДля новой записи свяжитесь с мастером: {master_phone}",
            ],
            [
                'type' => 'appointment_cancelled',
                'channel' => 'sms',
                'body' => "Ваша запись на {service_name} {appointment_date} в {appointment_time} отменена",
            ],

            // Appointment Rescheduled
            [
                'type' => 'appointment_rescheduled',
                'channel' => 'vk',
                'body' => "{client_name}, ваша запись перенесена!\n\n{service_name}\nНовое время: 📅 {appointment_date} в {appointment_time}\n📍 {address}\n\nДо встречи!",
            ],
            [
                'type' => 'appointment_rescheduled',
                'channel' => 'telegram',
                'body' => "{client_name}, ваша запись перенесена!\n\n{service_name}\nНовое время: 📅 {appointment_date} в {appointment_time}\n📍 {address}\n\nДо встречи!",
            ],
            [
                'type' => 'appointment_rescheduled',
                'channel' => 'sms',
                'body' => "Ваша запись на {service_name} перенесена на {appointment_date} в {appointment_time}",
            ],

            // Master notifications (Telegram only)
            [
                'type' => 'master_new_appointment',
                'channel' => 'telegram',
                'body' => "🔔 <b>Новая запись!</b>\n\n👤 Клиент: {client_name}\n📞 {client_phone}\n💼 Услуга: {service_name}\n📅 {appointment_date} в {appointment_time}\n💰 {price} руб.",
            ],
            [
                'type' => 'master_appointment_cancelled',
                'channel' => 'telegram',
                'body' => "❌ <b>Запись отменена</b>\n\n👤 Клиент: {client_name}\n💼 Услуга: {service_name}\n📅 {appointment_date} в {appointment_time}",
            ],
            [
                'type' => 'master_appointment_reminder',
                'channel' => 'telegram',
                'body' => "⏰ <b>Напоминание</b>\n\nЧерез 30 минут у вас запись:\n👤 {client_name}\n💼 {service_name}\n⏰ {appointment_time}",
            ],
        ];

        $variables = [
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

        foreach ($templates as $template) {
            NotificationTemplate::create([
                'user_id' => null, // System template
                'type' => $template['type'],
                'channel' => $template['channel'],
                'subject' => $template['subject'] ?? null,
                'body' => $template['body'],
                'variables' => $variables,
                'is_active' => true,
                'is_system' => true,
            ]);
        }

        $this->command->info('System notification templates created successfully!');
    }
}
