<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('telegram_notification_settings', function (Blueprint $table) {
            $table->id();
            $table->string('notifiable_type');
            $table->unsignedBigInteger('notifiable_id');
            $table->string('channel'); // telegram, email, sms
            $table->string('event_type'); // appointment_created, ticket_reply, etc.
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            
            // Индекс для быстрого поиска настроек (с коротким именем)
            $table->index(['notifiable_type', 'notifiable_id'], 'tg_notif_morph_idx');
            $table->index(['channel', 'event_type'], 'tg_notif_channel_event_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_notification_settings');
    }
};
